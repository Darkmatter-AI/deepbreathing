import {
  DEFAULT_LOCALE,
  TRANSLATED_LOCALES,
  getLocale,
  localizePathname,
  stripLocalePrefix,
  type LocaleCode,
} from "./index";

export const NATIVE_ROUTE_STATUSES = [
  "catalog-only",
  "mapping-required",
  "semantic-ready",
  "preview",
  "cutover-ready",
] as const;

export type NativeRouteStatus = (typeof NATIVE_ROUTE_STATUSES)[number];
export type TranslatedLocaleCode = Exclude<LocaleCode, "en-US">;

/**
 * Route kinds describe the migration path, not the visual page template.
 * Structured routes have repo-owned data schemas; bespoke routes need an
 * explicit semantic extraction; the embed pattern remains a dynamic exception.
 */
export type NativeRouteKind =
  | "bespoke"
  | "structured-breathing"
  | "structured-use-case"
  | "dynamic-embed";

export type NativeRouteContradiction = "noindex-in-sitemap";
export type LocalizedRouteHandler = "catch-all" | "explicit";
export type NativeLinkMode = "native-preview" | "native";

export type LocalePublicationIntent = Readonly<Record<LocaleCode, boolean>>;
export type LocaleNativeStatus = Readonly<
  Record<LocaleCode, NativeRouteStatus>
>;

export interface NativeRouteDefinition<
  Id extends string = string,
  Path extends string = string,
> {
  readonly id: Id;
  readonly path: Path;
  readonly kind: NativeRouteKind;
  readonly indexable: boolean;
  readonly dynamic: boolean;
  /** Which localized App Router page owns this route. */
  readonly localizedHandler: LocalizedRouteHandler;
  /** Whether the final preservation snapshot contains all five locale files. */
  readonly catalogAvailable: boolean;
  /** The current sitemap/public URL contract, separate from native readiness. */
  readonly publicationIntent: LocalePublicationIntent;
  /** Migration state for every locale. Only `cutover-ready` may be published. */
  readonly nativeStatus: LocaleNativeStatus;
  readonly knownContradiction: NativeRouteContradiction | null;
}

type PublicationProfile = "all-locales" | "english-only" | "none";

type TranslatedStatusInput =
  | NativeRouteStatus
  | Readonly<Partial<Record<TranslatedLocaleCode, NativeRouteStatus>>>;

interface NativeRouteInput<Id extends string, Path extends string> {
  readonly id: Id;
  readonly path: Path;
  readonly kind?: NativeRouteKind;
  readonly indexable?: boolean;
  readonly dynamic?: boolean;
  readonly localizedHandler?: LocalizedRouteHandler;
  readonly catalogAvailable?: boolean;
  readonly publication?: PublicationProfile;
  readonly translatedStatus?: TranslatedStatusInput;
  readonly knownContradiction?: NativeRouteContradiction;
}

function createPublicationIntent(
  profile: PublicationProfile,
): LocalePublicationIntent {
  const translated = profile === "all-locales";

  return Object.freeze({
    "en-US": profile !== "none",
    "es-ES": translated,
    "pt-BR": translated,
    "fr-FR": translated,
    "de-DE": translated,
    "ja-JP": translated,
  });
}

function translatedStatusForLocale(
  input: TranslatedStatusInput | undefined,
  locale: TranslatedLocaleCode,
  fallback: NativeRouteStatus,
): NativeRouteStatus {
  if (!input) return fallback;
  if (typeof input === "string") return input;
  return input[locale] ?? fallback;
}

function createNativeStatus(
  input: NativeRouteInput<string, string>,
  kind: NativeRouteKind,
  catalogAvailable: boolean,
): LocaleNativeStatus {
  const requiresStructuredMapping =
    kind === "structured-breathing" || kind === "structured-use-case";
  const translatedFallback: NativeRouteStatus =
    requiresStructuredMapping || !catalogAvailable
      ? "mapping-required"
      : "catalog-only";

  return Object.freeze({
    "en-US": "semantic-ready",
    "es-ES": translatedStatusForLocale(
      input.translatedStatus,
      "es-ES",
      translatedFallback,
    ),
    "pt-BR": translatedStatusForLocale(
      input.translatedStatus,
      "pt-BR",
      translatedFallback,
    ),
    "fr-FR": translatedStatusForLocale(
      input.translatedStatus,
      "fr-FR",
      translatedFallback,
    ),
    "de-DE": translatedStatusForLocale(
      input.translatedStatus,
      "de-DE",
      translatedFallback,
    ),
    "ja-JP": translatedStatusForLocale(
      input.translatedStatus,
      "ja-JP",
      translatedFallback,
    ),
  });
}

function defineRoute<const Id extends string, const Path extends string>(
  input: NativeRouteInput<Id, Path>,
): NativeRouteDefinition<Id, Path> {
  const kind = input.kind ?? "bespoke";
  const catalogAvailable = input.catalogAvailable ?? true;

  return Object.freeze({
    id: input.id,
    path: input.path,
    kind,
    indexable: input.indexable ?? true,
    dynamic: input.dynamic ?? false,
    localizedHandler:
      input.localizedHandler ?? (input.dynamic ? "explicit" : "catch-all"),
    catalogAvailable,
    publicationIntent: createPublicationIntent(
      input.publication ?? "all-locales",
    ),
    nativeStatus: createNativeStatus(input, kind, catalogAvailable),
    knownContradiction: input.knownContradiction ?? null,
  });
}

/**
 * The complete current page-route surface: 60 static routes plus the one
 * dynamic `/embed/[slug]` exception. This file is intentionally independent of
 * the preservation catalog so it remains safe to import in client code.
 */
export const NATIVE_ROUTE_MANIFEST = Object.freeze([
  defineRoute({ id: "home", path: "/", translatedStatus: "cutover-ready" }),
  defineRoute({
    id: "1-minute-breathing-exercise",
    path: "/1-minute-breathing-exercise",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "2-minute-breathing-exercise",
    path: "/2-minute-breathing-exercise",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "4-7-8-breathing-for-insomnia",
    path: "/4-7-8-breathing-for-insomnia",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "4-7-8-breathing-timer",
    path: "/4-7-8-breathing-timer",
    localizedHandler: "explicit",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "5-minute-breathing-exercise",
    path: "/5-minute-breathing-exercise",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "about",
    path: "/about",
    localizedHandler: "explicit",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "about-abi",
    path: "/about/abi",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "about-editorial-policy",
    path: "/about/editorial-policy",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "box-breathing-app",
    path: "/box-breathing-app",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "box-breathing-before-presentation",
    path: "/box-breathing-before-presentation",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "brand-lab",
    path: "/brand-lab",
    indexable: false,
    publication: "none",
  }),
  defineRoute({
    id: "breathe",
    path: "/breathe",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-4-7-8",
    path: "/breathe/4-7-8",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-9d-breathwork",
    path: "/breathe/9d-breathwork",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-belly",
    path: "/breathe/belly",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-box",
    path: "/breathe/box",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-breath-of-fire",
    path: "/breathe/breath-of-fire",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe.buteyko",
    path: "/breathe/buteyko",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-coherent",
    path: "/breathe/coherent",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-hope-cartel-9d-breathwork",
    path: "/breathe/hope-cartel-9d-breathwork",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-nadi-shodhana",
    path: "/breathe/nadi-shodhana",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-physiological-sigh",
    path: "/breathe/physiological-sigh",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-pursed-lip",
    path: "/breathe/pursed-lip",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-tummo",
    path: "/breathe/tummo",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-ujjayi",
    path: "/breathe/ujjayi",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathe-wim-hof",
    path: "/breathe/wim-hof",
    kind: "structured-breathing",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathing-app",
    path: "/breathing-app",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathing-exercises-before-surgery",
    path: "/breathing-exercises-before-surgery",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathing-exercises-for-labor",
    path: "/breathing-exercises-for-labor",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "breathing-visualizer",
    path: "/breathing-visualizer",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "coherent-breathing-app",
    path: "/coherent-breathing-app",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "embed",
    path: "/embed",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({ id: "for", path: "/for", translatedStatus: "cutover-ready" }),
  defineRoute({
    id: "for.anxiety",
    path: "/for/anxiety",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-athletes",
    path: "/for/athletes",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-focus",
    path: "/for/focus",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-high-blood-pressure",
    path: "/for/high-blood-pressure",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-holiday-stress",
    path: "/for/holiday-stress",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-huberman",
    path: "/for/huberman",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-kids",
    path: "/for/kids",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-lung-capacity",
    path: "/for/lung-capacity",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-meditation",
    path: "/for/meditation",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-panic-attacks",
    path: "/for/panic-attacks",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-pranayama",
    path: "/for/pranayama",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-pregnancy",
    path: "/for/pregnancy",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-public-speaking",
    path: "/for/public-speaking",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-running",
    path: "/for/running",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-singing",
    path: "/for/singing",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-sleep",
    path: "/for/sleep",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-stress",
    path: "/for/stress",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "for-travel-anxiety",
    path: "/for/travel-anxiety",
    kind: "structured-use-case",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "holiday-breathing-exercises",
    path: "/holiday-breathing-exercises",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "languages",
    path: "/languages",
    publication: "english-only",
  }),
  defineRoute({
    id: "og-preview",
    path: "/og-preview",
    indexable: false,
    publication: "none",
  }),
  defineRoute({
    id: "physiological-sigh-panic-attack",
    path: "/physiological-sigh-panic-attack",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "privacy",
    path: "/privacy",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "sensory-studio",
    path: "/sensory-studio",
    indexable: false,
    catalogAvailable: false,
    publication: "none",
  }),
  defineRoute({
    id: "stats",
    path: "/stats",
    indexable: false,
    localizedHandler: "explicit",
    knownContradiction: "noindex-in-sitemap",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "support",
    path: "/support",
    translatedStatus: "cutover-ready",
  }),
  defineRoute({
    id: "embed-slug",
    path: "/embed/[slug]",
    kind: "dynamic-embed",
    indexable: false,
    dynamic: true,
    catalogAvailable: false,
    publication: "none",
  }),
]);

export type NativeRoute = (typeof NATIVE_ROUTE_MANIFEST)[number];
export type NativeRouteId = NativeRoute["id"];
export type NativeRoutePath = NativeRoute["path"];

function normalizeLookupPath(path: string): string {
  const unprefixed = stripLocalePrefix(path);
  const suffixIndex = unprefixed.search(/[?#]/);
  const pathname =
    suffixIndex === -1 ? unprefixed : unprefixed.slice(0, suffixIndex);

  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

function matchesDynamicPattern(pattern: string, pathname: string): boolean {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathnameSegments = pathname.split("/").filter(Boolean);

  return (
    patternSegments.length === pathnameSegments.length &&
    patternSegments.every(
      (segment, index) =>
        /^\[[^/]+\]$/.test(segment) || segment === pathnameSegments[index],
    )
  );
}

export function getNativeRouteById(id: string): NativeRoute | null {
  return NATIVE_ROUTE_MANIFEST.find((route) => route.id === id) ?? null;
}

/** Resolve both canonical and locale-prefixed paths, including embed slugs. */
export function getNativeRouteByPath(path: string): NativeRoute | null {
  const pathname = normalizeLookupPath(path);
  const exact = NATIVE_ROUTE_MANIFEST.find((route) => route.path === pathname);
  if (exact) return exact;

  return (
    NATIVE_ROUTE_MANIFEST.find(
      (route) => route.dynamic && matchesDynamicPattern(route.path, pathname),
    ) ?? null
  );
}

function resolveRoute(
  route: NativeRouteDefinition | NativeRouteId | NativeRoutePath | string,
): NativeRouteDefinition | null {
  if (typeof route !== "string") return route;
  return route.startsWith("/")
    ? getNativeRouteByPath(route)
    : getNativeRouteById(route);
}

export function isLocalePublicationIntended(
  route: NativeRouteDefinition | NativeRouteId | NativeRoutePath | string,
  locale: LocaleCode,
): boolean {
  return resolveRoute(route)?.publicationIntent[locale] ?? false;
}

export function isLocaleSemanticReady(
  route: NativeRouteDefinition | NativeRouteId | NativeRoutePath | string,
  locale: LocaleCode,
): boolean {
  const status = resolveRoute(route)?.nativeStatus[locale];
  return (
    status === "semantic-ready" ||
    status === "preview" ||
    status === "cutover-ready"
  );
}

/**
 * Side-by-side preview is available only after the explicit preview gate. It
 * still respects the intended public route matrix and never admits dynamic
 * exceptions through the localized static route tree.
 */
export function isNativeRoutePreviewable(
  route: NativeRouteDefinition | NativeRouteId | NativeRoutePath | string,
  locale: LocaleCode,
): boolean {
  const definition = resolveRoute(route);
  if (!definition || locale === DEFAULT_LOCALE || definition.dynamic)
    return false;

  const status = definition.nativeStatus[locale];
  return (
    definition.publicationIntent[locale] &&
    (status === "preview" || status === "cutover-ready")
  );
}

/**
 * Production publication is deliberately strict. Preview and semantic-ready
 * content are not public, dynamic exceptions are not emitted as static routes,
 * and a route-locale pair must also belong to the preserved public contract.
 */
export function isNativeRoutePublished(
  route: NativeRouteDefinition | NativeRouteId | NativeRoutePath | string,
  locale: LocaleCode,
): boolean {
  const definition = resolveRoute(route);
  if (!definition || locale === DEFAULT_LOCALE || definition.dynamic)
    return false;

  return (
    definition.publicationIntent[locale] &&
    definition.nativeStatus[locale] === "cutover-ready"
  );
}

/** A translated locale is cut over only when every intended static route is. */
export function isNativeLocalePublished(locale: LocaleCode): boolean {
  if (locale === DEFAULT_LOCALE) return false;

  const intendedStaticRoutes = NATIVE_ROUTE_MANIFEST.filter(
    (route) => !route.dynamic && route.publicationIntent[locale],
  );

  return (
    intendedStaticRoutes.length > 0 &&
    intendedStaticRoutes.every((route) => isNativeRoutePublished(route, locale))
  );
}

/**
 * Keep an internal link in the active locale only when the target exists in
 * that serving mode. During partial previews, incomplete targets deliberately
 * fall back to their working English URL instead of advertising a localized 404.
 */
export function resolveNativeInternalHref(
  path: string,
  locale: LocaleCode,
  mode: NativeLinkMode,
): string {
  if (path.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(path)) return path;

  const englishPath = stripLocalePrefix(path);
  if (locale === DEFAULT_LOCALE) return englishPath;

  const route = getNativeRouteByPath(englishPath);
  if (!route) return englishPath;
  const available =
    mode === "native-preview"
      ? isNativeRoutePreviewable(route, locale)
      : isNativeRoutePublished(route, locale);

  return available ? localizePathname(englishPath, locale) : englishPath;
}

/** Small availability list safe to serialize into locale-aware client islands. */
export function getNativeLocalizedRoutePaths(
  locale: LocaleCode,
  mode: NativeLinkMode,
): readonly string[] {
  if (locale === DEFAULT_LOCALE) return Object.freeze([]);
  const isAvailable =
    mode === "native-preview"
      ? isNativeRoutePreviewable
      : isNativeRoutePublished;

  return Object.freeze(
    NATIVE_ROUTE_MANIFEST.filter(
      (route) => !route.dynamic && isAvailable(route, locale),
    ).map((route) => route.path),
  );
}

export interface LocalizedStaticParam {
  /** Public URL segment, such as `es`, never the unprefixed English locale. */
  readonly locale: string;
  /** Canonical route segments for an optional catch-all localized route. */
  readonly segments: readonly string[];
}

function buildLocalizedStaticParams(
  routes: readonly NativeRouteDefinition[],
  isIncluded: (route: NativeRouteDefinition, locale: LocaleCode) => boolean,
): readonly LocalizedStaticParam[] {
  const params: LocalizedStaticParam[] = [];

  for (const route of routes) {
    if (route.dynamic || route.localizedHandler !== "catch-all") continue;

    for (const locale of TRANSLATED_LOCALES) {
      if (!isIncluded(route, locale.code)) continue;

      params.push(
        Object.freeze({
          locale: getLocale(locale.code).routePrefix,
          segments: Object.freeze(route.path.split("/").filter(Boolean)),
        }),
      );
    }
  }

  return Object.freeze(params);
}

/** Generate route params for explicit preview and cutover-ready pairs. */
export function getPreviewLocalizedStaticParams(
  routes: readonly NativeRouteDefinition[] = NATIVE_ROUTE_MANIFEST,
): readonly LocalizedStaticParam[] {
  return buildLocalizedStaticParams(routes, isNativeRoutePreviewable);
}

/**
 * Generate only production-cutover locale-route pairs. Returning an empty list
 * until a pair reaches `cutover-ready` is the fail-closed default.
 */
export function getLocalizedStaticParams(
  routes: readonly NativeRouteDefinition[] = NATIVE_ROUTE_MANIFEST,
): readonly LocalizedStaticParam[] {
  return buildLocalizedStaticParams(routes, isNativeRoutePublished);
}
