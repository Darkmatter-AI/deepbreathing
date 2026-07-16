import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_LOCALE,
  LOCALES,
  SUPPORTED_LOCALES,
  TRANSLATED_LOCALES,
  buildHreflangAlternates,
  buildLocalizedUrl,
  getLocale,
  getLocaleByPrefix,
  getLocaleFromPathname,
  getLocalePathPrefix,
  isLocaleCode,
  localizePathname,
  resolveLocaleCode,
  stripLocalePrefix,
} from "../../src/i18n/index.ts";

const SITE_URL = "https://deepbreathingexercises.com";

test("locale registry defines the six native locales in display order", () => {
  assert.deepEqual(SUPPORTED_LOCALES, [
    "en-US",
    "es-ES",
    "pt-BR",
    "fr-FR",
    "de-DE",
    "ja-JP",
  ]);
  assert.equal(DEFAULT_LOCALE, "en-US");
  assert.equal(LOCALES.length, 6);
  assert.equal(TRANSLATED_LOCALES.length, 5);
  assert.deepEqual(
    LOCALES.map(({ routePrefix }) => routePrefix),
    ["", "es", "pt", "fr", "de", "ja"]
  );
});

test("locale definitions own labels, direction, HTML language, and hreflang", () => {
  assert.deepEqual(getLocale("pt-BR"), {
    code: "pt-BR",
    language: "pt",
    routePrefix: "pt",
    label: "Portuguese (Brazil)",
    nativeLabel: "Português (Brasil)",
    shortLabel: "PT",
    hreflang: "pt-BR",
    htmlLang: "pt-BR",
    direction: "ltr",
  });
  assert.equal(getLocale("ja-JP").nativeLabel, "日本語");
  assert.ok(LOCALES.every(({ direction }) => direction === "ltr"));
});

test("locale resolution accepts tags, legacy casing, primary codes, and prefixes", () => {
  assert.equal(resolveLocaleCode("pt_BR"), "pt-BR");
  assert.equal(resolveLocaleCode("/ES/"), "es-ES");
  assert.equal(resolveLocaleCode("ja-jp"), "ja-JP");
  assert.equal(resolveLocaleCode("fr"), "fr-FR");
  assert.equal(resolveLocaleCode("it"), null);
  assert.equal(isLocaleCode("de-DE"), true);
  assert.equal(isLocaleCode("de-de"), false);
  assert.equal(getLocaleByPrefix(""), getLocale("en-US"));
  assert.equal(getLocaleByPrefix("/ja/")?.code, "ja-JP");
  assert.equal(getLocaleByPrefix("it"), null);
  assert.throws(() => getLocale("it-IT"), /Unsupported locale/);
});

test("URL prefixes keep English unprefixed and translations short", () => {
  assert.equal(getLocalePathPrefix("en-US"), "");
  assert.equal(getLocalePathPrefix("es-ES"), "/es");
  assert.equal(getLocaleFromPathname("/de/breathe/box").code, "de-DE");
  assert.equal(getLocaleFromPathname("/design-system").code, "en-US");
});

test("stripLocalePrefix is segment-safe and repairs repeated locale prefixes", () => {
  assert.equal(stripLocalePrefix("/es"), "/");
  assert.equal(stripLocalePrefix("/es/"), "/");
  assert.equal(stripLocalePrefix("/ja/breathe/box"), "/breathe/box");
  assert.equal(stripLocalePrefix("/de/es/breathe/box"), "/breathe/box");
  assert.equal(stripLocalePrefix("/esoteric"), "/esoteric");
  assert.equal(stripLocalePrefix("es/for/sleep?duration=60#timer"), "/for/sleep?duration=60#timer");
});

test("localizePathname replaces locale prefixes without losing query or hash", () => {
  assert.equal(localizePathname("/breathe/box", "es-ES"), "/es/breathe/box");
  assert.equal(localizePathname("/es/breathe/box", "pt-BR"), "/pt/breathe/box");
  assert.equal(localizePathname("/de/es/breathe/box", "ja-JP"), "/ja/breathe/box");
  assert.equal(localizePathname("/fr/for/sleep?duration=60#timer", "en-US"), "/for/sleep?duration=60#timer");
  assert.equal(localizePathname("/", "de-DE"), "/de");
  assert.equal(localizePathname("/?ref=home", "fr-FR"), "/fr?ref=home");
});

test("absolute localized URLs have canonical homepage slash behavior", () => {
  assert.equal(buildLocalizedUrl(`${SITE_URL}/ignored`, "/", "en-US"), `${SITE_URL}/`);
  assert.equal(buildLocalizedUrl(SITE_URL, "/", "es-ES"), `${SITE_URL}/es`);
  assert.equal(
    buildLocalizedUrl(SITE_URL, "/ja/breathe/box?duration=60", "de-DE"),
    `${SITE_URL}/de/breathe/box?duration=60`
  );
});

test("hreflang alternates share one canonical path and include x-default", () => {
  assert.deepEqual(buildHreflangAlternates(SITE_URL, "/es/breathe/box"), {
    "en-US": `${SITE_URL}/breathe/box`,
    "x-default": `${SITE_URL}/breathe/box`,
    "es-ES": `${SITE_URL}/es/breathe/box`,
    "pt-BR": `${SITE_URL}/pt/breathe/box`,
    "fr-FR": `${SITE_URL}/fr/breathe/box`,
    "de-DE": `${SITE_URL}/de/breathe/box`,
    "ja-JP": `${SITE_URL}/ja/breathe/box`,
  });

  assert.deepEqual(buildHreflangAlternates(SITE_URL, "/", ["it-IT", "ja-JP"].filter(isLocaleCode)), {
    "en-US": `${SITE_URL}/`,
    "x-default": `${SITE_URL}/`,
    "ja-JP": `${SITE_URL}/ja`,
  });
});

test("pathname helpers reject absolute URLs so host handling stays explicit", () => {
  assert.throws(
    () => localizePathname("https://example.com/es/breathe/box", "fr-FR"),
    /Expected a pathname/
  );
});
