import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  TIMER_LOCALES,
  buildTimerContentArtifacts,
  checkTimerContentArtifacts,
} from "../i18n/bespoke/compile-timer-content.mjs";

const contentRoot = new URL(
  "../../src/i18n/content/bespoke/timer-4-7-8/",
  import.meta.url,
);

test("compiles complete timer content deterministically", async () => {
  const first = await buildTimerContentArtifacts();
  const second = await buildTimerContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.equal(first.outputs.size, 8);
  assert.equal(first.publication.expectedMessages, 176);
  assert.deepEqual(Object.keys(first.publication.locales), TIMER_LOCALES);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const locale of TIMER_LOCALES) {
    const coverage = first.publication.locales[locale];
    assert.equal(coverage.resolvedMessages, 176);
    assert.equal(coverage.publishable, true);
    assert.equal(coverage.unresolved, 0);
    assert.equal(
      coverage.catalogExact
        + coverage.catalogNormalized
        + coverage.override
        + coverage.replacement,
      176,
    );
    assert.match(coverage.sha256, /^[0-9a-f]{64}$/);
  }
});

test("keeps every locale aligned with the canonical English message IDs", async () => {
  const source = JSON.parse(await readFile(new URL("source.json", contentRoot), "utf8"));
  const build = await buildTimerContentArtifacts();
  const sourceKeys = Object.keys(source).sort();

  assert.equal(sourceKeys.length, 176);
  for (const locale of TIMER_LOCALES) {
    const messages = JSON.parse(build.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(Object.keys(messages).sort(), sourceKeys);
    assert.ok(Object.values(messages).every(
      (value) => typeof value === "string" && value.trim(),
    ));
  }
});

test("records catalog, gap, and fidelity-replacement provenance separately", async () => {
  const build = await buildTimerContentArtifacts();
  const [overrides, replacements] = await Promise.all([
    readFile(new URL("overrides.json", contentRoot), "utf8").then(JSON.parse),
    readFile(new URL("reviewed-replacements.json", contentRoot), "utf8").then(JSON.parse),
  ]);

  assert.ok(overrides.overrides.length > 0);
  assert.ok(replacements.replacements.length > 0);
  for (const record of [...overrides.overrides, ...replacements.replacements]) {
    assert.match(record.reviewedSourceHash, /^[0-9a-f]{64}$/);
    assert.ok(record.reason);
    assert.ok(Object.keys(record.translations).length > 0);
  }

  for (const locale of TIMER_LOCALES) {
    const statuses = Object.values(build.provenance.locales[locale]).map(
      ({ status }) => status,
    );
    assert.ok(statuses.some((status) => status.startsWith("route-catalog")));
    assert.ok(statuses.includes("repo-reviewed-override"));
  }
});

test("checked-in timer artifacts are current and contain no catalog identifiers", async () => {
  assert.deepEqual(await checkTimerContentArtifacts(), { checked: 8, stale: [] });
  const publication = JSON.parse(await readFile(new URL("publication.json", contentRoot), "utf8"));

  for (const locale of TIMER_LOCALES) {
    const raw = await readFile(new URL(publication.locales[locale].path, contentRoot), "utf8");
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }
});

test("timer loader is server-only, literal, and fails closed", async () => {
  const loader = await readFile(
    new URL("server/load-timer-content.ts", contentRoot),
    "utf8",
  );

  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /!localeCoverage\.publishable/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("timer renderer keeps long-form copy and structured data on the server", async () => {
  const [page, renderer, localizedPage] = await Promise.all([
    readFile(
      new URL("../../src/app/(site-en)/4-7-8-breathing-timer/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../src/app/(site-en)/4-7-8-breathing-timer/timer-page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../src/app/(site-localized)/[locale]/4-7-8-breathing-timer/page.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(page, /createTimerMetadataFromContent/);
  assert.match(renderer, /export function TimerPage/);
  assert.match(renderer, /export function createTimerMetadataFromContent/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /content\[messageId\]/);
  assert.match(renderer, /faqItems\.map/);
  assert.match(renderer, /locale=\{renderContext\?\.locale\}/);
  assert.doesNotMatch(renderer, /use client|dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /Fall Asleep in 2 Minutes|natural tranquilizer/);

  assert.match(localizedPage, /loadTimerContent/);
  assert.match(localizedPage, /createTimerMetadataFromContent/);
  assert.match(localizedPage, /isNativeRoutePreviewable/);
  assert.match(localizedPage, /buildHreflangAlternates/);
});
