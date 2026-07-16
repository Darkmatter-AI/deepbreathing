import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentRoot = new URL(
  "../../src/i18n/content/bespoke/holiday-breathing/",
  import.meta.url,
);
const routeRoot = new URL(
  "../../src/app/(site-en)/holiday-breathing-exercises/",
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

test("R-W02 holiday compiler emits five complete deterministic locale bundles", async () => {
  const { HOLIDAY_CONTENT_LOCALES, buildHolidayContentArtifacts } =
    await import("../i18n/bespoke/compile-holiday-content.mjs");
  assert.deepEqual(HOLIDAY_CONTENT_LOCALES, [
    "de-de",
    "es-es",
    "fr-fr",
    "ja-jp",
    "pt-br",
  ]);

  const [first, second] = await Promise.all([
    buildHolidayContentArtifacts(),
    buildHolidayContentArtifacts(),
  ]);
  const source = JSON.parse(
    await readFile(new URL("source.json", contentRoot), "utf8"),
  );
  const expectedMessages = leavesOf(source).length;

  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual(first.unresolved.unresolved, []);
  assert.equal(first.publication.expectedMessages, expectedMessages);

  for (const locale of HOLIDAY_CONTENT_LOCALES) {
    const messages = JSON.parse(first.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(shapeOf(messages), shapeOf(source), locale);
    assert.ok(leavesOf(messages).every((leaf) => typeof leaf === "string"));
    assert.equal(first.publication.locales[locale].publishable, true);
    assert.equal(
      first.publication.locales[locale].resolvedMessages,
      expectedMessages,
    );
    assert.match(first.publication.locales[locale].sha256, /^[0-9a-f]{64}$/);
  }
});

test("R-W02 checked-in artifacts are current and runtime-only", async () => {
  const { HOLIDAY_CONTENT_LOCALES, checkHolidayContentArtifacts } =
    await import("../i18n/bespoke/compile-holiday-content.mjs");
  const check = await checkHolidayContentArtifacts();
  assert.deepEqual(check.stale, []);

  for (const locale of HOLIDAY_CONTENT_LOCALES) {
    const raw = await readFile(
      new URL(`messages/${locale}.json`, contentRoot),
      "utf8",
    );
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }

  const bindings = JSON.parse(
    await readFile(
      new URL("reviewed-source-bindings.json", contentRoot),
      "utf8",
    ),
  );
  assert.equal(bindings.drifts.length, 19);
});

test("R-W02 loader is literal and fails closed on publication count or hash", async () => {
  const loader = await readFile(
    new URL("server/load-holiday-content.ts", contentRoot),
    "utf8",
  );
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
  assert.match(loader, /export async function loadHolidayContent/);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /!.*publishable/);
  assert.match(loader, /resolvedMessages\s*!==\s*coverage\.expectedMessages/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("R-W02 renderer keeps typed rich FAQ links and localized client-island props", async () => {
  const [renderer, page, shareIsland, snowIsland] = await Promise.all([
    readFile(new URL("holiday-breathing-page.tsx", routeRoot), "utf8"),
    readFile(new URL("page.tsx", routeRoot), "utf8"),
    readFile(new URL("share-button.tsx", routeRoot), "utf8"),
    readFile(new URL("snow-background.tsx", routeRoot), "utf8"),
  ]);

  assert.match(renderer, /export function createHolidayMetadataFromContent/);
  assert.match(renderer, /metadataBase: new URL\(baseUrl\)/);
  assert.match(renderer, /export function HolidayBreathingPage/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /answer\.parts/);
  assert.doesNotMatch(
    renderer,
    /includes\(["']The physiological|indexOf\(["']The physiological|dangerouslySetInnerHTML|["']use client["']/,
  );
  assert.match(renderer, /rel=\{[^}]*"nofollow"[^}]*\}/);
  assert.match(renderer, /<HolidayShareButton/);
  assert.match(renderer, /url=/);
  assert.match(renderer, /buttonText=/);
  assert.match(renderer, /text=/);
  assert.match(page, /HolidayBreathingPage/);
  assert.match(page, /createHolidayMetadataFromContent/);
  assert.match(shareIsland, /^["']use client["'];/);
  assert.match(shareIsland, /url: string/);
  assert.match(shareIsland, /buttonText: string/);
  assert.doesNotMatch(shareIsland, /getLocalizedShare/);
  assert.match(snowIsland, /^["']use client["'];/);
  assert.match(snowIsland, /SnowBackground/);
  assert.match(snowIsland, /tone="dark"/);
});
