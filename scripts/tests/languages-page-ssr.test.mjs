import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LANGUAGES_HTML = path.join(
  ROOT,
  ".next",
  "server",
  "app",
  "languages.html",
);
const HOMEPAGE_HTML = path.join(ROOT, ".next", "server", "app", "index.html");
const BUILD_MARKER = LANGUAGES_HTML;

// These assertions read real Next build output, so they can only run after
// `pnpm build`. They are skipped (not failed) on a clean tree so `pnpm test`
// is meaningful without a build; `pnpm run test:post-build` runs them for real.
const NEEDS_BUILD = { skip: fs.existsSync(BUILD_MARKER) ? false : "requires `pnpm build` output (.next/server/app)" };

const SITE_URL = "https://deepbreathingexercises.com";
const LOCALE_PREFIXES = ["/es", "/pt", "/fr", "/de", "/ja"];
const KEY_PATHS = [
  "/",
  "/breathe",
  "/for",
  "/breathing-visualizer",
  "/breathing-app",
  "/4-7-8-breathing-timer",
  "/box-breathing-app",
  "/coherent-breathing-app",
  "/breathe/4-7-8",
  "/breathe/box",
  "/breathe/buteyko",
  "/breathe/coherent",
  "/breathe/tummo",
  "/breathe/ujjayi",
  "/breathe/wim-hof",
  "/breathe/physiological-sigh",
  "/breathe/belly",
  "/breathe/breath-of-fire",
  "/breathe/nadi-shodhana",
  "/breathe/pursed-lip",
  "/for/anxiety",
  "/for/panic-attacks",
  "/for/sleep",
  "/for/stress",
  "/for/huberman",
];

function resolveHref(prefix, route) {
  return route === "/"
    ? `${SITE_URL}${prefix || "/"}`
    : `${SITE_URL}${prefix}${route}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("/languages SSR HTML has crawlable anchors to every locale root", NEEDS_BUILD, () => {
  assert.ok(
    fs.existsSync(LANGUAGES_HTML),
    "missing build output for /languages; run `pnpm build` first",
  );
  const html = fs.readFileSync(LANGUAGES_HTML, "utf8");
  for (const prefix of LOCALE_PREFIXES) {
    const pattern = new RegExp(`<a[^>]*href=["']${SITE_URL}${prefix}["']`);
    assert.match(
      html,
      pattern,
      `/languages should include <a href="${SITE_URL}${prefix}"> for crawler discovery`,
    );
  }
  const homeAnchor = new RegExp(`<a[^>]*href=["']${SITE_URL}/["']`);
  assert.match(
    html,
    homeAnchor,
    "/languages should also link to the English homepage",
  );
});

test("/languages SSR HTML preserves every locale and key-page crawl link", NEEDS_BUILD, () => {
  const html = fs.readFileSync(LANGUAGES_HTML, "utf8");
  for (const prefix of ["", ...LOCALE_PREFIXES]) {
    for (const route of KEY_PATHS) {
      const href = resolveHref(prefix, route);
      const pattern = new RegExp(`<a[^>]*href=["']${escapeRegExp(href)}["']`);
      assert.match(html, pattern, `/languages should link to ${href}`);
    }
  }
});

test("/languages SSR HTML renders native labels for translated destinations", NEEDS_BUILD, () => {
  const html = fs.readFileSync(LANGUAGES_HTML, "utf8");
  const expectedLinks = [
    ["/es/breathe/belly", "Respiración abdominal"],
    ["/pt/breathe/pursed-lip", "Respiração com lábios franzidos"],
    ["/fr/breathe/coherent", "Cohérence cardiaque"],
    ["/de/breathe/physiological-sigh", "Physiologischer Seufzer"],
    ["/ja/breathe/tummo", "トゥンモ呼吸法"],
    ["/ja/breathe/physiological-sigh", "生理的ため息"],
    ["/ja/for/huberman", "ヒューバーマンの呼吸プロトコル"],
  ];

  for (const [path, label] of expectedLinks) {
    const pattern = new RegExp(
      `<a[^>]*href=["']${escapeRegExp(`${SITE_URL}${path}`)}["'][^>]*>\\s*${escapeRegExp(label)}\\s*</a>`,
    );
    assert.match(
      html,
      pattern,
      `/languages should render ${label} for ${path}`,
    );
  }

  for (const locale of ["es", "pt", "fr", "de", "ja"]) {
    assert.match(html, new RegExp(`<section[^>]*lang=["']${locale}["']`));
  }
});

test("homepage SSR HTML links to /languages as a discoverable crawl entry", NEEDS_BUILD, () => {
  const html = fs.readFileSync(HOMEPAGE_HTML, "utf8");
  assert.match(
    html,
    /<a[^>]*href=["']\/languages["']/,
    'homepage should expose a visible <a href="/languages"> link for crawlers',
  );
});
