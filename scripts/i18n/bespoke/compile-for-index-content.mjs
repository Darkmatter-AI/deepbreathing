#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/for-index");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const sourcePath = join(contentRoot, "source.json");
const bindingsPath = join(contentRoot, "occurrence-bindings.json");
const overridesPath = join(contentRoot, "overrides.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const outputRoot = join(contentRoot, "messages");

export const FOR_INDEX_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const SOURCE_ROUTE = "/for";
const CATALOG_FILE = "for.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function normalizeForIndexTypography(value) {
  return value
    .normalize("NFKC")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
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

function interpolationTokens(value) {
  const braceTokens = value.match(/\{\{?[A-Za-z_][A-Za-z0-9_.-]*\}?\}/g) ?? [];
  const printfTokens =
    value.match(/%(?:\([A-Za-z_][A-Za-z0-9_.-]*\))?[sdif]/g) ?? [];
  return [...braceTokens, ...printfTokens].sort();
}

function numericTokens(value) {
  return (value.normalize("NFKC").match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map((token) => token.replace(",", "."))
    .sort();
}

function protectedSymbols(value) {
  return (value.match(/[→←↔%]|[₀₁₂₃₄₅₆₇₈₉]+/g) ?? []).sort();
}

function containsAllTokens(actual, required) {
  const remaining = [...actual];
  for (const token of required) {
    const index = remaining.indexOf(token);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return true;
}

function validateTranslation(sourceText, translation, label, reason) {
  assert(
    typeof translation === "string" && translation.trim(),
    `${label} is empty`,
  );
  assert(!translation.includes("\0"), `${label} contains a null byte`);
  assert(
    !/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation),
    `${label} contains unsafe markup`,
  );
  assert(
    !/\son[A-Za-z]+\s*=/i.test(translation),
    `${label} contains an HTML event handler`,
  );
  assert(
    !/javascript\s*:/i.test(translation),
    `${label} contains a javascript URL`,
  );
  assert(
    JSON.stringify(interpolationTokens(translation)) ===
      JSON.stringify(interpolationTokens(sourceText)),
    `${label} changed interpolation placeholders`,
  );
  const sourceNumbers = numericTokens(sourceText);
  assert(
    containsAllTokens(numericTokens(translation), sourceNumbers) ||
      (typeof reason === "string" && reason.trim()),
    `${label} changed numeric values without a review reason`,
  );
  assert(
    containsAllTokens(
      protectedSymbols(translation),
      protectedSymbols(sourceText),
    ),
    `${label} changed protected symbols`,
  );
  assert(
    translation.length <= Math.max(sourceText.length * 8, 320),
    `${label} is unexpectedly long`,
  );
}

function validateManualFile(file, kind, bindingsByPath) {
  assert(file.schemaVersion === 1, `Unsupported for-index ${kind} schema`);
  const records = file[kind];
  assert(Array.isArray(records), `For-index ${kind} must be an array`);
  const seen = new Set();

  for (const record of records) {
    const binding = bindingsByPath.get(record.messagePath);
    assert(binding, `Unknown for-index ${kind} ${record.messagePath}`);
    assert(
      record.sourceText === binding.sourceText,
      `${record.messagePath} ${kind} source changed`,
    );
    assert(
      record.reviewedSourceHash === sha256(record.sourceText),
      `${record.messagePath} ${kind} source hash changed`,
    );
    assert(
      typeof record.reason === "string" && record.reason.trim(),
      `${record.messagePath} ${kind} lacks a reason`,
    );
    for (const [locale, translation] of Object.entries(
      record.translations ?? {},
    )) {
      assert(
        FOR_INDEX_LOCALES.includes(locale),
        `${record.messagePath} ${kind} has unsupported locale ${locale}`,
      );
      const key = `${record.messagePath}:${locale}`;
      assert(!seen.has(key), `Duplicate for-index ${kind} ${key}`);
      seen.add(key);
      validateTranslation(
        record.sourceText,
        translation,
        `${key} ${kind}`,
        record.reason,
      );
    }
  }
}

function isApproved(segment) {
  return (
    segment?.translation?.isApproved === true &&
    segment.translation.needsReview === false &&
    typeof segment.translation.text === "string" &&
    segment.translation.text.trim()
  );
}

function resolveOccurrence(catalogByOccurrence, binding, label) {
  if (!binding.occurrenceKey) return null;
  const segment = catalogByOccurrence.get(binding.occurrenceKey);
  assert(
    segment,
    `${label} is missing catalog occurrence ${binding.occurrenceKey}`,
  );
  const expected = binding.catalogSourceText ?? binding.sourceText;
  const exact = segment.sourceText === expected;
  assert(
    exact ||
      normalizeForIndexTypography(segment.sourceText) ===
        normalizeForIndexTypography(expected),
    `${label} catalog source drift at ${binding.occurrenceKey}`,
  );
  assert(isApproved(segment), `${label} catalog translation is not approved`);
  validateTranslation(
    binding.sourceText,
    segment.translation.text,
    label,
    "approved catalog translation",
  );
  return {
    sourceText: segment.sourceText,
    status: exact
      ? "route-catalog-occurrence-exact"
      : "route-catalog-occurrence-normalized",
    translation: segment.translation.text,
  };
}

export async function buildForIndexContentArtifacts() {
  const [source, bindingFile, overrides, replacements] = await Promise.all([
    readJson(sourcePath),
    readJson(bindingsPath),
    readJson(overridesPath),
    readJson(replacementsPath),
  ]);
  assert(
    bindingFile.schemaVersion === 1,
    "Unsupported for-index binding schema",
  );
  assert(
    bindingFile.sourceRoute === SOURCE_ROUTE,
    "For-index binding route changed",
  );

  const sourceLeaves = flattenStringLeaves(source);
  const bindings = bindingFile.bindings;
  const bindingsByPath = new Map(
    bindings.map((binding) => [binding.messagePath, binding]),
  );
  assert(
    bindings.length === bindingsByPath.size,
    "Duplicate for-index message path",
  );
  assert(
    sourceLeaves.size === bindings.length,
    "For-index source and bindings have different leaf counts",
  );
  for (const [messagePath, sourceText] of sourceLeaves) {
    const binding = bindingsByPath.get(messagePath);
    assert(binding, `For-index binding missing ${messagePath}`);
    assert(binding.sourceText === sourceText, `${messagePath} source drift`);
  }

  validateManualFile(overrides, "overrides", bindingsByPath);
  validateManualFile(replacements, "replacements", bindingsByPath);
  const overrideByPath = new Map(
    overrides.overrides.map((record) => [record.messagePath, record]),
  );
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
    routeId: "for",
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
  };
  const provenance = {
    locales: {},
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
  };
  const unresolved = {
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
    unresolved: [],
  };
  const outputs = new Map();

  for (const locale of FOR_INDEX_LOCALES) {
    const catalog = await readJson(
      join(catalogRoot, locale, "pages", CATALOG_FILE),
    );
    assert(
      catalog.route === SOURCE_ROUTE,
      `${locale} for-index catalog route changed`,
    );
    const catalogByOccurrence = new Map(
      catalog.segments.map((segment) => [segment.occurrenceKey, segment]),
    );
    const messages = structuredClone(source);
    const localeProvenance = {};
    const counts = {
      catalogExact: 0,
      catalogNormalized: 0,
      override: 0,
      replacement: 0,
      unresolved: 0,
    };

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
        counts[
          resolution.status.endsWith("exact")
            ? "catalogExact"
            : "catalogNormalized"
        ] += 1;
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

  unresolved.unresolved.sort((left, right) =>
    `${left.messagePath}:${left.locale}`.localeCompare(
      `${right.messagePath}:${right.locale}`,
      "en",
    ),
  );
  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, provenance, publication, unresolved };
}

export async function writeForIndexContentArtifacts() {
  const build = await buildForIndexContentArtifacts();
  assert(
    outputRoot === join(contentRoot, "messages"),
    "Refusing unsafe for-index output path",
  );
  await rm(outputRoot, { force: true, recursive: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return {
    unresolved: build.unresolved.unresolved.length,
    written: build.outputs.size,
  };
}

export async function checkForIndexContentArtifacts() {
  const build = await buildForIndexContentArtifacts();
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

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes("--check")) {
    const result = await checkForIndexContentArtifacts();
    assert(
      result.stale.length === 0,
      `Stale for-index artifacts: ${result.stale.join(", ")}`,
    );
    console.log(JSON.stringify({ ...result, mode: "check" }));
  } else {
    const result = await writeForIndexContentArtifacts();
    console.log(JSON.stringify({ ...result, mode: "write" }));
  }
}
