import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ABOUT_LOCALES,
  buildAboutContentArtifacts,
  checkAboutContentArtifacts,
} from "../i18n/bespoke/compile-about-content.mjs";

const contentRoot = new URL("../../src/i18n/content/bespoke/about/", import.meta.url);

function shapeOf(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shapeOf(child)]),
    );
  }
  return typeof value;
}

function leavesOf(value) {
  if (!value || typeof value !== "object") return [value];
  return Object.values(value).flatMap(leavesOf);
}

test("compiles complete about content deterministically", async () => {
  const first = await buildAboutContentArtifacts();
  const second = await buildAboutContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.equal(first.outputs.size, 8);
  assert.equal(first.publication.expectedMessages, 31);
  assert.deepEqual(Object.keys(first.publication.locales), ABOUT_LOCALES);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const locale of ABOUT_LOCALES) {
    const coverage = first.publication.locales[locale];
    assert.equal(coverage.catalogMessages, locale === "ja-jp" ? 27 : 29);
    assert.equal(coverage.overrideMessages, 2);
    assert.equal(coverage.reviewedReplacementMessages, locale === "ja-jp" ? 2 : 0);
    assert.equal(coverage.resolvedMessages, 31);
    assert.equal(coverage.publishable, true);
    assert.match(coverage.sha256, /^[0-9a-f]{64}$/);
  }
});

test("keeps all localized bundles aligned with the canonical English shape", async () => {
  const source = JSON.parse(await readFile(new URL("source.json", contentRoot), "utf8"));
  const build = await buildAboutContentArtifacts();

  assert.equal(leavesOf(source).length, 31);
  for (const locale of ABOUT_LOCALES) {
    const localized = JSON.parse(build.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(shapeOf(localized), shapeOf(source));
    assert.equal(leavesOf(localized).length, 31);
    assert.ok(leavesOf(localized).every((value) => typeof value === "string" && value.trim()));
  }
});

test("reconstructs the linked technique sentence from one approved catalog translation", async () => {
  const sourceText = "This site provides simple, guided breathing sessions (box breathing, 4-7-8, coherent breathing for HRV, and the physiological sigh) plus short guides explaining when to use each technique.";
  const build = await buildAboutContentArtifacts();

  for (const locale of ABOUT_LOCALES) {
    const catalog = JSON.parse(await readFile(
      new URL(`../../../catalog/${locale}/pages/about.json`, contentRoot),
      "utf8",
    ));
    const approved = catalog.segments.find((segment) =>
      segment.sourceText === sourceText
        && segment.translation?.isApproved === true
        && segment.translation?.needsReview === false
    ).translation.text;
    const localized = JSON.parse(build.outputs.get(`messages/${locale}.json`));
    const rich = localized.sections.whatThisIs;
    assert.equal(`${rich.beforeLink}${rich.linkLabel}${rich.afterLink}`, approved);
  }
});

test("records catalog provenance separately from reviewed overrides and replacements", async () => {
  const build = await buildAboutContentArtifacts();
  const [overrides, replacements] = await Promise.all([
    readFile(new URL("overrides.json", contentRoot), "utf8").then(JSON.parse),
    readFile(new URL("reviewed-replacements.json", contentRoot), "utf8").then(JSON.parse),
  ]);

  assert.deepEqual(
    overrides.overrides.map(({ messagePath }) => messagePath),
    ["sections.editorial.title", "sections.editorial.linkLabel"],
  );
  for (const override of overrides.overrides) {
    assert.deepEqual(Object.keys(override.translations).sort(), [...ABOUT_LOCALES].sort());
    assert.match(override.reviewedSourceHash, /^[0-9a-f]{64}$/);
  }
  assert.deepEqual(
    replacements.replacements.map(({ messagePath }) => messagePath),
    ["sections.whoBuilt.title", "sections.whoBuilt.afterLink"],
  );

  for (const locale of ABOUT_LOCALES) {
    const provenance = build.provenance.locales[locale];
    assert.equal(Object.keys(provenance).length, 31);
    assert.equal(provenance["sections.editorial.title"].status, "repo-reviewed-override");
    assert.equal(provenance["sections.editorial.linkLabel"].status, "repo-reviewed-override");
    if (locale === "ja-jp") {
      assert.equal(provenance["sections.whoBuilt.title"].status, "repo-reviewed-replacement");
      assert.equal(provenance["sections.whoBuilt.afterLink"].status, "repo-reviewed-replacement");
    } else {
      assert.equal(provenance["sections.whoBuilt.title"].catalogRoute, "/about/editorial-policy");
      assert.equal(provenance["sections.whoBuilt.title"].status, "route-catalog-unique");
    }
  }
});

test("checked-in about artifacts are current and runtime bundles contain no catalog identifiers", async () => {
  assert.deepEqual(await checkAboutContentArtifacts(), { checked: 8, stale: [] });
  const publication = JSON.parse(await readFile(new URL("publication.json", contentRoot), "utf8"));

  for (const locale of ABOUT_LOCALES) {
    const raw = await readFile(new URL(publication.locales[locale].path, contentRoot), "utf8");
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }
});

test("about loader is server-only, literal, and fail-closed", async () => {
  const loader = await readFile(
    new URL("server/load-about-content.ts", contentRoot),
    "utf8",
  );

  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /!localeCoverage\.publishable/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("about renderer keeps typed slots, localized metadata, and fail-closed links on the server", async () => {
  const [page, renderer, source] = await Promise.all([
    readFile(new URL("../../src/app/(site-en)/about/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/app/(site-en)/about/about-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("source.json", contentRoot), "utf8"),
  ]);

  assert.doesNotMatch(page, /export function AboutPage|export function createAboutMetadataFromContent/);
  assert.match(page, /export const metadata/);
  assert.match(renderer, /export function AboutPage/);
  assert.match(renderer, /export function createAboutMetadataFromContent/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /content\.sections\.whatThisIs\.beforeLink/);
  assert.match(renderer, /content\.sections\.whatThisIs\.linkLabel/);
  assert.match(renderer, /content\.sections\.whatThisIs\.afterLink/);
  assert.doesNotMatch(renderer, /dangerouslySetInnerHTML|use client/);

  const english = JSON.parse(source);
  assert.equal(
    `${english.sections.whatThisIs.beforeLink}${english.sections.whatThisIs.linkLabel}${english.sections.whatThisIs.afterLink}`,
    "This site provides simple, guided breathing sessions (box breathing, 4-7-8, coherent breathing for HRV, and the physiological sigh) plus short guides explaining when to use each technique.",
  );
});
