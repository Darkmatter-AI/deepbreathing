"use client";

import { useEffect, useState, useRef } from "react";
import { createRuntimePhraseResolver } from "@/components/resonance/runtime-phrases";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getLocale,
  getLocaleFromPathname,
  localizePathname,
  resolveLocaleCode,
  stripLocalePrefix,
  type LocaleCode,
} from "@/i18n";
import {
  getNativeRouteByPath,
  isNativeRoutePublished,
  resolveNativeInternalHref,
} from "@/i18n/route-manifest";

declare global {
  interface Window {
    __MT_CONFIG__?: {
      lang?: string;
      supportedLocales?: readonly string[];
    };
  }
}

const TRANSLATED_LOCALES = LOCALES.filter(
  (locale) => locale.code !== DEFAULT_LOCALE,
);

type LocaleInfo = { currentLocale: LocaleCode; basePath: string };

/**
 * Routes that exist in English only. Pointing these options at each locale's
 * published home avoids a localized URL that cannot be served.
 */
const EN_ONLY_ROUTES = new Set(["/languages"]);

function isEnOnlyRoute(basePath: string): boolean {
  return EN_ONLY_ROUTES.has(basePath) || [...EN_ONLY_ROUTES].some((r) => basePath.startsWith(r + "/"));
}

function getDisplayedLocales(basePath: string) {
  const configuredLocales =
    typeof window === "undefined"
      ? undefined
      : window.__MT_CONFIG__?.supportedLocales;
  const configuredCodes = configuredLocales
    ? new Set(
        configuredLocales
          .map((value) => resolveLocaleCode(value))
          .filter((code): code is LocaleCode => code !== null),
      )
    : null;
  const candidates = configuredCodes
    ? TRANSLATED_LOCALES.filter((locale) => configuredCodes.has(locale.code))
    : TRANSLATED_LOCALES;

  const route = getNativeRouteByPath(
    isEnOnlyRoute(basePath) ? "/" : basePath,
  );
  if (!route) {
    // MassTranslate can serve dynamic proxy routes that are deliberately not
    // admitted to the static native manifest. Preserve those old options only
    // when the proxy has explicitly configured them.
    return configuredCodes ? candidates : [];
  }

  if (route.dynamic && configuredCodes) return candidates;
  return candidates.filter((locale) =>
    isNativeRoutePublished(route, locale.code),
  );
}

/** Build a locale option without linking to an unavailable native route. */
function localeHref(locale: LocaleCode, basePath: string): string {
  if (isEnOnlyRoute(basePath)) return localizePathname("/", locale);
  return resolveNativeInternalHref(basePath, locale, "native");
}

function getCurrentLocaleAndPath(): LocaleInfo {
  if (typeof window === "undefined") {
    return { currentLocale: DEFAULT_LOCALE, basePath: "/" };
  }

  const pathname = window.location.pathname;
  return {
    currentLocale: getLocaleFromPathname(pathname).code,
    basePath: stripLocalePrefix(pathname),
  };
}

function explicitLocaleInfo(
  locale?: string,
  basePath?: string,
): LocaleInfo | null {
  if (!locale || !basePath) return null;
  const code = resolveLocaleCode(locale);
  if (!code) return null;
  return { currentLocale: code, basePath: stripLocalePrefix(basePath) };
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
  const [info, setInfo] = useState<LocaleInfo | null>(
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

  const currentShort = getLocale(info.currentLocale).shortLabel;
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
              info.currentLocale === DEFAULT_LOCALE
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            English
          </a>
          {getDisplayedLocales(info.basePath).map((loc) => {
            const isActive = info.currentLocale === loc.code;
            return (
              <a
                key={loc.code}
                href={localeHref(loc.code, info.basePath)}
                className={`block w-full text-left px-4 py-2 text-xs transition-colors ${
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {loc.nativeLabel}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Footer-style language switcher, inline links.
 * Minimized: globe that expands to show all locales.
 *
 * This stays client-side because the switcher is an interactive control. It
 * only offers locales whose current route is published, while proxy pages use
 * the proxy's configured locale list for dynamic legacy routes.
 */
export function LanguageSwitcherFooter({ basePath, locale }: LanguageSwitcherProps = {}) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<LocaleInfo | null>(
    () => explicitLocaleInfo(locale, basePath),
  );

  useEffect(() => {
    setInfo(explicitLocaleInfo(locale, basePath) ?? getCurrentLocaleAndPath());
  }, [basePath, locale]);

  if (!info) return null;

  const currentLabel = getLocale(info.currentLocale).nativeLabel;
  const locales = getDisplayedLocales(info.basePath);
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
          info.currentLocale === DEFAULT_LOCALE
            ? "font-medium text-foreground"
            : "underline underline-offset-2 hover:text-foreground"
        }`}
      >
        English
      </a>
      {locales.map((loc) => {
        const isActive = info.currentLocale === loc.code;
        return (
          <a
            key={loc.code}
            href={localeHref(loc.code, info.basePath)}
            className={`transition-colors ${
              isActive
                ? "font-medium text-foreground"
                : "underline underline-offset-2 hover:text-foreground"
            }`}
          >
            {loc.nativeLabel}
          </a>
        );
      })}
    </div>
  );
}
