#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";
import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(
  repoRoot,
  "src/i18n/content/bespoke/duration-exercises",
);
const sourceRoot = join(contentRoot, "source");
const outputRoot = join(contentRoot, "messages");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const aliasesPath = join(contentRoot, "source-aliases.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");

export const DURATION_CONTENT_ROUTES = [
  "1-minute-breathing-exercise",
  "2-minute-breathing-exercise",
  "5-minute-breathing-exercise",
];
export const DURATION_CONTENT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      flattenStringLeaves(child, `${prefix}[${index}]`, output),
    );
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${key}` : key;
    flattenStringLeaves(child, childPath, output);
  }
  return output;
}

function pathParts(path) {
  return path.match(/[^.[\]]+/g) ?? [];
}

function setPath(target, path, value) {
  const parts = pathParts(path);
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part];
  cursor[parts.at(-1)] = value;
}

function isApproved(segment) {
  return (
    segment?.translation?.isApproved === true &&
    segment.translation.needsReview === false &&
    typeof segment.translation.text === "string" &&
    segment.translation.text.trim().length > 0
  );
}

function withSourceWhitespace(sourceText, translation) {
  const leading = sourceText.match(/^\s+/)?.[0] ?? "";
  const trailing = sourceText.match(/\s+$/)?.[0] ?? "";
  return `${leading}${translation.trim()}${trailing}`;
}

function validateTranslation(
  sourceText,
  translation,
  label,
  numericReviewReason,
) {
  assert(
    typeof translation === "string" && translation.trim(),
    `${label} is empty`,
  );
  assert(
    !/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation),
    `${label} contains unsafe markup`,
  );
  validateForTranslationSafety(sourceText, translation, label, {
    numericReviewReason,
  });
}

function validateAliases(aliasFile, sources) {
  assert(aliasFile.schemaVersion === 1, "Unsupported duration alias schema");
  assert(Array.isArray(aliasFile.aliases), "Duration aliases must be an array");
  const aliases = new Map();
  for (const alias of aliasFile.aliases) {
    const route = alias.sourceRoute.slice(1);
    const sourceLeaves = sources[route];
    assert(sourceLeaves, `Unknown duration alias route ${alias.sourceRoute}`);
    const key = `${alias.sourceRoute}:${alias.messagePath}`;
    assert(!aliases.has(key), `Duplicate duration alias ${key}`);
    assert(
      sourceLeaves.get(alias.messagePath) === alias.sourceText,
      `${key} source changed`,
    );
    assert(
      alias.reviewedSourceHash === sha256(alias.sourceText),
      `${key} source hash changed`,
    );
    if (alias.literal) {
      assert(
        !alias.catalogRoute && !alias.occurrenceKey,
        `${key} literal alias has catalog placement`,
      );
    } else {
      assert(
        typeof alias.catalogRoute === "string" &&
          typeof alias.occurrenceKey === "string" &&
          typeof alias.catalogSourceText === "string",
        `${key} catalog binding is incomplete`,
      );
    }
    aliases.set(key, alias);
  }
  return aliases;
}

function validateReplacements(file, sources) {
  assert(file.schemaVersion === 1, "Unsupported duration replacement schema");
  assert(
    Array.isArray(file.replacements),
    "Duration replacements must be an array",
  );
  const replacements = new Map();
  for (const replacement of file.replacements) {
    const route = replacement.sourceRoute.slice(1);
    const sourceLeaves = sources[route];
    const key = `${replacement.sourceRoute}:${replacement.messagePath}`;
    assert(sourceLeaves, `Unknown duration replacement route ${key}`);
    assert(!replacements.has(key), `Duplicate duration replacement ${key}`);
    assert(
      sourceLeaves.get(replacement.messagePath) === replacement.sourceText,
      `${key} replacement source changed`,
    );
    assert(
      replacement.reviewedSourceHash === sha256(replacement.sourceText),
      `${key} replacement source hash changed`,
    );
    assert(
      typeof replacement.reason === "string" && replacement.reason.trim(),
      `${key} replacement lacks a reason`,
    );
    const locales = Object.keys(replacement.translations ?? {}).sort();
    assert(
      JSON.stringify(locales) ===
        JSON.stringify([...DURATION_CONTENT_LOCALES].sort()),
      `${key} replacement must cover every duration locale`,
    );
    for (const [locale, translation] of Object.entries(
      replacement.translations,
    )) {
      validateTranslation(
        replacement.sourceText,
        translation,
        `${key}:${locale} replacement`,
      );
    }
    replacements.set(key, replacement);
  }
  return replacements;
}

async function loadCatalog(cache, locale, route) {
  const key = `${locale}:${route}`;
  if (!cache.has(key)) {
    const relativePath =
      route === "/" ? "_root.json" : `${route.slice(1)}.json`;
    const catalog = await readJson(
      join(catalogRoot, locale, "pages", relativePath),
    );
    assert(catalog.route === route, `${key} catalog route changed`);
    cache.set(key, catalog);
  }
  return cache.get(key);
}

function resolveExact(catalog, sourceText, label) {
  const candidates = catalog.segments.filter(
    (segment) => segment.sourceText === sourceText,
  );
  if (!candidates.length) return null;
  assert(
    candidates.length === 1,
    `${label} has multiple exact catalog placements; add an explicit occurrence binding`,
  );
  const [candidate] = candidates;
  assert(
    isApproved(candidate),
    `${label} has an unapproved exact catalog translation`,
  );
  return {
    catalogRoute: catalog.route,
    occurrenceKey: candidate.occurrenceKey,
    status: "route-catalog-exact",
    translation: candidate.translation.text,
  };
}

async function resolveAlias(alias, locale, catalogCache, label) {
  if (alias.literal) {
    return {
      status: "source-literal",
      translation: alias.sourceText,
    };
  }
  const catalog = await loadCatalog(catalogCache, locale, alias.catalogRoute);
  const candidates = catalog.segments.filter(
    (segment) => segment.occurrenceKey === alias.occurrenceKey,
  );
  assert(candidates.length === 1, `${label} catalog occurrence is not unique`);
  const segment = candidates[0];
  assert(
    segment.sourceText === alias.catalogSourceText,
    `${label} catalog alias source drifted`,
  );
  assert(isApproved(segment), `${label} catalog alias is not approved`);
  return {
    catalogRoute: alias.catalogRoute,
    occurrenceKey: alias.occurrenceKey,
    status: "explicit-source-alias",
    translation: withSourceWhitespace(
      alias.sourceText,
      segment.translation.text,
    ),
  };
}

export async function buildDurationContentArtifacts() {
  const sourceEntries = await Promise.all(
    DURATION_CONTENT_ROUTES.map(async (route) => [
      route,
      await readJson(join(sourceRoot, `${route}.json`)),
    ]),
  );
  const sourceObjects = Object.fromEntries(sourceEntries);
  const sourceLeaves = Object.fromEntries(
    sourceEntries.map(([route, source]) => [
      route,
      flattenStringLeaves(source),
    ]),
  );
  const [aliasFile, replacementFile] = await Promise.all([
    readJson(aliasesPath),
    readJson(replacementsPath),
  ]);
  const aliases = validateAliases(aliasFile, sourceLeaves);
  const replacements = validateReplacements(replacementFile, sourceLeaves);
  const publication = {
    coverage: {},
    expectedMessages: Object.fromEntries(
      DURATION_CONTENT_ROUTES.map((route) => [route, sourceLeaves[route].size]),
    ),
    routes: [...DURATION_CONTENT_ROUTES],
    schemaVersion: 1,
  };
  const provenance = { routes: {}, schemaVersion: 1 };
  const unresolved = { schemaVersion: 1, unresolved: [] };
  const outputs = new Map();
  const catalogCache = new Map();

  for (const route of DURATION_CONTENT_ROUTES) {
    const sourceRoute = `/${route}`;
    publication.coverage[route] = {};
    provenance.routes[route] = {};
    for (const locale of DURATION_CONTENT_LOCALES) {
      const routeCatalog = await loadCatalog(catalogCache, locale, sourceRoute);
      const messages = structuredClone(sourceObjects[route]);
      const localeProvenance = {};
      const counts = { alias: 0, catalog: 0, literal: 0, replacement: 0 };
      for (const [messagePath, sourceText] of sourceLeaves[route]) {
        const key = `${sourceRoute}:${messagePath}`;
        const replacement = replacements.get(key);
        const alias = aliases.get(key);
        let resolution;
        if (replacement) {
          resolution = {
            status: "repo-reviewed-replacement",
            translation: replacement.translations[locale],
          };
          counts.replacement += 1;
        } else if (alias) {
          resolution = await resolveAlias(alias, locale, catalogCache, key);
          counts[alias.literal ? "literal" : "alias"] += 1;
        } else {
          resolution = resolveExact(routeCatalog, sourceText, key);
          assert(resolution, `${key} has no exact or explicit catalog mapping`);
          counts.catalog += 1;
        }
        validateTranslation(
          sourceText,
          resolution.translation,
          `${key}:${locale}`,
          resolution.status === "route-catalog-exact" ||
            resolution.status === "explicit-source-alias"
            ? "Preserve the approved catalog value bound to this exact route placement."
            : undefined,
        );
        setPath(messages, messagePath, resolution.translation);
        localeProvenance[messagePath] = {
          sourceHash: sha256(sourceText),
          status: resolution.status,
          ...(replacement ? { reason: replacement.reason } : {}),
          ...(resolution.catalogRoute && resolution.occurrenceKey
            ? {
                catalogRoute: resolution.catalogRoute,
                occurrenceKey: resolution.occurrenceKey,
              }
            : {}),
        };
      }
      const serialized = stableJson(messages);
      const relativePath = `messages/${locale}/${route}.json`;
      outputs.set(relativePath, serialized);
      publication.coverage[route][locale] = {
        ...counts,
        bytes: Buffer.byteLength(serialized),
        path: relativePath,
        publishable: true,
        resolvedMessages: sourceLeaves[route].size,
        sha256: sha256(serialized),
      };
      provenance.routes[route][locale] = localeProvenance;
    }
  }
  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, provenance, publication, unresolved };
}

export async function writeDurationContentArtifacts() {
  const build = await buildDurationContentArtifacts();
  assert(
    outputRoot === join(contentRoot, "messages"),
    "Refusing unsafe duration output path",
  );
  await rm(outputRoot, { force: true, recursive: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return { unresolved: 0, written: build.outputs.size };
}

export async function checkDurationContentArtifacts() {
  const build = await buildDurationContentArtifacts();
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
    const result = await checkDurationContentArtifacts();
    assert(
      result.stale.length === 0,
      `Stale duration artifacts: ${result.stale.join(", ")}`,
    );
    console.log(JSON.stringify({ ...result, mode: "check" }));
  } else {
    const result = await writeDurationContentArtifacts();
    console.log(JSON.stringify({ ...result, mode: "write" }));
  }
}
