"use client";

import { useEffect, useState, useRef } from "react";
import { createRuntimePhraseResolver } from "@/components/resonance/runtime-phrases";

interface MTConfig {
  supportedLocales: string[];
  defaultLang: string;
  urlMode: string;
  lang: string;
  path: string;
}

declare global {
  interface Window {
    __MT_CONFIG__?: MTConfig;
  }
}

const SUPPORTED_LOCALES = ["es-es", "pt-br", "fr-fr", "de-de", "ja-jp"];

const LOCALE_SHORT: Record<string, string> = {
  en: "EN",
  "es-es": "ES",
  "pt-br": "PT",
  "fr-fr": "FR",
  "de-de": "DE",
  "ja-jp": "JA",
};

const LOCALE_FULL: Record<string, string> = {
  en: "English",
  "es-es": "Español",
  "pt-br": "Português",
  "fr-fr": "Français",
  "de-de": "Deutsch",
  "ja-jp": "日本語",
};

function getPrefix(locale: string): string {
  return locale.split("-")[0];
}

/** Strip all known locale prefixes from a path to get the English base path. */
function stripLocalePrefix(pathname: string): string {
  for (const loc of SUPPORTED_LOCALES) {
    const prefix = `/${getPrefix(loc)}`;
    if (pathname.startsWith(prefix + "/")) {
      return stripLocalePrefix(pathname.slice(prefix.length));
    }
    if (pathname === prefix) {
      return "/";
    }
  }
  return pathname;
}

/**
 * Routes that exist in English only. These are in the mass-translate proxy's
 * `exclude_paths`, so a localized variant (e.g. /es/languages) is NOT served —
 * the proxy 301s it back to the EN canonical. Linking a locale switcher straight
 * to /{loc}/languages would advertise a URL that just bounces, so for these
 * routes we point each locale at its localized home instead.
 * Keep in sync with the tenant's exclude_paths / EN_ONLY_ROUTES in sitemap-routes.
 */
const EN_ONLY_ROUTES = new Set(["/languages"]);

function isEnOnlyRoute(basePath: string): boolean {
  return EN_ONLY_ROUTES.has(basePath) || [...EN_ONLY_ROUTES].some((r) => basePath.startsWith(r + "/"));
}

/** Build the href for a locale option. EN-only routes route to the localized home. */
function localeHref(prefix: string, basePath: string): string {
  if (isEnOnlyRoute(basePath)) return `/${prefix}`;
  return `/${prefix}${basePath}`;
}

function getCurrentLocaleAndPath(): { currentLocale: string; basePath: string } {
  if (typeof window === "undefined") return { currentLocale: "en", basePath: "/" };

  const config = window.__MT_CONFIG__;
  if (config) {
    // Ensure config.path has no locale prefix (defensive)
    return { currentLocale: config.lang, basePath: stripLocalePrefix(config.path) };
  }

  // Detect from URL
  const pathname = window.location.pathname;
  const basePath = stripLocalePrefix(pathname);

  // If basePath differs from pathname, we had a locale prefix
  if (basePath !== pathname) {
    // Find which locale it was
    for (const loc of SUPPORTED_LOCALES) {
      const prefix = `/${getPrefix(loc)}`;
      if (pathname.startsWith(prefix + "/") || pathname === prefix) {
        return { currentLocale: loc, basePath };
      }
    }
  }

  return { currentLocale: "en", basePath };
}

function explicitLocaleInfo(
  locale?: string,
  basePath?: string,
): { currentLocale: string; basePath: string } | null {
  if (!locale || !basePath) return null;
  const normalized = locale.toLowerCase() === "en-us" ? "en" : locale.toLowerCase();
  return { currentLocale: normalized, basePath: stripLocalePrefix(basePath) };
}

interface LanguageSwitcherProps {
  basePath?: string;
  locale?: string;
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

/**
 * Inline language switcher for the Resonance header.
 * Shows just "PT" (or current locale) left of Settings — no extra chrome.
 * Click opens a dropdown with all languages.
 */
export function LanguageSwitcherInline({ basePath, locale }: LanguageSwitcherProps = {}) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<{ currentLocale: string; basePath: string } | null>(
    () => explicitLocaleInfo(locale, basePath),
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInfo(explicitLocaleInfo(locale, basePath) ?? getCurrentLocaleAndPath());
  }, [basePath, locale]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!info) return null;

  const currentShort = LOCALE_SHORT[info.currentLocale] || "EN";
  const changeLanguageLabel = createRuntimePhraseResolver(locale ?? info.currentLocale)
    .resolve("ui.change_language").text;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/80 px-2.5 py-2.5 text-xs font-semibold uppercase text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-card dark:border-border/40 dark:bg-card/40 dark:text-card-foreground"
        aria-label={changeLanguageLabel}
      >
        {currentShort}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[120px] rounded-xl border border-border/60 bg-card/95 py-1 shadow-lg backdrop-blur-md dark:border-border/40 dark:bg-card/80">
          <a
            href={info.basePath}
            className={`block w-full text-left px-4 py-2 text-xs transition-colors ${
              info.currentLocale === "en"
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            English
          </a>
          {SUPPORTED_LOCALES.map((loc) => {
            const prefix = getPrefix(loc);
            const isActive = info.currentLocale === loc || getPrefix(info.currentLocale) === prefix;
            return (
              <a
                key={loc}
                href={localeHref(prefix, info.basePath)}
                className={`block w-full text-left px-4 py-2 text-xs transition-colors ${
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {LOCALE_FULL[loc]}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Footer-style language switcher — inline links.
 * Minimized: globe that expands to show all locales.
 *
 * Note: the mass-translate reverse proxy rewrites anchor hrefs (both
 * relative and absolute on the canonical host) to prefix the current
 * locale. Server-rendering anchors here leaks broken paths like
 * /de/es into translated pages, which would generate crawler 404s.
 * We therefore gate the whole switcher on client-side hydration; for
 * crawl-discovery of translated pages, rely on hreflang metadata and
 * any server-rendered anchors added in page-level components where
 * the build pathway is proxy-safe.
 */
export function LanguageSwitcherFooter({ basePath, locale }: LanguageSwitcherProps = {}) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<{ currentLocale: string; basePath: string } | null>(
    () => explicitLocaleInfo(locale, basePath),
  );

  useEffect(() => {
    setInfo(explicitLocaleInfo(locale, basePath) ?? getCurrentLocaleAndPath());
  }, [basePath, locale]);

  if (!info) return null;

  const currentLabel = LOCALE_FULL[info.currentLocale] || "English";
  const locales = SUPPORTED_LOCALES;
  const changeLanguageLabel = createRuntimePhraseResolver(locale ?? info.currentLocale)
    .resolve("ui.change_language").text;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label={changeLanguageLabel}
      >
        <GlobeIcon />
        <span>{currentLabel}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
      <GlobeIcon className="opacity-60" />
      <a
        href={info.basePath}
        className={`transition-colors ${
          info.currentLocale === "en"
            ? "font-medium text-foreground"
            : "underline underline-offset-2 hover:text-foreground"
        }`}
      >
        English
      </a>
      {locales.map((loc) => {
        const prefix = getPrefix(loc);
        const isActive = info.currentLocale === loc || getPrefix(info.currentLocale) === prefix;
        return (
          <a
            key={loc}
            href={localeHref(prefix, info.basePath)}
            className={`transition-colors ${
              isActive
                ? "font-medium text-foreground"
                : "underline underline-offset-2 hover:text-foreground"
            }`}
          >
            {LOCALE_FULL[loc]}
          </a>
        );
      })}
    </div>
  );
}
