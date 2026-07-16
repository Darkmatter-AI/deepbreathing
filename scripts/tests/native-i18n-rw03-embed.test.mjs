import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentRoot = new URL(
  "../../src/i18n/content/bespoke/embed/",
  import.meta.url,
);
const routeRoot = new URL("../../src/app/(site-en)/embed/", import.meta.url);
const localizedPlayer = new URL(
  "../../src/app/(site-localized)/[locale]/embed/[slug]/page.tsx",
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

function stringLeavesOf(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringLeavesOf);
}

test("R-W03 embed generator no longer depends on MassTranslate runtime state", async () => {
  const generator = await readFile(
    new URL("embed-generator.tsx", routeRoot),
    "utf8",
  );

  assert.doesNotMatch(generator, /__MT_CONFIG__|detectLocaleCode/);
  assert.doesNotMatch(generator, /breathingPageMap|BREATHING_PATTERNS/);
  assert.match(generator, /initialLocale/);
  assert.match(generator, /useState<LocaleCode>\(initialLocale\)/);
  assert.match(generator, /<LanguageSwitcherFooter/);
  assert.match(generator, /basePath="\/embed"/);
  assert.match(generator, /locale=\{pageLocale\}/);
});

test("R-W03 embed URL serialization preserves the existing defaults and compact query contract", async () => {
  const generator = await readFile(
    new URL("embed-generator.tsx", routeRoot),
    "utf8",
  );

  assert.match(generator, /useState\(['"]box['"]\)/);
  assert.match(generator, /useState<ThemeOption>\(['"]auto['"]\)/);
  assert.match(generator, /useState<number \| null>\(60\)/);
  assert.match(generator, /useState\(true\)/);
  assert.match(generator, /const eyesClosed = false/);
  assert.match(
    generator,
    /if \(theme !== ['"]auto['"]\) params\.set\(['"]theme['"], theme\)/,
  );
  assert.match(
    generator,
    /if \(duration !== null\) params\.set\(['"]duration['"], String\(duration\)\)/,
  );
  assert.match(
    generator,
    /if \(!binaural\) params\.set\(['"]binaural['"], ['"]0['"]\)/,
  );
  assert.match(
    generator,
    /if \(eyesClosed\) params\.set\(['"]eyesClosed['"], ['"]1['"]\)/,
  );
  assert.match(generator, /return `\$\{localePrefix\}\/embed\/\$\{slug\}/);
  assert.match(
    generator,
    /https:\/\/deepbreathingexercises\.com\$\{localePrefix\}\/embed/,
  );
});

test("R-W03 embed compiler emits five complete bundles with the reviewed sound gap", async () => {
  const { EMBED_CONTENT_LOCALES, buildEmbedContentArtifacts } =
    await import("../i18n/bespoke/compile-embed-content.mjs");
  assert.deepEqual(EMBED_CONTENT_LOCALES, [
    "de-de",
    "es-es",
    "fr-fr",
    "ja-jp",
    "pt-br",
  ]);

  const [first, second, source] = await Promise.all([
    buildEmbedContentArtifacts(),
    buildEmbedContentArtifacts(),
    readFile(new URL("source.json", contentRoot), "utf8").then(JSON.parse),
  ]);
  const expectedMessages = stringLeavesOf(source).length;

  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual(first.unresolved.unresolved, []);
  assert.equal(first.publication.expectedMessages, expectedMessages);
  assert.deepEqual(Object.keys(source.generator.patterns), [
    "box",
    "4-7-8",
    "coherent",
    "physiological-sigh",
    "wim-hof",
    "pursed-lip",
    "belly",
    "9d-breathwork",
    "hope-cartel-9d-breathwork",
  ]);

  for (const locale of EMBED_CONTENT_LOCALES) {
    const messages = JSON.parse(first.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(shapeOf(messages), shapeOf(source), locale);
    assert.equal(
      messages.generator.sound.binauralLabel.length > 0,
      true,
      locale,
    );
    assert.equal(first.publication.locales[locale].reviewedGap, 1);
    assert.equal(first.publication.locales[locale].publishable, true);
    assert.equal(
      first.publication.locales[locale].resolvedMessages,
      expectedMessages,
    );
    assert.match(first.publication.locales[locale].sha256, /^[0-9a-f]{64}$/);
  }
});

test("R-W03 checked-in embed artifacts and fail-closed loader are current", async () => {
  const { EMBED_CONTENT_LOCALES, checkEmbedContentArtifacts } =
    await import("../i18n/bespoke/compile-embed-content.mjs");
  assert.deepEqual((await checkEmbedContentArtifacts()).stale, []);

  for (const locale of EMBED_CONTENT_LOCALES) {
    const raw = await readFile(
      new URL(`messages/${locale}.json`, contentRoot),
      "utf8",
    );
    assert.doesNotMatch(
      raw,
      /catalogSegmentId|catalogTranslationId|contextKey|occurrenceKey|pageSegmentId|sourceHash|sourceText/,
    );
  }

  const loader = await readFile(
    new URL("server/load-embed-content.ts", contentRoot),
    "utf8",
  );
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 5);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /!.*publishable/);
  assert.match(loader, /resolvedMessages\s*!==\s*coverage\.expectedMessages/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("R-W03 embed renderer passes serializable localized generator props and localized links", async () => {
  const [page, renderer, generator, types, breatheTypes] = await Promise.all([
    readFile(new URL("page.tsx", routeRoot), "utf8"),
    readFile(new URL("embed-page.tsx", routeRoot), "utf8"),
    readFile(new URL("embed-generator.tsx", routeRoot), "utf8"),
    readFile(new URL("types.ts", contentRoot), "utf8"),
    readFile(new URL("../../breathe/types.ts", contentRoot), "utf8"),
  ]);

  assert.match(page, /source\.json/);
  assert.match(page, /createEmbedMetadataFromContent/);
  assert.match(renderer, /export function createEmbedMetadataFromContent/);
  assert.match(renderer, /export function EmbedPage/);
  assert.match(renderer, /resolveNativeInternalHref/);
  assert.match(renderer, /metadataBase:\s*new URL\(siteUrl\)/);
  assert.match(renderer, /EMBED_GENERATOR_SLUGS\.map/);
  assert.match(renderer, /initialLocale/);
  assert.match(renderer, /footerLinks/);
  assert.match(generator, /iframeTitleTemplate/);
  assert.match(types, /VALID_EMBED_SLUGS\s*=\s*BREATHE_CONTENT_SLUGS/);
  assert.match(types, /EMBED_GENERATOR_SLUGS\s*=\s*\[/);
  const breatheSlugLiteral = breatheTypes.match(
    /BREATHE_CONTENT_SLUGS\s*=\s*(\[[^\]]+\])/,
  );
  assert.ok(breatheSlugLiteral);
  const playerSlugs = JSON.parse(breatheSlugLiteral[1]);
  assert.equal(playerSlugs.length, 14);
  assert.equal(playerSlugs.includes("buteyko"), true);
  assert.doesNotMatch(renderer, /["']use client["']/);
});

test("R-W03 localized embed players gate on the parent route and preserve dynamic query behavior", async () => {
  const [route, englishRoute, player, resonance] = await Promise.all([
    readFile(localizedPlayer, "utf8"),
    readFile(new URL("[slug]/page.tsx", routeRoot), "utf8"),
    readFile(new URL("[slug]/embed-player.tsx", routeRoot), "utf8"),
    readFile(new URL("[slug]/embed-player-resonance.tsx", routeRoot), "utf8"),
  ]);

  assert.match(route, /sourceRoute\s*=\s*["']\/embed["']/);
  assert.match(route, /isNativeRoutePreviewable\(sourceRoute/);
  assert.match(route, /isNativeRoutePublished\(sourceRoute/);
  assert.match(route, /validSlugs|VALID_EMBED_SLUGS/);
  assert.match(route, /notFound\(\)/);
  assert.match(route, /loadBreatheContent/);
  assert.match(route, /getNativeLocalizedRoutePaths/);
  assert.match(route, /searchParams/);
  assert.doesNotMatch(route, /isNativeRoutePreviewable\([^)]*embed-slug/);
  assert.match(route, /export const dynamicParams\s*=\s*false/);
  assert.match(route, /export function generateStaticParams/);
  assert.match(route, /TRANSLATED_LOCALES\.flatMap/);
  assert.match(route, /VALID_EMBED_SLUGS\.map/);
  assert.match(route, /mode === ["']native-preview["']/);

  assert.match(englishRoute, /VALID_EMBED_SLUGS\.map/);
  assert.match(englishRoute, /validSlugs\.has\(slug\)/);
  assert.doesNotMatch(englishRoute, /EMBED_GENERATOR_SLUGS/);

  assert.match(player, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(player, /resolveNativeInternalHref/);
  assert.match(player, /new URL\(fullPageHref, baseUrl\)/);
  assert.match(player, /searchParams\.theme === ['"]dark['"]/);
  assert.match(player, /searchParams\.theme === ['"]light['"]/);
  assert.match(resonance, /embedMode/);
  assert.match(resonance, /locale=\{locale\}/);
  assert.match(resonance, /localizedRoutePaths=\{localizedRoutePaths\}/);
});
