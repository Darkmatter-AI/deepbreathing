export const SUPPORTED_LOCALES = [
  "en-US",
  "es-ES",
  "pt-BR",
  "fr-FR",
  "de-DE",
  "ja-JP",
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];
export type LocaleDirection = "ltr" | "rtl";

export interface LocaleDefinition {
  readonly code: LocaleCode;
  readonly language: string;
  readonly routePrefix: string;
  readonly label: string;
  readonly nativeLabel: string;
  readonly shortLabel: string;
  readonly hreflang: LocaleCode;
  readonly htmlLang: LocaleCode;
  readonly direction: LocaleDirection;
}

export const DEFAULT_LOCALE: LocaleCode = "en-US";

const HOME_LABELS: Readonly<Record<LocaleCode, string>> = Object.freeze({
  "en-US": "Home",
  "es-ES": "Inicio",
  "pt-BR": "Início",
  "fr-FR": "Accueil",
  "de-DE": "Startseite",
  "ja-JP": "ホーム",
});

export function getLocalizedHomeLabel(locale: LocaleCode): string {
  return HOME_LABELS[locale];
}

/**
 * The single source of truth for languages the native app can serve.
 *
 * `routePrefix` deliberately omits the leading slash. English stays on the
 * canonical, unprefixed route while every translated locale uses a short URL
 * prefix. `code`, `hreflang`, and `htmlLang` remain full BCP 47 language tags.
 */
export const LOCALES: readonly LocaleDefinition[] = Object.freeze([
  Object.freeze({
    code: "en-US",
    language: "en",
    routePrefix: "",
    label: "English",
    nativeLabel: "English",
    shortLabel: "EN",
    hreflang: "en-US",
    htmlLang: "en-US",
    direction: "ltr",
  }),
  Object.freeze({
    code: "es-ES",
    language: "es",
    routePrefix: "es",
    label: "Spanish",
    nativeLabel: "Español",
    shortLabel: "ES",
    hreflang: "es-ES",
    htmlLang: "es-ES",
    direction: "ltr",
  }),
  Object.freeze({
    code: "pt-BR",
    language: "pt",
    routePrefix: "pt",
    label: "Portuguese (Brazil)",
    nativeLabel: "Português (Brasil)",
    shortLabel: "PT",
    hreflang: "pt-BR",
    htmlLang: "pt-BR",
    direction: "ltr",
  }),
  Object.freeze({
    code: "fr-FR",
    language: "fr",
    routePrefix: "fr",
    label: "French",
    nativeLabel: "Français",
    shortLabel: "FR",
    hreflang: "fr-FR",
    htmlLang: "fr-FR",
    direction: "ltr",
  }),
  Object.freeze({
    code: "de-DE",
    language: "de",
    routePrefix: "de",
    label: "German",
    nativeLabel: "Deutsch",
    shortLabel: "DE",
    hreflang: "de-DE",
    htmlLang: "de-DE",
    direction: "ltr",
  }),
  Object.freeze({
    code: "ja-JP",
    language: "ja",
    routePrefix: "ja",
    label: "Japanese",
    nativeLabel: "日本語",
    shortLabel: "JA",
    hreflang: "ja-JP",
    htmlLang: "ja-JP",
    direction: "ltr",
  }),
]);

export const TRANSLATED_LOCALES = Object.freeze(
  LOCALES.filter((locale) => locale.code !== DEFAULT_LOCALE)
);

const localeByCode = new Map<LocaleCode, LocaleDefinition>(
  LOCALES.map((locale) => [locale.code, locale])
);
const localeByPrefix = new Map(
  LOCALES.filter((locale) => locale.routePrefix).map((locale) => [
    locale.routePrefix,
    locale,
  ])
);

const localeAliases: Readonly<Record<string, LocaleCode>> = Object.freeze(
  LOCALES.reduce<Record<string, LocaleCode>>((aliases, locale) => {
    aliases[locale.code.toLowerCase()] = locale.code;
    aliases[locale.language] = locale.code;
    if (locale.routePrefix) aliases[locale.routePrefix] = locale.code;
    return aliases;
  }, {})
);

function normalizeLocaleAlias(value: string): string {
  return value
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replaceAll("_", "-")
    .toLowerCase();
}

export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === "string" && localeByCode.has(value as LocaleCode);
}

/** Resolve a BCP 47 tag, primary language code, or URL prefix. */
export function resolveLocaleCode(value: string | null | undefined): LocaleCode | null {
  if (!value) return null;
  return localeAliases[normalizeLocaleAlias(value)] ?? null;
}

export function getLocale(value: LocaleCode | string): LocaleDefinition {
  const code = resolveLocaleCode(value);
  const locale = code ? localeByCode.get(code) : undefined;
  if (!locale) throw new RangeError(`Unsupported locale: ${value}`);
  return locale;
}

export function getLocaleByPrefix(prefix: string): LocaleDefinition | null {
  const normalized = normalizeLocaleAlias(prefix);
  if (!normalized) return getLocale(DEFAULT_LOCALE);
  return localeByPrefix.get(normalized) ?? null;
}

/** Return the locale's URL prefix, including the leading slash. */
export function getLocalePathPrefix(locale: LocaleCode | string): string {
  const prefix = getLocale(locale).routePrefix;
  return prefix ? `/${prefix}` : "";
}

interface PathParts {
  pathname: string;
  suffix: string;
}

function splitPath(value: string): PathParts {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
    throw new TypeError("Expected a pathname, not an absolute URL");
  }

  const suffixIndex = value.search(/[?#]/);
  const rawPathname = suffixIndex === -1 ? value : value.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : value.slice(suffixIndex);
  const pathname = `/${rawPathname}`.replace(/^\/+/, "/") || "/";

  return { pathname, suffix };
}

function findPrefixedLocale(pathname: string): LocaleDefinition | null {
  const firstSegment = pathname.split("/", 3)[1] ?? "";
  return localeByPrefix.get(firstSegment.toLowerCase()) ?? null;
}

export function getLocaleFromPathname(path: string): LocaleDefinition {
  const { pathname } = splitPath(path);
  return findPrefixedLocale(pathname) ?? getLocale(DEFAULT_LOCALE);
}

/**
 * Remove every recognized leading locale segment and preserve query/hash data.
 * Removing repeats makes locale replacement idempotent and repairs malformed
 * inputs such as `/de/es/breathe/box` instead of producing another double prefix.
 */
export function stripLocalePrefix(path: string): string {
  const { suffix, ...parts } = splitPath(path);
  let pathname = parts.pathname;

  while (true) {
    const locale = findPrefixedLocale(pathname);
    if (!locale) break;

    const prefix = `/${locale.routePrefix}`;
    pathname = pathname.slice(prefix.length);
    if (!pathname || pathname === "/") pathname = "/";
  }

  return `${pathname}${suffix}`;
}

/** Replace any existing locale prefix with the requested native locale. */
export function localizePathname(path: string, locale: LocaleCode | string): string {
  const basePath = stripLocalePrefix(path);
  const { pathname, suffix } = splitPath(basePath);
  const prefix = getLocalePathPrefix(locale);

  if (!prefix) return `${pathname}${suffix}`;
  if (pathname === "/") return `${prefix}${suffix}`;
  return `${prefix}${pathname}${suffix}`;
}

export function buildLocalizedUrl(
  siteUrl: string,
  path: string,
  locale: LocaleCode | string
): string {
  const baseUrl = new URL(siteUrl);
  const origin = `${baseUrl.protocol}//${baseUrl.host}`;
  return new URL(localizePathname(path, locale), origin).toString();
}

/**
 * Build Next.js-compatible language alternates for a canonical page path.
 * English and x-default are always present even when a route is available in
 * only a subset of translated locales.
 */
export function buildHreflangAlternates(
  siteUrl: string,
  path: string,
  availableLocales: readonly LocaleCode[] = SUPPORTED_LOCALES
): Record<string, string> {
  const basePath = stripLocalePrefix(path);
  const englishUrl = buildLocalizedUrl(siteUrl, basePath, DEFAULT_LOCALE);
  const alternates: Record<string, string> = {
    [getLocale(DEFAULT_LOCALE).hreflang]: englishUrl,
    "x-default": englishUrl,
  };

  for (const localeCode of new Set(availableLocales)) {
    if (localeCode === DEFAULT_LOCALE) continue;
    const locale = getLocale(localeCode);
    alternates[locale.hreflang] = buildLocalizedUrl(siteUrl, basePath, localeCode);
  }

  return alternates;
}
