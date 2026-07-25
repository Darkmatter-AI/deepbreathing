import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HOMEPAGE_HTML = path.join(ROOT, ".next", "server", "app", "index.html");
const BUILD_MARKER = HOMEPAGE_HTML;

// These assertions read real Next build output, so they can only run after
// `pnpm build`. They are skipped (not failed) on a clean tree so `pnpm test`
// is meaningful without a build; `pnpm run test:post-build` runs them for real.
const NEEDS_BUILD = { skip: fs.existsSync(BUILD_MARKER) ? false : "requires `pnpm build` output (.next/server/app)" };


test("homepage build output keeps crawlable SSR body with H1", NEEDS_BUILD, () => {
  assert.ok(
    fs.existsSync(HOMEPAGE_HTML),
    "missing build output for homepage (.next/server/app/index.html); run `pnpm build` first"
  );

  const html = fs.readFileSync(HOMEPAGE_HTML, "utf8");

  assert.doesNotMatch(
    html,
    /id="__next_error__"/,
    "homepage deopted to app shell; crawlers may miss body headings"
  );

  assert.match(
    html,
    /<h1[\s>]/i,
    "homepage HTML should include a literal <h1> in server-rendered body markup"
  );
});
