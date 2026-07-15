#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/timer-4-7-8");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const sourcePath = join(contentRoot, "source.json");
const overridesPath = join(contentRoot, "overrides.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const outputRoot = join(contentRoot, "messages");
const publicationPath = join(contentRoot, "publication.json");
const provenancePath = join(contentRoot, "provenance.json");
const unresolvedPath = join(contentRoot, "unresolved.json");

export const TIMER_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const SOURCE_ROUTE = "/4-7-8-breathing-timer";
const SOURCE_ROUTE_FILE = "4-7-8-breathing-timer.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return left.localeCompare(right, "en");
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, child]) => [key, sortDeep(child)]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(sortDeep(value), null, 2)}\n`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function walkJsonFiles(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) output.push(...await walkJsonFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".json")) output.push(path);
  }
  return output.sort(compareText);
}

function normalizeForRecovery(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function approvedSegments(catalog) {
  return catalog.segments.filter((segment) =>
    segment.translation?.isApproved === true
      && segment.translation?.needsReview === false
      && typeof segment.translation?.text === "string"
      && segment.translation.text.trim()
  );
}

function indexSegments(entries) {
  const exact = new Map();
  const normalized = new Map();
  for (const entry of entries) {
    const exactEntries = exact.get(entry.sourceText) ?? [];
    exactEntries.push(entry);
    exact.set(entry.sourceText, exactEntries);
    const normalizedKey = normalizeForRecovery(entry.sourceText);
    const normalizedEntries = normalized.get(normalizedKey) ?? [];
    normalizedEntries.push(entry);
    normalized.set(normalizedKey, normalizedEntries);
  }
  return { exact, normalized };
}

function uniqueResolution(entries, sourceText, status) {
  if (!entries?.length) return null;
  const translations = [...new Set(entries.map((entry) => entry.translation.text))];
  if (translations.length !== 1) return null;
  const sourceTexts = [...new Set(entries.map((entry) => entry.sourceText))];
  return {
    catalogRoutes: [...new Set(entries.map((entry) => entry.catalogRoute))].sort(compareText),
    catalogSourceTexts: sourceTexts.sort(compareText),
    sourceHash: sha256(sourceText),
    status,
    translation: translations[0],
  };
}

function resolveCatalog(indexes, sourceText) {
  return uniqueResolution(indexes.route.exact.get(sourceText), sourceText, "route-catalog-exact")
    ?? uniqueResolution(
      indexes.route.normalized.get(normalizeForRecovery(sourceText)),
      sourceText,
      "route-catalog-normalized",
    )
    ?? uniqueResolution(indexes.global.exact.get(sourceText), sourceText, "global-catalog-exact")
    ?? uniqueResolution(
      indexes.global.normalized.get(normalizeForRecovery(sourceText)),
      sourceText,
      "global-catalog-normalized",
    );
}

function validateManualFile(file, kind, source) {
  assert(file.schemaVersion === 1, `Unsupported timer ${kind} schema`);
  const records = file[kind];
  assert(Array.isArray(records), `Timer ${kind} must be an array`);
  const seen = new Set();
  for (const record of records) {
    assert(typeof source[record.messageId] === "string", `Unknown timer ${kind} message ${record.messageId}`);
    assert(record.sourceText === source[record.messageId], `${record.messageId} ${kind} source changed`);
    assert(record.reviewedSourceHash === sha256(record.sourceText), `${record.messageId} ${kind} source hash changed`);
    assert(typeof record.reason === "string" && record.reason.trim(), `${record.messageId} ${kind} lacks a reason`);
    const locales = Object.keys(record.translations ?? {});
    assert(locales.length > 0, `${record.messageId} ${kind} has no translations`);
    for (const locale of locales) {
      assert(TIMER_LOCALES.includes(locale), `${record.messageId} ${kind} has unsupported locale ${locale}`);
      const key = `${record.messageId}:${locale}`;
      assert(!seen.has(key), `Duplicate timer ${kind} ${key}`);
      seen.add(key);
      const translation = record.translations[locale];
      assert(typeof translation === "string" && translation.trim(), `${key} ${kind} is empty`);
      assert(!/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation), `${key} ${kind} contains unsafe markup`);
    }
  }
}

export async function buildTimerContentArtifacts() {
  const [source, overrides, replacements] = await Promise.all([
    readJson(sourcePath),
    readJson(overridesPath),
    readJson(replacementsPath),
  ]);
  validateManualFile(overrides, "overrides", source);
  validateManualFile(replacements, "replacements", source);
  const overrideIndex = new Map(
    overrides.overrides.flatMap((record) => Object.entries(record.translations).map(([locale, translation]) => [
      `${record.messageId}:${locale}`,
      { record, translation },
    ])),
  );
  const replacementIndex = new Map(
    replacements.replacements.flatMap((record) => Object.entries(record.translations).map(([locale, translation]) => [
      `${record.messageId}:${locale}`,
      { record, translation },
    ])),
  );

  const publication = {
    expectedMessages: Object.keys(source).length,
    locales: {},
    routeId: "4-7-8-breathing-timer",
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
  };
  const provenance = { locales: {}, schemaVersion: 1, sourceRoute: SOURCE_ROUTE };
  const unresolved = { schemaVersion: 1, sourceRoute: SOURCE_ROUTE, unresolved: [] };
  const outputs = new Map();

  for (const locale of TIMER_LOCALES) {
    const pagesRoot = join(catalogRoot, locale, "pages");
    const files = await walkJsonFiles(pagesRoot);
    const entries = [];
    for (const path of files) {
      const catalog = await readJson(path);
      const catalogRoute = catalog.route ?? `/${relative(pagesRoot, path).replace(/\.json$/, "")}`;
      for (const segment of approvedSegments(catalog)) entries.push({ ...segment, catalogRoute });
    }
    const routeEntries = entries.filter((entry) => entry.catalogRoute === SOURCE_ROUTE);
    assert(routeEntries.length > 0, `Timer route catalog is empty for ${locale}`);
    const indexes = {
      global: indexSegments(entries),
      route: indexSegments(routeEntries),
    };
    const messages = {};
    const localeProvenance = {};
    const counts = {
      catalogExact: 0,
      catalogNormalized: 0,
      override: 0,
      replacement: 0,
      unresolved: 0,
    };

    for (const [messageId, sourceText] of Object.entries(source)) {
      const replacement = replacementIndex.get(`${messageId}:${locale}`);
      const override = overrideIndex.get(`${messageId}:${locale}`);
      if (replacement || override) {
        const manual = replacement ?? override;
        const status = replacement ? "repo-reviewed-replacement" : "repo-reviewed-override";
        messages[messageId] = manual.translation;
        localeProvenance[messageId] = {
          reason: manual.record.reason,
          sourceHash: manual.record.reviewedSourceHash,
          status,
        };
        counts[replacement ? "replacement" : "override"] += 1;
        continue;
      }

      const resolution = resolveCatalog(indexes, sourceText);
      if (resolution) {
        messages[messageId] = resolution.translation;
        localeProvenance[messageId] = {
          catalogRoutes: resolution.catalogRoutes,
          catalogSourceTexts: resolution.catalogSourceTexts,
          sourceHash: resolution.sourceHash,
          status: resolution.status,
        };
        counts[resolution.status.endsWith("exact") ? "catalogExact" : "catalogNormalized"] += 1;
        continue;
      }

      counts.unresolved += 1;
      unresolved.unresolved.push({ locale, messageId, sourceHash: sha256(sourceText), sourceText });
    }

    const resolvedMessages = Object.keys(messages).length;
    const publishable = resolvedMessages === Object.keys(source).length;
    const serialized = stableJson(messages);
    outputs.set(`messages/${locale}.json`, serialized);
    publication.locales[locale] = {
      ...counts,
      path: `messages/${locale}.json`,
      publishable,
      resolvedMessages,
      sha256: publishable ? sha256(serialized) : null,
    };
    provenance.locales[locale] = localeProvenance;
  }

  unresolved.unresolved.sort((left, right) =>
    compareText(`${left.messageId}:${left.locale}`, `${right.messageId}:${right.locale}`)
  );
  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, provenance, publication, unresolved };
}

export async function writeTimerContentArtifacts() {
  const result = await buildTimerContentArtifacts();
  await mkdir(outputRoot, { recursive: true });
  for (const [relativePath, content] of result.outputs) {
    await writeFile(join(contentRoot, relativePath), content);
  }
  return result;
}

export async function checkTimerContentArtifacts() {
  const result = await buildTimerContentArtifacts();
  const stale = [];
  for (const [relativePath, expected] of result.outputs) {
    let actual = null;
    try {
      actual = await readFile(join(contentRoot, relativePath), "utf8");
    } catch {}
    if (actual !== expected) stale.push(relativePath);
  }
  return { checked: result.outputs.size, stale };
}

async function main() {
  const check = process.argv.includes("--check");
  if (check) {
    const result = await checkTimerContentArtifacts();
    assert(result.stale.length === 0, `Stale timer content artifacts: ${result.stale.join(", ")}`);
    console.log(JSON.stringify({ ...result, mode: "check" }));
    return;
  }
  const result = await writeTimerContentArtifacts();
  console.log(JSON.stringify({
    messages: result.publication.expectedMessages,
    mode: "write",
    unresolved: result.unresolved.unresolved.length,
    written: result.outputs.size,
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
