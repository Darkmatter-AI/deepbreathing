import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HOMEPAGE_BUILDS = [
  ["/", "index.html"],
  ["/es", "es.html"],
  ["/pt", "pt.html"],
  ["/fr", "fr.html"],
  ["/de", "de.html"],
  ["/ja", "ja.html"],
];
const BUILD_MARKER = path.join(ROOT, ".next", "server", "app", "index.html");

// These assertions read real Next build output, so they can only run after
// `pnpm build`. They are skipped (not failed) on a clean tree so `pnpm test`
// is meaningful without a build; `pnpm run test:post-build` runs them for real.
const NEEDS_BUILD = { skip: fs.existsSync(BUILD_MARKER) ? false : "requires `pnpm build` output (.next/server/app)" };


test("homepage build output keeps one crawlable SSR H1 per locale root", NEEDS_BUILD, () => {
  for (const [route, filename] of HOMEPAGE_BUILDS) {
    const homepageHtml = path.join(ROOT, ".next", "server", "app", filename);
    assert.ok(
      fs.existsSync(homepageHtml),
      `missing build output for ${route}; run a native-i18n production build first`
    );

    const html = fs.readFileSync(homepageHtml, "utf8");

    assert.doesNotMatch(
      html,
      /id="__next_error__"/,
      `${route} deopted to app shell; crawlers may miss body headings`
    );

    const headings = html.match(/<h1[\s>]/gi) ?? [];
    assert.equal(
      headings.length,
      1,
      `${route} should include exactly one literal <h1> in server-rendered body markup`
    );
  }
});
