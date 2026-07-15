#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const batchMapPath = join(
  repoRoot,
  "docs/native-i18n/work/remaining-pages-batch-map.json",
);
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const manualRoot = join(repoRoot, "src/i18n/content/remaining-pages/manual");

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

export function stableJson(value) {
  return `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function contractFileName(route) {
  assert(route.startsWith("/"), `Invalid route: ${route}`);
  return `${route.slice(1).replaceAll("/", "--")}.json`;
}

function catalogFileName(route) {
  return route === "/" ? "_root.json" : `${route.slice(1)}.json`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function translationValue(segment, label) {
  if (segment.translation === null) return null;
  assert(
    segment.translation && typeof segment.translation.text === "string",
    `${label}: invalid catalog translation`,
  );
  assert(segment.translation.text.length > 0, `${label}: empty translation`);
  return segment.translation.text;
}

function assertSamePlacement(reference, candidate, label) {
  for (const field of [
    "pageSegmentId",
    "catalogSegmentId",
    "sourceHash",
    "sourceText",
    "sourceLocale",
    "segmentType",
    "isUi",
    "occurrenceKey",
    "contextKey",
    "attributeName",
    "fieldKey",
    "position",
  ]) {
    assert(
      candidate[field] === reference[field],
      `${label}: placement field ${field} differs across locale artifacts`,
    );
  }
}

async function buildRouteContract(routeConfig, locales) {
  const catalogs = Object.fromEntries(
    await Promise.all(
      locales.map(async (locale) => {
        const document = await readJson(
          join(catalogRoot, locale, "pages", catalogFileName(routeConfig.path)),
        );
        assert(
          document.route === routeConfig.path,
          `${locale}: route mismatch`,
        );
        assert(
          document.locale === locale,
          `${routeConfig.path}: locale mismatch`,
        );
        assert(
          document.segments.length === routeConfig.catalogSegments,
          `${routeConfig.path}:${locale}: catalog segment count drifted`,
        );
        return [locale, document];
      }),
    ),
  );
  const referenceLocale = locales[0];
  const referenceSegments = catalogs[referenceLocale].segments;
  const placementsByLocale = Object.fromEntries(
    locales.map((locale) => {
      const placements = new Map();
      for (const segment of catalogs[locale].segments) {
        assert(
          !placements.has(segment.pageSegmentId),
          `${routeConfig.path}:${locale}: duplicate pageSegmentId ${segment.pageSegmentId}`,
        );
        placements.set(segment.pageSegmentId, segment);
      }
      return [locale, placements];
    }),
  );

  const entries = [];
  for (const reference of referenceSegments) {
    const translations = {};
    let hasGap = false;
    for (const locale of locales) {
      const candidate = placementsByLocale[locale].get(reference.pageSegmentId);
      assert(
        candidate,
        `${routeConfig.path}:${reference.pageSegmentId}:${locale}: missing placement`,
      );
      assertSamePlacement(
        reference,
        candidate,
        `${routeConfig.path}:${locale}`,
      );
      const value = translationValue(
        candidate,
        `${routeConfig.path}:${reference.pageSegmentId}:${locale}`,
      );
      translations[locale] = value;
      if (value === null) hasGap = true;
    }
    if (!hasGap) continue;

    entries.push({
      messageId: `catalog-placement.${reference.pageSegmentId}`,
      reason: `Missing approved catalog translation for ${reference.occurrenceKey}`,
      reviewedSourceHash: sha256(reference.sourceText),
      scope: reference.isUi ? "chrome" : "content",
      sourceText: reference.sourceText,
      translations,
    });
  }

  for (const locale of locales) {
    const actual = entries.filter(
      (entry) => entry.translations[locale] === null,
    ).length;
    assert(
      actual === routeConfig.catalogMissingByLocale[locale],
      `${routeConfig.path}:${locale}: expected ${routeConfig.catalogMissingByLocale[locale]} gaps, found ${actual}`,
    );
  }
  const totalMissing = entries.reduce(
    (total, entry) =>
      total +
      Object.values(entry.translations).filter((value) => value === null)
        .length,
    0,
  );
  assert(
    totalMissing === routeConfig.catalogMissingCells,
    `${routeConfig.path}: expected ${routeConfig.catalogMissingCells} gaps, found ${totalMissing}`,
  );

  return preserveReviewedGapValues(
    {
      schemaVersion: 1,
      sourceRoute: routeConfig.path,
      entries,
    },
    await readExistingContract(routeConfig.path),
    locales,
  );
}

async function readExistingContract(route) {
  try {
    return await readJson(join(manualRoot, contractFileName(route)));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export function preserveReviewedGapValues(generated, existing, locales) {
  if (existing === null) return generated;
  assert(
    existing.schemaVersion === generated.schemaVersion,
    `${generated.sourceRoute}: existing schemaVersion changed`,
  );
  assert(
    existing.sourceRoute === generated.sourceRoute,
    `${generated.sourceRoute}: existing sourceRoute changed`,
  );
  assert(
    Array.isArray(existing.entries) &&
      existing.entries.length === generated.entries.length,
    `${generated.sourceRoute}: existing entry shape changed`,
  );

  for (let index = 0; index < generated.entries.length; index += 1) {
    const target = generated.entries[index];
    const prior = existing.entries[index];
    for (const field of [
      "messageId",
      "reason",
      "reviewedSourceHash",
      "scope",
      "sourceText",
    ]) {
      assert(
        prior[field] === target[field],
        `${generated.sourceRoute}:${target.messageId}: existing ${field} changed`,
      );
    }
    assert(
      JSON.stringify(Object.keys(prior.translations ?? {})) ===
        JSON.stringify(locales),
      `${generated.sourceRoute}:${target.messageId}: existing locale keys changed`,
    );
    for (const locale of locales) {
      const catalogValue = target.translations[locale];
      const priorValue = prior.translations[locale];
      if (catalogValue !== null) {
        assert(
          priorValue === catalogValue,
          `${generated.sourceRoute}:${target.messageId}:${locale}: existing catalog translation changed`,
        );
        continue;
      }
      assert(
        priorValue === null ||
          (typeof priorValue === "string" && priorValue.length > 0),
        `${generated.sourceRoute}:${target.messageId}:${locale}: invalid reviewed value`,
      );
      if (priorValue !== null) {
        validateForTranslationSafety(
          target.sourceText,
          priorValue,
          `${generated.sourceRoute}:${target.messageId}:${locale} reviewed value`,
        );
        target.translations[locale] = priorValue;
      }
    }
  }

  return generated;
}

export async function buildRemainingPageGapContracts() {
  const batchMap = await readJson(batchMapPath);
  const routes = batchMap.routes
    .filter((route) => route.catalogMissingCells > 0)
    .sort((left, right) => compareText(left.path, right.path));
  const assignedRoutes = new Set(
    batchMap.grokTranslationBatches.flatMap((batch) => batch.routes),
  );
  assert(
    routes.every((route) => assignedRoutes.has(route.path)),
    "Every route with catalog gaps must have a Grok batch owner",
  );

  const contracts = [];
  for (const route of routes) {
    contracts.push(await buildRouteContract(route, batchMap.locales));
  }
  return contracts;
}

async function writeContracts(contracts) {
  await mkdir(manualRoot, { recursive: true });
  const expectedFiles = new Set(
    contracts.map((contract) => contractFileName(contract.sourceRoute)),
  );
  for (const contract of contracts) {
    await writeFile(
      join(manualRoot, contractFileName(contract.sourceRoute)),
      stableJson(contract),
    );
  }
  const existingFiles = await readdir(manualRoot);
  const unexpected = existingFiles.filter(
    (file) => file.endsWith(".json") && !expectedFiles.has(file),
  );
  assert(
    unexpected.length === 0,
    `Unexpected remaining-page contracts: ${unexpected.join(", ")}`,
  );
}

async function checkContracts(contracts) {
  for (const contract of contracts) {
    const path = join(manualRoot, contractFileName(contract.sourceRoute));
    let actual;
    try {
      actual = await readFile(path, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`Missing generated contract: ${path}`);
      }
      throw error;
    }
    assert(
      actual === stableJson(contract),
      `${contract.sourceRoute}: generated contract is stale`,
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  assert(
    args.length === 0 || (args.length === 1 && args[0] === "--check"),
    "Usage: compile-remaining-page-gaps.mjs [--check]",
  );
  const contracts = await buildRemainingPageGapContracts();
  const batchMap = await readJson(batchMapPath);
  if (args[0] === "--check") await checkContracts(contracts);
  else await writeContracts(contracts);

  process.stdout.write(
    stableJson({
      catalogGapCells: batchMap.routes.reduce(
        (total, route) => total + route.catalogMissingCells,
        0,
      ),
      contracts: contracts.length,
      unresolvedCells: contracts.reduce(
        (total, contract) =>
          total +
          contract.entries.reduce(
            (entryTotal, entry) =>
              entryTotal +
              Object.values(entry.translations).filter(
                (value) => value === null,
              ).length,
            0,
          ),
        0,
      ),
      mode: args[0] === "--check" ? "check" : "write",
    }),
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
