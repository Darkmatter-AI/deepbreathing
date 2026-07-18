import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GA_SCRIPT_PATH = path.join(ROOT, "src", "components", "analytics", "GoogleAnalyticsScript.tsx");
const SITE_DOCUMENT_PATH = path.join(ROOT, "src", "components", "layout", "site-document.tsx");
const PAGE_VIEW_TRACKER_PATH = path.join(ROOT, "src", "components", "analytics", "PageViewTracker.tsx");
const GOOGLE_ANALYTICS_PATH = path.join(ROOT, "src", "lib", "analytics", "google-analytics.ts");

test("GoogleAnalyticsScript component exists and is client-side", () => {
  assert.ok(
    fs.existsSync(GA_SCRIPT_PATH),
    `GoogleAnalyticsScript expected at ${GA_SCRIPT_PATH}`
  );
  const src = fs.readFileSync(GA_SCRIPT_PATH, "utf8");
  assert.match(src, /["']use client["']/, "must be a client component");
  assert.match(src, /export\s+function\s+GoogleAnalyticsScript/, "must export GoogleAnalyticsScript");
});

test("GoogleAnalyticsScript imports production hostname constants", () => {
  const src = fs.readFileSync(GA_SCRIPT_PATH, "utf8");
  assert.match(src, /PRODUCTION_HOSTNAMES/, "must import PRODUCTION_HOSTNAMES");
  assert.match(src, /GOOGLE_ANALYTICS_SCRIPT_SRC/, "must import GA script src");
  assert.match(src, /GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT/, "must import GA init script");
});

test("GoogleAnalyticsScript checks hostname before rendering scripts", () => {
  const src = fs.readFileSync(GA_SCRIPT_PATH, "utf8");
  assert.match(src, /window\.location\.hostname/, "must check window.location.hostname");
  assert.match(src, /PRODUCTION_HOSTNAMES\.has/, "must check against PRODUCTION_HOSTNAMES");
  assert.match(src, /if\s*\(\s*!isProduction\s*\)\s*return\s+null/, "must return null if not production");
});

test("GoogleAnalyticsScript conditionally renders both GA scripts", () => {
  const src = fs.readFileSync(GA_SCRIPT_PATH, "utf8");
  assert.match(src, /<Script\s+src=\{GOOGLE_ANALYTICS_SCRIPT_SRC\}/, "must render GA remote script");
  assert.match(src, /id=["']ga4-init["']/, "must render GA4 init script with id");
  assert.match(src, /\{GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT\}/, "must render init script content");
});

test("SiteDocument uses GoogleAnalyticsScript component instead of direct Script tags", () => {
  const src = fs.readFileSync(SITE_DOCUMENT_PATH, "utf8");
  assert.match(src, /import\s+{\s*GoogleAnalyticsScript\s*}/, "must import GoogleAnalyticsScript");
  assert.match(src, /<GoogleAnalyticsScript\s*\/>/, "must render GoogleAnalyticsScript component");
  assert.ok(!src.includes("GOOGLE_ANALYTICS_SCRIPT_SRC"), "must not directly use GOOGLE_ANALYTICS_SCRIPT_SRC");
  assert.ok(!src.includes("GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT"), "must not directly import GA init script");
});

test("PageViewTracker page_path remains pathname-only for regression coverage", () => {
  const src = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");
  assert.match(src, /const\s+pagePath\s*=\s*pathname/, "page_path must be pathname only");
  assert.match(src, /page_path\s*:\s*pagePath/, "must send pathname to page_path param");
});

test("PageViewTracker maintains production host check for defense in depth", () => {
  const src = fs.readFileSync(PAGE_VIEW_TRACKER_PATH, "utf8");
  assert.match(src, /if\s*\(\s*!isProductionHost\(\)\s*\)\s*return/, "must check isProductionHost");
});

test("PRODUCTION_HOSTNAMES is exported from google-analytics for reuse", () => {
  const src = fs.readFileSync(GOOGLE_ANALYTICS_PATH, "utf8");
  assert.match(src, /export\s+const\s+PRODUCTION_HOSTNAMES/, "must export PRODUCTION_HOSTNAMES constant");
  assert.match(src, /"deepbreathingexercises\.com"/, "must include production domain");
  assert.match(src, /"www\.deepbreathingexercises\.com"/, "must include www variant");
});

test("Non-production hosts do not load GA script (verified by component conditional)", () => {
  const gaScriptSrc = fs.readFileSync(GA_SCRIPT_PATH, "utf8");

  // The component returns null if not production, preventing Script render
  assert.match(gaScriptSrc, /if\s*\(\s*!isProduction\s*\)\s*return\s+null/, "GA script must return null when not production");

  // The only way gtag gets defined is through GOOGLE_ANALYTICS_SCRIPT_SRC render
  assert.match(gaScriptSrc, /Script\s+src=\{GOOGLE_ANALYTICS_SCRIPT_SRC\}/, "GA script only renders inside conditional component");
});

test("SiteDocument does not directly reference GA script constants (deferred to component)", () => {
  const siteDocSrc = fs.readFileSync(SITE_DOCUMENT_PATH, "utf8");
  const gaAnalyticsSrc = fs.readFileSync(GOOGLE_ANALYTICS_PATH, "utf8");

  // SiteDocument should not import the script constants directly
  assert.ok(!siteDocSrc.includes("GOOGLE_ANALYTICS_SCRIPT_SRC"), "SiteDocument must not import GA script src");
  assert.ok(!siteDocSrc.includes("GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT"), "SiteDocument must not import GA init script");

  // Those constants should still exist in analytics module for GoogleAnalyticsScript to use
  assert.match(gaAnalyticsSrc, /export\s+const\s+GOOGLE_ANALYTICS_SCRIPT_SRC/, "GA script src must be exported");
  assert.match(gaAnalyticsSrc, /export\s+const\s+GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT/, "GA init script must be exported");
});
