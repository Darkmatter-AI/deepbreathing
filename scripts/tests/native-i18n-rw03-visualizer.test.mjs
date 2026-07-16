import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BREATHING_VISUALIZER_LOCALES,
  buildBreathingVisualizerArtifacts,
  checkBreathingVisualizerArtifacts,
} from "../i18n/bespoke/compile-breathing-visualizer-content.mjs";

const repoRoot = new URL("../../", import.meta.url);
const contentRoot = new URL(
  "../../src/i18n/content/bespoke/breathing-visualizer/",
  import.meta.url,
);

const expectedLocales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const expectedTechniqueSlugs = [
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
const forbiddenRuntimeFields =
  /catalog|placement|messageId|reason|reviewedSourceHash|sourceHash|sourceText/i;

async function read(relativePath) {
  return readFile(new URL(relativePath, repoRoot), "utf8");
}

function stringLeaves(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringLeaves);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringLeaves);
  }
  return [];
}

test("R-W03 visualizer compiler owns five locales and emits complete value-only bundles", async () => {
  assert.deepEqual(BREATHING_VISUALIZER_LOCALES, expectedLocales);

  const first = await buildBreathingVisualizerArtifacts();
  const second = await buildBreathingVisualizerArtifacts();
  assert.deepEqual([...second], [...first]);

  const source = JSON.parse(await readFile(new URL("source.json", contentRoot), "utf8"));
  const publication = JSON.parse(first.get("publication.json"));
  const unresolved = JSON.parse(first.get("unresolved.json"));
  const staleCatalogOnly = JSON.parse(first.get("stale-catalog-only.json"));

  assert.deepEqual(Object.keys(source.techniques.items), expectedTechniqueSlugs);
  assert.match(source.techniques.title, /10/);
  assert.equal(source.benefits.items.length, 6);
  assert.equal(source.howItWorks.steps.length, 3);
  assert.equal(source.faq.items.length, 6);
  assert.equal(source.moreTools.links.length, 4);
  assert.equal(source.footer.links.length, 7);
  assert.equal(publication.route, "/breathing-visualizer");
  assert.equal(publication.routeClientReviewedCells, 60);
  assert.equal(publication.routeClientMessagesPerLocale, 12);
  assert.equal(publication.staleCatalogOnlyCells, 5);
  assert.equal(publication.unresolvedCells, 0);
  assert.deepEqual(unresolved, []);
  assert.equal(staleCatalogOnly.length, 1);
  assert.equal(staleCatalogOnly[0].cells, 5);
  assert.equal(
    staleCatalogOnly[0].sourceText,
    "Application error: a client-side exception has occurred (see the browser console for more information).",
  );

  for (const locale of expectedLocales) {
    const contentRaw = first.get(`messages/${locale}.json`);
    const clientRaw = first.get(`route-client/messages/${locale}.json`);
    assert.ok(contentRaw, `missing ${locale} content`);
    assert.ok(clientRaw, `missing ${locale} client messages`);
    assert.doesNotMatch(contentRaw, forbiddenRuntimeFields);
    assert.doesNotMatch(clientRaw, forbiddenRuntimeFields);

    const content = JSON.parse(contentRaw);
    const routeClientMessages = JSON.parse(clientRaw);
    assert.deepEqual(Object.keys(content).sort(), Object.keys(source).sort());
    assert.deepEqual(
      Object.keys(content.techniques.items).sort(),
      [...expectedTechniqueSlugs].sort(),
    );
    assert.ok(stringLeaves(content).every((value) => value.length > 0));
    assert.equal(
      stringLeaves(content).includes(staleCatalogOnly[0].sourceText),
      false,
    );
    assert.equal(Object.keys(routeClientMessages).length, 12);
    assert.ok(
      Object.values(routeClientMessages).every(
        (value) => typeof value === "string" && value.length > 0,
      ),
    );
    assert.equal(
      Object.values(routeClientMessages).includes(staleCatalogOnly[0].sourceText),
      false,
    );
    assert.equal(publication.locales[locale].publishable, true);
    assert.match(publication.locales[locale].contentSha256, /^[0-9a-f]{64}$/);
    assert.match(
      publication.locales[locale].routeClientSha256,
      /^[0-9a-f]{64}$/,
    );
  }
});

test("R-W03 visualizer provenance keeps all 60 client cells placement-bound", async () => {
  const artifacts = await buildBreathingVisualizerArtifacts();
  const provenance = JSON.parse(artifacts.get("provenance.json"));

  for (const locale of expectedLocales) {
    const records = provenance.routeClient.locales[locale];
    assert.equal(Object.keys(records).length, 12);
    for (const record of Object.values(records)) {
      assert.match(record.placementId, /^[0-9a-f-]{36}$/);
      assert.match(record.reviewedSourceHash, /^[0-9a-f]{64}$/);
    }
  }
});

test("R-W03 visualizer artifacts are current", async () => {
  assert.deepEqual(await checkBreathingVisualizerArtifacts(), []);
});

test("R-W03 visualizer loader is literal and fail closed", async () => {
  const loader = await read(
    "src/i18n/content/bespoke/breathing-visualizer/server/load-breathing-visualizer-content.ts",
  );

  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
  assert.equal(
    (loader.match(/import\("\.\.\/route-client\/messages\//g) ?? []).length,
    5,
  );
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("R-W03 visualizer renderer preserves structure, schemas, links, and explicit client props", async () => {
  const [page, renderer, island] = await Promise.all([
    read("src/app/(site-en)/breathing-visualizer/page.tsx"),
    read("src/app/(site-en)/breathing-visualizer/visualizer-page.tsx"),
    read("src/app/(site-en)/breathing-visualizer/visualizer-resonance.tsx"),
  ]);

  assert.match(page, /source\.json/);
  assert.match(page, /BreathingVisualizerPage/);
  assert.doesNotMatch(page, /<main|<section|<footer/);

  assert.match(renderer, /createBreathingVisualizerMetadataFromContent/);
  assert.match(renderer, /BreadcrumbList/);
  assert.match(renderer, /FAQPage/);
  assert.match(renderer, /HowTo/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /VISUALIZER_TECHNIQUE_SLUGS\.map/);
  assert.match(renderer, /content\.techniques\.items\[slug\]/);
  assert.match(renderer, /modeDisplayName=\{content\.runtime\.modeDisplayName\}/);
  assert.match(renderer, /routeClientMessages=\{routeClientMessages\}/);
  assert.match(renderer, /locale=\{locale\}/);
  assert.match(renderer, /localizedRoutePaths=\{localizedRoutePaths\}/);
  assert.match(renderer, /import \{ Suspense \} from ["']react["']/);
  assert.match(renderer, /<Suspense[\s\S]*?<VisualizerResonance[\s\S]*?<\/Suspense>/);
  assert.match(renderer, /fallback=\{<div[^>]*min-h-screen[^>]*aria-hidden/);
  assert.doesNotMatch(renderer, /dangerouslySetInnerHTML|["']use client["']/);

  assert.equal(island.startsWith('"use client";'), true);
  assert.match(island, /import Resonance from ["']@\/components\/resonance\/Resonance["']/);
  assert.doesNotMatch(island, /ssr:\s*false|next\/dynamic/);
  assert.match(island, /defaultMode=\{ModeName\.Box\}/);
  assert.match(island, /routeClientMessages=\{routeClientMessages\}/);
});
