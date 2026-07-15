import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildAudit } from "../i18n/audit-structured-i18n-mapping.mjs";
import {
  BREATHE_INDEX_LOCALES,
  buildBreatheIndexContentArtifacts,
  checkBreatheIndexContentArtifacts,
} from "../i18n/bespoke/compile-breathe-index-content.mjs";

const contentRoot = new URL(
  "../../src/i18n/content/bespoke/breathe-index/",
  import.meta.url,
);

const EXPECTED_SLUGS = [
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

function shapeOf(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shapeOf(child)]),
    );
  }
  return typeof value;
}

function stringLeaves(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringLeaves);
}

test("compiles the 42-field breathe index deterministically", async () => {
  const first = await buildBreatheIndexContentArtifacts();
  const second = await buildBreatheIndexContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.equal(first.outputs.size, 8);
  assert.equal(first.publication.expectedMessages, 42);
  assert.deepEqual(Object.keys(first.publication.locales), BREATHE_INDEX_LOCALES);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const locale of BREATHE_INDEX_LOCALES) {
    const coverage = first.publication.locales[locale];
    assert.equal(coverage.catalogExact, 38);
    assert.equal(coverage.catalogNormalized, 3);
    assert.equal(coverage.override, 1);
    assert.equal(coverage.replacement, 0);
    assert.equal(coverage.resolvedMessages, 42);
    assert.equal(coverage.publishable, true);
    assert.equal(coverage.unresolved, 0);
    assert.match(coverage.sha256, /^[a-f0-9]{64}$/);
  }
});

test("keeps five values-only bundles aligned with the English source shape", async () => {
  const source = JSON.parse(await readFile(new URL("source.json", contentRoot), "utf8"));
  const build = await buildBreatheIndexContentArtifacts();

  assert.equal(stringLeaves(source).length, 42);
  assert.deepEqual(Object.keys(source.cards), EXPECTED_SLUGS);
  for (const locale of BREATHE_INDEX_LOCALES) {
    const localized = JSON.parse(build.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(shapeOf(localized), shapeOf(source));
    assert.equal(stringLeaves(localized).length, 42);
    assert.ok(stringLeaves(localized).every((value) => value.trim()));
  }
});

test("pins hub cards to the current English structured page titles and subtitles", async () => {
  const [source, audit] = await Promise.all([
    readFile(new URL("source.json", contentRoot), "utf8").then(JSON.parse),
    buildAudit(),
  ]);

  for (const slug of EXPECTED_SLUGS) {
    const page = audit.pages.find(({ route }) => route === `/breathe/${slug}`);
    assert.ok(page, `missing structured source for ${slug}`);
    const byPath = new Map(page.leaves.map((leaf) => [leaf.path, leaf.sourceText]));
    assert.equal(source.cards[slug].title, byPath.get("hero.title"), `${slug} title drift`);
    assert.equal(source.cards[slug].subtitle, byPath.get("hero.subtitle"), `${slug} subtitle drift`);
  }
});

test("uses exact route occurrences for metadata and preserved card placements", async () => {
  const build = await buildBreatheIndexContentArtifacts();
  const es = JSON.parse(build.outputs.get("messages/es-es.json"));
  const catalog = JSON.parse(await readFile(
    new URL("../../../catalog/es-es/pages/breathe.json", contentRoot),
    "utf8",
  ));
  const byOccurrence = new Map(
    catalog.segments.map((segment) => [segment.occurrenceKey, segment.translation.text]),
  );

  assert.equal(es.metadata.title, byOccurrence.get("head:title"));
  assert.equal(es.metadata.socialTitle, byOccurrence.get("head:meta:property:og:title"));
  assert.equal(es.cards.box.title, byOccurrence.get("sel:h2.mt-3.text-2xl:ctx:heading:pos:0"));
  assert.equal(
    es.cards["9d-breathwork"].subtitle,
    byOccurrence.get("sel:p.mt-2.text-sm:ctx:p:pos:12"),
    "strict parity retains the cataloged 9D card placement without copy improvement",
  );
});

test("keeps generated artifacts current and runtime bundles provenance-free", async () => {
  assert.deepEqual(await checkBreatheIndexContentArtifacts(), { checked: 8, stale: [] });
  const publication = JSON.parse(await readFile(new URL("publication.json", contentRoot), "utf8"));

  for (const locale of BREATHE_INDEX_LOCALES) {
    const raw = await readFile(new URL(publication.locales[locale].path, contentRoot), "utf8");
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }
});

test("breathe index loader is literal, server-only, and fail-closed", async () => {
  const loader = await readFile(
    new URL("server/load-breathe-index-content.ts", contentRoot),
    "utf8",
  );

  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /!localeCoverage\.publishable/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("shared renderer preserves structural slugs and keeps localization on the server", async () => {
  const [page, renderer] = await Promise.all([
    readFile(
      new URL("../../src/app/(site-en)/breathe/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../src/app/(site-en)/breathe/breathe-index-page.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(page, /createBreatheIndexMetadataFromContent/);
  assert.match(page, /<BreatheIndexPage content=\{content\}/);
  assert.doesNotMatch(page, /breathingPages/);
  assert.match(renderer, /export function BreatheIndexPage/);
  assert.match(renderer, /export function createBreatheIndexMetadataFromContent/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /content\.cards\[slug\]/);
  assert.match(renderer, /content\.cardAction/);
  assert.equal((renderer.match(/^  "[^"]+",$/gm) ?? []).length, 14);
  assert.doesNotMatch(renderer, /use client|dangerouslySetInnerHTML/);
});
