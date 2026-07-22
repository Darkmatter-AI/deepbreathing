#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/about");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const sourcePath = join(contentRoot, "source.json");
const overridesPath = join(contentRoot, "overrides.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const outputRoot = join(contentRoot, "messages");
const publicationPath = join(contentRoot, "publication.json");
const provenancePath = join(contentRoot, "provenance.json");
const unresolvedPath = join(contentRoot, "unresolved.json");

export const ABOUT_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];

const ABOUT_ROUTE = "/about";

const MESSAGE_MAPPINGS = [
  ["metadata.title", "About Deep Breathing Exercises"],
  ["metadata.description", "Deep Breathing Exercises is a free breathing visualizer and set of evidence-informed breathing guides for calm, focus, and sleep."],
  ["metadata.socialTitle", "About Deep Breathing Exercises"],
  ["metadata.socialDescription", "A free breathing visualizer and evidence-informed guides for calm, focus, and sleep."],
  ["breadcrumb.home", "Home", "/languages"],
  ["breadcrumb.about", "About"],
  ["hero.eyebrow", "Deep Breathing Exercises"],
  ["hero.title", "About"],
  ["hero.intro", "Deep Breathing Exercises is a free breathing visualizer and a set of evidence-informed guides for calm, focus, and sleep."],
  ["sections.whatThisIs.title", "What this is"],
  ["sections.disclaimer.title", "What this is not"],
  ["sections.disclaimer.body", "This is not medical treatment. If you have a cardiopulmonary condition, are pregnant, or have a history of fainting, keep breathing gentle, avoid long breath holds, and consult a clinician for personalized advice."],
  ["sections.whoBuilt.title", "Who built this", "/about/editorial-policy"],
  ["sections.whoBuilt.beforeLink", "Deep Breathing Exercises is built by"],
  ["sections.whoBuilt.linkLabel", "Abi Abiassi", "/about/editorial-policy"],
  ["sections.whoBuilt.afterLink", ", founder, photographer, and breathwork practitioner. He built it as a free visualizer for the techniques he uses daily."],
  ["sections.editorial.body", "Each technique page names the practitioner or tradition it comes from, links out to the peer-reviewed research that informs the claims, and shows when it was last updated. Where evidence is weak, we say so."],
  ["sections.links.title", "Links"],
  ["sections.links.breathingTechniques", "Breathing techniques"],
  ["sections.links.guidesByGoal", "Guides by goal"],
  ["sections.links.aboutAbi", "About Abi", "/physiological-sigh-panic-attack"],
  ["sections.links.editorialPolicy", "Editorial policy", "/about/editorial-policy"],
  ["sections.links.privacy", "Privacy"],
  ["sections.credits.title", "Created by"],
  ["sections.credits.abiassi", "Abiassi"],
  ["sections.credits.darkmatter", "Darkmatter AI Labs"],
].map(([messagePath, sourceText, catalogRoute = ABOUT_ROUTE]) => ({
  catalogRoute,
  messagePath,
  sourceText,
}));

const RICH_TEXT_MAPPING = {
  sourceText: "This site provides simple, guided breathing sessions (box breathing, 4-7-8, coherent breathing for HRV, and the physiological sigh) plus short guides explaining when to use each technique.",
  paths: {
    before: "sections.whatThisIs.beforeLink",
    link: "sections.whatThisIs.linkLabel",
    after: "sections.whatThisIs.afterLink",
  },
  linkedPhrase: {
    "de-de": "den physiologischen Seufzer",
    "es-es": "el suspiro fisiológico",
    "fr-fr": "soupir physiologique",
    "ja-jp": "生理的なため息",
    "pt-br": "o suspiro fisiológico",
  },
};

const OVERRIDE_PATHS = new Set([
  "sections.editorial.title",
  "sections.editorial.linkLabel",
]);

const TRAILING_SPACE_PATHS = new Set([
  "sections.whoBuilt.beforeLink",
]);

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

function flattenLeaves(value, prefix = "", output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") output.set(childPath, child);
    else flattenLeaves(child, childPath, output);
  }
  return output;
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
  cursor[parts.at(-1)] = value;
}

function validateTranslation(sourceText, translation, label) {
  assert(typeof translation === "string" && translation.trim(), `${label} is empty`);
  assert(!/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation), `${label} contains unsafe markup`);
  assert(translation.length <= Math.max(sourceText.length * 8, 240), `${label} is unexpectedly long`);
}

function validateOverrides(overrides, sourceLeaves) {
  assert(overrides.schemaVersion === 1, "Unsupported about override schema");
  assert(Array.isArray(overrides.overrides), "About overrides must be an array");
  const seen = new Set();
  for (const override of overrides.overrides) {
    assert(OVERRIDE_PATHS.has(override.messagePath), `Unexpected about override ${override.messagePath}`);
    assert(!seen.has(override.messagePath), `Duplicate about override ${override.messagePath}`);
    seen.add(override.messagePath);
    assert(override.sourceText === sourceLeaves.get(override.messagePath), `${override.messagePath} source changed`);
    assert(override.reviewedSourceHash === sha256(override.sourceText), `${override.messagePath} source hash changed`);
    assert(typeof override.reason === "string" && override.reason.trim(), `${override.messagePath} lacks a reason`);
    assert(
      JSON.stringify(Object.keys(override.translations).sort(compareText)) === JSON.stringify([...ABOUT_LOCALES].sort(compareText)),
      `${override.messagePath} must cover every about locale`,
    );
    for (const locale of ABOUT_LOCALES) {
      validateTranslation(override.sourceText, override.translations[locale], `${override.messagePath}:${locale}`);
    }
  }
  assert(
    JSON.stringify([...seen].sort(compareText)) === JSON.stringify([...OVERRIDE_PATHS].sort(compareText)),
    "Every unrecoverable about message must have a reviewed override",
  );
}

function validateReplacements(replacements, sourceLeaves) {
  assert(replacements.schemaVersion === 1, "Unsupported about replacement schema");
  assert(Array.isArray(replacements.replacements), "About replacements must be an array");
  const seen = new Set();
  for (const replacement of replacements.replacements) {
    assert(sourceLeaves.has(replacement.messagePath), `Unknown about replacement ${replacement.messagePath}`);
    assert(replacement.sourceText === sourceLeaves.get(replacement.messagePath), `${replacement.messagePath} replacement source changed`);
    assert(replacement.reviewedSourceHash === sha256(replacement.sourceText), `${replacement.messagePath} replacement hash changed`);
    assert(typeof replacement.reason === "string" && replacement.reason.trim(), `${replacement.messagePath} replacement lacks a reason`);
    const locales = Object.keys(replacement.translations);
    assert(locales.length > 0, `${replacement.messagePath} replacement has no locales`);
    for (const locale of locales) {
      assert(ABOUT_LOCALES.includes(locale), `${replacement.messagePath} has unsupported replacement locale ${locale}`);
      const key = `${replacement.messagePath}:${locale}`;
      assert(!seen.has(key), `Duplicate about replacement ${key}`);
      seen.add(key);
      validateTranslation(replacement.sourceText, replacement.translations[locale], key);
    }
  }
}

function resolveCatalogTranslation(catalog, sourceText, label) {
  const candidates = catalog.segments.filter((segment) => segment.sourceText === sourceText);
  const usable = candidates.filter((candidate) =>
    candidate.translation?.isApproved === true
      && candidate.translation?.needsReview === false
      && typeof candidate.translation?.text === "string"
      && candidate.translation.text.trim()
  );
  const translations = [...new Set(usable.map((candidate) => candidate.translation.text))].sort(compareText);
  assert(translations.length <= 1, `${label} has conflicting approved translations`);
  assert(translations.length === 1, `${label} has no approved translation`);
  return {
    candidateCount: candidates.length,
    translation: translations[0],
  };
}

function splitRichTranslation(translation, phrase, locale) {
  const index = translation.indexOf(phrase);
  assert(index !== -1, `About rich-text phrase not found for ${locale}: ${phrase}`);
  assert(translation.indexOf(phrase, index + phrase.length) === -1, `About rich-text phrase is ambiguous for ${locale}`);
  return {
    before: translation.slice(0, index),
    link: phrase,
    after: translation.slice(index + phrase.length),
  };
}

export async function buildAboutContentArtifacts() {
  const [source, overrides, replacements] = await Promise.all([
    readJson(sourcePath),
    readJson(overridesPath),
    readJson(replacementsPath),
  ]);
  const sourceLeaves = flattenLeaves(source);
  validateOverrides(overrides, sourceLeaves);
  validateReplacements(replacements, sourceLeaves);

  const mappedPaths = new Set([
    ...MESSAGE_MAPPINGS.map(({ messagePath }) => messagePath),
    ...Object.values(RICH_TEXT_MAPPING.paths),
    ...OVERRIDE_PATHS,
  ]);
  assert(
    JSON.stringify([...mappedPaths].sort(compareText)) === JSON.stringify([...sourceLeaves.keys()].sort(compareText)),
    "About source shape and compiler mappings have drifted",
  );

  const overrideByPath = new Map(overrides.overrides.map((override) => [override.messagePath, override]));
  const replacementByPathAndLocale = new Map(
    replacements.replacements.flatMap((replacement) =>
      Object.entries(replacement.translations).map(([locale, translation]) => [
        `${replacement.messagePath}:${locale}`,
        { ...replacement, translation },
      ])
    ),
  );
  const publication = {
    expectedMessages: sourceLeaves.size,
    locales: {},
    routeId: "about",
    schemaVersion: 1,
    sourceRoute: ABOUT_ROUTE,
  };
  const provenance = { locales: {}, schemaVersion: 1, sourceRoute: ABOUT_ROUTE };
  const unresolved = { schemaVersion: 1, sourceRoute: ABOUT_ROUTE, unresolved: [] };
  const outputs = new Map();

  for (const locale of ABOUT_LOCALES) {
    const routeCache = new Map();
    const loadRoute = async (route) => {
      if (!routeCache.has(route)) {
        const relativePath = route === "/" ? "_root.json" : `${route.slice(1)}.json`;
        routeCache.set(route, await readJson(join(catalogRoot, locale, "pages", relativePath)));
      }
      return routeCache.get(route);
    };

    const messages = {};
    const localeProvenance = {};
    for (const mapping of MESSAGE_MAPPINGS) {
      const replacement = replacementByPathAndLocale.get(`${mapping.messagePath}:${locale}`);
      if (replacement) {
        setPath(messages, mapping.messagePath, replacement.translation);
        localeProvenance[mapping.messagePath] = {
          reason: replacement.reason,
          sourceHash: replacement.reviewedSourceHash,
          status: "repo-reviewed-replacement",
        };
        continue;
      }
      const catalog = await loadRoute(mapping.catalogRoute);
      const resolution = resolveCatalogTranslation(
        catalog,
        mapping.sourceText,
        `${mapping.messagePath}:${locale}:${mapping.catalogRoute}`,
      );
      validateTranslation(mapping.sourceText, resolution.translation, `${mapping.messagePath}:${locale}`);
      const translation = TRAILING_SPACE_PATHS.has(mapping.messagePath) && locale !== "ja-jp"
        ? `${resolution.translation} `
        : resolution.translation;
      setPath(messages, mapping.messagePath, translation);
      localeProvenance[mapping.messagePath] = {
        catalogRoute: mapping.catalogRoute,
        sourceHash: sha256(mapping.sourceText),
        status: resolution.candidateCount === 1 ? "route-catalog-unique" : "route-catalog-equivalent",
      };
    }

    const aboutCatalog = await loadRoute(ABOUT_ROUTE);
    const richResolution = resolveCatalogTranslation(
      aboutCatalog,
      RICH_TEXT_MAPPING.sourceText,
      `sections.whatThisIs:${locale}:${ABOUT_ROUTE}`,
    );
    const rich = splitRichTranslation(
      richResolution.translation,
      RICH_TEXT_MAPPING.linkedPhrase[locale],
      locale,
    );
    for (const part of ["before", "link", "after"]) {
      const messagePath = RICH_TEXT_MAPPING.paths[part];
      setPath(messages, messagePath, rich[part]);
      localeProvenance[messagePath] = {
        catalogRoute: ABOUT_ROUTE,
        sourceHash: sha256(RICH_TEXT_MAPPING.sourceText),
        status: "route-catalog-rich-text-split",
      };
    }

    for (const messagePath of OVERRIDE_PATHS) {
      const override = overrideByPath.get(messagePath);
      setPath(messages, messagePath, override.translations[locale]);
      localeProvenance[messagePath] = {
        reason: override.reason,
        sourceHash: override.reviewedSourceHash,
        status: "repo-reviewed-override",
      };
    }

    const messageLeaves = flattenLeaves(messages);
    const serialized = stableJson(messages);
    const resolvedMessages = messageLeaves.size;
    const relativePath = `messages/${locale}.json`;
    outputs.set(relativePath, serialized);
    provenance.locales[locale] = localeProvenance;
    publication.locales[locale] = {
      bytes: Buffer.byteLength(serialized),
      catalogMessages: Object.values(localeProvenance).filter(({ status }) => status.startsWith("route-catalog-")).length,
      overrideMessages: OVERRIDE_PATHS.size,
      reviewedReplacementMessages: Object.values(localeProvenance).filter(({ status }) => status === "repo-reviewed-replacement").length,
      path: relativePath,
      publishable: resolvedMessages === sourceLeaves.size,
      resolvedMessages,
      sha256: resolvedMessages === sourceLeaves.size ? sha256(serialized) : null,
    };
  }

  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, publication, provenance, unresolved };
}

export async function writeAboutContentArtifacts() {
  const build = await buildAboutContentArtifacts();
  assert(outputRoot === join(contentRoot, "messages"), "Refusing unsafe about output path");
  await rm(outputRoot, { force: true, recursive: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return { unresolved: build.unresolved.unresolved.length, written: build.outputs.size };
}

export async function checkAboutContentArtifacts() {
  const build = await buildAboutContentArtifacts();
  const stale = [];
  for (const [relativePath, expected] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    let actual = null;
    try {
      actual = await readFile(outputPath, "utf8");
    } catch {
      // Report missing output through the same stale-artifact contract.
    }
    if (actual !== expected) stale.push(relativePath);
  }
  return { checked: build.outputs.size, stale };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const result = await checkAboutContentArtifacts();
    assert(result.stale.length === 0, `Stale about content artifacts: ${result.stale.join(", ")}`);
    console.log(JSON.stringify({ ...result, mode: "check" }));
  } else {
    const result = await writeAboutContentArtifacts();
    console.log(JSON.stringify({ ...result, mode: "write" }));
  }
}
