import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TRACKER_PATH = path.join(ROOT, "src", "components", "analytics", "PageViewTracker.tsx");
const CONFIG_PATH = path.join(ROOT, "src", "lib", "analytics", "google-analytics.ts");
const LAYOUT_PATH = path.join(ROOT, "src", "app", "(site-en)", "layout.tsx");
const SITE_DOCUMENT_PATH = path.join(
  ROOT,
  "src",
  "components",
  "layout",
  "site-document.tsx"
);

test("PageViewTracker client component exists", () => {
  assert.ok(
    fs.existsSync(TRACKER_PATH),
    `expected client tracker at ${TRACKER_PATH}`
  );
  const src = fs.readFileSync(TRACKER_PATH, "utf8");
  assert.match(src, /["']use client["']/, "must be a client component");
  assert.match(src, /export\s+function\s+PageViewTracker/);
});

test("PageViewTracker fires gtag page_view on path change", () => {
  const src = fs.readFileSync(TRACKER_PATH, "utf8");
  assert.match(src, /usePathname/, "must subscribe to pathname changes");
  assert.match(src, /useSearchParams/, "must support search params");
  assert.match(src, /gtag\s*\(\s*["']event["']\s*,\s*["']page_view["']/, "must emit gtag page_view event");
  assert.match(src, /page_path/, "must send page_path param");
  assert.match(src, /page_location/, "must send page_location param");
});

test("PageViewTracker sends page_path as pathname-only (without search params)", () => {
  const src = fs.readFileSync(TRACKER_PATH, "utf8");
  assert.match(src, /const\s+pagePath\s*=\s*pathname/, "page_path must be set to pathname (without search)");
  assert.match(src, /page_path\s*:\s*pagePath/, "must send pagePath without search params");
});

test("PageViewTracker sends page_location as full URL (with search params)", () => {
  const src = fs.readFileSync(TRACKER_PATH, "utf8");
  assert.match(src, /const\s+pageLocation\s*=/, "page_location must be explicitly computed");
  assert.match(src, /window\.location\.origin/, "page_location must use window.location.origin");
  assert.match(src, /page_location\s*:\s*pageLocation/, "must send full page_location with origin and path");
});

test("PageViewTracker filters out non-production hosts", () => {
  const src = fs.readFileSync(TRACKER_PATH, "utf8");
  assert.match(src, /PRODUCTION_HOSTNAMES/, "must define a set of allowed production hostnames");
  assert.match(src, /deepbreathingexercises\.com/, "must allow deepbreathingexercises.com");
  assert.match(src, /isProductionHost/, "must have a hostname validation function");
  assert.match(src, /if\s*\(\s*!isProductionHost\(\)\s*\)\s*return/, "must early return if not on production host");
});

test("PageViewTracker re-fires page_view on visibility return (session timeout case)", () => {
  const src = fs.readFileSync(TRACKER_PATH, "utf8");
  assert.match(src, /visibilitychange/, "must listen for visibilitychange to catch session-timeout returns");
  assert.match(src, /document\.visibilityState\s*!==\s*["']visible["']/, "must re-fire only when returning to visible state");
});

test("GA config disables auto page_view so PageViewTracker is the single source", () => {
  const src = fs.readFileSync(CONFIG_PATH, "utf8");
  assert.match(
    src,
    /send_page_view\s*:\s*false/,
    "gtag('config', ...) must set send_page_view:false to avoid double page_view on initial load"
  );
});

test("Root document mounts PageViewTracker", () => {
  const layout = fs.readFileSync(LAYOUT_PATH, "utf8");
  const document = fs.readFileSync(SITE_DOCUMENT_PATH, "utf8");
  assert.match(layout, /SiteDocument/, "root layout must render the shared document shell");
  assert.match(document, /PageViewTracker/, "document shell must import and render PageViewTracker");
  assert.match(
    document,
    /<Suspense/,
    "PageViewTracker uses useSearchParams; it must remain wrapped in Suspense"
  );
});
