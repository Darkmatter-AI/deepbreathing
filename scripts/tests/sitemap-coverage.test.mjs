import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  buildSitemapEntries,
  discoverPageRoutes,
  DEFAULT_EXCLUDED_ROUTES,
  EDGE_PROXY_LOCALE_PREFIXES,
} from '../../src/lib/seo/sitemap-routes.mjs';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const SITE_URL = 'https://deepbreathingexercises.com';
const FIXED_NOW = new Date('2026-02-19T00:00:00.000Z');

function getEntries() {
  return buildSitemapEntries({
    appDir: APP_DIR,
    siteUrl: SITE_URL,
    excludedRoutes: DEFAULT_EXCLUDED_ROUTES,
    localePrefixes: EDGE_PROXY_LOCALE_PREFIXES,
    now: FIXED_NOW,
  });
}

test('sitemap covers every discoverable page route', () => {
  const expectedRoutes = discoverPageRoutes(APP_DIR, DEFAULT_EXCLUDED_ROUTES);
  const entries = getEntries();

  const actualPathnames = new Set(entries.map((entry) => new URL(entry.url).pathname));

  for (const route of expectedRoutes) {
    assert.ok(actualPathnames.has(route), `missing route in sitemap: ${route}`);
  }
});

test('sitemap has no duplicate URLs', () => {
  const entries = getEntries();

  const urls = entries.map((entry) => entry.url);
  assert.equal(new Set(urls).size, urls.length, 'sitemap contains duplicate URLs');
});

test('sitemap includes translated locale-prefixed URLs when configured', () => {
  const entries = getEntries();
  const actualPathnames = new Set(entries.map((entry) => new URL(entry.url).pathname));

  assert.ok(actualPathnames.has('/es'), 'missing translated home route in sitemap: /es');
  assert.ok(
    actualPathnames.has('/es/breathe/box'),
    'missing translated breathing route in sitemap: /es/breathe/box'
  );
  assert.ok(
    actualPathnames.has('/es/for/anxiety'),
    'missing translated guide route in sitemap: /es/for/anxiety'
  );
});

test('sitemap entries include hreflang alternates for all languages', () => {
  const entries = getEntries();

  const enHome = entries.find((e) => e.url === `${SITE_URL}/`);
  assert.ok(enHome, 'English homepage entry missing');
  assert.ok(enHome.alternates, 'English homepage missing alternates');
  assert.ok(enHome.alternates.languages, 'English homepage missing alternates.languages');

  const langs = enHome.alternates.languages;
  assert.equal(langs['en-US'], `${SITE_URL}/`, 'en-US hreflang should point to root with trailing slash');
  assert.equal(langs['x-default'], `${SITE_URL}/`, 'x-default should point to root with trailing slash');
  assert.equal(langs['es-ES'], `${SITE_URL}/es`, 'es-ES hreflang should point to /es');
  assert.equal(langs['pt-BR'], `${SITE_URL}/pt`, 'pt-BR hreflang should point to /pt');
  assert.equal(langs['fr-FR'], `${SITE_URL}/fr`, 'fr-FR hreflang should point to /fr');
  assert.equal(langs['de-DE'], `${SITE_URL}/de`, 'de-DE hreflang should point to /de');
  assert.equal(langs['ja-JP'], `${SITE_URL}/ja`, 'ja-JP hreflang should point to /ja');

  // Translated entry should have identical alternates
  const esBox = entries.find((e) => e.url === `${SITE_URL}/es/breathe/box`);
  assert.ok(esBox.alternates, '/es/breathe/box missing alternates');
  assert.equal(
    esBox.alternates.languages['en-US'],
    `${SITE_URL}/breathe/box`,
    'es entry en-US alternate should point to English canonical'
  );
  assert.equal(
    esBox.alternates.languages['ja-JP'],
    `${SITE_URL}/ja/breathe/box`,
    'es entry ja-JP alternate should point to /ja/breathe/box'
  );

  // Every entry should have alternates except explicit EN-only routes
  // (/languages is a crawl-discovery hub that must not be served through the
  // mass-translate proxy — otherwise its cross-locale anchors would mangle).
  const EN_ONLY_URLS = new Set([`${SITE_URL}/languages`]);
  const withoutAlternates = entries.filter(
    (e) => !e.alternates && !EN_ONLY_URLS.has(e.url)
  );
  assert.equal(withoutAlternates.length, 0, `${withoutAlternates.length} entries missing alternates`);
});

test('hreflang en-US and x-default targets are self-canonical: must match <loc> URL for home page entries', () => {
  // Regression: buildAlternates previously generated https://site.com (no slash) for
  // the home-page en-US/x-default hreflang while Next.js renders the canonical as
  // https://site.com/ (with slash). Ahrefs flags this mismatch as "hreflang to non-canonical".
  const entries = getEntries();

  const homeEntries = entries.filter((e) => {
    const url = new URL(e.url);
    const isLocaleHome =
      url.pathname === '/' ||
      ['es', 'pt', 'fr', 'de', 'ja'].includes(url.pathname.replace(/^\//, ''));
    return isLocaleHome && e.alternates?.languages;
  });

  assert.ok(homeEntries.length >= 6, 'expected at least 6 home-page entries (en + 5 locales)');

  for (const entry of homeEntries) {
    const enUs = entry.alternates.languages['en-US'];
    const xDefault = entry.alternates.languages['x-default'];
    assert.equal(enUs, `${SITE_URL}/`, `entry ${entry.url}: en-US hreflang must be ${SITE_URL}/`);
    assert.equal(
      xDefault,
      `${SITE_URL}/`,
      `entry ${entry.url}: x-default hreflang must be ${SITE_URL}/`
    );
  }
});

test('home page <loc> URL uses trailing slash to match Next.js rendered canonical', () => {
  const entries = getEntries();
  const enHome = entries.find((e) => {
    const url = new URL(e.url);
    return url.pathname === '/';
  });
  assert.ok(enHome, 'English homepage entry missing');
  assert.equal(enHome.url, `${SITE_URL}/`, `home <loc> must be ${SITE_URL}/ (with slash)`);
});
