import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGE_VIEW_TRACKER_PATH = path.join(ROOT, "src", "components", "analytics", "PageViewTracker.tsx");
const GOOGLE_ANALYTICS_PATH = path.join(ROOT, "src", "lib", "analytics", "google-analytics.ts");
const CONVERSION_TRIGGERS_PATH = path.join(ROOT, "src", "lib", "conversion", "use-conversion-triggers.ts");

test("PageViewTracker includes production hostname allowlist", () => {
  const src = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");
  assert.match(src, /const\s+PRODUCTION_HOSTNAMES\s*=\s*new\s+Set/, "must define PRODUCTION_HOSTNAMES constant");
  assert.match(src, /"deepbreathingexercises\.com"/, "must include deepbreathingexercises.com");
  assert.match(src, /"www\.deepbreathingexercises\.com"/, "must include www.deepbreathingexercises.com");
});

test("PageViewTracker checks production host before sending page_view", () => {
  const src = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");
  assert.match(src, /function\s+isProductionHost\s*\(\s*\)\s*:\s*boolean/, "must have isProductionHost function");
  assert.match(src, /if\s*\(\s*typeof\s+window\s*===\s*["']undefined["']\s*\)\s*return\s+false/, "must check if window is defined");
  assert.match(src, /PRODUCTION_HOSTNAMES\.has/, "must check hostname against PRODUCTION_HOSTNAMES");
  assert.match(src, /window\.location\.hostname/, "must access window.location.hostname");
  assert.match(src, /if\s*\(\s*!isProductionHost\(\)\s*\)\s*return/, "must early return from sendPageView if not production");
});

test("PageViewTracker constructs page_path without query params", () => {
  const src = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");
  assert.match(src, /const\s+pagePath\s*=\s*pathname/, "page_path must be set to pathname");
  assert.match(src, /page_path\s*:\s*pagePath/, "must pass pagePath to gtag");
  assert.ok(!src.includes("page_path: pathname + search") && !src.includes("page_path: pathname + window.location.search"), "page_path must not directly concatenate search params");
});

test("PageViewTracker constructs page_location with full URL including origin", () => {
  const src = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");
  assert.match(src, /window\.location\.origin/, "must use window.location.origin");
  assert.match(src, /const\s+pageLocation\s*=/, "page_location must be explicitly computed");
  assert.match(src, /search\s+\?\s+`\${window\.location\.origin}\${pathname}\${search}`/, "page_location must include origin, pathname, and search");
  assert.match(src, /:\s+`\${window\.location\.origin}\${pathname}`/, "page_location fallback must still include origin");
});

test("Google Analytics exports PRODUCTION_HOSTNAMES constant for reuse", () => {
  const src = fs.readFileSync(GOOGLE_ANALYTICS_PATH, "utf8");
  assert.match(src, /export\s+const\s+PRODUCTION_HOSTNAMES/, "must export PRODUCTION_HOSTNAMES constant");
  assert.match(src, /"deepbreathingexercises\.com"/, "must include production domain");
  assert.match(src, /"www\.deepbreathingexercises\.com"/, "must include www domain");
});

test("Conversion triggers defines local trackEvent that safely fails if gtag unavailable", () => {
  const src = fs.readFileSync(CONVERSION_TRIGGERS_PATH, "utf8");
  assert.match(src, /function\s+trackEvent\s*\(/, "must define local trackEvent function");
  assert.match(src, /typeof\s+window\s*!==\s*["']undefined["']/, "must check if window exists");
  assert.match(src, /typeof\s+\(window\s+as\s+any\)\.gtag\s*===\s*["']function["']/, "must check if gtag function exists");
  assert.match(src, /\(window\s+as\s+any\)\.gtag\s*\(\s*["']event["']/, "must call gtag if available");
});

test("Host gating is consistent across PageViewTracker and google-analytics", () => {
  const trackerSrc = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");
  const analyticsSrc = fs.readFileSync(GOOGLE_ANALYTICS_PATH, "utf8");

  const trackerHostnames = trackerSrc.match(/"deepbreathingexercises\.com"[^}]*"www\.deepbreathingexercises\.com"/);
  const analyticsHostnames = analyticsSrc.match(/"deepbreathingexercises\.com"[^}]*"www\.deepbreathingexercises\.com"/);

  assert.ok(trackerHostnames, "PageViewTracker must define allowed hostnames");
  assert.ok(analyticsHostnames, "google-analytics must define allowed hostnames");
});

test("Non-production hosts are explicitly documented as not allowed", () => {
  const trackerSrc = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");

  // The code should NOT allow localhost or origin subdomain
  assert.ok(!trackerSrc.includes('"localhost"'), "must not allow localhost");
  assert.ok(!trackerSrc.includes('"origin.'), "must not allow origin subdomain");
  assert.ok(!trackerSrc.includes('"127.0.0.1'), "must not allow 127.0.0.1");
  assert.ok(!trackerSrc.includes('"0.0.0.0'), "must not allow 0.0.0.0");
});
