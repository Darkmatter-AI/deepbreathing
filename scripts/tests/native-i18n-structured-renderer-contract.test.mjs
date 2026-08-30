import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const patternPagePath = new URL(
  "../../src/app/(site-en)/breathe/pattern-page.tsx",
  import.meta.url,
);
const useCasePagePath = new URL(
  "../../src/app/(site-en)/for/use-case-page.tsx",
  import.meta.url,
);
const resonancePath = new URL(
  "../../src/components/resonance/Resonance.tsx",
  import.meta.url,
);

test("structured renderers accept resolved content without changing English wrappers", async () => {
  const [patternSource, useCaseSource] = await Promise.all([
    readFile(patternPagePath, "utf8"),
    readFile(useCasePagePath, "utf8"),
  ]);

  assert.match(patternSource, /content\?: BreathingPageContent/);
  assert.match(patternSource, /content \?\? breathingPageMap\[slug\]/);
  assert.match(patternSource, /renderContext\?: NativeRouteRenderContext/);
  assert.match(
    patternSource,
    /renderContext\?\.canonicalPath \?\? canonicalPath \?\? `\/breathe\/\$\{routeSlug\}`/,
  );
  assert.match(
    patternSource,
    /resolveNativeInternalHref\(\s*path,\s*renderContext\.locale,\s*renderContext\.linkMode,?\s*\)/,
  );
  assert.match(patternSource, /locale=\{renderContext\?\.locale\}/);
  assert.match(
    patternSource,
    /localizedRoutePaths=\{renderContext\?\.localizedRoutePaths\}/,
  );
  assert.match(
    patternSource,
    /export function createPatternMetadataFromContent/,
  );
  assert.match(patternSource, /createPatternMetadataFromContent\(page\)/);

  assert.match(useCaseSource, /content\?: UseCasePageContent/);
  assert.match(useCaseSource, /content \?\? useCasePageMap\[slug\]/);
  assert.match(useCaseSource, /renderContext\?: NativeRouteRenderContext/);
  assert.match(
    useCaseSource,
    /renderContext\?\.canonicalPath \?\? canonicalPath \?\? `\/for\/\$\{routeSlug\}`/,
  );
  assert.match(
    useCaseSource,
    /resolveNativeInternalHref\(\s*path,\s*renderContext\.locale,\s*renderContext\.linkMode,?\s*\)/,
  );
  assert.match(useCaseSource, /locale=\{renderContext\?\.locale\}/);
  assert.match(
    useCaseSource,
    /localizedRoutePaths=\{renderContext\?\.localizedRoutePaths\}/,
  );
  assert.match(
    useCaseSource,
    /export function createUseCaseMetadataFromContent/,
  );
  assert.match(useCaseSource, /createUseCaseMetadataFromContent\(page\)/);
});

test("resolved content remains inside server renderers instead of crossing wholesale to clients", async () => {
  const [patternSource, useCaseSource] = await Promise.all([
    readFile(patternPagePath, "utf8"),
    readFile(useCasePagePath, "utf8"),
  ]);

  assert.doesNotMatch(patternSource, /^\s*["']use client["'];/m);
  assert.doesNotMatch(useCaseSource, /^\s*["']use client["'];/m);
  assert.doesNotMatch(patternSource, /<Resonance[^>]+content=/);
  assert.doesNotMatch(useCaseSource, /<Resonance[^>]+content=/);
});

test("interactive breathing islands cannot deopt localized editorial HTML", async () => {
  const [patternSource, useCaseSource, resonanceClientSource] = await Promise.all([
    readFile(patternPagePath, "utf8"),
    readFile(useCasePagePath, "utf8"),
    readFile(
      new URL("../../src/components/resonance/resonance-client.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  for (const [name, source] of [
    ["pattern", patternSource],
    ["use-case", useCaseSource],
  ]) {
    assert.match(source, /ResonanceClient as Resonance/);
    assert.doesNotMatch(
      source,
      /^import Resonance from "@\/components\/resonance\/Resonance";/m,
      `${name} renderer must not let Resonance deopt the complete server document`,
    );
  }

  assert.match(resonanceClientSource, /^"use client";/);
  assert.match(
    resonanceClientSource,
    /const DynamicResonance = dynamic\([\s\S]*?import\("\.\/Resonance"\)[\s\S]*?ssr: false/,
    "the client wrapper must isolate the useSearchParams island under Next 15",
  );
});

test("native locale seeds client phrases and localized navigation before hydration", async () => {
  const source = await readFile(resonancePath, "utf8");

  assert.match(source, /locale\?: string/);
  assert.match(source, /localizedRoutePaths\?: readonly string\[\]/);
  assert.match(source, /useState\(\(\) => locale \?\? 'en'\)/);
  assert.match(
    source,
    /setRuntimeLocale\(locale \?\? detectRuntimeLocale\(\)\)/,
  );
  assert.match(source, /localizedRoutePathSet\.has\(routePath\)/);
  assert.match(
    source,
    /const destinationPath = slug \? resolveClientHref\(`\/breathe\/\$\{slug\}`\) : pathname/,
  );
  assert.match(source, /href=\{resolveClientHref\("\/stats"\)\}/);
  assert.match(source, /data-runtime-locale=\{runtimePhrases\.locale\}/);
});
