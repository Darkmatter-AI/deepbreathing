#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";
import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/trust-pages");
const outputRoot = join(contentRoot, "messages");
const sourcePath = join(contentRoot, "source.json");
const bindingsPath = join(contentRoot, "reviewed-source-bindings.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const catalogRoot = join(repoRoot, "src/i18n/catalog");

export const TRUST_PAGE_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];

const ROUTES = {
  abi: "/about/abi",
  editorialPolicy: "/about/editorial-policy",
};

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
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      assert(
        /^[a-z][a-zA-Z\d]*$/.test(key),
        `Trust source key is not semantic: ${prefix ? `${prefix}.` : ""}${key}`,
      );
      flattenStringLeaves(child, prefix ? `${prefix}.${key}` : key, output);
    }
    return output;
  }
  assert(false, `Trust source contains a non-string leaf at ${prefix}`);
}

function setPath(target, path, value) {
  const parts = path.split(".");
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

function placeholders(value) {
  return [...value.matchAll(/\{([a-z][a-z\d]*)\}/gi)]
    .map((match) => match[1])
    .sort();
}

function validateTranslation(sourceText, translation, label, reviewReason) {
  assert(
    typeof translation === "string" && translation.trim(),
    `${label} is empty`,
  );
  assert(
    !/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation),
    `${label} contains unsafe markup`,
  );
  assert(
    JSON.stringify(placeholders(translation)) ===
      JSON.stringify(placeholders(sourceText)),
    `${label} changed interpolation placeholders`,
  );
  validateForTranslationSafety(sourceText, translation, label, {
    numericReviewReason: reviewReason,
  });
}

function validateReviewedFiles(
  source,
  sourceLeavesByRoute,
  bindingsFile,
  replacementsFile,
) {
  const sourceHash = sha256(stableJson(source));
  for (const [label, file] of [
    ["binding", bindingsFile],
    ["replacement", replacementsFile],
  ]) {
    assert(file.schemaVersion === 1, `Unsupported trust ${label} schema`);
    assert(
      file.reviewedSourceHash === sourceHash,
      `Trust ${label} review is stale for source.json`,
    );
  }

  const bindings = new Map(Object.entries(bindingsFile.bindings ?? {}));
  const localeBindings = new Map(
    Object.entries(bindingsFile.localeBindings ?? {}),
  );
  const replacements = new Map(
    Object.entries(replacementsFile.replacements ?? {}),
  );
  const allPaths = new Set(
    Object.entries(sourceLeavesByRoute).flatMap(([routeKey, leaves]) =>
      [...leaves.keys()].map((path) => `${routeKey}.${path}`),
    ),
  );

  function validateBinding(messagePath, binding, label) {
    assert(allPaths.has(messagePath), `Unknown trust binding ${messagePath}`);
    assert(
      typeof binding.occurrenceKey === "string" &&
        typeof binding.catalogSourceText === "string" &&
        typeof binding.reason === "string" &&
        binding.reason.trim(),
      `${label} is incomplete`,
    );
    assert(
      binding.catalogRoute === undefined ||
        (typeof binding.catalogRoute === "string" &&
          binding.catalogRoute.startsWith("/")),
      `${label} has an invalid catalog route`,
    );
    assert(
      binding.catalogTranslationText === undefined ||
        (typeof binding.catalogTranslationText === "string" &&
          binding.catalogTranslationText.trim()),
      `${label} has an invalid catalog translation`,
    );
  }

  for (const [messagePath, binding] of bindings) {
    validateBinding(messagePath, binding, `Trust binding ${messagePath}`);
  }
  for (const [messagePath, bindingsByLocale] of localeBindings) {
    assert(
      allPaths.has(messagePath),
      `Unknown trust locale binding ${messagePath}`,
    );
    assert(
      bindingsByLocale &&
        typeof bindingsByLocale === "object" &&
        !Array.isArray(bindingsByLocale),
      `Trust locale binding ${messagePath} is incomplete`,
    );
    for (const [locale, binding] of Object.entries(bindingsByLocale)) {
      assert(
        TRUST_PAGE_LOCALES.includes(locale),
        `Trust locale binding ${messagePath} has unknown locale ${locale}`,
      );
      validateBinding(
        messagePath,
        binding,
        `Trust locale binding ${messagePath}:${locale}`,
      );
    }
  }
  for (const [messagePath, replacement] of replacements) {
    assert(
      allPaths.has(messagePath),
      `Unknown trust replacement ${messagePath}`,
    );
    assert(
      !bindings.has(messagePath),
      `Trust mapping overlaps at ${messagePath}`,
    );
    assert(
      typeof replacement.reason === "string" && replacement.reason.trim(),
      `Trust replacement ${messagePath} lacks a reason`,
    );
    const locales = Object.keys(replacement.locales ?? {}).sort();
    assert(
      locales.length > 0 &&
        locales.every((locale) => TRUST_PAGE_LOCALES.includes(locale)),
      `Trust replacement ${messagePath} has invalid locales`,
    );
    const [routeKey, ...localParts] = messagePath.split(".");
    const sourceText = sourceLeavesByRoute[routeKey].get(localParts.join("."));
    for (const [locale, localeReplacement] of Object.entries(
      replacement.locales,
    )) {
      assert(
        !localeBindings.get(messagePath)?.[locale],
        `Trust locale mapping overlaps at ${messagePath}:${locale}`,
      );
      assert(
        Array.isArray(localeReplacement.evidence) &&
          localeReplacement.evidence.length > 0,
        `Trust replacement ${messagePath}:${locale} lacks catalog evidence`,
      );
      for (const [index, evidence] of localeReplacement.evidence.entries()) {
        validateBinding(
          messagePath,
          evidence,
          `Trust replacement ${messagePath}:${locale} evidence ${index}`,
        );
        assert(
          typeof evidence.catalogRoute === "string" &&
            typeof evidence.catalogTranslationText === "string",
          `Trust replacement ${messagePath}:${locale} evidence ${index} is not source-bound`,
        );
      }
      validateTranslation(
        sourceText,
        localeReplacement.translation,
        `${messagePath}:${locale} replacement`,
        replacement.reason,
      );
    }
  }

  return { bindings, localeBindings, replacements };
}

async function loadCatalog(locale, route) {
  const catalog = await readJson(
    join(catalogRoot, locale, "pages", `${route.slice(1)}.json`),
  );
  assert(
    catalog.route === route,
    `${locale} trust catalog moved from ${route}`,
  );
  return catalog;
}

function resolveBinding(catalog, binding, label) {
  const candidates = catalog.segments.filter(
    (segment) => segment.occurrenceKey === binding.occurrenceKey,
  );
  assert(candidates.length === 1, `${label} occurrence is not unique`);
  const [segment] = candidates;
  assert(
    segment.sourceText === binding.catalogSourceText,
    `${label} bound catalog source drifted`,
  );
  assert(isApproved(segment), `${label} bound translation is not approved`);
  if (binding.catalogTranslationText !== undefined) {
    assert(
      segment.translation.text === binding.catalogTranslationText,
      `${label} bound catalog translation drifted`,
    );
  }
  return segment;
}

function resolveExact(catalog, sourceText, label) {
  const candidates = catalog.segments.filter(
    (segment) => segment.sourceText === sourceText,
  );
  assert(candidates.length > 0, `${label} has no exact or reviewed mapping`);
  assert(
    candidates.length === 1,
    `${label} has multiple exact placements; add an explicit binding`,
  );
  const [segment] = candidates;
  assert(isApproved(segment), `${label} exact translation is not approved`);
  return segment;
}

export async function buildTrustPageArtifacts() {
  const [source, bindingsFile, replacementsFile] = await Promise.all([
    readJson(sourcePath),
    readJson(bindingsPath),
    readJson(replacementsPath),
  ]);
  assert(
    JSON.stringify(Object.keys(source)) === JSON.stringify(Object.keys(ROUTES)),
    "Trust source route keys changed",
  );
  const sourceLeavesByRoute = Object.fromEntries(
    Object.entries(source).map(([routeKey, content]) => [
      routeKey,
      flattenStringLeaves(content),
    ]),
  );
  const { bindings, localeBindings, replacements } = validateReviewedFiles(
    source,
    sourceLeavesByRoute,
    bindingsFile,
    replacementsFile,
  );
  const publication = { routes: {}, schemaVersion: 1 };
  const provenance = { routes: {}, schemaVersion: 1 };
  const unresolved = { schemaVersion: 1, unresolved: [] };
  const outputs = new Map();

  for (const [routeKey, catalogRoute] of Object.entries(ROUTES)) {
    const sourceLeaves = sourceLeavesByRoute[routeKey];
    publication.routes[routeKey] = {
      expectedMessages: sourceLeaves.size,
      locales: {},
      sourceRoute: catalogRoute,
    };
    provenance.routes[routeKey] = {
      locales: {},
      sourceRoute: catalogRoute,
    };

    for (const locale of TRUST_PAGE_LOCALES) {
      const catalogs = new Map();
      async function catalogFor(route) {
        if (!catalogs.has(route)) catalogs.set(route, loadCatalog(locale, route));
        return catalogs.get(route);
      }
      const catalog = await catalogFor(catalogRoute);
      const messages = structuredClone(source[routeKey]);
      const localeProvenance = {};
      const counts = { binding: 0, catalog: 0, replacement: 0 };

      for (const [messagePath, sourceText] of sourceLeaves) {
        const fullPath = `${routeKey}.${messagePath}`;
        const binding =
          localeBindings.get(fullPath)?.[locale] ?? bindings.get(fullPath);
        const replacement = replacements.get(fullPath)?.locales?.[locale];
        let translation;
        let status;
        let occurrenceKey;
        let reason;
        let provenanceCatalogRoute;
        let evidence;

        if (replacement) {
          const replacementConfig = replacements.get(fullPath);
          for (const [index, item] of replacement.evidence.entries()) {
            resolveBinding(
              await catalogFor(item.catalogRoute),
              item,
              `${fullPath}:${locale} replacement evidence ${index}`,
            );
          }
          translation = replacement.translation;
          status = "repo-reviewed-replacement";
          reason = replacementConfig.reason;
          evidence = replacement.evidence.map((item) => ({
            catalogRoute: item.catalogRoute,
            occurrenceKey: item.occurrenceKey,
          }));
          counts.replacement += 1;
        } else {
          provenanceCatalogRoute = binding?.catalogRoute ?? catalogRoute;
          const bindingCatalog = binding
            ? await catalogFor(provenanceCatalogRoute)
            : catalog;
          const segment = binding
            ? resolveBinding(bindingCatalog, binding, fullPath)
            : resolveExact(catalog, sourceText, fullPath);
          translation = segment.translation.text;
          occurrenceKey = segment.occurrenceKey;
          status = binding
            ? "explicit-reviewed-source-binding"
            : "route-catalog-exact";
          reason = binding?.reason;
          counts[binding ? "binding" : "catalog"] += 1;
        }

        validateTranslation(
          sourceText,
          translation,
          `${fullPath}:${locale}`,
          reason ??
            "Preserve the approved catalog value for this route placement.",
        );
        setPath(messages, messagePath, translation);
        localeProvenance[messagePath] = {
          sourceHash: sha256(sourceText),
          status,
          ...(occurrenceKey
            ? { catalogRoute: provenanceCatalogRoute, occurrenceKey }
            : {}),
          ...(evidence ? { evidence } : {}),
          ...(reason ? { reason } : {}),
        };
      }

      const serialized = stableJson(messages);
      const relativePath = `messages/${locale}/${routeKey}.json`;
      outputs.set(relativePath, serialized);
      publication.routes[routeKey].locales[locale] = {
        ...counts,
        bytes: Buffer.byteLength(serialized),
        path: relativePath,
        publishable: true,
        resolvedMessages: sourceLeaves.size,
        sha256: sha256(serialized),
      };
      provenance.routes[routeKey].locales[locale] = localeProvenance;
    }
  }

  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, provenance, publication, unresolved };
}

export async function writeTrustPageArtifacts() {
  const build = await buildTrustPageArtifacts();
  assert(
    outputRoot === join(contentRoot, "messages"),
    "Refusing unsafe trust-page output path",
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

export async function checkTrustPageArtifacts() {
  const build = await buildTrustPageArtifacts();
  const stale = [];
  for (const [relativePath, expected] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    let actual = null;
    try {
      actual = await readFile(outputPath, "utf8");
    } catch {
      // Missing output is reported through the same stale-artifact contract.
    }
    if (actual !== expected) stale.push(relativePath);
  }
  return { checked: build.outputs.size, stale };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes("--check")) {
    const result = await checkTrustPageArtifacts();
    console.log(JSON.stringify({ ...result, mode: "check" }));
    if (result.stale.length > 0) process.exitCode = 1;
  } else {
    const result = await writeTrustPageArtifacts();
    console.log(JSON.stringify({ ...result, mode: "write" }));
  }
}
