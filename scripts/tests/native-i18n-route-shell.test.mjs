import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === "./route-manifest" &&
      context.parentURL?.endsWith("/src/i18n/serving-mode.ts")
    ) {
      return nextResolve("./route-manifest.ts", context);
    }
    return nextResolve(specifier, context);
  },
});

const { getNativeLinkMode, resolveNativeI18nMode } =
  await import("../../src/i18n/serving-mode.ts");

const require = createRequire(import.meta.url);
const configPath = fileURLToPath(
  new URL("../../next.config.js", import.meta.url),
);

async function loadRedirects(mode) {
  const previousMode = process.env.NATIVE_I18N_MODE;
  if (mode === undefined) delete process.env.NATIVE_I18N_MODE;
  else process.env.NATIVE_I18N_MODE = mode;

  try {
    delete require.cache[configPath];
    const config = require(configPath);
    return await config.redirects();
  } finally {
    delete require.cache[configPath];
    if (previousMode === undefined) delete process.env.NATIVE_I18N_MODE;
    else process.env.NATIVE_I18N_MODE = previousMode;
  }
}

function localeStrippingRedirects(redirects) {
  const localePrefix = "/:locale(es|pt|fr|de|ja)";
  return redirects.filter(({ source }) =>
    source === localePrefix || source === `${localePrefix}/:rest+`,
  );
}

test("serving mode defaults fail closed to the legacy proxy", () => {
  // Passing `undefined` invokes the function's process.env default, which made
  // this assertion depend on Vercel's production-only NATIVE_I18N_MODE value.
  // An empty environment value is the actual fail-closed case.
  assert.equal(resolveNativeI18nMode(""), "proxy");
  assert.equal(resolveNativeI18nMode("native-preview"), "native-preview");
  assert.equal(resolveNativeI18nMode("native"), "native");
  assert.equal(getNativeLinkMode("proxy"), null);
  assert.equal(getNativeLinkMode("native-preview"), "native-preview");
  assert.equal(getNativeLinkMode("native"), "native");
  assert.throws(
    () => resolveNativeI18nMode("unexpected"),
    /Unsupported NATIVE_I18N_MODE: unexpected/,
  );
});

test("Next redirects preserve proxy behavior and release prefixes only in native modes", async () => {
  assert.equal(
    localeStrippingRedirects(await loadRedirects(undefined)).length,
    2,
  );
  assert.equal(
    localeStrippingRedirects(await loadRedirects("proxy")).length,
    2,
  );
  assert.equal(
    localeStrippingRedirects(await loadRedirects("native-preview")).length,
    0,
  );
  assert.equal(
    localeStrippingRedirects(await loadRedirects("native")).length,
    0,
  );

  await assert.rejects(
    () => loadRedirects("unexpected"),
    /Unsupported NATIVE_I18N_MODE: unexpected/,
  );
});

test("legacy technique aliases redirect to their canonical breathing pages in every mode", async () => {
  const expected = new Map([
    ["/4-7-8", "/breathe/4-7-8"],
    ["/box", "/breathe/box"],
    ["/coherent", "/breathe/coherent"],
    ["/physiological-sigh", "/breathe/physiological-sigh"],
    ["/wim-hof", "/breathe/wim-hof"],
  ]);

  for (const mode of [undefined, "proxy", "native-preview", "native"]) {
    const redirects = await loadRedirects(mode);
    for (const [source, destination] of expected) {
      const redirect = redirects.find((candidate) => candidate.source === source);
      assert.deepEqual(
        redirect,
        { source, destination, permanent: true },
        `${source} redirect in ${mode ?? "default"} mode`,
      );
    }
  }
});

test("the route groups keep English URLs stable and give localized pages their own document", async () => {
  const [
    englishLayout,
    localizedLayout,
    localizedPage,
    localizedAboutPage,
    localizedTimerPage,
    localizedStatsPage,
    statsServerPage,
  ] = await Promise.all([
    readFile(
      new URL("../../src/app/(site-en)/layout.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-localized)/[locale]/layout.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-localized)/[locale]/[[...segments]]/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-localized)/[locale]/about/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-localized)/[locale]/4-7-8-breathing-timer/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-localized)/[locale]/stats/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-en)/stats/stats-page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(englishLayout, /<SiteDocument htmlLang="en">/);
  assert.match(localizedLayout, /getLocaleByPrefix\(\(await params\)\.locale\)/);
  assert.match(localizedLayout, /htmlLang=\{locale\.htmlLang\}/);
  assert.match(localizedLayout, /direction=\{locale\.direction\}/);
  assert.match(localizedLayout, /disableSeasonalBanner/);

  assert.match(localizedPage, /export const dynamicParams = false/);
  assert.match(localizedPage, /mode === "native-preview"/);
  assert.match(localizedPage, /\[\.\.\.getPreviewLocalizedStaticParams\(\)\]/);
  assert.match(localizedPage, /mode === "native"/);
  assert.match(localizedPage, /\[\.\.\.getLocalizedStaticParams\(\)\]/);
  assert.match(localizedPage, /return \[\]/);
  assert.match(localizedPage, /isNativeRoutePublished/);
  assert.match(localizedPage, /buildHreflangAlternates/);
  assert.match(localizedPage, /loadForIndexContent/);
  assert.match(localizedPage, /loadUseCaseRoute/);
  assert.match(localizedPage, /FOR_CONTENT_SLUGS/);
  assert.match(localizedPage, /loadBreatheIndexContent/);
  assert.match(localizedPage, /loadBreatheRoute/);
  assert.match(localizedPage, /BREATHE_CONTENT_SLUGS/);
  assert.match(localizedPage, /getNativeRouteByPath/);
  assert.match(localizedPage, /loadHomeContent/);
  assert.match(localizedPage, /loadDurationContent/);
  assert.match(localizedPage, /loadInsomniaContent/);
  assert.match(localizedPage, /DURATION_CONTENT_ROUTES/);
  assert.match(localizedPage, /loadResonanceGuideContent/);
  assert.match(localizedPage, /RESONANCE_GUIDE_ROUTES/);
  assert.match(localizedPage, /loadHolidayContent/);
  assert.match(localizedPage, /loadRw03AppContent/);
  assert.match(localizedPage, /loadBreathingVisualizerContent/);
  assert.match(localizedPage, /loadEmbedContent/);
  assert.match(localizedPage, /loadTrustPageContent/);
  assert.match(localizedPage, /loadPrivacyContent/);
  assert.match(localizedPage, /loadSupportContent/);
  assert.match(localizedPage, /createHomeMetadataFromContent/);
  assert.match(localizedPage, /<LocalizedHomeResonance/);
  assert.match(localizedPage, /<HomePage/);
  assert.match(localizedPage, /<BreatheIndexPage/);
  assert.match(localizedPage, /<PatternPage/);
  assert.match(localizedPage, /<ForIndexPage/);
  assert.match(localizedPage, /<UseCasePage/);
  assert.match(localizedPage, /<DurationExercisePage/);
  assert.match(localizedPage, /<InsomniaPage/);
  assert.match(localizedPage, /<ResonanceGuidePage/);
  assert.match(localizedPage, /<HolidayBreathingPage/);
  assert.match(localizedPage, /<BoxBreathingAppPage/);
  assert.match(localizedPage, /<BreathingAppPage/);
  assert.match(localizedPage, /<BreathingVisualizerPage/);
  assert.match(localizedPage, /<CoherentBreathingAppPage/);
  assert.match(localizedPage, /<EmbedPage/);
  assert.match(localizedPage, /<AbiPage/);
  assert.match(localizedPage, /<EditorialPolicyPage/);
  assert.match(localizedPage, /<PrivacyPage/);
  assert.match(localizedPage, /<SupportPage/);
  assert.doesNotMatch(localizedPage, /sourceRoute === "\/breathe\/buteyko"/);
  assert.doesNotMatch(localizedPage, /sourceRoute === "\/for\/anxiety"/);
  assert.doesNotMatch(localizedPage, /loadProofContent|loadProofServerChrome/);
  assert.doesNotMatch(localizedPage, /AboutPage|loadAboutContent/);

  assert.match(localizedAboutPage, /export const dynamicParams = false/);
  assert.match(localizedAboutPage, /mode === "proxy"/);
  assert.match(localizedAboutPage, /isNativeRoutePreviewable/);
  assert.match(localizedAboutPage, /isNativeRoutePublished/);
  assert.match(localizedAboutPage, /loadAboutContent/);
  assert.match(localizedAboutPage, /createAboutMetadataFromContent/);
  assert.match(localizedAboutPage, /buildHreflangAlternates/);

  assert.match(localizedTimerPage, /export const dynamicParams = false/);
  assert.match(localizedTimerPage, /mode === "proxy"/);
  assert.match(localizedTimerPage, /isNativeRoutePreviewable/);
  assert.match(localizedTimerPage, /isNativeRoutePublished/);
  assert.match(localizedTimerPage, /loadTimerContent/);
  assert.match(localizedTimerPage, /createTimerMetadataFromContent/);
  assert.match(localizedTimerPage, /buildHreflangAlternates/);

  assert.match(localizedStatsPage, /dynamic = "force-dynamic"/);
  assert.match(localizedStatsPage, /resolveNativeI18nMode/);
  assert.match(localizedStatsPage, /isNativeRoutePreviewable/);
  assert.match(localizedStatsPage, /isNativeRoutePublished/);
  assert.match(localizedStatsPage, /loadStatsContent/);
  assert.match(localizedStatsPage, /createStatsMetadataFromContent/);
  assert.match(localizedStatsPage, /buildHreflangAlternates/);
  assert.match(localizedStatsPage, /SUPPORTED_LOCALES/);
  assert.doesNotMatch(localizedStatsPage, /generateStaticParams|dynamicParams/);
  assert.match(statsServerPage, /robots:\s*\{\s*index:\s*false/);
});
