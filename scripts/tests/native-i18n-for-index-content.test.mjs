import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildAudit } from "../i18n/audit-structured-i18n-mapping.mjs";
import {
  FOR_INDEX_LOCALES,
  buildForIndexContentArtifacts,
  checkForIndexContentArtifacts,
} from "../i18n/bespoke/compile-for-index-content.mjs";

const contentRoot = new URL(
  "../../src/i18n/content/bespoke/for-index/",
  import.meta.url,
);

const EXPECTED_SLUGS = [
  "public-speaking",
  "high-blood-pressure",
  "sleep",
  "running",
  "anxiety",
  "panic-attacks",
  "focus",
  "meditation",
  "athletes",
  "pregnancy",
  "holiday-stress",
  "travel-anxiety",
  "huberman",
  "stress",
  "kids",
  "pranayama",
  "singing",
  "lung-capacity",
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

test("compiles the 50-field for index deterministically", async () => {
  const first = await buildForIndexContentArtifacts();
  const second = await buildForIndexContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.equal(first.outputs.size, 8);
  assert.equal(first.publication.expectedMessages, 50);
  assert.deepEqual(Object.keys(first.publication.locales), FOR_INDEX_LOCALES);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const locale of FOR_INDEX_LOCALES) {
    const coverage = first.publication.locales[locale];
    assert.equal(coverage.catalogExact, 45);
    assert.equal(coverage.catalogNormalized, 0);
    assert.equal(coverage.override, 5);
    assert.equal(coverage.replacement, 0);
    assert.equal(coverage.resolvedMessages, 50);
    assert.equal(coverage.publishable, true);
    assert.equal(coverage.unresolved, 0);
    assert.match(coverage.sha256, /^[a-f0-9]{64}$/);
  }
});

test("keeps five values-only bundles aligned with the English source shape", async () => {
  const source = JSON.parse(
    await readFile(new URL("source.json", contentRoot), "utf8"),
  );
  const build = await buildForIndexContentArtifacts();

  assert.equal(stringLeaves(source).length, 50);
  assert.deepEqual(Object.keys(source.cards), EXPECTED_SLUGS);
  for (const locale of FOR_INDEX_LOCALES) {
    const localized = JSON.parse(build.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(shapeOf(localized), shapeOf(source));
    assert.equal(stringLeaves(localized).length, 50);
    assert.ok(stringLeaves(localized).every((value) => value.trim()));
  }
});

test("pins hub cards to the current English use-case titles and subtitles", async () => {
  const [source, audit] = await Promise.all([
    readFile(new URL("source.json", contentRoot), "utf8").then(JSON.parse),
    buildAudit(),
  ]);

  for (const slug of EXPECTED_SLUGS) {
    const page = audit.pages.find(({ route }) => route === `/for/${slug}`);
    assert.ok(page, `missing structured source for ${slug}`);
    const byPath = new Map(
      page.leaves.map((leaf) => [leaf.path, leaf.sourceText]),
    );
    assert.equal(
      source.cards[slug].title,
      byPath.get("hero.title"),
      `${slug} title drift`,
    );
    assert.equal(
      source.cards[slug].subtitle,
      byPath.get("hero.subtitle"),
      `${slug} subtitle drift`,
    );
  }
});

test("uses current reviewed source instead of stale hub title and card claims", async () => {
  const build = await buildForIndexContentArtifacts();
  const es = JSON.parse(build.outputs.get("messages/es-es.json"));
  const catalog = JSON.parse(
    await readFile(
      new URL("../../../catalog/es-es/pages/for.json", contentRoot),
      "utf8",
    ),
  );
  const staleTitle = catalog.segments.find(
    ({ occurrenceKey }) => occurrenceKey === "head:title",
  );
  const staleBloodPressure = catalog.segments.find(
    ({ occurrenceKey }) => occurrenceKey === "sel:p.mt-2.text-sm:ctx:p:pos:1",
  );
  const staleKidsTitle = catalog.segments.find(
    ({ occurrenceKey }) =>
      occurrenceKey === "sel:h2.mt-3.text-2xl:ctx:heading:pos:14",
  );

  assert.match(staleTitle.sourceText, /Panic, Focus & Performance/);
  assert.match(
    staleBloodPressure.sourceText,
    /reduce systolic pressure by up to 10 points/,
  );
  assert.equal(staleKidsTitle.sourceText, "Breathing Exercises for Kids");
  assert.doesNotMatch(es.metadata.title, /pánico|rendimiento/i);
  assert.doesNotMatch(es.cards["high-blood-pressure"].subtitle, /10/);
  assert.match(es.cards.kids.title, /profunda/);
});

test("keeps generated artifacts current and runtime bundles provenance-free", async () => {
  assert.deepEqual(await checkForIndexContentArtifacts(), {
    checked: 8,
    stale: [],
  });
  const publication = JSON.parse(
    await readFile(new URL("publication.json", contentRoot), "utf8"),
  );

  for (const locale of FOR_INDEX_LOCALES) {
    const raw = await readFile(
      new URL(publication.locales[locale].path, contentRoot),
      "utf8",
    );
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }
});

test("for index loader is literal, server-only, and fail-closed", async () => {
  const loader = await readFile(
    new URL("server/load-for-index-content.ts", contentRoot),
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
      new URL("../../src/app/(site-en)/for/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-en)/for/for-index-page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(page, /createForIndexMetadataFromContent/);
  assert.match(page, /<ForIndexPage content=\{content\}/);
  assert.doesNotMatch(page, /useCasePages/);
  assert.match(renderer, /export function ForIndexPage/);
  assert.match(renderer, /export function createForIndexMetadataFromContent/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /content\.cards\[slug\]/);
  assert.match(renderer, /content\.cardAction/);
  assert.equal((renderer.match(/^  "[^"]+",$/gm) ?? []).length, 18);
  assert.doesNotMatch(renderer, /use client|dangerouslySetInnerHTML/);
});
