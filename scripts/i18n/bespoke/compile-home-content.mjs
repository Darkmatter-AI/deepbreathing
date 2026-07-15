#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/home");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const sourcePath = join(contentRoot, "source.json");
const bindingsPath = join(contentRoot, "occurrence-bindings.json");
const overridesPath = join(contentRoot, "overrides.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const outputRoot = join(contentRoot, "messages");

export const HOME_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const SOURCE_ROUTE = "/";
const ROOT_CATALOG_FILE = "_root.json";

/** Documented typography normalization bridge (HOMEPAGE-AUDIT.md). */
export function normalizeTypography(value) {
  return value
    .normalize("NFKC")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return left.localeCompare(right, "en");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
  cursor[parts.at(-1)] = value;
}

function getPath(target, path) {
  return path.split(".").reduce((cursor, part) => cursor?.[part], target);
}

function deepClone(value) {
  return structuredClone(value);
}

function flattenStringLeaves(value, prefix = "", output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") output.set(childPath, child);
    else if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenStringLeaves(child, childPath, output);
    }
  }
  return output;
}

function validateTranslation(sourceText, translation, label) {
  assert(typeof translation === "string" && translation.trim(), `${label} is empty`);
  assert(!/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation), `${label} contains unsafe markup`);
  assert(translation.length <= Math.max(sourceText.length * 8, 320), `${label} is unexpectedly long`);
}

function validateManualFile(file, kind, bindingsByPath) {
  assert(file.schemaVersion === 1, `Unsupported home ${kind} schema`);
  const records = file[kind];
  assert(Array.isArray(records), `Home ${kind} must be an array`);
  const seen = new Set();
  for (const record of records) {
    assert(bindingsByPath.has(record.messagePath), `Unknown home ${kind} ${record.messagePath}`);
    const binding = bindingsByPath.get(record.messagePath);
    assert(record.sourceText === binding.sourceText, `${record.messagePath} ${kind} source changed`);
    assert(record.reviewedSourceHash === sha256(record.sourceText), `${record.messagePath} ${kind} source hash changed`);
    assert(typeof record.reason === "string" && record.reason.trim(), `${record.messagePath} ${kind} lacks a reason`);
    const locales = Object.keys(record.translations ?? {});
    assert(locales.length > 0, `${record.messagePath} ${kind} has no translations`);
    for (const locale of locales) {
      assert(HOME_LOCALES.includes(locale), `${record.messagePath} ${kind} has unsupported locale ${locale}`);
      const key = `${record.messagePath}:${locale}`;
      assert(!seen.has(key), `Duplicate home ${kind} ${key}`);
      seen.add(key);
      validateTranslation(record.sourceText, record.translations[locale], `${key} ${kind}`);
    }
  }
}

function approvedSegment(segment) {
  return segment.translation?.isApproved === true
    && segment.translation?.needsReview === false
    && typeof segment.translation?.text === "string"
    && segment.translation.text.trim();
}

function resolveOccurrenceSegment(catalogByOccurrence, binding, label) {
  if (!binding.occurrenceKey) return null;
  const segment = catalogByOccurrence.get(binding.occurrenceKey);
  assert(segment, `${label} missing catalog segment ${binding.occurrenceKey}`);
  const catalogSource = segment.sourceText;
  const expected = binding.catalogSourceText ?? binding.sourceText;
  const normalizedMatch = normalizeTypography(catalogSource) === normalizeTypography(expected);
  const exactMatch = catalogSource === expected || catalogSource === binding.sourceText;
  assert(
    exactMatch || normalizedMatch,
    `${label} catalog source drift at ${binding.occurrenceKey}`,
  );
  assert(approvedSegment(segment), `${label} catalog translation is not approved`);
  validateTranslation(binding.sourceText, segment.translation.text, label);
  return {
    catalogSourceTexts: [catalogSource],
    status: exactMatch ? "route-catalog-occurrence-exact" : "route-catalog-occurrence-normalized",
    translation: segment.translation.text,
  };
}

export async function buildHomeContentArtifacts() {
  const [source, bindingFile, overrides, replacements] = await Promise.all([
    readJson(sourcePath),
    readJson(bindingsPath),
    readJson(overridesPath),
    readJson(replacementsPath),
  ]);
  assert(bindingFile.schemaVersion === 1, "Unsupported home occurrence binding schema");
  const bindings = bindingFile.bindings;
  const bindingsByPath = new Map(bindings.map((binding) => [binding.messagePath, binding]));

  for (const binding of bindings) {
    assert(getPath(source, binding.messagePath) === binding.sourceText, `${binding.messagePath} source drift`);
  }

  validateManualFile(overrides, "overrides", bindingsByPath);
  validateManualFile(replacements, "replacements", bindingsByPath);

  const overrideByPath = new Map(overrides.overrides.map((record) => [record.messagePath, record]));
  const replacementByPathAndLocale = new Map(
    replacements.replacements.flatMap((record) =>
      Object.entries(record.translations).map(([locale, translation]) => [
        `${record.messagePath}:${locale}`,
        { ...record, translation },
      ]),
    ),
  );

  const publication = {
    expectedMessages: bindings.length,
    locales: {},
    routeId: "home",
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
  };
  const provenance = { locales: {}, schemaVersion: 1, sourceRoute: SOURCE_ROUTE };
  const unresolved = { schemaVersion: 1, sourceRoute: SOURCE_ROUTE, unresolved: [] };
  const outputs = new Map();

  for (const locale of HOME_LOCALES) {
    const catalog = await readJson(join(catalogRoot, locale, "pages", ROOT_CATALOG_FILE));
    const catalogByOccurrence = new Map(catalog.segments.map((segment) => [segment.occurrenceKey, segment]));
    const messages = deepClone(source);
    const localeProvenance = {};
    let catalogExact = 0;
    let catalogNormalized = 0;
    let overrideCount = 0;
    let replacementCount = 0;
    let unresolvedCount = 0;

    for (const binding of bindings) {
      const label = `${binding.messagePath}:${locale}`;
      const replacement = replacementByPathAndLocale.get(`${binding.messagePath}:${locale}`);
      const override = overrideByPath.get(binding.messagePath);
      if (replacement) {
        setPath(messages, binding.messagePath, replacement.translation);
        localeProvenance[binding.messagePath] = {
          reason: replacement.reason,
          sourceHash: replacement.reviewedSourceHash,
          status: "repo-reviewed-replacement",
        };
        replacementCount += 1;
        continue;
      }
      if (override?.translations[locale]) {
        setPath(messages, binding.messagePath, override.translations[locale]);
        localeProvenance[binding.messagePath] = {
          reason: override.reason,
          sourceHash: override.reviewedSourceHash,
          status: "repo-reviewed-override",
        };
        overrideCount += 1;
        continue;
      }

      const resolution = resolveOccurrenceSegment(catalogByOccurrence, binding, label);
      if (resolution) {
        setPath(messages, binding.messagePath, resolution.translation);
        localeProvenance[binding.messagePath] = {
          catalogRoute: SOURCE_ROUTE,
          occurrenceKey: binding.occurrenceKey,
          sourceHash: sha256(binding.sourceText),
          status: resolution.status,
        };
        if (resolution.status.endsWith("exact")) catalogExact += 1;
        else catalogNormalized += 1;
        continue;
      }

      unresolvedCount += 1;
      unresolved.unresolved.push({
        locale,
        messagePath: binding.messagePath,
        sourceHash: sha256(binding.sourceText),
        sourceText: binding.sourceText,
      });
      localeProvenance[binding.messagePath] = {
        sourceHash: sha256(binding.sourceText),
        status: "unresolved",
      };
    }

    const resolvedMessages = bindings.length - unresolvedCount;
    const publishable = unresolvedCount === 0;
    const serialized = stableJson(messages);
    const relativePath = `messages/${locale}.json`;
    outputs.set(relativePath, serialized);
    provenance.locales[locale] = localeProvenance;
    publication.locales[locale] = {
      bytes: Buffer.byteLength(serialized),
      catalogExact,
      catalogNormalized,
      overrideMessages: overrideCount,
      path: relativePath,
      publishable,
      replacementMessages: replacementCount,
      resolvedMessages,
      reviewedReplacementMessages: replacementCount,
      sha256: publishable ? sha256(serialized) : null,
      unresolved: unresolvedCount,
    };
  }

  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, publication, provenance, unresolved };
}

export async function writeHomeContentArtifacts() {
  const build = await buildHomeContentArtifacts();
  assert(outputRoot === join(contentRoot, "messages"), "Refusing unsafe home output path");
  await rm(outputRoot, { force: true, recursive: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return { unresolved: build.unresolved.unresolved.length, written: build.outputs.size };
}

export async function checkHomeContentArtifacts() {
  const build = await buildHomeContentArtifacts();
  const stale = [];
  for (const [relativePath, expected] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    let actual = null;
    try {
      actual = await readFile(outputPath, "utf8");
    } catch {
      // missing artifact
    }
    if (actual !== expected) stale.push(relativePath);
  }
  return { checked: build.outputs.size, stale };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const result = await checkHomeContentArtifacts();
    assert(result.stale.length === 0, `Stale home content artifacts: ${result.stale.join(", ")}`);
    console.log(JSON.stringify({ ...result, mode: "check" }));
  } else {
    const result = await writeHomeContentArtifacts();
    console.log(JSON.stringify({ ...result, mode: "write" }));
  }
}