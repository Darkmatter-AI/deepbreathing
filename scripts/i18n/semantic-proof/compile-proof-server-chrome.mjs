#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const proofRoot = join(repoRoot, "src/i18n/content/proof");
const sourceMapPath = join(proofRoot, "server-chrome-map.json");
const overridesPath = join(proofRoot, "server-chrome-overrides.json");
const outputRoot = join(proofRoot, "server-chrome");
const publicationPath = join(proofRoot, "server-chrome-publication.json");
const unresolvedPath = join(proofRoot, "server-chrome-unresolved.json");

export const PROOF_CHROME_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
export const PROOF_CHROME_ROUTES = ["/breathe/buteyko", "/for/anxiety"];

const ROUTE_CONFIG = {
  "/breathe/buteyko": {
    catalogPath: "pages/breathe/buteyko.json",
    routeId: "breathe.buteyko",
    stem: "breathe-buteyko",
  },
  "/for/anxiety": {
    catalogPath: "pages/for/anxiety.json",
    routeId: "for.anxiety",
    stem: "for-anxiety",
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

function validateTranslation(sourceText, translation, label) {
  assert(typeof translation === "string" && translation.trim(), `${label} is empty`);
  assert(!/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation), `${label} contains unsafe markup`);
  assert(translation.length <= Math.max(sourceText.length * 8, 240), `${label} is unexpectedly long`);
}

function validateSourceMap(sourceMap) {
  assert(sourceMap.schemaVersion === 1, "Unsupported server chrome map schema");
  assert(Array.isArray(sourceMap.routes), "Server chrome map routes must be an array");
  assert(
    JSON.stringify(sourceMap.routes.map((route) => route.sourceRoute).sort(compareText)) ===
      JSON.stringify([...PROOF_CHROME_ROUTES].sort(compareText)),
    "Server chrome map route set is incomplete",
  );

  const globalIds = new Set();
  for (const route of sourceMap.routes) {
    const config = ROUTE_CONFIG[route.sourceRoute];
    assert(config?.routeId === route.routeId, `Unexpected route id for ${route.sourceRoute}`);
    assert(Array.isArray(route.messages) && route.messages.length > 0, `${route.sourceRoute} has no chrome messages`);
    for (const message of route.messages) {
      assert(/^chrome\.[a-z0-9.-]+$/.test(message.messageId), `Invalid message id ${message.messageId}`);
      assert(!globalIds.has(`${route.sourceRoute}:${message.messageId}`), `Duplicate message ${message.messageId}`);
      globalIds.add(`${route.sourceRoute}:${message.messageId}`);
      assert(typeof message.sourceText === "string" && message.sourceText.trim(), `${message.messageId} has no source`);
      assert(
        message.reviewedSourceHash === sha256(message.sourceText),
        `${message.messageId} source changed without review`,
      );
    }
  }
}

function validateOverrides(overrides, sourceMap) {
  assert(overrides.schemaVersion === 1, "Unsupported server chrome override schema");
  assert(Array.isArray(overrides.overrides), "Server chrome overrides must be an array");
  const mappings = new Map(
    sourceMap.routes.flatMap((route) => route.messages.map((message) => [
      `${route.sourceRoute}:${message.messageId}`,
      message,
    ])),
  );
  const seen = new Set();
  for (const override of overrides.overrides) {
    const key = `${override.sourceRoute}:${override.messageId}`;
    assert(!seen.has(key), `Duplicate server chrome override ${key}`);
    seen.add(key);
    const mapping = mappings.get(key);
    assert(mapping, `Override ${key} has no source mapping`);
    assert(override.sourceText === mapping.sourceText, `Override ${key} source text changed`);
    assert(override.reviewedSourceHash === mapping.reviewedSourceHash, `Override ${key} source hash changed`);
    assert(typeof override.reason === "string" && override.reason.trim(), `Override ${key} lacks a reason`);
    assert(
      JSON.stringify(Object.keys(override.translations).sort(compareText)) ===
        JSON.stringify([...PROOF_CHROME_LOCALES].sort(compareText)),
      `Override ${key} must cover every proof locale`,
    );
    for (const locale of PROOF_CHROME_LOCALES) {
      validateTranslation(mapping.sourceText, override.translations[locale], `${key}:${locale}`);
    }
  }
}

function resolveCatalogTranslation(segments, sourceText, scope) {
  const candidates = segments.filter((segment) => segment.sourceText === sourceText);
  const usable = candidates.filter((candidate) =>
    candidate.translation?.isApproved === true &&
    candidate.translation?.needsReview === false &&
    typeof candidate.translation?.text === "string" &&
    candidate.translation.text.trim(),
  );
  const translations = [...new Set(usable.map((candidate) => candidate.translation.text))].sort(compareText);
  if (translations.length === 1) {
    return { status: `${scope}-${candidates.length === 1 ? "unique" : "equivalent"}`, translation: translations[0] };
  }
  if (translations.length > 1) return { status: `${scope}-conflict`, translation: null };
  if (candidates.length > 0) return { status: `${scope}-unusable`, translation: null };
  return { status: `${scope}-miss`, translation: null };
}

async function readCatalogSegmentsRecursively(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const segments = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      segments.push(...await readCatalogSegmentsRecursively(path));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      const catalog = await readJson(path);
      if (Array.isArray(catalog.segments)) segments.push(...catalog.segments);
    }
  }
  return segments;
}

export async function buildProofServerChromeArtifacts() {
  const [sourceMap, overrides] = await Promise.all([
    readJson(sourceMapPath),
    readJson(overridesPath),
  ]);
  validateSourceMap(sourceMap);
  validateOverrides(overrides, sourceMap);
  const overrideByKey = new Map(
    overrides.overrides.map((override) => [`${override.sourceRoute}:${override.messageId}`, override]),
  );
  const outputs = new Map();
  const publication = { schemaVersion: 1, routes: {} };
  const unresolved = { schemaVersion: 1, unresolved: [] };
  const bundles = {};
  const globalSegments = Object.fromEntries(
    await Promise.all(PROOF_CHROME_LOCALES.map(async (locale) => [
      locale,
      await readCatalogSegmentsRecursively(join(repoRoot, "src/i18n/catalog", locale, "pages")),
    ])),
  );

  for (const sourceRoute of PROOF_CHROME_ROUTES) {
    const config = ROUTE_CONFIG[sourceRoute];
    const routeMap = sourceMap.routes.find((route) => route.sourceRoute === sourceRoute);
    bundles[sourceRoute] = {};
    publication.routes[sourceRoute] = {
      expectedMessages: routeMap.messages.length,
      locales: {},
      routeId: config.routeId,
    };

    for (const locale of PROOF_CHROME_LOCALES) {
      const catalog = await readJson(join(repoRoot, "src/i18n/catalog", locale, config.catalogPath));
      const messages = {};
      const statuses = {};
      for (const mapping of routeMap.messages) {
        const key = `${sourceRoute}:${mapping.messageId}`;
        const override = overrideByKey.get(key);
        if (override) {
          messages[mapping.messageId] = override.translations[locale];
          statuses[mapping.messageId] = "repo-reviewed-override";
          continue;
        }
        const routeResolution = resolveCatalogTranslation(catalog.segments, mapping.sourceText, "route-catalog");
        const resolution = routeResolution.status.endsWith("-miss")
          ? resolveCatalogTranslation(globalSegments[locale], mapping.sourceText, "global-catalog")
          : routeResolution;
        if (resolution.translation) {
          validateTranslation(mapping.sourceText, resolution.translation, `${key}:${locale}`);
          messages[mapping.messageId] = resolution.translation;
        } else {
          unresolved.unresolved.push({
            locale,
            messageId: mapping.messageId,
            reason: resolution.status,
            reviewedSourceHash: mapping.reviewedSourceHash,
            sourceRoute,
            sourceText: mapping.sourceText,
          });
        }
        statuses[mapping.messageId] = resolution.status;
      }

      const serialized = stableJson(messages);
      const relativePath = `server-chrome/${locale}/${config.stem}.json`;
      outputs.set(relativePath, serialized);
      bundles[sourceRoute][locale] = messages;
      const resolvedMessages = Object.keys(messages).length;
      publication.routes[sourceRoute].locales[locale] = {
        bytes: Buffer.byteLength(serialized),
        catalogMessages: Object.values(statuses).filter((status) => status.includes("catalog-") && !status.endsWith("miss") && !status.endsWith("unusable") && !status.endsWith("conflict")).length,
        overrideMessages: Object.values(statuses).filter((status) => status === "repo-reviewed-override").length,
        path: relativePath,
        publishable: resolvedMessages === routeMap.messages.length,
        resolvedMessages,
        sha256: resolvedMessages === routeMap.messages.length ? sha256(serialized) : null,
      };
    }
  }

  outputs.set("server-chrome-publication.json", stableJson(publication));
  outputs.set("server-chrome-unresolved.json", stableJson(unresolved));
  return { bundles, outputs, publication, sourceMap, unresolved };
}

export async function writeProofServerChromeArtifacts() {
  const build = await buildProofServerChromeArtifacts();
  assert(outputRoot === join(proofRoot, "server-chrome"), "Refusing unsafe server chrome output path");
  await rm(outputRoot, { recursive: true, force: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(proofRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return { unresolved: build.unresolved.unresolved.length, written: build.outputs.size };
}

export async function checkProofServerChromeArtifacts() {
  const build = await buildProofServerChromeArtifacts();
  const stale = [];
  for (const [relativePath, expected] of build.outputs) {
    try {
      const actual = await readFile(join(proofRoot, relativePath), "utf8");
      if (actual !== expected) stale.push(relativePath);
    } catch {
      stale.push(relativePath);
    }
  }
  return { checked: build.outputs.size, stale, unresolved: build.unresolved.unresolved.length };
}

async function main() {
  const mode = process.argv[2] ?? "--check";
  if (mode === "--write") {
    console.log(JSON.stringify(await writeProofServerChromeArtifacts()));
    return;
  }
  if (mode === "--check") {
    const result = await checkProofServerChromeArtifacts();
    console.log(JSON.stringify(result));
    if (result.stale.length > 0 || result.unresolved > 0) process.exitCode = 1;
    return;
  }
  throw new Error(`Unknown mode ${mode}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
