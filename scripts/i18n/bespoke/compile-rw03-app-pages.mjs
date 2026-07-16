#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/rw03-app-pages");
const catalogRoot = join(repoRoot, "src/i18n/catalog");

export const RW03_APP_ROUTES = [
  "box-breathing-app",
  "breathing-app",
  "coherent-breathing-app",
];

export const RW03_APP_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];

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
  const relative = route === "/" ? "_root" : route.replace(/^\//, "");
  return join(catalogRoot, locale, "pages", `${relative}.json`);
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
    translation.length <= Math.max(sourceText.length * 8, 240),
    `${label} is unexpectedly long`,
  );
}

async function loadCatalog(cache, locale, route) {
  const key = `${locale}:${route}`;
  if (!cache.has(key)) {
    cache.set(key, await readJson(catalogPath(locale, route)));
  }
  return cache.get(key);
}

function exactApprovedSegments(catalog, sourceText) {
  return catalog.segments
    .filter(
      (segment) =>
        segment.sourceText === sourceText &&
        segment.translation?.isApproved === true &&
        segment.translation?.needsReview === false &&
        typeof segment.translation?.text === "string" &&
        segment.translation.text.trim(),
    )
    .sort(
      (left, right) =>
        left.position - right.position ||
        compareText(left.occurrenceKey, right.occurrenceKey),
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

function validateSegment(segment, expectedSourceText, label) {
  assert(segment.sourceText === expectedSourceText, `${label} source changed`);
  assert(/^[0-9a-f]{64}$/.test(segment.sourceHash), `${label} hash is invalid`);
  assert(segment.translation?.isApproved === true, `${label} is not approved`);
  assert(segment.translation?.needsReview === false, `${label} needs review`);
  validateTranslation(expectedSourceText, segment.translation.text, label);
}

function indexLedger(ledger, field, label) {
  assert(ledger.schemaVersion === 1, `${label} schema changed`);
  assert(Array.isArray(ledger[field]), `${label}.${field} must be an array`);
  const records = new Map();
  for (const record of ledger[field]) {
    const key = `${record.route}:${record.messageId}`;
    assert(
      RW03_APP_ROUTES.includes(record.route),
      `${label} unexpected route ${record.route}`,
    );
    assert(!records.has(key), `${label} duplicate ${key}`);
    records.set(key, record);
  }
  return records;
}

function validateLedgers({ sources, aliases, externals, invariants, manuals }) {
  for (const [key, record] of aliases) {
    const [route, messageId] = key.split(":");
    const sourceText = sources.get(route)[messageId];
    assert(sourceText !== undefined, `Unknown alias ${key}`);
    assert(record.sourceText === sourceText, `${key} alias source changed`);
    assert(
      record.reviewedSourceHash === sha256(sourceText),
      `${key} alias hash changed`,
    );
    assert(
      typeof record.catalogRoute === "string",
      `${key} alias lacks catalog route`,
    );
    assert(
      typeof record.occurrenceKey === "string",
      `${key} alias lacks occurrence`,
    );
    assert(
      typeof record.catalogSourceText === "string",
      `${key} alias lacks catalog source`,
    );
    assert(
      typeof record.reason === "string" && record.reason.trim(),
      `${key} alias lacks reason`,
    );
  }
  for (const [key, record] of externals) {
    const [route, messageId] = key.split(":");
    const sourceText = sources.get(route)[messageId];
    assert(sourceText !== undefined, `Unknown external binding ${key}`);
    assert(record.sourceText === sourceText, `${key} external source changed`);
    assert(
      record.reviewedSourceHash === sha256(sourceText),
      `${key} external hash changed`,
    );
    assert(
      typeof record.catalogRoute === "string",
      `${key} external lacks catalog route`,
    );
    assert(
      typeof record.occurrenceKey === "string",
      `${key} external lacks occurrence`,
    );
    assert(
      typeof record.reason === "string" && record.reason.trim(),
      `${key} external lacks reason`,
    );
  }
  for (const [key, record] of invariants) {
    const [route, messageId] = key.split(":");
    const sourceText = sources.get(route)[messageId];
    assert(sourceText !== undefined, `Unknown invariant ${key}`);
    assert(record.sourceText === sourceText, `${key} invariant source changed`);
    assert(
      record.reviewedSourceHash === sha256(sourceText),
      `${key} invariant hash changed`,
    );
    assert(
      typeof record.reason === "string" && record.reason.trim(),
      `${key} invariant lacks reason`,
    );
  }
  for (const [key, record] of manuals) {
    const [route, messageId] = key.split(":");
    const sourceText = sources.get(route)[messageId];
    assert(sourceText !== undefined, `Unknown reviewed replacement ${key}`);
    assert(
      record.sourceText === sourceText,
      `${key} replacement source changed`,
    );
    assert(
      record.reviewedSourceHash === sha256(sourceText),
      `${key} replacement hash changed`,
    );
    assert(
      typeof record.reason === "string" && record.reason.trim(),
      `${key} replacement lacks reason`,
    );
    assert(
      JSON.stringify(Object.keys(record.translations).sort(compareText)) ===
        JSON.stringify([...RW03_APP_LOCALES].sort(compareText)),
      `${key} replacement locales changed`,
    );
    for (const locale of RW03_APP_LOCALES) {
      validateTranslation(
        sourceText,
        record.translations[locale],
        `${key}:${locale}`,
      );
    }
  }
}

async function buildRouteLocale({
  route,
  locale,
  source,
  aliases,
  externals,
  invariants,
  manuals,
  catalogCache,
}) {
  const routePath = `/${route}`;
  const catalog = await loadCatalog(catalogCache, locale, routePath);
  const messages = {};
  const provenance = {};
  const unresolved = [];

  for (const [messageId, sourceText] of Object.entries(source)) {
    const key = `${route}:${messageId}`;
    const label = `${key}:${locale}`;
    const manual = manuals.get(key);
    if (manual) {
      if (manual.catalogGapBinding) {
        const gapCatalog = await loadCatalog(
          catalogCache,
          locale,
          manual.catalogGapBinding.catalogRoute,
        );
        const segment = findOccurrence(
          gapCatalog,
          manual.catalogGapBinding.occurrenceKey,
          label,
        );
        assert(
          segment.sourceText === sourceText,
          `${label} gap source changed`,
        );
      }
      messages[messageId] = manual.translations[locale];
      provenance[messageId] = {
        kind: manual.catalogGapBinding
          ? "reviewed-gap-replacement"
          : "reviewed-replacement",
        reviewedSourceHash: manual.reviewedSourceHash,
        ...(manual.catalogGapBinding ?? {}),
      };
      continue;
    }
    const invariant = invariants.get(key);
    if (invariant) {
      messages[messageId] = sourceText;
      provenance[messageId] = {
        kind: "reviewed-invariant",
        reviewedSourceHash: invariant.reviewedSourceHash,
      };
      continue;
    }

    const alias = aliases.get(key);
    if (alias) {
      const aliasCatalog = await loadCatalog(
        catalogCache,
        locale,
        alias.catalogRoute,
      );
      const segment = findOccurrence(aliasCatalog, alias.occurrenceKey, label);
      validateSegment(segment, alias.catalogSourceText, label);
      messages[messageId] = segment.translation.text;
      provenance[messageId] = {
        kind: "reviewed-source-alias",
        route: alias.catalogRoute,
        occurrenceKey: segment.occurrenceKey,
        sourceHash: segment.sourceHash,
        reviewedSourceHash: alias.reviewedSourceHash,
      };
      continue;
    }

    const external = externals.get(key);
    if (external) {
      const externalCatalog = await loadCatalog(
        catalogCache,
        locale,
        external.catalogRoute,
      );
      const segment = findOccurrence(
        externalCatalog,
        external.occurrenceKey,
        label,
      );
      if (
        segment.sourceText === sourceText &&
        segment.translation?.isApproved === true &&
        segment.translation?.needsReview === false &&
        segment.translation?.text?.trim()
      ) {
        validateSegment(segment, sourceText, label);
        messages[messageId] = segment.translation.text;
        provenance[messageId] = {
          kind: "catalog-external",
          route: external.catalogRoute,
          occurrenceKey: segment.occurrenceKey,
          sourceHash: segment.sourceHash,
        };
        continue;
      }
      unresolved.push({
        route,
        locale,
        messageId,
        sourceText,
        reason: "explicit external catalog binding has no approved translation",
      });
      continue;
    }

    const exact = exactApprovedSegments(catalog, sourceText)[0];
    if (exact) {
      validateSegment(exact, sourceText, label);
      messages[messageId] = exact.translation.text;
      provenance[messageId] = {
        kind: "catalog-exact-source",
        route: routePath,
        occurrenceKey: exact.occurrenceKey,
        sourceHash: exact.sourceHash,
      };
      continue;
    }

    unresolved.push({
      route,
      locale,
      messageId,
      sourceText,
      reason:
        "no approved exact-source catalog match, explicit alias, external binding, invariant, or reviewed replacement",
    });
  }

  return {
    messages,
    provenance,
    unresolved,
    expectedMessages: Object.keys(source).length,
  };
}

export async function buildRw03AppPageArtifacts() {
  const sources = new Map();
  for (const route of RW03_APP_ROUTES) {
    const source = await readJson(join(contentRoot, "source", `${route}.json`));
    assert(
      !/(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/.test(
        JSON.stringify(source),
      ),
      `${route} runtime source leaks catalog placement metadata`,
    );
    assert(
      Object.values(source).every((value) => typeof value === "string"),
      `${route} source must contain only string messages`,
    );
    sources.set(route, source);
  }

  const [aliasLedger, externalLedger, invariantLedger, manualLedger] =
    await Promise.all([
      readJson(join(contentRoot, "source-aliases.json")),
      readJson(join(contentRoot, "external-bindings.json")),
      readJson(join(contentRoot, "reviewed-invariants.json")),
      readJson(join(contentRoot, "reviewed-replacements.json")),
    ]);
  const aliases = indexLedger(aliasLedger, "aliases", "aliases");
  const externals = indexLedger(
    externalLedger,
    "bindings",
    "external bindings",
  );
  const invariants = indexLedger(invariantLedger, "invariants", "invariants");
  const manuals = indexLedger(manualLedger, "replacements", "replacements");
  validateLedgers({ sources, aliases, externals, invariants, manuals });

  const outputs = new Map();
  const publication = {
    schemaVersion: 1,
    routes: RW03_APP_ROUTES,
    locales: RW03_APP_LOCALES,
    coverage: {},
  };
  const provenance = { schemaVersion: 1, routes: {} };
  const unresolved = { schemaVersion: 1, unresolved: [] };
  const catalogCache = new Map();

  for (const route of RW03_APP_ROUTES) {
    publication.coverage[route] = {};
    provenance.routes[route] = {};
    const source = sources.get(route);
    for (const locale of RW03_APP_LOCALES) {
      const built = await buildRouteLocale({
        route,
        locale,
        source,
        aliases,
        externals,
        invariants,
        manuals,
        catalogCache,
      });
      unresolved.unresolved.push(...built.unresolved);
      const path = `messages/${locale}/${route}.json`;
      const raw = stableJson(built.messages);
      const resolvedMessages = Object.keys(built.messages).length;
      const publishable =
        built.unresolved.length === 0 &&
        resolvedMessages === built.expectedMessages;
      outputs.set(path, raw);
      publication.coverage[route][locale] = {
        path,
        expectedMessages: built.expectedMessages,
        resolvedMessages,
        publishable,
        sha256: publishable ? sha256(raw) : null,
      };
      provenance.routes[route][locale] = built.provenance;
    }
  }

  unresolved.unresolved.sort((left, right) =>
    compareText(
      `${left.route}:${left.locale}:${left.messageId}`,
      `${right.route}:${right.locale}:${right.messageId}`,
    ),
  );
  return { outputs, publication, provenance, unresolved };
}

async function expectedArtifacts() {
  const built = await buildRw03AppPageArtifacts();
  return new Map([
    ...built.outputs,
    ["publication.json", stableJson(built.publication)],
    ["provenance.json", stableJson(built.provenance)],
    ["unresolved.json", stableJson(built.unresolved)],
  ]);
}

export async function checkRw03AppPageArtifacts() {
  const expected = await expectedArtifacts();
  const stale = [];
  for (const [relativePath, expectedRaw] of expected) {
    try {
      const actualRaw = await readFile(join(contentRoot, relativePath), "utf8");
      if (actualRaw !== expectedRaw) stale.push(relativePath);
    } catch {
      stale.push(relativePath);
    }
  }
  return { stale: stale.sort(compareText) };
}

export async function writeRw03AppPageArtifacts() {
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
    const result = await writeRw03AppPageArtifacts();
    console.log(`Wrote ${result.written} R-W03 app artifacts.`);
  } else if (command === "check" || command === "--check") {
    const result = await checkRw03AppPageArtifacts();
    if (result.stale.length) {
      console.error(`Stale R-W03 app artifacts:\n${result.stale.join("\n")}`);
      process.exitCode = 1;
    } else {
      console.log("R-W03 app artifacts are current.");
    }
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}
