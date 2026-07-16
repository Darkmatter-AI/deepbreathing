#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/resonance-guides");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const manualPath = join(contentRoot, "reviewed-replacements.json");

export const RESONANCE_GUIDE_ROUTES = [
  "box-breathing-before-presentation",
  "breathing-exercises-before-surgery",
  "breathing-exercises-for-labor",
  "physiological-sigh-panic-attack",
];

export const RESONANCE_GUIDE_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
];

const INVARIANT_IDS = new Set([
  "prose.paragraphs.0.after",
  "schema.authorName",
  "schema.publisherName",
]);

const EXTERNAL_BINDINGS = {
  "schema.breadcrumbHome": {
    route: "/languages",
    occurrenceKey:
      "sel:a.text-muted-foreground.underline-offset-4:ctx:link:pos:0",
  },
};

const MODE_BINDINGS = {
  "box-breathing-before-presentation": {
    route: "/",
    occurrenceKey: "sel:a.rounded-full.border:ctx:link:pos:0",
  },
  "breathing-exercises-before-surgery": {
    route: "/",
    occurrenceKey: "sel:a.rounded-full.border:ctx:link:pos:0",
  },
  "breathing-exercises-for-labor": {
    route: "/breathing-exercises-for-labor",
    occurrenceKey: "sel:p.text-lg.font-semibold:ctx:product:pos:1",
  },
  "physiological-sigh-panic-attack": {
    route: "/physiological-sigh-panic-attack",
    occurrenceKey: "sel:p.text-lg.font-semibold:ctx:product:pos:1",
  },
};

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

function flatten(value, prefix = "", output = {}) {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }
  assert(
    value && typeof value === "object",
    `${prefix || "source"} must be an object`,
  );
  for (const key of Object.keys(value)) {
    flatten(value[key], prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}

function inflate(flat) {
  const output = {};
  for (const [messageId, value] of Object.entries(flat)) {
    const parts = messageId.split(".");
    let cursor = output;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      const nextPart = parts[index + 1];
      if (cursor[part] === undefined) {
        cursor[part] = /^\d+$/.test(nextPart) ? [] : {};
      }
      cursor = cursor[part];
    }
    cursor[parts.at(-1)] = value;
  }
  return output;
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

function validateCatalogSegment(
  segment,
  sourceText,
  label,
  catalogSourceText = sourceText,
) {
  assert(segment, `${label} catalog occurrence is missing`);
  assert(
    segment.sourceText === catalogSourceText,
    `${label} catalog source changed`,
  );
  assert(
    /^[0-9a-f]{64}$/.test(segment.sourceHash),
    `${label} catalog hash is invalid`,
  );
  assert(segment.translation?.isApproved === true, `${label} is not approved`);
  assert(segment.translation?.needsReview === false, `${label} needs review`);
  validateTranslation(sourceText, segment.translation.text, label);
}

function validateAlias(alias, sourceText, segment, label) {
  assert(alias, `${label} lacks a reviewed current-source alias`);
  assert(alias.sourceText === sourceText, `${label} alias source changed`);
  assert(
    alias.catalogSourceText === segment.sourceText,
    `${label} alias catalog source changed`,
  );
  assert(
    alias.occurrenceKey === segment.occurrenceKey,
    `${label} alias occurrence changed`,
  );
  assert(
    alias.reviewedSourceHash === sha256(sourceText),
    `${label} alias hash changed`,
  );
  assert(
    typeof alias.reason === "string" && alias.reason.trim(),
    `${label} alias lacks reason`,
  );
}

async function loadCatalog(cache, locale, route) {
  const key = `${locale}:${route}`;
  if (!cache.has(key))
    cache.set(key, await readJson(catalogPath(locale, route)));
  return cache.get(key);
}

function findOccurrence(catalog, occurrenceKey) {
  const matches = catalog.segments.filter(
    (segment) => segment.occurrenceKey === occurrenceKey,
  );
  assert(
    matches.length === 1,
    `${catalog.route}:${occurrenceKey} expected one occurrence, found ${matches.length}`,
  );
  return matches[0];
}

function findExactSource(catalog, sourceText) {
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
    )[0];
}

function validateManual(replacements, sources) {
  assert(
    replacements.schemaVersion === 1,
    "Unsupported guide replacement schema",
  );
  assert(
    Array.isArray(replacements.replacements),
    "Guide replacements must be an array",
  );
  const records = new Map();
  for (const record of replacements.replacements) {
    const key = `${record.route}:${record.messageId}`;
    assert(
      RESONANCE_GUIDE_ROUTES.includes(record.route),
      `Unexpected replacement route ${record.route}`,
    );
    assert(!records.has(key), `Duplicate replacement ${key}`);
    const sourceText = sources.get(record.route)[record.messageId];
    assert(sourceText !== undefined, `Unknown replacement ${key}`);
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
        JSON.stringify([...RESONANCE_GUIDE_LOCALES].sort(compareText)),
      `${key} replacement locales changed`,
    );
    for (const locale of RESONANCE_GUIDE_LOCALES) {
      validateTranslation(
        sourceText,
        record.translations[locale],
        `${key}:${locale}`,
      );
    }
    records.set(key, record);
  }
  return records;
}

async function buildRouteLocale({
  route,
  locale,
  source,
  aliases,
  bindings,
  manuals,
  catalogCache,
}) {
  const routePath = `/${route}`;
  const catalog = await loadCatalog(catalogCache, locale, routePath);
  const flatSource = flatten(source);
  const flatMessages = {};
  const provenance = {};
  const unresolved = [];

  for (const [messageId, sourceText] of Object.entries(flatSource)) {
    const label = `${route}:${locale}:${messageId}`;
    const manual = manuals.get(`${route}:${messageId}`);
    if (manual) {
      flatMessages[messageId] = manual.translations[locale];
      provenance[messageId] = {
        kind: "reviewed-replacement",
        reviewedSourceHash: manual.reviewedSourceHash,
      };
      continue;
    }
    if (INVARIANT_IDS.has(messageId)) {
      flatMessages[messageId] = sourceText;
      provenance[messageId] = { kind: "invariant" };
      continue;
    }

    let bindingRoute = routePath;
    let occurrenceKey = bindings.get(messageId)?.occurrenceKey;
    let catalogSourceText = bindings.get(messageId)?.catalogSourceText;
    if (messageId === "runtime.modeDisplayName") {
      ({ route: bindingRoute, occurrenceKey } = MODE_BINDINGS[route]);
      catalogSourceText = sourceText;
    } else if (EXTERNAL_BINDINGS[messageId]) {
      ({ route: bindingRoute, occurrenceKey } = EXTERNAL_BINDINGS[messageId]);
      catalogSourceText = sourceText;
    }

    let boundCatalog = catalog;
    if (bindingRoute !== routePath) {
      boundCatalog = await loadCatalog(catalogCache, locale, bindingRoute);
    }
    let segment = occurrenceKey
      ? findOccurrence(boundCatalog, occurrenceKey)
      : findExactSource(catalog, sourceText);
    if (!segment) {
      unresolved.push({
        route,
        locale,
        messageId,
        sourceText,
        reason:
          "no approved exact-source catalog binding or reviewed replacement",
      });
      continue;
    }
    const alias = aliases.get(messageId);
    if (segment.sourceText !== sourceText) {
      validateAlias(alias, sourceText, segment, label);
    } else {
      assert(!alias, `${label} has an unnecessary alias`);
    }
    validateCatalogSegment(
      segment,
      sourceText,
      label,
      catalogSourceText ?? segment.sourceText,
    );
    flatMessages[messageId] = segment.translation.text;
    provenance[messageId] = {
      kind: bindingRoute === routePath ? "catalog" : "catalog-external",
      route: bindingRoute,
      occurrenceKey: segment.occurrenceKey,
      sourceHash: segment.sourceHash,
    };
  }

  return {
    messages: inflate(flatMessages),
    provenance,
    unresolved,
    expectedMessages: Object.keys(flatSource).length,
  };
}

export async function buildResonanceGuideContentArtifacts() {
  const sources = new Map();
  const aliasMaps = new Map();
  const bindingMaps = new Map();
  for (const route of RESONANCE_GUIDE_ROUTES) {
    const [source, aliasLedger, bindingLedger] = await Promise.all([
      readJson(join(contentRoot, "source", `${route}.json`)),
      readJson(join(contentRoot, "aliases", `${route}.json`)),
      readJson(join(contentRoot, "bindings", `${route}.json`)),
    ]);
    const flatSource = flatten(source);
    assert(
      !/(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/.test(
        JSON.stringify(source),
      ),
      `${route} runtime source leaks catalog placement metadata`,
    );
    sources.set(route, flatSource);
    assert(aliasLedger.schemaVersion === 1, `${route} alias schema changed`);
    assert(
      aliasLedger.sourceRoute === `/${route}`,
      `${route} alias source route changed`,
    );
    const aliasMap = new Map();
    for (const alias of aliasLedger.aliases) {
      assert(
        !aliasMap.has(alias.messageId),
        `${route} duplicate alias ${alias.messageId}`,
      );
      assert(
        flatSource[alias.messageId] !== undefined,
        `${route} unknown alias ${alias.messageId}`,
      );
      aliasMap.set(alias.messageId, alias);
    }
    aliasMaps.set(route, aliasMap);
    assert(
      bindingLedger.schemaVersion === 1,
      `${route} binding schema changed`,
    );
    assert(
      bindingLedger.sourceRoute === `/${route}`,
      `${route} binding source route changed`,
    );
    const bindingMap = new Map(Object.entries(bindingLedger.bindings));
    for (const messageId of bindingMap.keys()) {
      assert(
        flatSource[messageId] !== undefined,
        `${route} unknown binding ${messageId}`,
      );
    }
    for (const messageId of Object.keys(flatSource)) {
      const mayResolveWithoutRouteBinding =
        messageId === "metadata.imageAlt" ||
        messageId === "runtime.modeDisplayName" ||
        messageId.startsWith("schema.") ||
        INVARIANT_IDS.has(messageId);
      assert(
        mayResolveWithoutRouteBinding || bindingMap.has(messageId),
        `${route} semantic field ${messageId} lacks a build-time catalog binding`,
      );
    }
    bindingMaps.set(route, bindingMap);
  }
  const replacements = await readJson(manualPath);
  const manuals = validateManual(replacements, sources);
  const catalogCache = new Map();
  const outputs = new Map();
  const publication = {
    schemaVersion: 1,
    routes: RESONANCE_GUIDE_ROUTES,
    locales: RESONANCE_GUIDE_LOCALES,
    coverage: {},
  };
  const provenance = { schemaVersion: 1, routes: {} };
  const unresolved = { schemaVersion: 1, unresolved: [] };

  for (const route of RESONANCE_GUIDE_ROUTES) {
    publication.coverage[route] = {};
    provenance.routes[route] = {};
    const source = await readJson(join(contentRoot, "source", `${route}.json`));
    for (const locale of RESONANCE_GUIDE_LOCALES) {
      const built = await buildRouteLocale({
        route,
        locale,
        source,
        aliases: aliasMaps.get(route),
        bindings: bindingMaps.get(route),
        manuals,
        catalogCache,
      });
      unresolved.unresolved.push(...built.unresolved);
      const path = `messages/${locale}/${route}.json`;
      const raw = stableJson(built.messages);
      const resolvedMessages = Object.keys(flatten(built.messages)).length;
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
  const built = await buildResonanceGuideContentArtifacts();
  return new Map([
    ...built.outputs,
    ["publication.json", stableJson(built.publication)],
    ["provenance.json", stableJson(built.provenance)],
    ["unresolved.json", stableJson(built.unresolved)],
  ]);
}

export async function checkResonanceGuideContentArtifacts() {
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

export async function writeResonanceGuideContentArtifacts() {
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
    const result = await writeResonanceGuideContentArtifacts();
    console.log(`Wrote ${result.written} R-W02 guide artifacts.`);
  } else if (command === "check" || command === "--check") {
    const result = await checkResonanceGuideContentArtifacts();
    if (result.stale.length) {
      console.error(`Stale R-W02 guide artifacts:\n${result.stale.join("\n")}`);
      process.exitCode = 1;
    } else {
      console.log("R-W02 guide artifacts are current.");
    }
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}
