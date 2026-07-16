import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DURATION_CONTENT_LOCALES,
  DURATION_CONTENT_ROUTES,
  buildDurationContentArtifacts,
  checkDurationContentArtifacts,
} from "../i18n/bespoke/compile-duration-content.mjs";
import {
  INSOMNIA_CONTENT_LOCALES,
  buildInsomniaContentArtifacts,
  checkInsomniaContentArtifacts,
} from "../i18n/bespoke/compile-insomnia-content.mjs";

const durationRoot = new URL(
  "../../src/i18n/content/bespoke/duration-exercises/",
  import.meta.url,
);
const insomniaRoot = new URL(
  "../../src/i18n/content/bespoke/insomnia-4-7-8/",
  import.meta.url,
);

function shapeOf(value) {
  if (Array.isArray(value)) return value.map(shapeOf);
  if (value && typeof value === "object") {
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

test("R-W01 compilers cover the four planned routes and five preserved locales", () => {
  assert.deepEqual(DURATION_CONTENT_ROUTES, [
    "1-minute-breathing-exercise",
    "2-minute-breathing-exercise",
    "5-minute-breathing-exercise",
  ]);
  assert.deepEqual(DURATION_CONTENT_LOCALES, [
    "de-de",
    "es-es",
    "fr-fr",
    "ja-jp",
    "pt-br",
  ]);
  assert.deepEqual(INSOMNIA_CONTENT_LOCALES, DURATION_CONTENT_LOCALES);
});

test("duration exercise bundles compile completely and deterministically", async () => {
  const first = await buildDurationContentArtifacts();
  const second = await buildDurationContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.deepEqual(first.unresolved.unresolved, []);
  assert.equal(first.publication.routes.length, 3);

  for (const route of DURATION_CONTENT_ROUTES) {
    const source = JSON.parse(
      await readFile(new URL(`source/${route}.json`, durationRoot), "utf8"),
    );
    for (const locale of DURATION_CONTENT_LOCALES) {
      const messages = JSON.parse(
        first.outputs.get(`messages/${locale}/${route}.json`),
      );
      assert.deepEqual(shapeOf(messages), shapeOf(source), `${locale}:${route}`);
      assert.ok(leavesOf(messages).every((leaf) => typeof leaf === "string"));
      assert.equal(first.publication.coverage[route][locale].publishable, true);
      assert.match(first.publication.coverage[route][locale].sha256, /^[0-9a-f]{64}$/);
    }
  }
});

test("insomnia bundle compiles completely and deterministically", async () => {
  const first = await buildInsomniaContentArtifacts();
  const second = await buildInsomniaContentArtifacts();
  const source = JSON.parse(await readFile(new URL("source.json", insomniaRoot), "utf8"));

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const locale of INSOMNIA_CONTENT_LOCALES) {
    const messages = JSON.parse(first.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(shapeOf(messages), shapeOf(source), locale);
    assert.ok(leavesOf(messages).every((leaf) => typeof leaf === "string"));
    assert.equal(first.publication.locales[locale].publishable, true);
    assert.match(first.publication.locales[locale].sha256, /^[0-9a-f]{64}$/);
  }
});

test("checked-in R-W01 artifacts are current and runtime bundles contain no catalog identifiers", async () => {
  const [durationCheck, insomniaCheck] = await Promise.all([
    checkDurationContentArtifacts(),
    checkInsomniaContentArtifacts(),
  ]);
  assert.deepEqual(durationCheck.stale, []);
  assert.deepEqual(insomniaCheck.stale, []);

  const durationPublication = JSON.parse(
    await readFile(new URL("publication.json", durationRoot), "utf8"),
  );
  const insomniaPublication = JSON.parse(
    await readFile(new URL("publication.json", insomniaRoot), "utf8"),
  );
  const runtimePaths = [
    ...Object.values(durationPublication.coverage).flatMap((coverage) =>
      Object.values(coverage).map(({ path }) => new URL(path, durationRoot)),
    ),
    ...Object.values(insomniaPublication.locales).map(
      ({ path }) => new URL(path, insomniaRoot),
    ),
  ];

  for (const path of runtimePaths) {
    const raw = await readFile(path, "utf8");
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }
});

test("R-W01 loaders are server-only, literal, and fail closed", async () => {
  const [durationLoader, insomniaLoader] = await Promise.all([
    readFile(new URL("server/load-duration-content.ts", durationRoot), "utf8"),
    readFile(new URL("server/load-insomnia-content.ts", insomniaRoot), "utf8"),
  ]);

  for (const loader of [durationLoader, insomniaLoader]) {
    assert.equal(loader.startsWith('import "server-only";'), true);
    assert.match(loader, /publication\.json/);
    assert.match(loader, /!.*publishable/);
    assert.match(loader, /refusing English fallback/);
    assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
  }
  assert.equal((durationLoader.match(/import\("\.\.\/messages\//g) ?? []).length, 15);
  assert.equal((insomniaLoader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
});

test("R-W01 renderers keep typed content, localized metadata, links, and client boundaries", async () => {
  const [durationRenderer, insomniaRenderer] = await Promise.all([
    readFile(
      new URL(
        "../../src/app/(site-en)/duration-exercise-page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-en)/4-7-8-breathing-for-insomnia/insomnia-page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  for (const renderer of [durationRenderer, insomniaRenderer]) {
    assert.match(renderer, /create.*MetadataFromContent/);
    assert.match(renderer, /resolveNativeInternalHref/);
    assert.doesNotMatch(renderer, /dangerouslySetInnerHTML|["']use client["']/);
  }
  assert.match(durationRenderer, /ShareButton/);
  assert.match(insomniaRenderer, /Resonance/);
});
