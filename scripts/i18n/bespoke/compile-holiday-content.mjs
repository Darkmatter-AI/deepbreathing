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
  "src/i18n/content/bespoke/holiday-breathing",
);
const outputRoot = join(contentRoot, "messages");
const sourcePath = join(contentRoot, "source.json");
const bindingsPath = join(contentRoot, "reviewed-source-bindings.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const catalogRoute = "/holiday-breathing-exercises";

export const HOLIDAY_CONTENT_LOCALES = [
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
    flattenStringLeaves(child, prefix ? `${prefix}.${key}` : key, output);
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

function validateReviewedFiles(
  source,
  sourceLeaves,
  bindingFile,
  replacementFile,
) {
  const sourceHash = sha256(stableJson(source));
  for (const [label, file] of [
    ["binding", bindingFile],
    ["replacement", replacementFile],
  ]) {
    assert(file.schemaVersion === 1, `Unsupported holiday ${label} schema`);
    assert(
      file.reviewedSourceHash === sourceHash,
      `Holiday ${label} review is stale for source.json`,
    );
  }

  assert(
    bindingFile.drifts.length === 19,
    "Holiday source audit must retain 19 reviewed drift decisions",
  );
  const reviewedPaths = new Set(
    bindingFile.drifts.flatMap((drift) => {
      assert(
        typeof drift.id === "string" &&
          Array.isArray(drift.messagePaths) &&
          typeof drift.reason === "string" &&
          drift.reason.trim(),
        "Holiday drift decision is incomplete",
      );
      return drift.messagePaths;
    }),
  );

  const bindings = new Map(Object.entries(bindingFile.bindings ?? {}));
  const replacements = new Map(
    Object.entries(replacementFile.replacements ?? {}),
  );
  for (const [messagePath, binding] of bindings) {
    assert(
      sourceLeaves.has(messagePath),
      `Unknown holiday binding ${messagePath}`,
    );
    assert(
      typeof binding.occurrenceKey === "string" &&
        typeof binding.catalogSourceText === "string",
      `Holiday binding ${messagePath} is incomplete`,
    );
  }
  for (const [messagePath, replacement] of replacements) {
    const sourceText = sourceLeaves.get(messagePath);
    assert(
      sourceText !== undefined,
      `Unknown holiday replacement ${messagePath}`,
    );
    assert(
      !bindings.has(messagePath),
      `Holiday mapping overlaps at ${messagePath}`,
    );
    assert(
      typeof replacement.reason === "string" && replacement.reason.trim(),
      `Holiday replacement ${messagePath} lacks a reason`,
    );
    const locales = Object.keys(replacement.translations ?? {}).sort();
    assert(
      JSON.stringify(locales) ===
        JSON.stringify([...HOLIDAY_CONTENT_LOCALES].sort()),
      `Holiday replacement ${messagePath} must cover every locale`,
    );
    for (const [locale, translation] of Object.entries(
      replacement.translations,
    )) {
      validateTranslation(
        sourceText,
        translation,
        `${messagePath}:${locale} replacement`,
      );
    }
  }
  for (const messagePath of reviewedPaths) {
    assert(
      bindings.has(messagePath) || replacements.has(messagePath),
      `Reviewed holiday drift ${messagePath} lacks an explicit mapping`,
    );
  }
  return { bindings, replacements };
}

async function loadCatalog(locale) {
  const catalog = await readJson(
    join(catalogRoot, locale, "pages", "holiday-breathing-exercises.json"),
  );
  assert(catalog.route === catalogRoute, `${locale} holiday catalog moved`);
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

export async function buildHolidayContentArtifacts() {
  const [source, bindingFile, replacementFile] = await Promise.all([
    readJson(sourcePath),
    readJson(bindingsPath),
    readJson(replacementsPath),
  ]);
  const sourceLeaves = flattenStringLeaves(source);
  const { bindings, replacements } = validateReviewedFiles(
    source,
    sourceLeaves,
    bindingFile,
    replacementFile,
  );
  const publication = {
    expectedMessages: sourceLeaves.size,
    locales: {},
    route: catalogRoute,
    schemaVersion: 1,
  };
  const provenance = { locales: {}, route: catalogRoute, schemaVersion: 1 };
  const unresolved = { route: catalogRoute, schemaVersion: 1, unresolved: [] };
  const outputs = new Map();

  for (const locale of HOLIDAY_CONTENT_LOCALES) {
    const catalog = await loadCatalog(locale);
    const messages = structuredClone(source);
    const localeProvenance = {};
    const counts = { binding: 0, catalog: 0, replacement: 0 };

    for (const [messagePath, sourceText] of sourceLeaves) {
      const replacement = replacements.get(messagePath);
      const binding = bindings.get(messagePath);
      let translation;
      let status;
      let occurrenceKey;
      if (replacement) {
        translation = replacement.translations[locale];
        status = "repo-reviewed-replacement";
        counts.replacement += 1;
      } else {
        const segment = binding
          ? resolveBinding(catalog, binding, messagePath)
          : resolveExact(catalog, sourceText, messagePath);
        translation = segment.translation.text;
        occurrenceKey = segment.occurrenceKey;
        status = binding
          ? "explicit-reviewed-source-binding"
          : "route-catalog-exact";
        counts[binding ? "binding" : "catalog"] += 1;
      }
      validateTranslation(
        sourceText,
        translation,
        `${messagePath}:${locale}`,
        occurrenceKey
          ? "Preserve the approved catalog value bound to this reviewed route placement."
          : undefined,
      );
      setPath(messages, messagePath, translation);
      localeProvenance[messagePath] = {
        sourceHash: sha256(sourceText),
        status,
        ...(occurrenceKey ? { catalogRoute, occurrenceKey } : {}),
        ...(replacement ? { reason: replacement.reason } : {}),
      };
    }

    const serialized = stableJson(messages);
    const relativePath = `messages/${locale}.json`;
    outputs.set(relativePath, serialized);
    publication.locales[locale] = {
      ...counts,
      bytes: Buffer.byteLength(serialized),
      path: relativePath,
      publishable: true,
      resolvedMessages: sourceLeaves.size,
      sha256: sha256(serialized),
    };
    provenance.locales[locale] = localeProvenance;
  }

  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, provenance, publication, unresolved };
}

export async function writeHolidayContentArtifacts() {
  const build = await buildHolidayContentArtifacts();
  assert(
    outputRoot === join(contentRoot, "messages"),
    "Refusing unsafe holiday output path",
  );
  await rm(outputRoot, { force: true, recursive: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return { unresolved: 0, written: build.outputs.size };
}

export async function checkHolidayContentArtifacts() {
  const build = await buildHolidayContentArtifacts();
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
    const result = await checkHolidayContentArtifacts();
    assert(
      result.stale.length === 0,
      `Stale holiday artifacts: ${result.stale.join(", ")}`,
    );
    console.log(JSON.stringify({ ...result, mode: "check" }));
  } else {
    const result = await writeHolidayContentArtifacts();
    console.log(JSON.stringify({ ...result, mode: "write" }));
  }
}
