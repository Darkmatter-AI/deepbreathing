#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manualRoot = join(
  repoRoot,
  "src/i18n/content/remaining-pages/manual",
);
const outputRoot = join(
  repoRoot,
  "src/i18n/content/remaining-pages/rw02-route-client",
);
const bindingsPath = join(outputRoot, "bindings.json");
const bannerSourcePath = join(
  repoRoot,
  "src/components/auth/non-blocking-sign-in-banner.tsx",
);
const promptSourcePath = join(
  repoRoot,
  "src/components/auth/session-complete-prompt.tsx",
);
const modeSourcePath = join(
  repoRoot,
  "src/components/resonance/types.ts",
);
const guideSourceRoot = join(
  repoRoot,
  "src/i18n/content/bespoke/resonance-guides/source",
);
const guideRendererPath = join(
  repoRoot,
  "src/app/(site-en)/resonance-guide-page.tsx",
);
const guideClientIslandPath = join(
  repoRoot,
  "src/app/(site-en)/resonance-guide-resonance.tsx",
);

export const RW02_ROUTE_CLIENT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
];

export const RW02_ROUTE_CLIENT_ROUTES = [
  "/box-breathing-before-presentation",
  "/physiological-sigh-panic-attack",
];

const EXPECTED_MESSAGES = {
  "/box-breathing-before-presentation": 12,
  "/physiological-sigh-panic-attack": 11,
};

const CURRENT_BANNER_DEFAULTS = {
  saveSessionAria: "Save your session",
  closeAria: "Close",
  title: "Save your breathing practice journey",
  sessionComplete: "✓ SESSION COMPLETE",
  justNow: "just now",
  continueWithGoogle: "Continue with Google",
  oneTapNoPassword: "One tap. No password.",
  emailAddressAria: "Email address",
  emailPlaceholder: "Enter your email",
  sendLink: "Send link",
  saveWithEmail: "or save with email",
};

const CURRENT_ROUTE_MODES = {
  "/box-breathing-before-presentation": {
    enumMember: "Box",
    sourceText: "Box Breathing",
  },
  "/physiological-sigh-panic-attack": {
    enumMember: "Sigh",
    sourceText: "Physiological Sigh",
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

function routeSlug(route) {
  return route.slice(1);
}

function assertExactKeys(value, expected, label) {
  assert(
    JSON.stringify(Object.keys(value).sort(compareText)) ===
      JSON.stringify([...expected].sort(compareText)),
    `${label}: keys changed`,
  );
}

function exactOccurrenceCount(source, value) {
  return source.split(value).length - 1;
}

async function auditCurrentClientSource(bindings) {
  const [
    bannerSource,
    promptSource,
    modeSource,
    guideRendererSource,
    guideClientIslandSource,
  ] = await Promise.all([
    readFile(bannerSourcePath, "utf8"),
    readFile(promptSourcePath, "utf8"),
    readFile(modeSourcePath, "utf8"),
    readFile(guideRendererPath, "utf8"),
    readFile(guideClientIslandPath, "utf8"),
  ]);

  for (const [field, sourceText] of Object.entries(CURRENT_BANNER_DEFAULTS)) {
    const fallbackExpression = `messages?.${field} ?? ${JSON.stringify(sourceText)}`;
    assert(
      exactOccurrenceCount(bannerSource, fallbackExpression) === 1,
      `R-W02 client current source drifted for ${field}`,
    );
    for (const route of RW02_ROUTE_CLIENT_ROUTES) {
      const binding = bindings.routes[route][field];
      if (!binding) {
        assert(
          field === "justNow" &&
            route === "/physiological-sigh-panic-attack",
          `${route}:${field}: current client source is unbound`,
        );
        continue;
      }
      assert(
        binding.sourceText === sourceText,
        `${route}:${field}: binding no longer matches the consumed client source`,
      );
    }
  }

  assert(
    /<NonBlockingSignInBanner[\s\S]*?sessionMode=\{pattern\.name\}[\s\S]*?messages=\{routeClientMessages\}[\s\S]*?\/>/.test(
      promptSource,
    ),
    "R-W02 client current mode pipeline drifted in SessionCompletePrompt",
  );
  assert(
    exactOccurrenceCount(
      bannerSource,
      "messages?.modeName ?? sessionMode",
    ) === 1,
    "R-W02 client current mode fallback drifted in NonBlockingSignInBanner",
  );
  assert(
    exactOccurrenceCount(
      guideRendererSource,
      "modeDisplayName={content.runtime.modeDisplayName}",
    ) === 1,
    "R-W02 guide renderer no longer consumes runtime.modeDisplayName",
  );
  assert(
    exactOccurrenceCount(
      guideClientIslandSource,
      "modeDisplayName={modeDisplayName}",
    ) === 1,
    "R-W02 guide client island no longer passes the consumed modeDisplayName",
  );

  for (const route of RW02_ROUTE_CLIENT_ROUTES) {
    const mode = CURRENT_ROUTE_MODES[route];
    const guideSource = await readJson(
      join(guideSourceRoot, `${routeSlug(route)}.json`),
    );
    const enumSource = `${mode.enumMember} = '${mode.sourceText}'`;
    assert(
      exactOccurrenceCount(modeSource, enumSource) === 1,
      `${route}: consumed ModeName source drifted`,
    );
    assert(
      guideSource?.runtime?.modeDisplayName === mode.sourceText,
      `${route}: runtime.modeDisplayName source drifted`,
    );
    assert(
      bindings.routes[route].modeName.sourceText === mode.sourceText,
      `${route}: modeName binding no longer matches the consumed ModeName source`,
    );
  }
}

function validateBinding(binding, label) {
  assertExactKeys(
    binding,
    ["placementId", "reviewedSourceHash", "sourceText"],
    label,
  );
  assert(
    /^[0-9a-f-]{36}$/.test(binding.placementId),
    `${label}: invalid placementId`,
  );
  assert(
    typeof binding.sourceText === "string" && binding.sourceText.length > 0,
    `${label}: sourceText is empty`,
  );
  assert(
    binding.reviewedSourceHash === sha256(binding.sourceText),
    `${label}: reviewed source hash drifted`,
  );
}

function validateTranslation(sourceText, translation, label) {
  assert(
    typeof translation === "string" && translation.trim().length > 0,
    `${label}: reviewed translation is empty`,
  );
  assert(
    !/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation),
    `${label}: reviewed translation contains unsafe markup`,
  );
  validateForTranslationSafety(sourceText, translation, label);
}

async function buildRoute(route, routeBindings) {
  const slug = routeSlug(route);
  const contract = await readJson(join(manualRoot, `${slug}.json`));
  const expectedCount = EXPECTED_MESSAGES[route];

  assert(contract.schemaVersion === 1, `${route}: unsupported contract schema`);
  assert(contract.sourceRoute === route, `${route}: source route changed`);
  assert(Array.isArray(contract.entries), `${route}: entries must be an array`);
  assert(
    contract.entries.length === expectedCount,
    `${route}: expected ${expectedCount} reviewed entries, found ${contract.entries.length}`,
  );
  assert(
    Object.keys(routeBindings).length === expectedCount,
    `${route}: expected ${expectedCount} bindings`,
  );

  const entriesById = new Map();
  for (const entry of contract.entries) {
    assert(
      /^catalog-placement\.[0-9a-f-]{36}$/.test(entry.messageId),
      `${route}: invalid reviewed messageId`,
    );
    const placementId = entry.messageId.slice("catalog-placement.".length);
    assert(!entriesById.has(placementId), `${route}: duplicate ${placementId}`);
    assert(
      entry.reviewedSourceHash === sha256(entry.sourceText),
      `${route}:${placementId}: reviewed source hash drifted`,
    );
    assert(
      typeof entry.reason === "string" && entry.reason.trim().length > 0,
      `${route}:${placementId}: missing review reason`,
    );
    assert(
      entry.scope === "content" || entry.scope === "chrome",
      `${route}:${placementId}: invalid review scope`,
    );
    assertExactKeys(
      entry.translations,
      RW02_ROUTE_CLIENT_LOCALES,
      `${route}:${placementId}:translations`,
    );
    entriesById.set(placementId, entry);
  }

  const messagesByLocale = Object.fromEntries(
    RW02_ROUTE_CLIENT_LOCALES.map((locale) => [locale, {}]),
  );
  const provenanceByLocale = Object.fromEntries(
    RW02_ROUTE_CLIENT_LOCALES.map((locale) => [locale, {}]),
  );
  const claimedPlacements = new Set();

  for (const [field, binding] of Object.entries(routeBindings)) {
    const label = `${route}:${field}`;
    validateBinding(binding, label);
    assert(
      !claimedPlacements.has(binding.placementId),
      `${label}: placement is bound more than once`,
    );
    claimedPlacements.add(binding.placementId);

    const entry = entriesById.get(binding.placementId);
    assert(entry, `${label}: reviewed placement is missing`);
    assert(entry.sourceText === binding.sourceText, `${label}: source changed`);
    assert(
      entry.reviewedSourceHash === binding.reviewedSourceHash,
      `${label}: source hash changed`,
    );

    for (const locale of RW02_ROUTE_CLIENT_LOCALES) {
      const translation = entry.translations[locale];
      validateTranslation(binding.sourceText, translation, `${label}:${locale}`);
      messagesByLocale[locale][field] = translation;
      provenanceByLocale[locale][field] = {
        placementId: binding.placementId,
        reviewedSourceHash: binding.reviewedSourceHash,
      };
    }
  }

  assert(
    claimedPlacements.size === entriesById.size,
    `${route}: unbound reviewed placements remain`,
  );

  return { messagesByLocale, provenanceByLocale };
}

export async function buildRw02RouteClientArtifacts() {
  const bindings = await readJson(bindingsPath);
  assert(bindings.schemaVersion === 1, "Unsupported R-W02 client binding schema");
  assertExactKeys(
    bindings.routes,
    RW02_ROUTE_CLIENT_ROUTES,
    "R-W02 client routes",
  );
  await auditCurrentClientSource(bindings);

  const artifacts = new Map();
  const publication = {
    schemaVersion: 1,
    reviewedCells: 0,
    unresolvedCells: 0,
    routes: {},
  };
  const provenance = { schemaVersion: 1, routes: {} };

  for (const route of RW02_ROUTE_CLIENT_ROUTES) {
    const { messagesByLocale, provenanceByLocale } = await buildRoute(
      route,
      bindings.routes[route],
    );
    const slug = routeSlug(route);
    const messagesPerLocale = EXPECTED_MESSAGES[route];
    const localePublication = {};

    for (const locale of RW02_ROUTE_CLIENT_LOCALES) {
      const relativePath = `messages/${slug}/${locale}.json`;
      const source = stableJson(messagesByLocale[locale]);
      artifacts.set(relativePath, source);
      localePublication[locale] = {
        path: relativePath,
        publishable: true,
        resolvedMessages: messagesPerLocale,
        sha256: sha256(source),
      };
    }

    const reviewedCells = messagesPerLocale * RW02_ROUTE_CLIENT_LOCALES.length;
    publication.reviewedCells += reviewedCells;
    publication.routes[route] = {
      locales: localePublication,
      messagesPerLocale,
      reviewedCells,
    };
    provenance.routes[route] = { locales: provenanceByLocale };
  }

  assert(
    publication.reviewedCells === 115,
    `R-W02 client expected 115 reviewed cells, found ${publication.reviewedCells}`,
  );

  artifacts.set("publication.json", stableJson(publication));
  artifacts.set("provenance.json", stableJson(provenance));
  artifacts.set("unresolved.json", stableJson([]));
  return artifacts;
}

async function listGeneratedFiles(root, current = root) {
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
    if (entry.isDirectory()) files.push(...(await listGeneratedFiles(root, path)));
    else files.push(relative(root, path));
  }
  return files;
}

export async function writeRw02RouteClientArtifacts() {
  const artifacts = await buildRw02RouteClientArtifacts();
  await rm(join(outputRoot, "messages"), { recursive: true, force: true });
  for (const [relativePath, source] of artifacts) {
    const path = join(outputRoot, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, source, "utf8");
  }
  return artifacts;
}

export async function checkRw02RouteClientArtifacts() {
  const artifacts = await buildRw02RouteClientArtifacts();
  const stale = [];
  for (const [relativePath, expected] of artifacts) {
    try {
      const actual = await readFile(join(outputRoot, relativePath), "utf8");
      if (actual !== expected) stale.push(relativePath);
    } catch (error) {
      if (error.code === "ENOENT") stale.push(relativePath);
      else throw error;
    }
  }

  const expectedPaths = new Set(artifacts.keys());
  const generatedFiles = [
    ...(await listGeneratedFiles(join(outputRoot, "messages"))),
  ].map((path) => `messages/${path}`);
  for (const path of generatedFiles) {
    if (!expectedPaths.has(path)) stale.push(path);
  }
  return [...new Set(stale)].sort(compareText);
}

async function main() {
  if (process.argv.includes("--check")) {
    const stale = await checkRw02RouteClientArtifacts();
    if (stale.length) {
      throw new Error(`Stale R-W02 route-client artifacts: ${stale.join(", ")}`);
    }
    console.log(JSON.stringify({ checked: 13, stale, mode: "check" }));
    return;
  }

  const artifacts = await writeRw02RouteClientArtifacts();
  console.log(
    JSON.stringify({ written: artifacts.size, unresolved: 0, mode: "write" }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
