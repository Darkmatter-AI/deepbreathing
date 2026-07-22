#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(
  repoRoot,
  "src/i18n/content/bespoke/breathing-visualizer",
);
const sourcePath = join(contentRoot, "source.json");
const aliasesPath = join(contentRoot, "source-aliases.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const routeClientBindingsPath = join(
  contentRoot,
  "route-client-bindings.json",
);
const manualPath = join(
  repoRoot,
  "src/i18n/content/remaining-pages/manual/breathing-visualizer.json",
);
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const bannerSourcePath = join(
  repoRoot,
  "src/components/auth/non-blocking-sign-in-banner.tsx",
);
const modeSourcePath = join(
  repoRoot,
  "packages/audio/src/modes.ts",
);

export const BREATHING_VISUALIZER_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
];

const SOURCE_ROUTE = "/breathing-visualizer";
const EXPECTED_SERVER_MESSAGES = 112;
const EXPECTED_ROUTE_CLIENT_MESSAGES = 12;
const EXPECTED_ROUTE_CLIENT_CELLS = 60;
const EXPECTED_STALE_CATALOG_ONLY_CELLS = 5;
const EXPECTED_TECHNIQUE_SLUGS = [
  "box",
  "4-7-8",
  "coherent",
  "physiological-sigh",
  "wim-hof",
  "pursed-lip",
  "nadi-shodhana",
  "ujjayi",
  "belly",
  "buteyko",
  "tummo",
  "breath-of-fire",
  "9d-breathwork",
  "hope-cartel-9d-breathwork",
];

const CURRENT_BANNER_DEFAULTS = {
  saveSessionAria: "Save your session",
  closeAria: "Close",
  title: "Save your breathing practice journey",
  sessionComplete: "✓ SESSION COMPLETE",
  modeName: "Box Breathing",
  justNow: "just now",
  continueWithGoogle: "Continue with Google",
  oneTapNoPassword: "One tap. No password.",
  emailAddressAria: "Email address",
  emailPlaceholder: "Enter your email",
  sendLink: "Send link",
  saveWithEmail: "or save with email",
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
    assert(catalog.route === route, `${key}: catalog route changed`);
    assert(catalog.locale === locale, `${key}: catalog locale changed`);
    cache.set(key, catalog);
  }
  return cache.get(key);
}

function resolveOccurrence(catalog, occurrenceKey, sourceText, label) {
  const candidates = catalog.segments.filter(
    (segment) => segment.occurrenceKey === occurrenceKey,
  );
  assert(candidates.length === 1, `${label}: occurrence is not unique`);
  const [candidate] = candidates;
  assert(candidate.sourceText === sourceText, `${label}: catalog source drifted`);
  assert(isApproved(candidate), `${label}: catalog translation is not approved`);
  return candidate;
}

function validateAliases(file, sourceLeaves) {
  assert(file.schemaVersion === 1, "Unsupported visualizer alias schema");
  assert(Array.isArray(file.aliases), "Visualizer aliases must be an array");
  const aliases = new Map();
  for (const alias of file.aliases) {
    const label = `visualizer alias ${alias.messagePath}`;
    assert(!aliases.has(alias.messagePath), `${label}: duplicate`);
    const sourceText = sourceLeaves.get(alias.messagePath);
    assert(typeof sourceText === "string", `${label}: unknown source path`);
    assert(
      alias.reviewedSourceHash === sha256(sourceText),
      `${label}: current source hash drifted`,
    );
    assert(
      typeof alias.catalogRoute === "string" &&
        typeof alias.occurrenceKey === "string" &&
        typeof alias.catalogSourceText === "string",
      `${label}: incomplete catalog binding`,
    );
    assert(
      typeof alias.reason === "string" && alias.reason.trim().length > 0,
      `${label}: missing reason`,
    );
    if (alias.numericReviewReasons !== undefined) {
      assert(
        alias.numericReviewReasons &&
          typeof alias.numericReviewReasons === "object" &&
          !Array.isArray(alias.numericReviewReasons),
        `${label}: invalid numeric review reasons`,
      );
      for (const [locale, reason] of Object.entries(
        alias.numericReviewReasons,
      )) {
        assert(
          BREATHING_VISUALIZER_LOCALES.includes(locale),
          `${label}: unsupported numeric review locale ${locale}`,
        );
        assert(
          typeof reason === "string" && reason.trim().length > 0,
          `${label}:${locale}: empty numeric review reason`,
        );
      }
    }
    aliases.set(alias.messagePath, alias);
  }
  return aliases;
}

function validateReplacements(file, sourceLeaves) {
  assert(file.schemaVersion === 1, "Unsupported visualizer replacement schema");
  assert(
    Array.isArray(file.replacements),
    "Visualizer replacements must be an array",
  );
  const replacements = new Map();
  for (const replacement of file.replacements) {
    const label = `visualizer replacement ${replacement.messagePath}`;
    assert(!replacements.has(replacement.messagePath), `${label}: duplicate`);
    const sourceText = sourceLeaves.get(replacement.messagePath);
    assert(sourceText === replacement.sourceText, `${label}: source changed`);
    assert(
      replacement.reviewedSourceHash === sha256(sourceText),
      `${label}: source hash drifted`,
    );
    assertExactKeys(
      replacement.translations,
      BREATHING_VISUALIZER_LOCALES,
      `${label}:translations`,
    );
    assert(
      typeof replacement.reason === "string" &&
        replacement.reason.trim().length > 0,
      `${label}: missing reason`,
    );
    for (const [locale, translation] of Object.entries(
      replacement.translations,
    )) {
      validateTranslation(sourceText, translation, `${label}:${locale}`);
    }
    replacements.set(replacement.messagePath, replacement);
  }
  return replacements;
}

async function validateRouteClientContract(
  bindings,
  manual,
  source,
) {
  assert(bindings.schemaVersion === 1, "Unsupported visualizer client schema");
  assert(bindings.sourceRoute === SOURCE_ROUTE, "Visualizer client route changed");
  assert(manual.schemaVersion === 1, "Unsupported visualizer manual schema");
  assert(manual.sourceRoute === SOURCE_ROUTE, "Visualizer manual route changed");
  assert(Array.isArray(manual.entries), "Visualizer manual entries changed");
  assert(manual.entries.length === 13, "Visualizer manual entry count changed");
  assertExactKeys(
    bindings.messages,
    Object.keys(CURRENT_BANNER_DEFAULTS),
    "Visualizer route-client messages",
  );
  assert(
    Array.isArray(bindings.catalogOnly) && bindings.catalogOnly.length === 1,
    "Visualizer catalog-only classification changed",
  );

  const entriesByPlacement = new Map();
  for (const entry of manual.entries) {
    assert(
      /^catalog-placement\.[0-9a-f-]{36}$/.test(entry.messageId),
      "Visualizer manual messageId changed",
    );
    const placementId = entry.messageId.slice("catalog-placement.".length);
    assert(
      !entriesByPlacement.has(placementId),
      `Visualizer manual duplicate ${placementId}`,
    );
    assert(
      entry.reviewedSourceHash === sha256(entry.sourceText),
      `Visualizer manual ${placementId} source hash drifted`,
    );
    assertExactKeys(
      entry.translations,
      BREATHING_VISUALIZER_LOCALES,
      `Visualizer manual ${placementId}:translations`,
    );
    entriesByPlacement.set(placementId, entry);
  }

  const bannerSource = await readFile(bannerSourcePath, "utf8");
  const modeSource = await readFile(modeSourcePath, "utf8");
  const claimedPlacements = new Set();
  for (const [field, binding] of Object.entries(bindings.messages)) {
    const label = `visualizer route-client ${field}`;
    assert(
      binding.sourceText === CURRENT_BANNER_DEFAULTS[field],
      `${label}: source contract changed`,
    );
    assert(
      binding.reviewedSourceHash === sha256(binding.sourceText),
      `${label}: source hash drifted`,
    );
    assert(
      !claimedPlacements.has(binding.placementId),
      `${label}: placement reused`,
    );
    claimedPlacements.add(binding.placementId);
    const entry = entriesByPlacement.get(binding.placementId);
    assert(entry, `${label}: reviewed placement missing`);
    assert(entry.sourceText === binding.sourceText, `${label}: source changed`);
    assert(
      entry.reviewedSourceHash === binding.reviewedSourceHash,
      `${label}: reviewed hash changed`,
    );

    if (field === "modeName") {
      assert(
        source.runtime.modeDisplayName === binding.sourceText,
        `${label}: runtime mode source changed`,
      );
      assert(
        modeSource.includes(`Box = '${binding.sourceText}'`),
        `${label}: ModeName.Box source changed`,
      );
      assert(
        bannerSource.includes("messages?.modeName ?? sessionMode"),
        `${label}: consumed mode fallback changed`,
      );
    } else {
      const fallback = `messages?.${field} ?? ${JSON.stringify(binding.sourceText)}`;
      assert(
        bannerSource.split(fallback).length - 1 === 1,
        `${label}: consumed banner fallback changed`,
      );
    }
  }

  const [catalogOnly] = bindings.catalogOnly;
  assert(
    catalogOnly.classification === "stale-catalog-only",
    "Visualizer client exception classification changed",
  );
  assert(
    catalogOnly.reviewedSourceHash === sha256(catalogOnly.sourceText),
    "Visualizer client exception source hash changed",
  );
  assert(
    ![...flattenStringLeaves(source).values()].includes(catalogOnly.sourceText),
    "Visualizer client exception entered current route source",
  );
  const staleEntry = entriesByPlacement.get(catalogOnly.placementId);
  assert(staleEntry, "Visualizer client exception placement missing");
  assert(
    staleEntry.sourceText === catalogOnly.sourceText &&
      staleEntry.reviewedSourceHash === catalogOnly.reviewedSourceHash,
    "Visualizer client exception review binding changed",
  );
  claimedPlacements.add(catalogOnly.placementId);
  assert(
    claimedPlacements.size === entriesByPlacement.size,
    "Visualizer manual entries include unclassified placements",
  );

  return { entriesByPlacement, catalogOnly };
}

export async function buildBreathingVisualizerArtifacts() {
  const [source, aliasFile, replacementFile, routeClientBindings, manual] =
    await Promise.all([
      readJson(sourcePath),
      readJson(aliasesPath),
      readJson(replacementsPath),
      readJson(routeClientBindingsPath),
      readJson(manualPath),
    ]);
  const sourceLeaves = flattenStringLeaves(source);
  assert(
    sourceLeaves.size === EXPECTED_SERVER_MESSAGES,
    `Visualizer expected ${EXPECTED_SERVER_MESSAGES} source messages, found ${sourceLeaves.size}`,
  );
  assert(
    JSON.stringify(Object.keys(source.techniques.items)) ===
      JSON.stringify(EXPECTED_TECHNIQUE_SLUGS) &&
      /10/.test(source.techniques.title),
    "Visualizer technique-card parity contract changed",
  );
  assert(
    source.benefits.items.length === 6 &&
      source.howItWorks.steps.length === 3 &&
      source.faq.items.length === 6 &&
      source.moreTools.links.length === 4 &&
      source.footer.links.length === 7,
    "Visualizer section structure changed",
  );

  const aliases = validateAliases(aliasFile, sourceLeaves);
  const replacements = validateReplacements(replacementFile, sourceLeaves);
  for (const path of replacements.keys()) {
    assert(!aliases.has(path), `${path}: both alias and replacement`);
  }
  const { entriesByPlacement, catalogOnly } =
    await validateRouteClientContract(routeClientBindings, manual, source);

  const outputs = new Map();
  const provenance = {
    schemaVersion: 1,
    server: { locales: {} },
    routeClient: { locales: {} },
  };
  const publication = {
    schemaVersion: 1,
    route: SOURCE_ROUTE,
    expectedServerMessages: EXPECTED_SERVER_MESSAGES,
    routeClientMessagesPerLocale: EXPECTED_ROUTE_CLIENT_MESSAGES,
    routeClientReviewedCells: EXPECTED_ROUTE_CLIENT_CELLS,
    staleCatalogOnlyCells: EXPECTED_STALE_CATALOG_ONLY_CELLS,
    unresolvedCells: 0,
    locales: {},
  };
  const unresolved = [];
  const catalogCache = new Map();

  for (const locale of BREATHING_VISUALIZER_LOCALES) {
    const routeCatalog = await loadCatalog(
      catalogCache,
      locale,
      SOURCE_ROUTE,
    );
    const localized = structuredClone(source);
    const localeProvenance = {};

    for (const [messagePath, sourceText] of sourceLeaves) {
      let translation;
      let record;
      const replacement = replacements.get(messagePath);
      const alias = aliases.get(messagePath);

      if (messagePath === "runtime.modeDisplayName") {
        const binding = routeClientBindings.messages.modeName;
        const entry = entriesByPlacement.get(binding.placementId);
        translation = entry.translations[locale];
        record = {
          status: "route-client-reviewed",
          placementId: binding.placementId,
          reviewedSourceHash: binding.reviewedSourceHash,
        };
      } else if (replacement) {
        translation = replacement.translations[locale];
        record = {
          status: "reviewed-replacement",
          reviewedSourceHash: replacement.reviewedSourceHash,
        };
      } else if (alias) {
        const catalog = await loadCatalog(
          catalogCache,
          locale,
          alias.catalogRoute,
        );
        const segment = resolveOccurrence(
          catalog,
          alias.occurrenceKey,
          alias.catalogSourceText,
          `${locale}:${messagePath}`,
        );
        translation = segment.translation.text;
        record = {
          status: "explicit-source-alias",
          catalogRoute: alias.catalogRoute,
          occurrenceKey: alias.occurrenceKey,
          reviewedSourceHash: alias.reviewedSourceHash,
        };
      } else {
        const candidates = routeCatalog.segments.filter(
          (segment) => segment.sourceText === sourceText && isApproved(segment),
        );
        if (candidates.length !== 1) {
          unresolved.push({
            locale,
            messagePath,
            sourceText,
            reason:
              candidates.length === 0
                ? "no approved exact catalog translation"
                : "ambiguous exact catalog placement requires an explicit alias",
          });
          continue;
        }
        const [segment] = candidates;
        translation = segment.translation.text;
        record = {
          status: "route-catalog-exact",
          catalogRoute: SOURCE_ROUTE,
          occurrenceKey: segment.occurrenceKey,
          sourceHash: segment.sourceHash,
        };
      }

      validateTranslation(
        sourceText,
        translation,
        `${locale}:${messagePath}`,
        alias?.numericReviewReasons?.[locale],
      );
      setPath(localized, messagePath, translation);
      localeProvenance[messagePath] = record;
    }

    const routeClientMessages = {};
    const routeClientProvenance = {};
    for (const [field, binding] of Object.entries(
      routeClientBindings.messages,
    )) {
      const entry = entriesByPlacement.get(binding.placementId);
      const translation = entry.translations[locale];
      validateTranslation(
        binding.sourceText,
        translation,
        `${locale}:route-client.${field}`,
      );
      routeClientMessages[field] = translation;
      routeClientProvenance[field] = {
        placementId: binding.placementId,
        reviewedSourceHash: binding.reviewedSourceHash,
      };
    }

    const staleEntry = entriesByPlacement.get(catalogOnly.placementId);
    const renderedValues = [
      ...flattenStringLeaves(localized).values(),
      ...Object.values(routeClientMessages),
    ];
    assert(
      !renderedValues.includes(catalogOnly.sourceText) &&
        !renderedValues.includes(staleEntry.translations[locale]),
      `${locale}: stale browser exception entered a runtime bundle`,
    );

    const contentPath = `messages/${locale}.json`;
    const routeClientPath = `route-client/messages/${locale}.json`;
    const contentRaw = stableJson(localized);
    const routeClientRaw = stableJson(routeClientMessages);
    outputs.set(contentPath, contentRaw);
    outputs.set(routeClientPath, routeClientRaw);
    provenance.server.locales[locale] = localeProvenance;
    provenance.routeClient.locales[locale] = routeClientProvenance;
    publication.locales[locale] = {
      contentPath,
      routeClientPath,
      resolvedServerMessages: Object.keys(localeProvenance).length,
      resolvedRouteClientMessages: Object.keys(routeClientMessages).length,
      publishable:
        Object.keys(localeProvenance).length === EXPECTED_SERVER_MESSAGES &&
        Object.keys(routeClientMessages).length ===
          EXPECTED_ROUTE_CLIENT_MESSAGES,
      contentSha256: sha256(contentRaw),
      routeClientSha256: sha256(routeClientRaw),
    };
  }

  publication.unresolvedCells = unresolved.length;
  const staleCatalogOnly = [
    {
      ...catalogOnly,
      cells: BREATHING_VISUALIZER_LOCALES.length,
      locales: [...BREATHING_VISUALIZER_LOCALES],
    },
  ];
  assert(
    publication.routeClientReviewedCells === EXPECTED_ROUTE_CLIENT_CELLS,
    "Visualizer route-client reviewed cell count changed",
  );
  assert(
    staleCatalogOnly.reduce((total, item) => total + item.cells, 0) ===
      EXPECTED_STALE_CATALOG_ONLY_CELLS,
    "Visualizer stale catalog-only cell count changed",
  );
  assert(
    unresolved.length === 0,
    `Visualizer has unresolved content:\n${JSON.stringify(unresolved, null, 2)}`,
  );
  assert(
    Object.values(publication.locales).every((entry) => entry.publishable),
    "Visualizer locale is not publishable",
  );

  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  outputs.set("stale-catalog-only.json", stableJson(staleCatalogOnly));
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

export async function writeBreathingVisualizerArtifacts() {
  const outputs = await buildBreathingVisualizerArtifacts();
  await rm(join(contentRoot, "messages"), { recursive: true, force: true });
  await rm(join(contentRoot, "route-client", "messages"), {
    recursive: true,
    force: true,
  });
  for (const [relativePath, raw] of outputs) {
    const path = join(contentRoot, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, raw, "utf8");
  }
  return outputs;
}

export async function checkBreathingVisualizerArtifacts() {
  const outputs = await buildBreathingVisualizerArtifacts();
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
  const generatedRoots = [
    [join(contentRoot, "messages"), "messages"],
    [join(contentRoot, "route-client", "messages"), "route-client/messages"],
  ];
  for (const [root, prefix] of generatedRoots) {
    for (const file of await listFiles(root)) {
      const path = `${prefix}/${file}`;
      if (!expectedPaths.has(path)) stale.push(path);
    }
  }
  return [...new Set(stale)].sort(compareText);
}

async function main() {
  if (process.argv.includes("--check")) {
    const stale = await checkBreathingVisualizerArtifacts();
    if (stale.length) {
      throw new Error(`Stale breathing visualizer artifacts: ${stale.join(", ")}`);
    }
    console.log(JSON.stringify({ checked: 14, stale, mode: "check" }));
    return;
  }
  const outputs = await writeBreathingVisualizerArtifacts();
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
