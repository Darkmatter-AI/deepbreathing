#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/privacy-support");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const manualRoot = join(repoRoot, "src/i18n/content/remaining-pages/manual");

export const PRIVACY_SUPPORT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
];

const ROUTES = {
  privacy: {
    sourceRoute: "/privacy",
    expectedMessages: 32,
    expectedCatalogBindings: 16,
    expectedGapBindings: 3,
    expectedMirrorBindings: 2,
    expectedReplacementBindings: 11,
    expectedReviewedGapCells: 15,
    expectedRenderedGapCells: 15,
    expectedStaleGapCells: 0,
  },
  support: {
    sourceRoute: "/support",
    expectedMessages: 36,
    expectedCatalogBindings: 6,
    expectedGapBindings: 25,
    expectedMirrorBindings: 2,
    expectedReplacementBindings: 3,
    expectedReviewedGapCells: 140,
    expectedRenderedGapCells: 125,
    expectedStaleGapCells: 15,
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareText)
        .map((key) => [key, sortJsonValue(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function flattenStringLeaves(value, prefix = "", output = new Map()) {
  if (typeof value === "string") {
    output.set(prefix, value);
    return output;
  }
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    `${prefix || "source"}: semantic contracts cannot contain arrays`,
  );
  for (const [key, child] of Object.entries(value)) {
    assert(
      /^[a-z][A-Za-z0-9]*$/.test(key) &&
        !/sel|ctx|copy|[0-9]{4}/i.test(key),
      `${prefix || "source"}: unstable semantic key ${key}`,
    );
    flattenStringLeaves(child, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}

function pathParts(path) {
  return path.split(".");
}

function setPath(target, path, value) {
  const parts = pathParts(path);
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part];
  cursor[parts.at(-1)] = value;
}

function assertExactKeys(value, expected, label) {
  assert(
    JSON.stringify(Object.keys(value).sort(compareText)) ===
      JSON.stringify([...expected].sort(compareText)),
    `${label}: keys changed`,
  );
}

function isApproved(segment) {
  return (
    segment?.translation?.isApproved === true &&
    segment.translation.needsReview === false &&
    typeof segment.translation.text === "string" &&
    segment.translation.text.trim().length > 0
  );
}

function validateTranslation(
  sourceText,
  translation,
  label,
  numericReviewReason,
) {
  assert(
    typeof translation === "string" && translation.trim().length > 0,
    `${label}: translation is empty`,
  );
  assert(
    !/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation),
    `${label}: translation contains unsafe markup`,
  );
  validateForTranslationSafety(sourceText, translation, label, {
    numericReviewReason,
  });
}

function catalogFileName(route) {
  return route === "/" ? "_root.json" : `${route.slice(1)}.json`;
}

async function loadCatalog(cache, locale, route) {
  const key = `${locale}:${route}`;
  if (!cache.has(key)) {
    const catalog = await readJson(
      join(catalogRoot, locale, "pages", catalogFileName(route)),
    );
    assert(catalog.locale === locale, `${key}: catalog locale changed`);
    assert(catalog.route === route, `${key}: catalog route changed`);
    cache.set(key, catalog);
  }
  return cache.get(key);
}

function resolveCatalogOccurrence(catalog, binding, label) {
  const candidates = catalog.segments.filter(
    (segment) => segment.occurrenceKey === binding.occurrenceKey,
  );
  assert(candidates.length === 1, `${label}: occurrence is not unique`);
  const [segment] = candidates;
  assert(
    segment.sourceText === binding.catalogSourceText,
    `${label}: catalog source drifted`,
  );
  assert(isApproved(segment), `${label}: catalog translation is not approved`);
  return segment;
}

function indexManualEntries(manual, route) {
  assert(manual.schemaVersion === 1, `${route}: manual schema changed`);
  assert(manual.sourceRoute === route, `${route}: manual route changed`);
  assert(Array.isArray(manual.entries), `${route}: manual entries changed`);
  const entries = new Map();
  for (const entry of manual.entries) {
    assert(
      /^catalog-placement\.[0-9a-f-]{36}$/.test(entry.messageId),
      `${route}: manual message id changed`,
    );
    const placementId = entry.messageId.slice("catalog-placement.".length);
    assert(!entries.has(placementId), `${route}: duplicate ${placementId}`);
    assert(
      entry.reviewedSourceHash === sha256(entry.sourceText),
      `${route}:${placementId}: source hash drifted`,
    );
    assertExactKeys(
      entry.translations,
      PRIVACY_SUPPORT_LOCALES,
      `${route}:${placementId}:translations`,
    );
    for (const [locale, translation] of Object.entries(entry.translations)) {
      validateTranslation(
        entry.sourceText,
        translation,
        `${route}:${placementId}:${locale}`,
      );
    }
    entries.set(placementId, entry);
  }
  return entries;
}

function validateRouteBindings(routeName, config, sourceLeaves, bindings) {
  assert(bindings.schemaVersion === 1, `${routeName}: binding schema changed`);
  assert(bindings.route === config.sourceRoute, `${routeName}: binding route changed`);
  for (const field of ["catalog", "gaps", "mirrors", "staleGaps"]) {
    assert(Array.isArray(bindings[field]), `${routeName}: ${field} changed`);
  }
  assert(
    bindings.catalog.length === config.expectedCatalogBindings,
    `${routeName}: catalog binding count changed`,
  );
  assert(
    bindings.gaps.length === config.expectedGapBindings,
    `${routeName}: gap binding count changed`,
  );
  assert(
    bindings.mirrors.length === config.expectedMirrorBindings,
    `${routeName}: mirror binding count changed`,
  );

  const claimedPaths = new Set();
  for (const [kind, records] of [
    ["catalog", bindings.catalog],
    ["gap", bindings.gaps],
    ["mirror", bindings.mirrors],
  ]) {
    for (const record of records) {
      const label = `${routeName}:${kind}:${record.messagePath}`;
      assert(!claimedPaths.has(record.messagePath), `${label}: duplicate path`);
      claimedPaths.add(record.messagePath);
      const sourceText = sourceLeaves.get(record.messagePath);
      assert(typeof sourceText === "string", `${label}: unknown source path`);
      assert(
        record.reviewedSourceHash === sha256(sourceText),
        `${label}: current source hash drifted`,
      );
      if (kind === "catalog") {
        assert(
          typeof record.catalogRoute === "string" &&
            typeof record.occurrenceKey === "string" &&
            typeof record.catalogSourceText === "string" &&
            typeof record.reason === "string" &&
            record.reason.trim().length > 0,
          `${label}: incomplete catalog alias`,
        );
      } else if (kind === "gap") {
        assert(
          /^[0-9a-f-]{36}$/.test(record.placementId),
          `${label}: invalid placement`,
        );
      } else {
        assert(
          typeof record.sourceMessagePath === "string" &&
            typeof record.reason === "string" &&
            record.reason.trim().length > 0,
          `${label}: incomplete mirror`,
        );
      }
    }
  }
  return claimedPaths;
}

function validateReplacements(file, sources) {
  assert(file.schemaVersion === 1, "Replacement schema changed");
  assert(Array.isArray(file.replacements), "Replacement list changed");
  const replacements = new Map();
  for (const replacement of file.replacements) {
    const routeName = replacement.route.slice(1);
    const sourceLeaves = sources[routeName];
    assert(sourceLeaves, `Unknown replacement route ${replacement.route}`);
    const key = `${routeName}:${replacement.messagePath}`;
    assert(!replacements.has(key), `${key}: duplicate replacement`);
    const sourceText = sourceLeaves.get(replacement.messagePath);
    assert(sourceText === replacement.sourceText, `${key}: source changed`);
    assert(
      replacement.reviewedSourceHash === sha256(sourceText),
      `${key}: current source hash drifted`,
    );
    assert(
      typeof replacement.reason === "string" &&
        replacement.reason.trim().length > 0,
      `${key}: missing review reason`,
    );
    assertExactKeys(
      replacement.translations,
      PRIVACY_SUPPORT_LOCALES,
      `${key}:translations`,
    );
    for (const [locale, translation] of Object.entries(
      replacement.translations,
    )) {
      validateTranslation(sourceText, translation, `${key}:${locale}`);
    }
    replacements.set(key, replacement);
  }
  return replacements;
}

export async function buildPrivacySupportArtifacts() {
  const routeInputs = {};
  for (const [routeName, config] of Object.entries(ROUTES)) {
    const [source, bindings, manual] = await Promise.all([
      readJson(join(contentRoot, "source", `${routeName}.json`)),
      readJson(join(contentRoot, "bindings", `${routeName}.json`)),
      readJson(join(manualRoot, `${routeName}.json`)),
    ]);
    const sourceLeaves = flattenStringLeaves(source);
    assert(
      sourceLeaves.size === config.expectedMessages,
      `${routeName}: expected ${config.expectedMessages} messages, found ${sourceLeaves.size}`,
    );
    routeInputs[routeName] = {
      source,
      sourceLeaves,
      bindings,
      manualEntries: indexManualEntries(manual, config.sourceRoute),
    };
  }

  const replacementFile = await readJson(
    join(contentRoot, "reviewed-replacements.json"),
  );
  const replacements = validateReplacements(
    replacementFile,
    Object.fromEntries(
      Object.entries(routeInputs).map(([name, input]) => [
        name,
        input.sourceLeaves,
      ]),
    ),
  );
  const outputs = new Map();
  const unresolved = [];
  const staleGapContracts = [];
  const provenance = { schemaVersion: 1, routes: {} };
  const publication = {
    schemaVersion: 1,
    unresolvedCells: 0,
    routes: {},
  };
  const catalogCache = new Map();

  for (const [routeName, config] of Object.entries(ROUTES)) {
    const { source, sourceLeaves, bindings, manualEntries } =
      routeInputs[routeName];
    const claimedPaths = validateRouteBindings(
      routeName,
      config,
      sourceLeaves,
      bindings,
    );
    const routeReplacements = [...replacements.values()].filter(
      (replacement) => replacement.route === config.sourceRoute,
    );
    assert(
      routeReplacements.length === config.expectedReplacementBindings,
      `${routeName}: replacement binding count changed`,
    );
    for (const replacement of routeReplacements) {
      assert(
        !claimedPaths.has(replacement.messagePath),
        `${routeName}:${replacement.messagePath}: multiply bound`,
      );
      claimedPaths.add(replacement.messagePath);
    }
    assert(
      claimedPaths.size === sourceLeaves.size &&
        [...sourceLeaves.keys()].every((path) => claimedPaths.has(path)),
      `${routeName}: source contract has unbound semantic paths`,
    );

    const claimedPlacements = new Set();
    for (const gap of bindings.gaps) {
      const entry = manualEntries.get(gap.placementId);
      assert(entry, `${routeName}:${gap.messagePath}: gap placement missing`);
      assert(
        entry.sourceText === (gap.gapSourceText ?? sourceLeaves.get(gap.messagePath)),
        `${routeName}:${gap.messagePath}: gap source drifted`,
      );
      assert(
        entry.reviewedSourceHash === sha256(entry.sourceText),
        `${routeName}:${gap.messagePath}: gap review hash drifted`,
      );
      assert(
        !claimedPlacements.has(gap.placementId),
        `${routeName}:${gap.messagePath}: gap placement reused`,
      );
      claimedPlacements.add(gap.placementId);
    }
    for (const stale of bindings.staleGaps) {
      const entry = manualEntries.get(stale.placementId);
      assert(entry, `${routeName}:${stale.placementId}: stale gap missing`);
      assert(
        stale.sourceText === entry.sourceText &&
          stale.reviewedSourceHash === entry.reviewedSourceHash &&
          stale.reviewedSourceHash === sha256(stale.sourceText),
        `${routeName}:${stale.placementId}: stale gap source drifted`,
      );
      assert(
        typeof stale.classification === "string" &&
          typeof stale.reason === "string" &&
          stale.reason.trim().length > 0,
        `${routeName}:${stale.placementId}: stale classification incomplete`,
      );
      assert(
        !claimedPlacements.has(stale.placementId),
        `${routeName}:${stale.placementId}: stale gap placement reused`,
      );
      claimedPlacements.add(stale.placementId);
      staleGapContracts.push({
        route: config.sourceRoute,
        placementId: stale.placementId,
        reviewedSourceHash: stale.reviewedSourceHash,
        sourceText: stale.sourceText,
        classification: stale.classification,
        reason: stale.reason,
        cells: PRIVACY_SUPPORT_LOCALES.length,
        locales: [...PRIVACY_SUPPORT_LOCALES],
      });
    }
    assert(
      claimedPlacements.size === manualEntries.size,
      `${routeName}: reviewed gap placements are not fully classified`,
    );

    provenance.routes[routeName] = { locales: {} };
    const routePublication = {
      expectedMessages: config.expectedMessages,
      catalogBindings: bindings.catalog.length,
      gapBindings: bindings.gaps.length,
      mirrorBindings: bindings.mirrors.length,
      replacementBindings: routeReplacements.length,
      replacementCells:
        routeReplacements.length * PRIVACY_SUPPORT_LOCALES.length,
      reviewedGapCells: manualEntries.size * PRIVACY_SUPPORT_LOCALES.length,
      renderedGapCells: bindings.gaps.length * PRIVACY_SUPPORT_LOCALES.length,
      staleGapCells:
        bindings.staleGaps.length * PRIVACY_SUPPORT_LOCALES.length,
      locales: {},
    };
    assert(
      routePublication.reviewedGapCells === config.expectedReviewedGapCells &&
        routePublication.renderedGapCells === config.expectedRenderedGapCells &&
        routePublication.staleGapCells === config.expectedStaleGapCells,
      `${routeName}: reviewed gap cell contract changed`,
    );

    for (const locale of PRIVACY_SUPPORT_LOCALES) {
      const localized = structuredClone(source);
      const translations = new Map();
      const localeProvenance = {};

      for (const binding of bindings.catalog) {
        const catalog = await loadCatalog(
          catalogCache,
          locale,
          binding.catalogRoute,
        );
        const segment = resolveCatalogOccurrence(
          catalog,
          binding,
          `${routeName}:${locale}:${binding.messagePath}`,
        );
        const sourceText = sourceLeaves.get(binding.messagePath);
        validateTranslation(
          sourceText,
          segment.translation.text,
          `${routeName}:${locale}:${binding.messagePath}`,
          binding.numericReviewReasons?.[locale],
        );
        translations.set(binding.messagePath, segment.translation.text);
        localeProvenance[binding.messagePath] = {
          status: "explicit-catalog-alias",
          catalogRoute: binding.catalogRoute,
          occurrenceKey: binding.occurrenceKey,
          reviewedSourceHash: binding.reviewedSourceHash,
        };
      }
      for (const binding of bindings.gaps) {
        const entry = manualEntries.get(binding.placementId);
        const translation = entry.translations[locale];
        const sourceText = sourceLeaves.get(binding.messagePath);
        validateTranslation(
          sourceText,
          translation,
          `${routeName}:${locale}:${binding.messagePath}`,
          binding.numericReviewReasons?.[locale],
        );
        translations.set(binding.messagePath, translation);
        localeProvenance[binding.messagePath] = {
          status: "reviewed-gap",
          placementId: binding.placementId,
          reviewedSourceHash: binding.reviewedSourceHash,
        };
      }
      for (const replacement of routeReplacements) {
        const translation = replacement.translations[locale];
        translations.set(replacement.messagePath, translation);
        localeProvenance[replacement.messagePath] = {
          status: "reviewed-replacement",
          reviewedSourceHash: replacement.reviewedSourceHash,
        };
      }
      for (const mirror of bindings.mirrors) {
        const translation = translations.get(mirror.sourceMessagePath);
        assert(
          typeof translation === "string",
          `${routeName}:${locale}:${mirror.messagePath}: mirror source unresolved`,
        );
        translations.set(mirror.messagePath, translation);
        localeProvenance[mirror.messagePath] = {
          status: "semantic-mirror",
          sourceMessagePath: mirror.sourceMessagePath,
          reviewedSourceHash: mirror.reviewedSourceHash,
        };
      }
      for (const [messagePath, translation] of translations) {
        setPath(localized, messagePath, translation);
      }
      if (translations.size !== sourceLeaves.size) {
        for (const [messagePath, sourceText] of sourceLeaves) {
          if (!translations.has(messagePath)) {
            unresolved.push({
              route: config.sourceRoute,
              locale,
              messagePath,
              sourceText,
              reason: "semantic path was not resolved",
            });
          }
        }
      }
      const raw = stableJson(localized);
      const outputPath = `messages/${routeName}/${locale}.json`;
      outputs.set(outputPath, raw);
      provenance.routes[routeName].locales[locale] = localeProvenance;
      routePublication.locales[locale] = {
        path: outputPath,
        resolvedMessages: translations.size,
        publishable: translations.size === config.expectedMessages,
        sha256: sha256(raw),
      };
    }
    publication.routes[routeName] = routePublication;
  }

  publication.unresolvedCells = unresolved.length;
  assert(
    unresolved.length === 0,
    `Privacy/support content is unresolved:\n${JSON.stringify(unresolved, null, 2)}`,
  );
  assert(
    Object.values(publication.routes).every((route) =>
      Object.values(route.locales).every((locale) => locale.publishable),
    ),
    "Privacy/support route is not publishable",
  );

  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  outputs.set("stale-gap-contracts.json", stableJson(staleGapContracts));
  return outputs;
}

async function listFiles(root, current = root) {
  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    else files.push(relative(root, path));
  }
  return files;
}

export async function writePrivacySupportArtifacts() {
  const outputs = await buildPrivacySupportArtifacts();
  await rm(join(contentRoot, "messages"), { recursive: true, force: true });
  for (const [relativePath, raw] of outputs) {
    const path = join(contentRoot, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, raw, "utf8");
  }
  return outputs;
}

export async function checkPrivacySupportArtifacts() {
  const outputs = await buildPrivacySupportArtifacts();
  const stale = [];
  for (const [relativePath, expected] of outputs) {
    try {
      const actual = await readFile(join(contentRoot, relativePath), "utf8");
      if (actual !== expected) stale.push(relativePath);
    } catch (error) {
      if (error.code === "ENOENT") stale.push(relativePath);
      else throw error;
    }
  }
  const expectedPaths = new Set(outputs.keys());
  for (const file of await listFiles(join(contentRoot, "messages"))) {
    const path = `messages/${file}`;
    if (!expectedPaths.has(path)) stale.push(path);
  }
  return [...new Set(stale)].sort(compareText);
}

async function main() {
  if (process.argv.includes("--check")) {
    const stale = await checkPrivacySupportArtifacts();
    if (stale.length > 0) {
      throw new Error(`Stale privacy/support artifacts: ${stale.join(", ")}`);
    }
    console.log(JSON.stringify({ checked: 14, stale, mode: "check" }));
    return;
  }
  const outputs = await writePrivacySupportArtifacts();
  console.log(
    JSON.stringify({ written: outputs.size, unresolved: 0, mode: "write" }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
