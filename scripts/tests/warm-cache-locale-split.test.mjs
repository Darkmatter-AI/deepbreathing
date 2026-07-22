import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  buildSitemapEntries,
  isLocaleUrl,
  DEFAULT_EXCLUDED_ROUTES,
  EDGE_PROXY_LOCALE_PREFIXES,
} from '../../src/lib/seo/sitemap-routes.mjs';
import { usesMassTranslateProxy } from '../../src/i18n/serving-mode.ts';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const SITE_URL = 'https://deepbreathingexercises.com';
const WARMER_ROUTE = readFileSync(
  path.join(ROOT, 'src', 'app', 'api', 'warm-cache', 'route.ts'),
  'utf8'
);

// The cache warmer (src/app/api/warm-cache/route.ts) splits sitemap URLs into
// English vs locale so it can warm English origins first, then proxy-served
// locale pages. These tests pin the classifier that split relies on.

test('cache warmer runs only while MassTranslate proxy mode is active', () => {
  assert.equal(usesMassTranslateProxy('proxy'), true);
  assert.equal(usesMassTranslateProxy('native-preview'), false);
  assert.equal(usesMassTranslateProxy('native'), false);
  assert.match(
    WARMER_ROUTE,
    /if \(!usesMassTranslateProxy\(servingMode\)\)[\s\S]*mass-translate-proxy-disabled/
  );
});

test('isLocaleUrl classifies locale-prefixed URLs as locale', () => {
  assert.ok(isLocaleUrl(`${SITE_URL}/es`, SITE_URL));
  assert.ok(isLocaleUrl(`${SITE_URL}/es/breathe/box`, SITE_URL));
  assert.ok(isLocaleUrl(`${SITE_URL}/ja/4-7-8-breathing-timer`, SITE_URL));
});

test('isLocaleUrl classifies English canonical URLs as non-locale', () => {
  assert.ok(!isLocaleUrl(`${SITE_URL}`, SITE_URL));
  assert.ok(!isLocaleUrl(`${SITE_URL}/breathe/box`, SITE_URL));
  // A path that merely starts with a locale code but is not a prefix segment
  // (e.g. /esp...) must not be misclassified.
  assert.ok(!isLocaleUrl(`${SITE_URL}/espanol`, SITE_URL));
});

test('every sitemap URL splits into exactly one bucket, totals match the proxy multiplier', () => {
  const entries = buildSitemapEntries({
    appDir: APP_DIR,
    siteUrl: SITE_URL,
    excludedRoutes: DEFAULT_EXCLUDED_ROUTES,
    localePrefixes: EDGE_PROXY_LOCALE_PREFIXES,
  });
  const urls = entries.map((e) => e.url);

  const localeUrls = urls.filter((u) => isLocaleUrl(u, SITE_URL));
  const englishUrls = urls.filter((u) => !isLocaleUrl(u, SITE_URL));

  // Partition is total and disjoint.
  assert.equal(localeUrls.length + englishUrls.length, urls.length);

  // English-only routes (e.g. /languages) have no locale variants, so the
  // locale count is (english routes that DO get translated) * locale count.
  const enOnlyCount = englishUrls.filter(
    (u) => u === `${SITE_URL}/languages`
  ).length;
  const translatedEnglish = englishUrls.length - enOnlyCount;
  assert.equal(
    localeUrls.length,
    translatedEnglish * EDGE_PROXY_LOCALE_PREFIXES.length,
    'locale URL count should equal translated English routes times the number of locales'
  );
});
