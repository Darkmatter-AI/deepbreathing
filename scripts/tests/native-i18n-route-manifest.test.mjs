import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";

// The application uses bundler-style extensionless TypeScript imports. Teach
// Node's strip-types test runner the one local resolution it cannot infer.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === "./index" &&
      context.parentURL?.endsWith("/src/i18n/route-manifest.ts")
    ) {
      return nextResolve("./index.ts", context);
    }

    return nextResolve(specifier, context);
  },
});

const {
  NATIVE_ROUTE_MANIFEST,
  getLocalizedStaticParams,
  getPreviewLocalizedStaticParams,
  getNativeRouteById,
  getNativeRouteByPath,
  getNativeLocalizedRoutePaths,
  isLocalePublicationIntended,
  isLocaleSemanticReady,
  isNativeLocalePublished,
  isNativeRoutePreviewable,
  isNativeRoutePublished,
  resolveNativeInternalHref,
} = await import("../../src/i18n/route-manifest.ts");
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  TRANSLATED_LOCALES,
} from "../../src/i18n/index.ts";
import { collectInventory } from "../i18n/build-native-i18n-inventory.mjs";

const STATIC_ROUTES = NATIVE_ROUTE_MANIFEST.filter((route) => !route.dynamic);
const DYNAMIC_ROUTES = NATIVE_ROUTE_MANIFEST.filter((route) => route.dynamic);

test("manifest pins the 60 static routes and dynamic embed exception", () => {
  assert.equal(NATIVE_ROUTE_MANIFEST.length, 61);
  assert.equal(STATIC_ROUTES.length, 60);
  assert.deepEqual(
    DYNAMIC_ROUTES.map(({ path, kind, indexable }) => ({
      path,
      kind,
      indexable,
    })),
    [
      {
        path: "/embed/[slug]",
        kind: "dynamic-embed",
        indexable: false,
      },
    ],
  );

  const ids = NATIVE_ROUTE_MANIFEST.map(({ id }) => id);
  const paths = NATIVE_ROUTE_MANIFEST.map(({ path }) => path);
  assert.equal(new Set(ids).size, ids.length, "route IDs must be unique");
  assert.equal(new Set(paths).size, paths.length, "route paths must be unique");
  assert.ok(paths.every((path) => !path.startsWith("/en")));

  const inventory = collectInventory(process.cwd());
  assert.deepEqual(
    STATIC_ROUTES.map(({ path }) => path).sort(),
    inventory.routes.map(({ route }) => route).sort(),
  );
});

test("publication intent preserves the current 337-URL sitemap contract", () => {
  assert.equal(
    STATIC_ROUTES.filter((route) => route.publicationIntent[DEFAULT_LOCALE])
      .length,
    57,
  );

  for (const locale of TRANSLATED_LOCALES) {
    assert.equal(
      STATIC_ROUTES.filter((route) => route.publicationIntent[locale.code])
        .length,
      56,
      `${locale.code} publication intent`,
    );
  }

  const intendedUrlCount = STATIC_ROUTES.reduce(
    (count, route) =>
      count +
      SUPPORTED_LOCALES.filter((locale) => route.publicationIntent[locale])
        .length,
    0,
  );
  assert.equal(intendedUrlCount, 337);

  assert.deepEqual(
    STATIC_ROUTES.filter((route) =>
      SUPPORTED_LOCALES.every((locale) => !route.publicationIntent[locale]),
    ).map(({ path }) => path),
    ["/brand-lab", "/og-preview", "/sensory-studio"],
  );

  const languages = getNativeRouteByPath("/languages");
  assert.ok(languages);
  assert.equal(isLocalePublicationIntended(languages, "en-US"), true);
  assert.ok(
    TRANSLATED_LOCALES.every(
      ({ code }) => !isLocalePublicationIntended(languages, code),
    ),
  );
});

test("manifest records indexability and the existing stats contradiction", () => {
  assert.deepEqual(
    STATIC_ROUTES.filter((route) => !route.indexable).map(({ path }) => path),
    ["/brand-lab", "/og-preview", "/sensory-studio", "/stats"],
  );

  const stats = getNativeRouteById("stats");
  assert.ok(stats);
  assert.equal(stats.knownContradiction, "noindex-in-sitemap");
  assert.equal(stats.indexable, false);
  assert.equal(stats.localizedHandler, "explicit");
  assert.equal(getNativeRouteById("about")?.localizedHandler, "explicit");
  assert.equal(
    getNativeRouteById("4-7-8-breathing-timer")?.localizedHandler,
    "explicit",
  );
  assert.equal(
    STATIC_ROUTES.filter((route) => route.localizedHandler === "catch-all")
      .length,
    57,
  );
  assert.ok(
    SUPPORTED_LOCALES.every((locale) => stats.publicationIntent[locale]),
  );
});

test("catalog facts cover 59 static routes and every translated sitemap route", () => {
  const cataloged = STATIC_ROUTES.filter((route) => route.catalogAvailable);
  assert.equal(cataloged.length, 59);
  assert.equal(cataloged.length * TRANSLATED_LOCALES.length, 295);

  assert.deepEqual(
    STATIC_ROUTES.filter((route) => !route.catalogAvailable).map(
      ({ path }) => path,
    ),
    ["/sensory-studio"],
  );
  assert.equal(getNativeRouteByPath("/embed/box")?.catalogAvailable, false);

  for (const locale of TRANSLATED_LOCALES) {
    assert.ok(
      STATIC_ROUTES.filter(
        (route) => route.publicationIntent[locale.code],
      ).every((route) => route.catalogAvailable),
    );
  }
});

test("translated migration state admits the complete cutover candidate", () => {
  const semanticReadyPaths = new Set([
    "/",
    "/1-minute-breathing-exercise",
    "/2-minute-breathing-exercise",
    "/4-7-8-breathing-for-insomnia",
    "/4-7-8-breathing-timer",
    "/5-minute-breathing-exercise",
    "/about",
    "/about/abi",
    "/about/editorial-policy",
    "/box-breathing-app",
    "/box-breathing-before-presentation",
    "/breathe",
    "/breathing-app",
    "/breathing-exercises-before-surgery",
    "/breathing-exercises-for-labor",
    "/breathing-visualizer",
    "/coherent-breathing-app",
    "/embed",
    ...NATIVE_ROUTE_MANIFEST.filter(
      (route) => route.kind === "structured-breathing",
    ).map((route) => route.path),
    "/for",
    ...NATIVE_ROUTE_MANIFEST.filter(
      (route) => route.kind === "structured-use-case",
    ).map((route) => route.path),
    "/holiday-breathing-exercises",
    "/physiological-sigh-panic-attack",
    "/privacy",
    "/stats",
    "/support",
  ]);

  for (const route of NATIVE_ROUTE_MANIFEST) {
    assert.equal(route.nativeStatus["en-US"], "semantic-ready");

    for (const locale of TRANSLATED_LOCALES) {
      const expectedSemanticReady = semanticReadyPaths.has(route.path);
      assert.equal(
        isLocaleSemanticReady(route, locale.code),
        expectedSemanticReady,
        `${route.path} ${locale.code}`,
      );
      if (!expectedSemanticReady) {
        assert.ok(
          route.nativeStatus[locale.code] === "catalog-only" ||
            route.nativeStatus[locale.code] === "mapping-required",
          `${route.path} ${locale.code}`,
        );
      }
      assert.equal(
        isNativeRoutePreviewable(route, locale.code),
        expectedSemanticReady,
      );
      assert.equal(
        isNativeRoutePublished(route, locale.code),
        expectedSemanticReady,
        `${route.path} ${locale.code} native publication`,
      );
    }
  }

  const allStatuses = NATIVE_ROUTE_MANIFEST.flatMap((route) =>
    SUPPORTED_LOCALES.map((locale) => route.nativeStatus[locale]),
  );
  assert.ok(!allStatuses.includes("preview"));
  assert.ok(allStatuses.includes("cutover-ready"));

  assert.ok(
    TRANSLATED_LOCALES.every(({ code }) => isNativeLocalePublished(code)),
  );
  assert.equal(getLocalizedStaticParams().length, 265);
  // Explicit bespoke routes own their params outside the shared catch-all.
  assert.equal(getPreviewLocalizedStaticParams().length, 265);
  assert.equal(isNativeLocalePublished(DEFAULT_LOCALE), false);
});

test("the breathe and use-case families and their hubs are cutover-ready", () => {
  const structured = NATIVE_ROUTE_MANIFEST.filter(
    (route) =>
      route.kind === "structured-breathing" ||
      route.kind === "structured-use-case",
  );
  assert.equal(structured.length, 32);
  assert.equal(
    structured.filter((route) => route.kind === "structured-breathing").length,
    14,
  );
  assert.equal(
    structured.filter((route) => route.kind === "structured-use-case").length,
    18,
  );
  const semanticReady = structured.filter((route) =>
    TRANSLATED_LOCALES.every(
      ({ code }) => route.nativeStatus[code] === "cutover-ready",
    ),
  );
  assert.equal(semanticReady.length, 32);
  assert.ok(semanticReady.some((route) => route.path === "/for/anxiety"));
  assert.equal(
    semanticReady.filter((route) => route.kind === "structured-breathing")
      .length,
    14,
  );
  assert.equal(
    semanticReady.filter((route) => route.kind === "structured-use-case")
      .length,
    18,
  );

  const home = getNativeRouteById("home");
  const forIndex = getNativeRouteById("for");
  assert.ok(home);
  assert.ok(forIndex);
  assert.ok(
    TRANSLATED_LOCALES.every(
      ({ code }) => home.nativeStatus[code] === "cutover-ready",
    ),
  );
  assert.ok(
    TRANSLATED_LOCALES.every(
      ({ code }) => forIndex.nativeStatus[code] === "cutover-ready",
    ),
  );
});

test("the R-W01 duration and insomnia routes are cutover-ready", () => {
  const routePaths = [
    "/1-minute-breathing-exercise",
    "/2-minute-breathing-exercise",
    "/4-7-8-breathing-for-insomnia",
    "/5-minute-breathing-exercise",
  ];

  for (const path of routePaths) {
    const route = getNativeRouteByPath(path);
    assert.ok(route, path);
    assert.equal(route.localizedHandler, "catch-all");
    assert.ok(
      TRANSLATED_LOCALES.every(
        ({ code }) => route.nativeStatus[code] === "cutover-ready",
      ),
      path,
    );
  }
});

test("the R-W02 Resonance guides and holiday route are cutover-ready", () => {
  const routePaths = [
    "/box-breathing-before-presentation",
    "/breathing-exercises-before-surgery",
    "/breathing-exercises-for-labor",
    "/holiday-breathing-exercises",
    "/physiological-sigh-panic-attack",
  ];

  for (const path of routePaths) {
    const route = getNativeRouteByPath(path);
    assert.ok(route, path);
    assert.equal(route.localizedHandler, "catch-all");
    assert.ok(
      TRANSLATED_LOCALES.every(
        ({ code }) => route.nativeStatus[code] === "cutover-ready",
      ),
      path,
    );
  }
});

test("the R-W03 application, visualizer, and embed routes are cutover-ready", () => {
  const routePaths = [
    "/box-breathing-app",
    "/breathing-app",
    "/breathing-visualizer",
    "/coherent-breathing-app",
    "/embed",
  ];

  for (const path of routePaths) {
    const route = getNativeRouteByPath(path);
    assert.ok(route, path);
    assert.equal(route.localizedHandler, "catch-all");
    assert.ok(
      TRANSLATED_LOCALES.every(
        ({ code }) => route.nativeStatus[code] === "cutover-ready",
      ),
      path,
    );
  }

  const embedSlug = getNativeRouteById("embed-slug");
  assert.ok(embedSlug);
  assert.equal(embedSlug.dynamic, true);
  assert.equal(embedSlug.indexable, false);
  assert.equal(isNativeRoutePreviewable(embedSlug, "es-ES"), false);
});

test("the R-W04 trust and information routes are cutover-ready", () => {
  const catchAllPaths = [
    "/about/abi",
    "/about/editorial-policy",
    "/privacy",
    "/support",
  ];

  for (const path of catchAllPaths) {
    const route = getNativeRouteByPath(path);
    assert.ok(route, path);
    assert.equal(route.localizedHandler, "catch-all");
    assert.ok(
      TRANSLATED_LOCALES.every(
        ({ code }) => route.nativeStatus[code] === "cutover-ready",
      ),
      path,
    );
  }

  const stats = getNativeRouteByPath("/stats");
  assert.ok(stats);
  assert.equal(stats.localizedHandler, "explicit");
  assert.equal(stats.indexable, false);
  assert.ok(
    TRANSLATED_LOCALES.every(
      ({ code }) => stats.nativeStatus[code] === "cutover-ready",
    ),
  );
});

test("lookup normalizes locale prefixes and gives exact routes precedence", () => {
  assert.equal(getNativeRouteById("breathe-box")?.path, "/breathe/box");
  assert.equal(
    getNativeRouteByPath("/es/breathe/box?duration=60")?.id,
    "breathe-box",
  );
  assert.equal(getNativeRouteByPath("/de/es/breathe/box")?.id, "breathe-box");
  assert.equal(getNativeRouteByPath("/ja")?.id, "home");
  assert.equal(getNativeRouteByPath("/embed")?.id, "embed");
  assert.equal(getNativeRouteByPath("/pt/embed/coherent")?.id, "embed-slug");
  assert.equal(getNativeRouteByPath("/unknown"), null);
  assert.equal(getNativeRouteById("unknown"), null);
});

test("native publication requires cutover-ready, intent, and a static route", () => {
  const source = getNativeRouteById("breathe-box");
  assert.ok(source);
  const isolatedTranslatedStatus = {
    ...source.nativeStatus,
    "pt-BR": "mapping-required",
    "fr-FR": "mapping-required",
    "de-DE": "mapping-required",
    "ja-JP": "mapping-required",
  };

  const preview = {
    ...source,
    nativeStatus: { ...isolatedTranslatedStatus, "es-ES": "preview" },
  };
  assert.equal(isLocaleSemanticReady(preview, "es-ES"), true);
  assert.equal(isNativeRoutePreviewable(preview, "es-ES"), true);
  assert.equal(isNativeRoutePublished(preview, "es-ES"), false);
  assert.deepEqual(getPreviewLocalizedStaticParams([preview]), [
    {
      locale: "es",
      segments: ["breathe", "box"],
    },
  ]);
  assert.deepEqual(getLocalizedStaticParams([preview]), []);

  const cutoverReady = {
    ...source,
    nativeStatus: { ...isolatedTranslatedStatus, "es-ES": "cutover-ready" },
  };
  assert.equal(isNativeRoutePreviewable(cutoverReady, "es-ES"), true);
  assert.equal(isNativeRoutePublished(cutoverReady, "es-ES"), true);
  assert.deepEqual(getPreviewLocalizedStaticParams([cutoverReady]), [
    {
      locale: "es",
      segments: ["breathe", "box"],
    },
  ]);
  assert.deepEqual(getLocalizedStaticParams([cutoverReady]), [
    {
      locale: "es",
      segments: ["breathe", "box"],
    },
  ]);

  const stats = getNativeRouteById("stats");
  assert.ok(stats);
  const explicitStats = {
    ...stats,
    nativeStatus: { ...stats.nativeStatus, "es-ES": "cutover-ready" },
  };
  assert.equal(isNativeRoutePublished(explicitStats, "es-ES"), true);
  assert.deepEqual(getPreviewLocalizedStaticParams([explicitStats]), []);
  assert.deepEqual(getLocalizedStaticParams([explicitStats]), []);

  const semanticReady = {
    ...source,
    nativeStatus: { ...isolatedTranslatedStatus, "es-ES": "semantic-ready" },
  };
  assert.equal(isNativeRoutePreviewable(semanticReady, "es-ES"), false);
  assert.equal(isNativeRoutePublished(semanticReady, "es-ES"), false);

  const excluded = getNativeRouteById("brand-lab");
  assert.ok(excluded);
  const excludedCutoverReady = {
    ...excluded,
    nativeStatus: { ...excluded.nativeStatus, "es-ES": "cutover-ready" },
  };
  assert.equal(isNativeRoutePreviewable(excludedCutoverReady, "es-ES"), false);
  assert.equal(isNativeRoutePublished(excludedCutoverReady, "es-ES"), false);

  const dynamic = getNativeRouteById("embed-slug");
  assert.ok(dynamic);
  const dynamicCutoverReady = {
    ...dynamic,
    publicationIntent: { ...dynamic.publicationIntent, "es-ES": true },
    nativeStatus: { ...dynamic.nativeStatus, "es-ES": "cutover-ready" },
  };
  assert.equal(isNativeRoutePreviewable(dynamicCutoverReady, "es-ES"), false);
  assert.equal(isNativeRoutePublished(dynamicCutoverReady, "es-ES"), false);
});

test("partial native links keep preview targets localized and fall back elsewhere", () => {
  const previewPaths = getNativeLocalizedRoutePaths("es-ES", "native-preview");
  assert.equal(previewPaths.length, 56);
  assert.ok(previewPaths.includes("/1-minute-breathing-exercise"));
  assert.ok(previewPaths.includes("/2-minute-breathing-exercise"));
  assert.ok(previewPaths.includes("/4-7-8-breathing-for-insomnia"));
  assert.ok(previewPaths.includes("/5-minute-breathing-exercise"));
  assert.ok(previewPaths.includes("/breathe"));
  assert.ok(previewPaths.includes("/breathe/box"));
  assert.ok(previewPaths.includes("/breathe/buteyko"));
  assert.ok(previewPaths.includes("/for/anxiety"));
  assert.ok(previewPaths.includes("/for"));
  assert.ok(previewPaths.includes("/for/travel-anxiety"));
  assert.ok(previewPaths.includes("/box-breathing-before-presentation"));
  assert.ok(previewPaths.includes("/breathing-exercises-before-surgery"));
  assert.ok(previewPaths.includes("/breathing-exercises-for-labor"));
  assert.ok(previewPaths.includes("/holiday-breathing-exercises"));
  assert.ok(previewPaths.includes("/physiological-sigh-panic-attack"));
  assert.ok(previewPaths.includes("/box-breathing-app"));
  assert.ok(previewPaths.includes("/breathing-app"));
  assert.ok(previewPaths.includes("/breathing-visualizer"));
  assert.ok(previewPaths.includes("/coherent-breathing-app"));
  assert.ok(previewPaths.includes("/embed"));
  assert.ok(previewPaths.includes("/about/abi"));
  assert.ok(previewPaths.includes("/about/editorial-policy"));
  assert.ok(previewPaths.includes("/privacy"));
  assert.ok(previewPaths.includes("/stats"));
  assert.ok(previewPaths.includes("/support"));
  assert.deepEqual(
    getNativeLocalizedRoutePaths("es-ES", "native"),
    previewPaths,
  );
  assert.equal(
    resolveNativeInternalHref(
      "/breathe/buteyko?duration=60",
      "es-ES",
      "native-preview",
    ),
    "/es/breathe/buteyko?duration=60",
  );
  assert.equal(
    resolveNativeInternalHref("/es/for/anxiety", "es-ES", "native"),
    "/es/for/anxiety",
  );
  assert.equal(
    resolveNativeInternalHref(
      "/unknown?duration=60",
      "fr-FR",
      "native-preview",
    ),
    "/unknown?duration=60",
  );
  assert.equal(
    resolveNativeInternalHref("#practice", "de-DE", "native-preview"),
    "#practice",
  );
  assert.equal(
    resolveNativeInternalHref(
      "https://example.com/help",
      "ja-JP",
      "native-preview",
    ),
    "https://example.com/help",
  );
});

test("semantic proof route IDs are owned by the route manifest", async () => {
  const mapping = JSON.parse(
    await readFile(
      new URL(
        "../../src/i18n/content/proof/semantic-map.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const publication = JSON.parse(
    await readFile(
      new URL("../../src/i18n/content/proof/publication.json", import.meta.url),
      "utf8",
    ),
  );

  for (const proofRoute of mapping.routes) {
    const manifestRoute = getNativeRouteByPath(proofRoute.sourceRoute);
    assert.equal(manifestRoute?.id, proofRoute.routeId, proofRoute.sourceRoute);
    assert.ok(
      TRANSLATED_LOCALES.every(
        ({ code }) => manifestRoute.nativeStatus[code] === "cutover-ready",
      ),
    );
    assert.ok(
      Object.values(publication.routes[proofRoute.sourceRoute].locales).every(
        (locale) => locale.publishable,
      ),
    );
  }
});
