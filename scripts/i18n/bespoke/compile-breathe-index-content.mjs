#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/breathe-index");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const sourcePath = join(contentRoot, "source.json");
const bindingsPath = join(contentRoot, "occurrence-bindings.json");
const overridesPath = join(contentRoot, "overrides.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const outputRoot = join(contentRoot, "messages");
const italianPilotPath = join(repoRoot, "src/i18n/content/italian-pilot/breathe-index.json");

export const BREATHE_INDEX_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const SOURCE_ROUTE = "/breathe";
const CATALOG_FILE = "breathe.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function normalizeBreatheIndexTypography(value) {
  return value
    .normalize("NFKC")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getPath(target, path) {
  return path.split(".").reduce((cursor, part) => cursor?.[part], target);
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
  cursor[parts.at(-1)] = value;
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

function validateItalianTranslation(sourceText, translation, label) {
  validateTranslation(sourceText, translation, label);
  const numbers = (value) => (value.normalize("NFKC").match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map((token) => token.replace(",", "."))
    .sort();
  const placeholders = (value) => (value.match(/\{\{?[A-Za-z_][A-Za-z0-9_.-]*\}?\}|%(?:\([A-Za-z_][A-Za-z0-9_.-]*\))?[sdif]/g) ?? []).sort();
  const symbols = (value) => (value.match(/[→←↔%]/g) ?? []).sort();
  assert(JSON.stringify(numbers(translation)) === JSON.stringify(numbers(sourceText)), `${label} changed numeric values`);
  assert(JSON.stringify(placeholders(translation)) === JSON.stringify(placeholders(sourceText)), `${label} changed placeholders`);
  assert(JSON.stringify(symbols(translation)) === JSON.stringify(symbols(sourceText)), `${label} changed protected symbols`);
}

async function readItalianPilot(bindings, bindingsByPath) {
  const file = await readJson(italianPilotPath);
  assert(file.schemaVersion === 1, "Unsupported Italian breathe-index schema");
  assert(file.sourceRoute === SOURCE_ROUTE, "Italian breathe-index source route changed");
  assert(Array.isArray(file.entries), "Italian breathe-index entries changed");
  assert(file.entries.length === bindings.length, "Italian breathe-index entry count changed");
  const entries = new Map();
  for (const entry of file.entries) {
    const binding = bindingsByPath.get(entry.messagePath);
    assert(binding, `Unknown Italian breathe-index message ${entry.messagePath}`);
    assert(!entries.has(entry.messagePath), `Duplicate Italian breathe-index message ${entry.messagePath}`);
    assert(entry.sourceText === binding.sourceText, `${entry.messagePath} Italian source changed`);
    assert(entry.reviewedSourceHash === sha256(entry.sourceText), `${entry.messagePath} Italian source hash changed`);
    assert(typeof entry.reason === "string" && entry.reason.trim(), `${entry.messagePath} Italian lacks a reason`);
    validateItalianTranslation(entry.sourceText, entry.translation, `${entry.messagePath}:it-it`);
    entries.set(entry.messagePath, entry);
  }
  assert(entries.size === bindings.length, "Italian breathe-index does not cover every binding");
  return entries;
}

function validateManualFile(file, kind, bindingsByPath) {
  assert(file.schemaVersion === 1, `Unsupported breathe-index ${kind} schema`);
  const records = file[kind];
  assert(Array.isArray(records), `Breathe-index ${kind} must be an array`);
  const seen = new Set();

  for (const record of records) {
    const binding = bindingsByPath.get(record.messagePath);
    assert(binding, `Unknown breathe-index ${kind} ${record.messagePath}`);
    assert(record.sourceText === binding.sourceText, `${record.messagePath} ${kind} source changed`);
    assert(record.reviewedSourceHash === sha256(record.sourceText), `${record.messagePath} ${kind} source hash changed`);
    assert(typeof record.reason === "string" && record.reason.trim(), `${record.messagePath} ${kind} lacks a reason`);
    for (const [locale, translation] of Object.entries(record.translations ?? {})) {
      assert(BREATHE_INDEX_LOCALES.includes(locale), `${record.messagePath} ${kind} has unsupported locale ${locale}`);
      const key = `${record.messagePath}:${locale}`;
      assert(!seen.has(key), `Duplicate breathe-index ${kind} ${key}`);
      seen.add(key);
      validateTranslation(record.sourceText, translation, `${key} ${kind}`);
    }
  }
}

function isApproved(segment) {
  return segment?.translation?.isApproved === true
    && segment.translation.needsReview === false
    && typeof segment.translation.text === "string"
    && segment.translation.text.trim();
}

function resolveOccurrence(catalogByOccurrence, binding, label) {
  if (!binding.occurrenceKey) return null;
  const segment = catalogByOccurrence.get(binding.occurrenceKey);
  assert(segment, `${label} is missing catalog occurrence ${binding.occurrenceKey}`);
  const expected = binding.catalogSourceText ?? binding.sourceText;
  const exact = segment.sourceText === expected;
  assert(
    exact || normalizeBreatheIndexTypography(segment.sourceText) === normalizeBreatheIndexTypography(expected),
    `${label} catalog source drift at ${binding.occurrenceKey}`,
  );
  assert(isApproved(segment), `${label} catalog translation is not approved`);
  validateTranslation(binding.sourceText, segment.translation.text, label);
  return {
    sourceText: segment.sourceText,
    status: exact ? "route-catalog-occurrence-exact" : "route-catalog-occurrence-normalized",
    translation: segment.translation.text,
  };
}

export async function buildBreatheIndexContentArtifacts() {
  const [source, bindingFile, overrides, replacements] = await Promise.all([
    readJson(sourcePath),
    readJson(bindingsPath),
    readJson(overridesPath),
    readJson(replacementsPath),
  ]);
  assert(bindingFile.schemaVersion === 1, "Unsupported breathe-index binding schema");
  assert(bindingFile.sourceRoute === SOURCE_ROUTE, "Breathe-index binding route changed");

  const sourceLeaves = flattenStringLeaves(source);
  const bindings = bindingFile.bindings;
  const bindingsByPath = new Map(bindings.map((binding) => [binding.messagePath, binding]));
  assert(bindings.length === bindingsByPath.size, "Duplicate breathe-index message path");
  assert(sourceLeaves.size === bindings.length, "Breathe-index source and bindings have different leaf counts");
  for (const [messagePath, sourceText] of sourceLeaves) {
    const binding = bindingsByPath.get(messagePath);
    assert(binding, `Breathe-index binding missing ${messagePath}`);
    assert(binding.sourceText === sourceText, `${messagePath} source drift`);
  }

  const italianEntries = await readItalianPilot(bindings, bindingsByPath);

  validateManualFile(overrides, "overrides", bindingsByPath);
  validateManualFile(replacements, "replacements", bindingsByPath);
  const overrideByPath = new Map(overrides.overrides.map((record) => [record.messagePath, record]));
  const replacementByPathLocale = new Map(
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
    routeId: "breathe",
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
  };
  const provenance = { locales: {}, schemaVersion: 1, sourceRoute: SOURCE_ROUTE };
  const unresolved = { schemaVersion: 1, sourceRoute: SOURCE_ROUTE, unresolved: [] };
  const outputs = new Map();

  for (const locale of BREATHE_INDEX_LOCALES) {
    const catalog = await readJson(join(catalogRoot, locale, "pages", CATALOG_FILE));
    assert(catalog.route === SOURCE_ROUTE, `${locale} breathe-index catalog route changed`);
    const catalogByOccurrence = new Map(catalog.segments.map((segment) => [segment.occurrenceKey, segment]));
    const messages = structuredClone(source);
    const localeProvenance = {};
    const counts = { catalogExact: 0, catalogNormalized: 0, override: 0, replacement: 0, unresolved: 0 };

    for (const binding of bindings) {
      const label = `${binding.messagePath}:${locale}`;
      const replacement = replacementByPathLocale.get(label);
      const override = overrideByPath.get(binding.messagePath);
      if (replacement) {
        setPath(messages, binding.messagePath, replacement.translation);
        localeProvenance[binding.messagePath] = {
          reason: replacement.reason,
          sourceHash: replacement.reviewedSourceHash,
          status: "repo-reviewed-replacement",
        };
        counts.replacement += 1;
        continue;
      }
      if (override?.translations[locale]) {
        setPath(messages, binding.messagePath, override.translations[locale]);
        localeProvenance[binding.messagePath] = {
          reason: override.reason,
          sourceHash: override.reviewedSourceHash,
          status: "repo-reviewed-override",
        };
        counts.override += 1;
        continue;
      }

      const resolution = resolveOccurrence(catalogByOccurrence, binding, label);
      if (resolution) {
        setPath(messages, binding.messagePath, resolution.translation);
        localeProvenance[binding.messagePath] = {
          catalogRoute: SOURCE_ROUTE,
          catalogSourceText: resolution.sourceText,
          occurrenceKey: binding.occurrenceKey,
          sourceHash: sha256(binding.sourceText),
          status: resolution.status,
        };
        counts[resolution.status.endsWith("exact") ? "catalogExact" : "catalogNormalized"] += 1;
        continue;
      }

      counts.unresolved += 1;
      unresolved.unresolved.push({
        locale,
        messagePath: binding.messagePath,
        sourceHash: sha256(binding.sourceText),
        sourceText: binding.sourceText,
      });
    }

    const resolvedMessages = bindings.length - counts.unresolved;
    const publishable = counts.unresolved === 0;
    const serialized = stableJson(messages);
    const relativePath = `messages/${locale}.json`;
    outputs.set(relativePath, serialized);
    provenance.locales[locale] = localeProvenance;
    publication.locales[locale] = {
      ...counts,
      bytes: Buffer.byteLength(serialized),
      path: relativePath,
      publishable,
      resolvedMessages,
      sha256: publishable ? sha256(serialized) : null,
    };
  }

  const italianMessages = structuredClone(source);
  const italianProvenance = {};
  for (const binding of bindings) {
    const entry = italianEntries.get(binding.messagePath);
    setPath(italianMessages, binding.messagePath, entry.translation);
    italianProvenance[binding.messagePath] = {
      reason: entry.reason,
      sourceHash: entry.reviewedSourceHash,
      status: "italian-pilot-reviewed",
    };
  }
  const italianSerialized = stableJson(italianMessages);
  outputs.set("messages/it-it.json", italianSerialized);
  provenance.locales["it-it"] = italianProvenance;
  publication.locales["it-it"] = {
    catalogExact: 0,
    catalogNormalized: 0,
    override: 0,
    replacement: 0,
    unresolved: 0,
    bytes: Buffer.byteLength(italianSerialized),
    path: "messages/it-it.json",
    publishable: true,
    resolvedMessages: bindings.length,
    sha256: sha256(italianSerialized),
  };

  unresolved.unresolved.sort((left, right) =>
    `${left.messagePath}:${left.locale}`.localeCompare(`${right.messagePath}:${right.locale}`, "en")
  );
  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, provenance, publication, unresolved };
}

export async function writeBreatheIndexContentArtifacts() {
  const build = await buildBreatheIndexContentArtifacts();
  assert(outputRoot === join(contentRoot, "messages"), "Refusing unsafe breathe-index output path");
  await rm(outputRoot, { force: true, recursive: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return { unresolved: build.unresolved.unresolved.length, written: build.outputs.size };
}

export async function checkBreatheIndexContentArtifacts() {
  const build = await buildBreatheIndexContentArtifacts();
  const stale = [];
  for (const [relativePath, expected] of build.outputs) {
    let actual = null;
    try {
      actual = await readFile(join(contentRoot, relativePath), "utf8");
    } catch {}
    if (actual !== expected) stale.push(relativePath);
  }
  return { checked: build.outputs.size, stale };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const result = await checkBreatheIndexContentArtifacts();
    assert(result.stale.length === 0, `Stale breathe-index artifacts: ${result.stale.join(", ")}`);
    console.log(JSON.stringify({ ...result, mode: "check" }));
  } else {
    const result = await writeBreatheIndexContentArtifacts();
    console.log(JSON.stringify({ ...result, mode: "write" }));
  }
}
