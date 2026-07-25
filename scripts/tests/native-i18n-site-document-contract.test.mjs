import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROOT_LAYOUT_PATH = path.join(ROOT, "src", "app", "(site-en)", "layout.tsx");
const SITE_DOCUMENT_PATH = path.join(
  ROOT,
  "src",
  "components",
  "layout",
  "site-document.tsx"
);

const rootLayoutSource = fs.readFileSync(ROOT_LAYOUT_PATH, "utf8");
const siteDocumentSource = fs.readFileSync(SITE_DOCUMENT_PATH, "utf8");

function assertAppearsInOrder(source, fragments) {
  let previousIndex = -1;

  for (const fragment of fragments) {
    const index = source.indexOf(fragment);
    assert.notEqual(index, -1, `missing expected document element: ${fragment}`);
    assert.ok(index > previousIndex, `${fragment} must keep its document order`);
    previousIndex = index;
  }
}

test("root layout keeps metadata and selects the English document explicitly", () => {
  assert.match(rootLayoutSource, /import "\.\.\/globals\.css";/);
  assert.match(rootLayoutSource, /export const metadata: Metadata =/);
  assert.match(
    rootLayoutSource,
    /return <SiteDocument htmlLang="en">\{children\}<\/SiteDocument>;/,
    "the unprefixed root must retain its current HTML language without inferring it"
  );
  assert.doesNotMatch(rootLayoutSource, /<html\b|<body\b/);
  assert.doesNotMatch(rootLayoutSource, /direction=/, "English must not gain a dir attribute in this refactor");
});

test("SiteDocument remains a server component with explicit document locale inputs", () => {
  assert.doesNotMatch(
    siteDocumentSource,
    /^\s*["']use client["'];?/m,
    "the shared document must not create a client boundary"
  );
  assert.match(siteDocumentSource, /htmlLang: string;/);
  assert.match(siteDocumentSource, /direction\?: "ltr" \| "rtl";/);
  assert.match(
    siteDocumentSource,
    /<html lang=\{htmlLang\} dir=\{direction\} suppressHydrationWarning>/
  );
  assert.match(
    siteDocumentSource,
    /<body className=\{`\$\{fontSans\.variable\} min-h-screen bg-background text-foreground`\}>/
  );
  assert.match(
    siteDocumentSource,
    /Inter\(\{ subsets: \["latin"\], variable: "--font-sans" \}\)/
  );
});

test("SiteDocument preserves every output-affecting global in its original order", () => {
  assertAppearsInOrder(siteDocumentSource, [
    '<Script id="resonance-theme-init" strategy="beforeInteractive">',
    // The two GA <Script> tags that used to sit here were extracted into the
    // GoogleAnalyticsScript component; order relative to the rest is unchanged.
    '<GoogleAnalyticsScript />',
    '<Suspense fallback={null}>',
    '<PageViewTracker />',
    'src="https://analytics.ahrefs.com/analytics.js"',
    '<AuthProvider>',
    '<SeasonalBanner disabled={disableSeasonalBanner} />',
    "{children}",
    '<Analytics />',
    '<SpeedInsights />',
  ]);

  assert.match(
    siteDocumentSource,
    /storageKey='resonance_theme'.*root\.dataset\.theme=theme;/s,
    "theme initialization must remain before hydration"
  );
  // GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT moved with the <Script> tags into
  // GoogleAnalyticsScript.tsx; ga-script-gating.test.mjs asserts it there.
  assert.match(
    siteDocumentSource,
    /import \{ GoogleAnalyticsScript \} from "@\/components\/analytics\/GoogleAnalyticsScript";/
  );
  assert.match(siteDocumentSource, /data-key="uzrT\/cO760nX502p37kP0g"/);
  assert.match(
    siteDocumentSource,
    /<Suspense fallback=\{null\}>\s*<PageViewTracker \/>\s*<\/Suspense>/s
  );
  assert.match(
    siteDocumentSource,
    /<AuthProvider>\s*<SeasonalBanner disabled=\{disableSeasonalBanner\} \/>\s*\{children\}\s*<\/AuthProvider>/s
  );
});
