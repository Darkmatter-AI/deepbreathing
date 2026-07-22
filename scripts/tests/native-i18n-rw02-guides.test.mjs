import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  RESONANCE_GUIDE_LOCALES,
  RESONANCE_GUIDE_ROUTES,
  buildResonanceGuideContentArtifacts,
  checkResonanceGuideContentArtifacts,
} from "../i18n/bespoke/compile-resonance-guide-content.mjs";

const contentRoot = new URL(
  "../../src/i18n/content/bespoke/resonance-guides/",
  import.meta.url,
);
const rendererPath = new URL(
  "../../src/app/(site-en)/resonance-guide-page.tsx",
  import.meta.url,
);

const expectedRoutes = [
  "box-breathing-before-presentation",
  "breathing-exercises-before-surgery",
  "breathing-exercises-for-labor",
  "physiological-sigh-panic-attack",
];
const expectedLocales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];

function leavesOf(value) {
  if (!value || typeof value !== "object") return [value];
  return Object.values(value).flatMap(leavesOf);
}

test("R-W02 guide compiler owns the four assigned routes and five locales", () => {
  assert.deepEqual(RESONANCE_GUIDE_ROUTES, expectedRoutes);
  assert.deepEqual(RESONANCE_GUIDE_LOCALES, expectedLocales);
});

test("R-W02 guide bundles compile completely and deterministically", async () => {
  const first = await buildResonanceGuideContentArtifacts();
  const second = await buildResonanceGuideContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const route of expectedRoutes) {
    const source = JSON.parse(
      await readFile(new URL(`source/${route}.json`, contentRoot), "utf8"),
    );
    assert.doesNotMatch(
      JSON.stringify(source),
      /(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/,
    );
    for (const locale of expectedLocales) {
      const messages = JSON.parse(
        first.outputs.get(`messages/${locale}/${route}.json`),
      );
      assert.deepEqual(
        Object.keys(messages).sort(),
        Object.keys(source).sort(),
        `${locale}:${route}`,
      );
      assert.ok(leavesOf(messages).every((leaf) => typeof leaf === "string"));
      assert.doesNotMatch(
        JSON.stringify(messages),
        /(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/,
      );
      assert.equal(first.publication.coverage[route][locale].publishable, true);
      assert.match(
        first.publication.coverage[route][locale].sha256,
        /^[0-9a-f]{64}$/,
      );
    }
  }
});

test("checked-in R-W02 guide artifacts are current and value-only", async () => {
  const check = await checkResonanceGuideContentArtifacts();
  assert.deepEqual(check.stale, []);

  const publication = JSON.parse(
    await readFile(new URL("publication.json", contentRoot), "utf8"),
  );
  for (const routeCoverage of Object.values(publication.coverage)) {
    for (const { path } of Object.values(routeCoverage)) {
      const raw = await readFile(new URL(path, contentRoot), "utf8");
      assert.doesNotMatch(
        raw,
        /catalogSegmentId|occurrenceKey|sourceHash|sourceText|reviewedSourceHash/,
      );
    }
  }
});

test("R-W02 guide compiler accepts the package check flag", () => {
  const compilerPath = fileURLToPath(
    new URL("../i18n/bespoke/compile-resonance-guide-content.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [compilerPath, "--check"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /artifacts are current/);
});

test("R-W02 guide loader and renderer keep server and client boundaries explicit", async () => {
  const [loader, renderer] = await Promise.all([
    readFile(
      new URL("server/load-resonance-guide-content.ts", contentRoot),
      "utf8",
    ),
    readFile(rendererPath, "utf8"),
  ]);

  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);

  assert.match(renderer, /createResonanceGuideMetadataFromContent/);
  assert.match(renderer, /metadataBase:\s*new URL\(siteUrl\)/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /routeClientMessages/);
  assert.match(renderer, /<ResonanceGuideResonance/);
  assert.match(
    renderer,
    /modeDisplayName=\{content\.runtime\.modeDisplayName\}/,
  );
  assert.doesNotMatch(renderer, /(?:sel:|attr:)/);
  assert.doesNotMatch(renderer, /dangerouslySetInnerHTML|["']use client["']/);
});

test("the four English routes are thin source-bound wrappers", async () => {
  for (const route of expectedRoutes) {
    const page = await readFile(
      new URL(`../../src/app/(site-en)/${route}/page.tsx`, import.meta.url),
      "utf8",
    );
    assert.match(page, /source\.json|source\//);
    assert.match(page, /ResonanceGuidePage/);
    assert.match(page, /createResonanceGuideMetadataFromContent/);
    assert.doesNotMatch(page, /<main|<section|<footer/);
  }
});
