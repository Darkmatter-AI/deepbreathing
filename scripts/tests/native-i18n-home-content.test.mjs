import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  HOME_LOCALES,
  buildHomeContentArtifacts,
  checkHomeContentArtifacts,
  normalizeTypography,
} from "../i18n/bespoke/compile-home-content.mjs";

const contentRoot = new URL("../../src/i18n/content/bespoke/home/", import.meta.url);

function shapeOf(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shapeOf(child)]),
    );
  }
  if (Array.isArray(value)) return value.map(shapeOf);
  return typeof value;
}

function translatablePaths(bindings) {
  return bindings.bindings.map(({ messagePath }) => messagePath).sort();
}

test("compiles home content deterministically with catalog-backed coverage", async () => {
  const first = await buildHomeContentArtifacts();
  const second = await buildHomeContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.equal(first.outputs.size, 8);
  assert.equal(first.publication.expectedMessages, 159);
  assert.deepEqual(Object.keys(first.publication.locales), HOME_LOCALES);
  const expectedReplacementCounts = {
    "de-de": 5,
    "es-es": 13,
    "fr-fr": 4,
    "ja-jp": 7,
    "pt-br": 6,
  };

  for (const locale of HOME_LOCALES) {
    const coverage = first.publication.locales[locale];
    assert.equal(coverage.resolvedMessages, 159);
    assert.equal(coverage.unresolved, 0);
    assert.equal(coverage.publishable, true);
    assert.equal(coverage.catalogExact, 154 - expectedReplacementCounts[locale]);
    assert.equal(coverage.catalogNormalized, 1);
    assert.equal(coverage.overrideMessages, 4);
    assert.equal(coverage.reviewedReplacementMessages, expectedReplacementCounts[locale]);
    assert.match(coverage.sha256, /^[a-f0-9]{64}$/);
  }
});

test("keeps localized bundles aligned with the canonical English shape", async () => {
  const [source, bindings, build] = await Promise.all([
    readFile(new URL("source.json", contentRoot), "utf8").then(JSON.parse),
    readFile(new URL("occurrence-bindings.json", contentRoot), "utf8").then(JSON.parse),
    buildHomeContentArtifacts(),
  ]);

  assert.equal(translatablePaths(bindings).length, 159);
  for (const locale of HOME_LOCALES) {
    const localized = JSON.parse(build.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(shapeOf(localized), shapeOf(source));
    assert.equal(localized.sections.modePicker.featured.box.displaySlug, "/box");
    assert.equal(localized.sections.modePicker.featured.box.slug, "box");
    assert.equal(localized.hero.startButton.color, "#e11d48");
    assert.equal(localized.schema.website["@type"], "WebSite");
    assert.deepEqual(localized.schema.faq, {
      "@context": "https://schema.org",
      "@type": "FAQPage",
    });
  }
});

test("maps metadata title occurrences separately for head and social tags", async () => {
  const build = await buildHomeContentArtifacts();
  const de = JSON.parse(build.outputs.get("messages/de-de.json"));
  const catalog = JSON.parse(await readFile(
    new URL("../../../catalog/de-de/pages/_root.json", contentRoot),
    "utf8",
  ));
  const byOcc = new Map(catalog.segments.map((segment) => [segment.occurrenceKey, segment]));

  assert.notEqual(de.metadata.title, de.metadata.openGraph.title);
  assert.equal(
    de.metadata.title,
    byOcc.get("head:title").translation.text,
  );
  assert.equal(
    de.metadata.openGraph.title,
    byOcc.get("head:meta:property:og:title").translation.text,
  );
  assert.equal(
    de.metadata.twitter.title,
    byOcc.get("head:meta:name:twitter:title").translation.text,
  );
});

test("records provenance separately from unresolved catalog gaps", async () => {
  const build = await buildHomeContentArtifacts();
  const unresolvedPaths = [
    "footer.columns.info.links.embed.label",
    "footer.columns.info.links.my-stats.label",
    "metadata.openGraph.imageAlt",
    "schema.website.description",
  ];

  assert.equal(build.unresolved.unresolved.length, 0);
  for (const locale of HOME_LOCALES) {
    const provenance = build.provenance.locales[locale];
    assert.equal(Object.keys(provenance).length, 159);
    for (const messagePath of unresolvedPaths) {
      assert.equal(provenance[messagePath].status, "repo-reviewed-override");
    }
    assert.equal(
      provenance["sections.modePicker.featured.fourSevenEight.cardTitle"].status,
      "route-catalog-occurrence-exact",
    );
    assert.equal(
      provenance["sections.modePicker.featured.fourSevenEight.pillLabel"].status,
      "route-catalog-occurrence-exact",
    );
    const de = JSON.parse(build.outputs.get("messages/de-de.json"));
    assert.notEqual(
      de.sections.modePicker.featured.fourSevenEight.pillLabel,
      de.sections.modePicker.featured.fourSevenEight.cardTitle,
    );
  }
});

test("applies documented typography normalization for hero start session", () => {
  assert.equal(
    normalizeTypography("Start Session").toLocaleLowerCase("en"),
    normalizeTypography("Start session").toLocaleLowerCase("en"),
  );
});

test("checked-in home artifacts are current and runtime bundles contain no catalog identifiers", async () => {
  assert.deepEqual(await checkHomeContentArtifacts(), { checked: 8, stale: [] });
  const publication = JSON.parse(await readFile(new URL("publication.json", contentRoot), "utf8"));

  for (const locale of HOME_LOCALES) {
    const raw = await readFile(new URL(publication.locales[locale].path, contentRoot), "utf8");
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }
});

test("home loader is server-only, literal, and fail-closed", async () => {
  const loader = await readFile(
    new URL("server/load-home-content.ts", contentRoot),
    "utf8",
  );

  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /!localeCoverage\.publishable/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});
