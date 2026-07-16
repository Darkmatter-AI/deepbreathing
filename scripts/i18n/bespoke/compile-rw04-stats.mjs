#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/stats");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const sourcePath = join(contentRoot, "source.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const bindingsPath = join(contentRoot, "external-bindings.json");

export const RW04_STATS_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];

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

function catalogPath(locale, route) {
  return join(catalogRoot, locale, "pages", `${route.replace(/^\//, "")}.json`);
}

function validateTranslation(sourceText, translation, label) {
  assert(
    typeof translation === "string" && translation.trim(),
    `${label} is empty`,
  );
  assert(
    !/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation),
    `${label} contains unsafe markup`,
  );
  assert(
    translation.length <= Math.max(sourceText.length * 10, 280),
    `${label} is unexpectedly long`,
  );
  const sourceTokens = sourceText.match(/\{[a-z]+\}/g) ?? [];
  const targetTokens = translation.match(/\{[a-z]+\}/g) ?? [];
  assert(
    JSON.stringify(sourceTokens.sort()) === JSON.stringify(targetTokens.sort()),
    `${label} interpolation tokens changed`,
  );
}

function findOccurrence(catalog, occurrenceKey, label) {
  const matches = catalog.segments.filter(
    (segment) => segment.occurrenceKey === occurrenceKey,
  );
  assert(
    matches.length === 1,
    `${label} expected one occurrence, found ${matches.length}`,
  );
  return matches[0];
}

function indexRecords(ledger, field, source, label) {
  assert(ledger.schemaVersion === 1, `${label} schema changed`);
  assert(ledger.sourceRoute === "/stats", `${label} source route changed`);
  assert(Array.isArray(ledger[field]), `${label}.${field} must be an array`);
  const result = new Map();
  for (const record of ledger[field]) {
    assert(
      typeof source[record.messageId] === "string",
      `${label} has unknown ${record.messageId}`,
    );
    assert(
      !result.has(record.messageId),
      `${label} duplicates ${record.messageId}`,
    );
    assert(
      record.sourceText === source[record.messageId],
      `${record.messageId} ${label} source changed`,
    );
    assert(
      record.reviewedSourceHash === sha256(record.sourceText),
      `${record.messageId} ${label} hash changed`,
    );
    assert(
      typeof record.reason === "string" && record.reason.trim(),
      `${record.messageId} ${label} lacks reason`,
    );
    result.set(record.messageId, record);
  }
  return result;
}

function validateLedgers(source, replacements, bindings) {
  const replacementIndex = indexRecords(
    replacements,
    "replacements",
    source,
    "replacements",
  );
  const bindingIndex = indexRecords(bindings, "bindings", source, "bindings");
  for (const [messageId, record] of replacementIndex) {
    assert(
      JSON.stringify(Object.keys(record.translations).sort(compareText)) ===
        JSON.stringify([...RW04_STATS_LOCALES].sort(compareText)),
      `${messageId} replacement locales changed`,
    );
    for (const locale of RW04_STATS_LOCALES)
      validateTranslation(
        record.sourceText,
        record.translations[locale],
        `${messageId}:${locale}`,
      );
    if (record.catalogGapBinding) {
      assert(
        record.catalogGapBinding.catalogRoute === "/stats",
        `${messageId} gap route changed`,
      );
      assert(
        typeof record.catalogGapBinding.occurrenceKey === "string",
        `${messageId} gap occurrence missing`,
      );
      assert(
        typeof record.catalogGapBinding.catalogSourceText === "string",
        `${messageId} gap source missing`,
      );
    }
  }
  for (const [messageId, record] of bindingIndex) {
    assert(
      record.catalogRoute === "/breathing-visualizer",
      `${messageId} external route changed`,
    );
    assert(
      typeof record.occurrenceKey === "string",
      `${messageId} external occurrence missing`,
    );
  }
  for (const messageId of Object.keys(source)) {
    assert(
      replacementIndex.has(messageId) !== bindingIndex.has(messageId),
      `${messageId} must have exactly one reviewed resolution`,
    );
  }
  return { replacementIndex, bindingIndex };
}

export async function buildRw04StatsArtifacts() {
  const [source, replacements, bindings] = await Promise.all([
    readJson(sourcePath),
    readJson(replacementsPath),
    readJson(bindingsPath),
  ]);
  assert(
    Object.values(source).every((value) => typeof value === "string"),
    "stats source must be a flat string contract",
  );
  assert(
    !/(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/.test(
      JSON.stringify(source),
    ),
    "stats source leaks catalog placement metadata",
  );
  const { replacementIndex, bindingIndex } = validateLedgers(
    source,
    replacements,
    bindings,
  );
  const outputs = new Map();
  const publication = {
    expectedMessages: Object.keys(source).length,
    locales: RW04_STATS_LOCALES,
    coverage: {},
    routeId: "stats",
    schemaVersion: 1,
    sourceRoute: "/stats",
  };
  const provenance = { locales: {}, schemaVersion: 1, sourceRoute: "/stats" };
  const unresolved = {
    schemaVersion: 1,
    sourceRoute: "/stats",
    unresolved: [],
  };

  for (const locale of RW04_STATS_LOCALES) {
    const messages = {};
    const localeProvenance = {};
    const counts = {
      externalBindings: 0,
      gapReplacements: 0,
      reviewedReplacements: 0,
      unresolved: 0,
    };
    for (const [messageId, sourceText] of Object.entries(source)) {
      const replacement = replacementIndex.get(messageId);
      if (replacement) {
        if (replacement.catalogGapBinding) {
          const catalog = await readJson(
            catalogPath(locale, replacement.catalogGapBinding.catalogRoute),
          );
          const segment = findOccurrence(
            catalog,
            replacement.catalogGapBinding.occurrenceKey,
            `${messageId}:${locale}`,
          );
          assert(
            segment.sourceText ===
              replacement.catalogGapBinding.catalogSourceText,
            `${messageId}:${locale} gap catalog source changed`,
          );
          assert(
            segment.translation?.isApproved !== true ||
              segment.translation?.needsReview === true ||
              !segment.translation?.text?.trim(),
            `${messageId}:${locale} gap unexpectedly has approved catalog text`,
          );
          counts.gapReplacements += 1;
          localeProvenance[messageId] = {
            kind: "reviewed-gap-replacement",
            reviewedSourceHash: replacement.reviewedSourceHash,
            ...replacement.catalogGapBinding,
          };
        } else {
          counts.reviewedReplacements += 1;
          localeProvenance[messageId] = {
            kind: "reviewed-replacement",
            reviewedSourceHash: replacement.reviewedSourceHash,
          };
        }
        messages[messageId] = replacement.translations[locale];
        continue;
      }

      const binding = bindingIndex.get(messageId);
      const catalog = await readJson(catalogPath(locale, binding.catalogRoute));
      const segment = findOccurrence(
        catalog,
        binding.occurrenceKey,
        `${messageId}:${locale}`,
      );
      assert(
        segment.sourceText === sourceText,
        `${messageId}:${locale} external source changed`,
      );
      assert(
        segment.translation?.isApproved === true &&
          segment.translation?.needsReview === false &&
          segment.translation?.text?.trim(),
        `${messageId}:${locale} external catalog value is unavailable`,
      );
      validateTranslation(
        sourceText,
        segment.translation.text,
        `${messageId}:${locale}`,
      );
      messages[messageId] = segment.translation.text;
      localeProvenance[messageId] = {
        catalogRoute: binding.catalogRoute,
        kind: "catalog-external",
        occurrenceKey: binding.occurrenceKey,
        sourceHash: segment.sourceHash,
      };
      counts.externalBindings += 1;
    }
    const raw = stableJson(messages);
    const resolvedMessages = Object.keys(messages).length;
    const publishable = resolvedMessages === Object.keys(source).length;
    outputs.set(`messages/${locale}.json`, raw);
    publication.coverage[locale] = {
      ...counts,
      path: `messages/${locale}.json`,
      publishable,
      resolvedMessages,
      sha256: publishable ? sha256(raw) : null,
    };
    provenance.locales[locale] = localeProvenance;
  }
  return { outputs, publication, provenance, unresolved };
}

async function expectedArtifacts() {
  const built = await buildRw04StatsArtifacts();
  return new Map([
    ...built.outputs,
    ["publication.json", stableJson(built.publication)],
    ["provenance.json", stableJson(built.provenance)],
    ["unresolved.json", stableJson(built.unresolved)],
  ]);
}

export async function checkRw04StatsArtifacts() {
  const expected = await expectedArtifacts();
  const stale = [];
  for (const [relativePath, expectedRaw] of expected) {
    try {
      if (
        (await readFile(join(contentRoot, relativePath), "utf8")) !==
        expectedRaw
      )
        stale.push(relativePath);
    } catch {
      stale.push(relativePath);
    }
  }
  return { stale: stale.sort(compareText) };
}

export async function writeRw04StatsArtifacts() {
  const expected = await expectedArtifacts();
  await rm(join(contentRoot, "messages"), { recursive: true, force: true });
  for (const [relativePath, raw] of expected) {
    const path = join(contentRoot, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, raw);
  }
  return { written: expected.size };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const command = process.argv[2] ?? "write";
  if (command === "write" || command === "--write") {
    const result = await writeRw04StatsArtifacts();
    console.log(`Wrote ${result.written} R-W04 stats artifacts.`);
  } else if (command === "check" || command === "--check") {
    const result = await checkRw04StatsArtifacts();
    if (result.stale.length) {
      console.error(`Stale R-W04 stats artifacts:\n${result.stale.join("\n")}`);
      process.exitCode = 1;
    } else {
      console.log("R-W04 stats artifacts are current.");
    }
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}
