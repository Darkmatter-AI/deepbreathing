import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LAYOUT_PATH = path.join(ROOT, "src", "app", "(site-en)", "layout.tsx");
const SITE_DOCUMENT_PATH = path.join(
  ROOT,
  "src",
  "components",
  "layout",
  "site-document.tsx",
);
const CONFIG_PATH = path.join(ROOT, "src", "lib", "analytics", "google-analytics.ts");

test("GA measurement ID is centralized outside the root layout", () => {
  assert.ok(
    fs.existsSync(CONFIG_PATH),
    "missing analytics config module; expected src/lib/analytics/google-analytics.ts"
  );

  const layoutSource = fs.readFileSync(LAYOUT_PATH, "utf8");
  const siteDocumentSource = fs.readFileSync(SITE_DOCUMENT_PATH, "utf8");
  const configSource = fs.readFileSync(CONFIG_PATH, "utf8");

  assert.doesNotMatch(
    `${layoutSource}\n${siteDocumentSource}`,
    /\bG-[A-Z0-9]+\b/,
    "root layout should not hardcode a GA measurement ID"
  );

  // The GA <Script> tags were extracted out of site-document.tsx into the
  // GoogleAnalyticsScript client component (which ga-script-gating.test.mjs
  // covers). SiteDocument now only delegates — that still satisfies this
  // test's intent, which is that no GA id is hardcoded in the layout.
  assert.match(siteDocumentSource, /<GoogleAnalyticsScript\s*\/>/);
  assert.match(siteDocumentSource, /from "@\/components\/analytics\/GoogleAnalyticsScript"/);

  assert.match(
    configSource,
    /\bG-[A-Z0-9]+\b/,
    "analytics config should define the GA measurement ID"
  );
});
