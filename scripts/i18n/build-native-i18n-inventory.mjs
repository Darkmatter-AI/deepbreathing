#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  EDGE_PROXY_LOCALE_PREFIXES,
  buildSitemapEntries,
} from "../../src/lib/seo/sitemap-routes.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "../..");
const SITE_URL = "https://deepbreathingexercises.com";
const INVENTORY_PATH = "docs/native-i18n/INVENTORY.md";
const FIXED_NOW = new Date("2000-01-01T00:00:00.000Z");

const CATALOG_LOCALE_BY_PREFIX = Object.freeze({
  de: "de-de",
  es: "es-es",
  fr: "fr-fr",
  ja: "ja-jp",
  pt: "pt-br",
});

/**
 * Deterministic, platform-independent string order.
 *
 * `localeCompare` uses ICU collation, which treats `/` and `-` as ignorable
 * punctuation and varies with the Node build's ICU data. That made this
 * generator emit a different row order on macOS than on Vercel's Linux, so the
 * checked-in INVENTORY.md could never match a fresh build on both. Compare by
 * code point instead — this file is a snapshot that must be byte-reproducible.
 */
function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

const MARKER_RE =
  /(mass[- ]?translate|masstranslate|mass_translate|edge[_ -]?proxy|reverse proxy|translation proxy|cloudflare[^\n]*proxy|proxy[^\n]*cloudflare|proxy[^\n]*locale|locale[^\n]*proxy|origin\.deepbreathingexercises\.com|\/api\/proxy|__MT_CONFIG__|x-mt-cache)/i;

/**
 * These are deliberately explicit. The marker scan below fails the focused
 * test if a new MassTranslate reference appears without being classified.
 */
export const DEPENDENCY_GROUPS = Object.freeze([
  {
    title: "Edge request path and SEO publication (active)",
    entries: [
      {
        file: "next.config.js",
        marker: "Proxy mode keeps",
        detail:
          "Keeps locale-prefix stripping only in the legacy proxy build mode; native serving modes release those paths to the App Router.",
      },
      {
        file: "src/lib/seo/sitemap-routes.mjs",
        marker: "EDGE_PROXY_LOCALE_PREFIXES",
        detail:
          "Owns the five proxy prefixes, manufactures locale URLs/hreflang, and keeps `/languages` English-only.",
      },
      {
        file: "src/lib/seo/sitemap-routes.ts",
        marker: "EDGE_PROXY_LOCALE_PREFIXES",
        detail: "Typed adapter exposes proxy-specific sitemap constants and URL classification.",
      },
      {
        file: "src/app/sitemap.xml/route.ts",
        marker: "EDGE_PROXY_LOCALE_PREFIXES",
        detail:
          "Publishes locale-prefixed URLs even though the current Next.js app has no native locale route tree.",
      },
      {
        file: "scripts/ping-sitemap.mjs",
        marker: "EDGE_PROXY_LOCALE_PREFIXES",
        detail:
          "Builds the canonical URL allowlist used to fail closed when deriving changed-route IndexNow submissions; the legacy-named constant now represents the five published native locale prefixes.",
      },
      {
        file: "src/app/robots.ts",
        marker: "mass-translate",
        detail:
          "Carries `/api/proxy/` crawl cleanup and query-parameter rules created for proxy canonical behavior.",
      },
      {
        file: "src/app/(site-en)/layout.tsx",
        marker: '<SiteDocument htmlLang="en">',
        detail:
          "The English root explicitly selects the shared document language; the proxy currently changes locale-facing HTML outside the app.",
      },
      {
        file: "src/app/(site-en)/languages/page.tsx",
        marker: "translated pages",
        detail:
          "Hardcodes the locale discovery hub; proxy anchor rewriting is why this route is published only in English.",
      },
    ],
  },
  {
    title: "Browser locale and translated-DOM contracts (active)",
    entries: [
      {
        file: "src/components/language-switcher.tsx",
        marker: "__MT_CONFIG__",
        detail:
          "Reads the injected proxy global, duplicates locale/path logic, and delays links until hydration to avoid rewritten double-prefix URLs.",
      },
      {
        file: "src/components/resonance/runtime-phrases.ts",
        marker: "__MT_CONFIG__",
        detail:
          "Uses the injected language as the first locale signal for the existing interactive phrase catalog.",
      },
      {
        file: "apps/mobile/src/components/breathing-web/runtime-phrases.ts",
        marker: "__MT_CONFIG__",
        detail: "Mobile web-content copy mirrors the same injected-global locale detection.",
      },
      {
        file: "src/components/resonance/Resonance.tsx",
        marker: "createRuntimePhraseResolver",
        detail:
          "Consumes the runtime phrase resolver and reports fallback misses; native routing must provide its locale explicitly.",
      },
      {
        file: "src/components/auth/sign-in-sheet.tsx",
        marker: "detectRuntimeLocale",
        detail: "Detects the proxy-backed runtime locale before resolving sign-in copy.",
      },
      {
        file: "src/components/auth/session-complete-prompt.tsx",
        marker: "detectRuntimeLocale",
        detail: "Detects the proxy-backed runtime locale before resolving conversion-prompt copy.",
      },
      {
        file: "src/lib/share-utm.ts",
        marker: "mass-translate",
        detail:
          "Reads proxy-mutated `document.title` and `<html lang>` because localized meta descriptions are unavailable.",
      },
      {
        file: "src/lib/render-inline-links.tsx",
        marker: "Mass-translate",
        detail:
          "Assumes the proxy preserves citation link URLs; this is compatibility coupling rather than locale detection.",
      },
    ],
  },
  {
    title: "Proxy bypasses for auth, webhooks, and diagnostics (active or externally configured)",
    entries: [
      {
        file: "src/lib/auth-client.ts",
        marker: "origin.deepbreathingexercises.com",
        detail: "Forces browser auth calls to the origin host because the apex proxy mangles responses.",
      },
      {
        file: "src/lib/auth.ts",
        marker: "Cloudflare proxy",
        detail:
          "Retains proxy-driven Better Auth workarounds and trusts the origin host for cross-subdomain callbacks.",
      },
      {
        file: "src/app/api/auth/[...all]/route.ts",
        marker: "origin.deepbreathingexercises.com",
        detail: "Allows the origin host in the auth route CORS contract.",
      },
      {
        file: "apps/mobile/src/auth/auth-client.ts",
        marker: "origin.deepbreathingexercises.com",
        detail: "Pins native-app auth to the proxy-bypass origin host.",
      },
      {
        file: "scripts/check-og-image.sh",
        marker: "origin.deepbreathingexercises.com",
        detail: "Defaults diagnostics to the origin alias rather than the apex.",
      },
      {
        file: ".claude/skills/dbe-accounts-auth/SKILL.md",
        marker: "origin.deepbreathingexercises.com",
        detail: "The auth health runbook explicitly probes the origin callback path.",
      },
    ],
  },
  {
    title: "Serving-mode gating (active)",
    entries: [
      {
        file: "src/i18n/serving-mode.ts",
        marker: "MassTranslate proxy",
        detail:
          "Decides whether the proxy or native i18n serves locales; proxy-only maintenance must be gated behind usesMassTranslateProxy().",
      },
    ],
  },
  {
    title: "Proxy cache and deployment operations (active)",
    entries: [
      {
        file: "src/app/api/warm-cache/route.ts",
        marker: "x-mt-cache",
        detail:
          "Fetches all 337 sitemap URLs in English-then-locale order with a bot UA to populate proxy KV and avoid cold translation timeouts.",
      },
      {
        file: "vercel.json",
        marker: "/api/warm-cache",
        detail: "Runs the proxy-specific cache warmer every two hours.",
      },
    ],
  },
  {
    title: "Generated translation content and build tooling (active until replaced)",
    entries: [
      {
        file: "scripts/build-og-translations.mjs",
        marker: "mass-translate",
        detail: "Scrapes localized apex pages and treats proxy-produced `og:title` as authoritative.",
      },
      {
        file: "package.json",
        marker: "build:og-translations",
        detail: "Exposes the proxy-scraping OG translation build command.",
      },
      {
        file: "src/data/og-translations.json",
        marker: '"source"',
        detail: "Checked-in localized OG-title artifact produced by live-site scraping.",
      },
      {
        file: "src/app/og/route.tsx",
        marker: "ogTranslations",
        detail: "Consumes the proxy-derived OG-title artifact for query-based images.",
      },
      {
        file: "src/app/og/[slug]/route.tsx",
        marker: "ogTranslations",
        detail: "Consumes the proxy-derived OG-title artifact for slug-based images.",
      },
      {
        file: "src/lib/seo/og-scene.tsx",
        marker: "mass-translate",
        detail: "Locale normalization and image-copy assumptions are documented in proxy terms.",
      },
    ],
  },
  {
    title: "Snapshot migration provenance (temporary, not runtime)",
    entries: [
      {
        file: "scripts/i18n/export-masstranslate-catalog.mjs",
        marker: "MASS_TRANSLATE_DATABASE_URL",
        detail:
          "Read-only exporter used to preserve the final production catalog; it is provenance tooling, not a future authoring path.",
      },
      {
        file: "scripts/tests/i18n-catalog-export.test.mjs",
        marker: "MassTranslate",
        detail: "Validates preservation counts, checksums, and translation-record identity.",
      },
      {
        file: "scripts/i18n/catalog-README.md",
        marker: "MassTranslate",
        detail:
          "Documents the immutable snapshot boundary, reproduction command, and rule that native runtime/build code must not contact MassTranslate.",
      },
      {
        file: "scripts/i18n/semantic-proof/README.md",
        marker: "MassTranslate",
        detail:
          "Documents the isolated two-route semantic compiler and its strict separation between build-time catalog evidence and runtime messages.",
      },
      {
        file: "scripts/i18n/semantic-proof/build-semantic-proof.mjs",
        marker: "masstranslate-catalog",
        detail:
          "Compiles approved preservation records into frozen semantic IDs and fail-closed route bundles; it is migration tooling, not a runtime lookup path.",
      },
      {
        file: "scripts/tests/native-i18n-semantic-proof.test.mjs",
        marker: "masstranslate-catalog",
        detail:
          "Pins semantic IDs, provenance separation, deterministic generation, runtime bundle shape, and incomplete-route refusal.",
      },
      {
        file: "scripts/tests/native-i18n-route-shell.test.mjs",
        marker: "legacy proxy",
        detail:
          "Pins the fail-closed serving-mode boundary so proxy, preview, and cutover builds cannot accidentally expose the wrong route set.",
      },
      {
        file: "scripts/tests/next-config-locale-redirects.test.js",
        marker: "proxy mode",
        detail:
          "Pins locale redirect behavior across legacy proxy and native serving modes so stable translated URLs remain reachable.",
      },
      {
        file: "scripts/tests/native-i18n-rw03-embed.test.mjs",
        marker: "__MT_CONFIG__",
        detail:
          "Proves the repository-owned embed generator no longer reads the legacy translation global or proxy locale state.",
      },
      {
        file: "scripts/tests/native-i18n-rw04-trust-pages.test.mjs",
        marker: "__MT_CONFIG__",
        detail:
          "Proves the repository-owned trust-page renderers do not inspect or mutate proxy-translated browser state.",
      },
      {
        file: "scripts/i18n/verify-native-preview-build.mjs",
        marker: "__MT_CONFIG__",
        detail:
          "Post-build migration verifier rejects client-render error fallbacks, legacy translation globals, unsafe crisis numbers, and incomplete locale metadata in proof HTML.",
      },
    ],
  },
  {
    title: "Tests that pin current proxy behavior (rewrite or retire at cutover)",
    entries: [
      {
        file: "scripts/tests/sitemap-coverage.test.mjs",
        marker: "EDGE_PROXY_LOCALE_PREFIXES",
        detail: "Pins proxy-prefixed publication, hreflang, and the English-only `/languages` rule.",
      },
      {
        file: "scripts/tests/warm-cache-locale-split.test.mjs",
        marker: "EDGE_PROXY_LOCALE_PREFIXES",
        detail: "Pins English-versus-proxy URL classification and the five-locale multiplier.",
      },
      {
        file: "scripts/tests/ping-sitemap.test.mjs",
        marker: "site-localized",
        detail:
          "Pins the changed-route IndexNow safety boundary: localized catch-all changes are ambiguous and must submit nothing rather than expanding to locale variants.",
      },
      {
        file: "scripts/tests/languages-page-ssr.test.mjs",
        marker: "LOCALE_PREFIXES",
        detail: "Pins the client-only switcher and hardcoded locale discovery links.",
      },
      {
        file: "scripts/tests/share-utm.test.mjs",
        marker: "proxy-translated",
        detail:
          "Pins share-copy behavior against proxy-mutated page metadata, and separates the proxy-translated buttons from the natively-translated holiday button.",
      },
    ],
  },
  {
    title: "Operational instructions and analytics integrations (mixed active and stale)",
    entries: [
      {
        file: "CLAUDE.md",
        marker: "mass-translate",
        detail: "Canonical project guidance still documents proxy URL semantics and old OAuth context.",
      },
      {
        file: "AGENTS.md",
        marker: "origin.deepbreathingexercises.com",
        detail: "Project environment declares the origin application endpoint.",
      },
      {
        file: ".claude/skills/daily-indexing/SKILL.md",
        marker: "mass-translate",
        detail:
          "Correctly states that MassTranslate submission/OAuth paths are retired for indexing; keep this negative dependency true.",
      },
      {
        file: "docs/runbooks/tools-and-data-sources.md",
        marker: "mass-translate",
        detail:
          "Primary live runbook for proxy cache, signed-webhook bypass, URL semantics, and remaining GSC/Bing fallbacks.",
      },
      {
        file: "docs/runbooks/weekly-funnel-refresh.md",
        marker: "mass-translate",
        detail: "Still contains MassTranslate GSC/Bing synchronization commands and OAuth recovery steps.",
      },
      {
        file: "docs/indexing-queue.md",
        marker: "mass-translate",
        detail: "Contains operational and historical references to MassTranslate URL-submission tools.",
      },
      {
        file: "docs/FUNNEL-DASHBOARD.md",
        marker: "mass-translate",
        detail: "A dated dashboard snapshot names MassTranslate as a prior GSC data source.",
      },
    ],
  },
  {
    title: "App Store submission notes (active)",
    entries: [
      {
        file: "docs/appstore/submission-checklist.md",
        marker: "origin.deepbreathingexercises.com",
        detail:
          "Records that Google sign-in's first page is the origin subdomain, which reviewers see as a domain handoff; documentation only, no runtime dependency.",
      },
    ],
  },
  {
    title: "Historical evidence only (preserve; do not treat as a live dependency)",
    entries: [
      {
        file: "docs/SEO-EXPERIMENTS.md",
        marker: "mass-translate",
        detail: "Permanent experiment history for proxy defects, mitigations, and indexing outcomes.",
      },
      {
        file: "docs/UX-BACKLOG.md",
        marker: "mass-translate",
        detail: "Historical ownership and translation-coverage findings.",
      },
      {
        file: "docs/qa-reports/traction-pages-2026-06-06.md",
        marker: "mass-translate",
        detail: "Production evidence for delayed translation, partial coverage, and hydration failures.",
      },
      {
        file: "docs/research/eeat-citations-2026-05.md",
        marker: "mass-translate",
        detail: "A dated content-research decision record.",
      },
      {
        file: "docs/seo-audit-2026-05-05.md",
        marker: "mass-translate",
        detail: "A dated audit whose MassTranslate observations are historical baseline evidence.",
      },
    ],
  },
]);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function markdownCode(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function formatList(values) {
  return values.length ? values.map(markdownCode).join(", ") : "none";
}

function routeFromPageFile(repoRoot, absoluteFile) {
  const appDir = path.join(repoRoot, "src", "app");
  const relativeDir = path.relative(appDir, path.dirname(absoluteFile));
  const rawSegments = relativeDir ? relativeDir.split(path.sep) : [];
  const routeSegments = rawSegments.filter(
    (segment) =>
      !(segment.startsWith("(") && segment.endsWith(")")) &&
      !segment.startsWith("@") &&
      !segment.startsWith("_"),
  );
  return routeSegments.length ? `/${routeSegments.join("/")}` : "/";
}

function walkFiles(root, predicate) {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile() && predicate(absolute)) {
        files.push(absolute);
      }
    }
  }
  walk(root);
  return files.sort();
}

function pageRobotsState(source) {
  if (/robots\s*:\s*\{[\s\S]{0,300}?index\s*:\s*false\b/.test(source)) return "noindex";
  if (/robots\s*:\s*\{[\s\S]{0,300}?index\s*:\s*true\b/.test(source)) return "index (explicit)";
  return "index (default)";
}

function localizedPath(route, prefix) {
  return route === "/" ? `/${prefix}` : `/${prefix}${route}`;
}

function sourceReference(repoRoot, entry) {
  const absolute = path.join(repoRoot, entry.file);
  if (!fs.existsSync(absolute)) return `${entry.file} (missing)`;
  const lines = fs.readFileSync(absolute, "utf8").split(/\r?\n/);
  const marker = String(entry.marker).toLowerCase();
  const index = lines.findIndex((line) => line.toLowerCase().includes(marker));
  return index >= 0 ? `${entry.file}:${index + 1}` : `${entry.file} (marker missing)`;
}

function shouldSkipMarkerPath(relativePath) {
  return (
    relativePath.startsWith("docs/native-i18n/") ||
    relativePath.startsWith("src/i18n/catalog/") ||
    relativePath.startsWith("src/i18n/content/proof/") ||
    relativePath === "scripts/i18n/build-native-i18n-inventory.mjs" ||
    relativePath === "scripts/tests/native-i18n-inventory.test.mjs" ||
    relativePath.endsWith("package-lock.json") ||
    relativePath === "pnpm-lock.yaml"
  );
}

function scanMarkerFiles(repoRoot) {
  const ignoredDirectories = new Set([
    ".agents",
    ".git",
    ".next",
    ".vercel",
    "node_modules",
    "tmp",
  ]);
  const allowedExtensions = new Set([
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".sh",
    ".toml",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
  ]);
  const matches = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = toPosix(path.relative(repoRoot, absolute));
      if (
        entry.isDirectory() &&
        (
          ignoredDirectories.has(entry.name) ||
          entry.name.startsWith(".next.") ||
          relative.startsWith(".claude/worktrees/")
        )
      ) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.isFile() || !allowedExtensions.has(path.extname(entry.name))) continue;
      if (shouldSkipMarkerPath(relative)) continue;
      const source = fs.readFileSync(absolute, "utf8");
      if (MARKER_RE.test(source)) matches.push(relative);
    }
  }

  walk(repoRoot);
  return matches.sort();
}

export function collectInventory(repoRoot = DEFAULT_REPO_ROOT) {
  const appDir = path.join(repoRoot, "src", "app");
  const pageFiles = walkFiles(appDir, (file) =>
    path.basename(file) === "page.tsx"
      && !toPosix(path.relative(appDir, file)).startsWith("(site-localized)/")
  );
  const pageRecords = pageFiles.map((absoluteFile) => {
    const file = toPosix(path.relative(repoRoot, absoluteFile));
    const route = routeFromPageFile(repoRoot, absoluteFile);
    const source = fs.readFileSync(absoluteFile, "utf8");
    return {
      route,
      file,
      dynamic: route.includes("[") || route.includes("]"),
      robots: pageRobotsState(source),
    };
  });
  const staticPages = pageRecords.filter((record) => !record.dynamic).sort((a, b) => compareStrings(a.route, b.route));
  const dynamicPages = pageRecords.filter((record) => record.dynamic).sort((a, b) => compareStrings(a.route, b.route));

  const sitemapEntries = buildSitemapEntries({
    appDir,
    siteUrl: SITE_URL,
    localePrefixes: EDGE_PROXY_LOCALE_PREFIXES,
    now: FIXED_NOW,
  });
  const publishedPaths = new Set(sitemapEntries.map((entry) => new URL(entry.url).pathname));

  const manifestPath = path.join(repoRoot, "src", "i18n", "catalog", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Catalog manifest is required: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const catalogRoutes = [...manifest.routes].sort((a, b) => compareStrings(a.route, b.route));
  const catalogByRoute = new Map(catalogRoutes.map((entry) => [entry.route, entry]));

  const routes = staticPages.map((page) => {
    const publication = Object.fromEntries([
      ["en", publishedPaths.has(page.route)],
      ...EDGE_PROXY_LOCALE_PREFIXES.map((prefix) => [prefix, publishedPaths.has(localizedPath(page.route, prefix))]),
    ]);
    const localizedCount = EDGE_PROXY_LOCALE_PREFIXES.filter((prefix) => publication[prefix]).length;
    return {
      ...page,
      publication,
      sitemapExcluded: !publication.en,
      englishOnly: publication.en && localizedCount === 0,
      catalog: catalogByRoute.get(page.route) ?? null,
    };
  });

  const appRouteSet = new Set(routes.map((entry) => entry.route));
  const catalogRouteSet = new Set(catalogRoutes.map((entry) => entry.route));
  const sitemapEnglishSet = new Set(routes.filter((entry) => entry.publication.en).map((entry) => entry.route));
  const translatedSitemapSet = new Set(
    routes
      .filter((entry) => EDGE_PROXY_LOCALE_PREFIXES.every((prefix) => entry.publication[prefix]))
      .map((entry) => entry.route),
  );

  const setDifference = (left, right) => [...left].filter((value) => !right.has(value)).sort();
  const markerFiles = scanMarkerFiles(repoRoot);
  const classifiedFiles = new Set(
    DEPENDENCY_GROUPS.flatMap((group) => group.entries.map((entry) => entry.file)),
  );

  return {
    repoRoot,
    manifest,
    routes,
    dynamicPages,
    sitemapEntries,
    catalogRoutes,
    markerFiles,
    unclassifiedMarkerFiles: markerFiles.filter((file) => !classifiedFiles.has(file)),
    discrepancies: {
      appStaticNotCatalog: setDifference(appRouteSet, catalogRouteSet),
      catalogNotAppStatic: setDifference(catalogRouteSet, appRouteSet),
      sitemapEnglishNotCatalog: setDifference(sitemapEnglishSet, catalogRouteSet),
      catalogNotSitemapEnglish: setDifference(catalogRouteSet, sitemapEnglishSet),
      translatedSitemapNotCatalog: setDifference(translatedSitemapSet, catalogRouteSet),
      noindexInSitemap: routes
        .filter((entry) => entry.robots === "noindex" && entry.publication.en)
        .map((entry) => entry.route)
        .sort(),
      englishOnlyCataloged: routes
        .filter((entry) => entry.englishOnly && entry.catalog)
        .map((entry) => entry.route)
        .sort(),
    },
  };
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function routeNote(route) {
  const notes = [];
  if (route.sitemapExcluded) notes.push("sitemap-excluded");
  if (route.englishOnly) notes.push("English-only");
  if (route.robots === "noindex" && route.publication.en) notes.push("noindex-in-sitemap");
  if (route.catalog && route.englishOnly) notes.push("catalog has unpublished locale files");
  if (!route.catalog) notes.push("not in catalog");
  return notes.join("; ") || "-";
}

export function renderInventory(inventory) {
  const {
    repoRoot,
    manifest,
    routes,
    dynamicPages,
    sitemapEntries,
    catalogRoutes,
    markerFiles,
    unclassifiedMarkerFiles,
    discrepancies,
  } = inventory;
  const englishPublished = routes.filter((route) => route.publication.en).length;
  const englishOnly = routes.filter((route) => route.englishOnly).length;
  const translatedEnglish = routes.filter((route) =>
    EDGE_PROXY_LOCALE_PREFIXES.every((prefix) => route.publication[prefix]),
  ).length;
  const noindex = routes.filter((route) => route.robots === "noindex").length;
  const excluded = routes.filter((route) => route.sitemapExcluded).length;
  const localeCounts = Object.fromEntries(
    ["en", ...EDGE_PROXY_LOCALE_PREFIXES].map((locale) => [
      locale,
      routes.filter((route) => route.publication[locale]).length,
    ]),
  );

  const lines = [
    "# Native i18n Phase 0 inventory",
    "",
    "> Generated by `node scripts/i18n/build-native-i18n-inventory.mjs`. Do not hand-edit this file; update the generator and rerun it.",
    "",
    "This is a repository snapshot only. It does not change routing, metadata, sitemap output, translations, proxy configuration, or production traffic.",
    "",
    "## Scope and definitions",
    "",
    "- A **static English page route** is a `src/app/**/page.tsx` route with no dynamic (`[...]`) segment. Route groups, private folders, and parallel-route segments are normalized out.",
    "- **Published** means a URL is emitted by the current `buildSitemapEntries` implementation with `EDGE_PROXY_LOCALE_PREFIXES`.",
    "- **Cataloged** means the final checked-in MassTranslate manifest has a page record for the unprefixed canonical route. A route file can still contain missing placements.",
    "- `robots` is read from explicit page metadata. `index (default)` means the page has no route-level `robots.index` override.",
    "- The inventory reads checked-in files only. Cloudflare routes, Worker/KV settings, DNS, Vercel aliases/env, and third-party webhook destinations remain external state and must be inspected separately before cutover.",
    "",
    "## Snapshot counts",
    "",
    "| Measure | Count |",
    "|---|---:|",
    `| Static English page routes in the app | ${routes.length} |`,
    `| Dynamic page patterns outside the static inventory | ${dynamicPages.length} |`,
    `| English sitemap URLs | ${englishPublished} |`,
    `| English-only sitemap routes | ${englishOnly} |`,
    `| English routes with all five locale variants | ${translatedEnglish} |`,
    `| Sitemap URLs total | ${sitemapEntries.length} |`,
    `| Explicit noindex static routes | ${noindex} |`,
    `| Static routes excluded from the sitemap | ${excluded} |`,
    `| MassTranslate catalog pages | ${manifest.counts.pages} |`,
    `| Catalog route artifacts | ${manifest.counts.artifactFiles - manifest.source.locales.length} |`,
    `| Current source placements | ${manifest.counts.currentPlacements} |`,
    `| Preserved translation records | ${manifest.counts.translationRecords} |`,
    `| Preserved orphan translation records | ${manifest.counts.orphanTranslationRecords} |`,
    "",
    "### Current sitemap publication totals",
    "",
    "| Locale | URL prefix | Published URLs |",
    "|---|---|---:|",
    `| English | none | ${localeCounts.en} |`,
    ...EDGE_PROXY_LOCALE_PREFIXES.map((prefix) =>
      `| ${CATALOG_LOCALE_BY_PREFIX[prefix]} | \`/${prefix}\` | ${localeCounts[prefix]} |`,
    ),
    `| **Total** |  | **${sitemapEntries.length}** |`,
    "",
    "The current multiplier is therefore 55 translated English routes × 5 locale variants + 56 English URLs = 331. `/languages` is the one English-only sitemap route.",
    "",
    "## Excluded, noindex, and English-only routes",
    "",
    "| Route | Robots | Sitemap | Locale publication | Catalog | Why it matters |",
    "|---|---|---|---|---|---|",
    ...routes
      .filter((route) => route.sitemapExcluded || route.robots === "noindex" || route.englishOnly)
      .map((route) => {
        const localePublication = EDGE_PROXY_LOCALE_PREFIXES.some((prefix) => route.publication[prefix])
          ? "all five"
          : "none";
        return `| ${markdownCode(route.route)} | ${route.robots} | ${route.publication.en ? "included" : "excluded"} | ${localePublication} | ${yesNo(route.catalog)} | ${routeNote(route)} |`;
      }),
    "",
    "`/stats` remains publicly available in English and all five locales, but its noindex metadata now agrees with its sitemap exclusion.",
    "",
    "## Static route publication matrix",
    "",
    "| English route | Source page | Robots | EN | ES | PT | FR | DE | JA | Catalog | Notes |",
    "|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|",
    ...routes.map(
      (route) =>
        `| ${markdownCode(route.route)} | ${markdownCode(route.file)} | ${route.robots} | ${yesNo(route.publication.en)} | ${yesNo(route.publication.es)} | ${yesNo(route.publication.pt)} | ${yesNo(route.publication.fr)} | ${yesNo(route.publication.de)} | ${yesNo(route.publication.ja)} | ${yesNo(route.catalog)} | ${routeNote(route)} |`,
    ),
    "",
    "## Dynamic page patterns",
    "",
    "Dynamic pages are intentionally outside the 60-route static matrix and are skipped by current sitemap discovery.",
    "",
    "| Route pattern | Source page | Robots | Sitemap | Catalog |",
    "|---|---|---|---|---|",
    ...dynamicPages.map(
      (page) =>
        `| ${markdownCode(page.route)} | ${markdownCode(page.file)} | ${page.robots} | skipped (dynamic) | ${yesNo(false)} |`,
    ),
    "",
    "## Final MassTranslate catalog page URLs (59)",
    "",
    `Snapshot source: ${markdownCode(manifest.source.tenantId)} through ${markdownCode(manifest.source.snapshotUpdatedThrough)}. Each row has one checked-in artifact for each catalog locale.`,
    "",
    "| # | Canonical URL | Route | Page id | DE | ES | FR | JA | PT |",
    "|---:|---|---|---|:---:|:---:|:---:|:---:|:---:|",
    ...catalogRoutes.map((entry, index) => {
      const localePresence = EDGE_PROXY_LOCALE_PREFIXES.map((prefix) =>
        yesNo(Boolean(entry.files[CATALOG_LOCALE_BY_PREFIX[prefix]])),
      );
      return `| ${index + 1} | ${SITE_URL}${entry.route === "/" ? "/" : entry.route} | ${markdownCode(entry.route)} | ${markdownCode(entry.catalogPageId)} | ${localePresence[3]} | ${localePresence[0]} | ${localePresence[2]} | ${localePresence[4]} | ${localePresence[1]} |`;
    }),
    "",
    "### Catalog completeness by locale",
    "",
    "| Locale | Route files | Placements | Translated placements | Missing placements | Unique translations | Orphans |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...manifest.source.locales.map((locale) => {
      const counts = manifest.localeCounts[locale];
      return `| ${locale} | ${counts.routeFiles} | ${counts.placements} | ${counts.translatedPlacements} | ${counts.missingPlacements} | ${counts.uniqueTranslations} | ${counts.orphanTranslations} |`;
    }),
    "",
    "A `yes` in the route matrix means an artifact exists, not that every placement translated. The native publication gate must fail closed on missing required content instead of silently equating a file with completeness.",
    "",
    "## App, sitemap, and catalog discrepancies",
    "",
    `- App static routes absent from the catalog: ${formatList(discrepancies.appStaticNotCatalog)}.`,
    `- Catalog routes absent from the static app: ${formatList(discrepancies.catalogNotAppStatic)}.`,
    `- English sitemap routes absent from the catalog: ${formatList(discrepancies.sitemapEnglishNotCatalog)}.`,
    `- Catalog routes absent from the English sitemap: ${formatList(discrepancies.catalogNotSitemapEnglish)}.`,
    `- Five-locale sitemap routes absent from the catalog: ${formatList(discrepancies.translatedSitemapNotCatalog)}.`,
    `- Explicit noindex routes still in the sitemap: ${formatList(discrepancies.noindexInSitemap)}.`,
    `- English-only routes that still have five catalog artifacts: ${formatList(discrepancies.englishOnlyCataloged)}.`,
    "",
    "Interpretation:",
    "",
    "1. `/sensory-studio` is the only static app route with no catalog page. It is explicitly noindex and sitemap-excluded.",
    "2. `/brand-lab` and `/og-preview` are cataloged but intentionally sitemap-excluded and noindex.",
    "3. `/stats` is cataloged and translated, but intentionally excluded from the sitemap because its route metadata is noindex.",
    "4. `/languages` is sitemap-published only in English even though the final catalog contains five locale files for it.",
    "5. Every route currently published in all five locale variants has a catalog artifact for every locale. Publication parity is possible without inventing new translated routes.",
    "",
    "## MassTranslate dependency inventory",
    "",
    "The groups below separate live coupling from migration provenance and historical evidence. Removing a historical mention is not a cutover requirement; removing or replacing every active contract is.",
    "",
    ...DEPENDENCY_GROUPS.flatMap((group) => [
      `### ${group.title}`,
      "",
      "| Evidence | Dependency / cutover implication |",
      "|---|---|",
      ...group.entries.map(
        (entry) => `| ${markdownCode(sourceReference(repoRoot, entry))} | ${entry.detail} |`,
      ),
      "",
    ]),
    "### Explicit-marker coverage audit",
    "",
    `The deterministic marker scan found ${markerFiles.length} files with explicit MassTranslate/proxy/origin coupling. All must be classified above.`,
    "",
    `Unclassified marker files: ${formatList(unclassifiedMarkerFiles)}.`,
    "",
    "The marker scan is intentionally supplemented by manually classified indirect dependencies such as the hardcoded root `lang`, OG consumers, Vercel cron, and generated JSON. A future explicit reference that is not classified makes the focused inventory test fail.",
    "",
    "## External state not captured by repository files",
    "",
    "Before traffic cutover, verify these outside the repo rather than inferring them from comments:",
    "",
    "- Cloudflare DNS/routes that put the apex behind the MassTranslate Worker and leave `origin.` as a bypass.",
    "- Worker tenant settings, including `exclude_paths` for `/languages`, query stripping, locale-prefix behavior, crawler allowlists, and KV/cache keys.",
    "- The Resend signed-webhook destination currently documented as the `origin.` host.",
    "- Better Auth and OAuth provider callback URLs, cookies, and Vercel environment values that still name the origin host.",
    "- Any monitors, scheduled jobs, or external MCP consumers that call MassTranslate services but are not configured in this repository.",
    "",
    "## Reproduction and validation",
    "",
    "```bash",
    "node scripts/i18n/build-native-i18n-inventory.mjs --check",
    "node --test scripts/tests/native-i18n-inventory.test.mjs",
    "```",
    "",
    "The first command proves this document matches current source, sitemap code, and catalog manifest. The second pins the key counts, known discrepancies, catalog coverage, and complete dependency classification.",
    "",
  ];

  return lines.join("\n");
}

export function buildInventoryDocument(repoRoot = DEFAULT_REPO_ROOT) {
  return renderInventory(collectInventory(repoRoot));
}

function main() {
  const repoRoot = DEFAULT_REPO_ROOT;
  const outputPath = path.join(repoRoot, INVENTORY_PATH);
  const content = buildInventoryDocument(repoRoot);
  const checkOnly = process.argv.includes("--check");

  if (checkOnly) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== content) {
      console.error(`${INVENTORY_PATH} is stale. Run node scripts/i18n/build-native-i18n-inventory.mjs`);
      process.exitCode = 1;
      return;
    }
    console.log(`${INVENTORY_PATH} is current`);
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);
  console.log(`Wrote ${INVENTORY_PATH}`);
}

if (path.resolve(process.argv[1] ?? "") === path.resolve(SCRIPT_PATH)) {
  main();
}
