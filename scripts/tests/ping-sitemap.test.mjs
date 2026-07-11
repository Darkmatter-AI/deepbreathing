import test from "node:test";
import assert from "node:assert/strict";

import { runSitemapPingWorkflow } from "../ping-sitemap-lib.mjs";

const silentLogger = {
  log() {},
  warn() {},
};

test("skips workflow outside CI", async () => {
  let called = 0;
  const fetchImpl = async () => {
    called += 1;
    return { ok: true, status: 200, text: async () => "" };
  };

  const result = await runSitemapPingWorkflow({
    ci: false,
    fetchImpl,
    logger: silentLogger,
  });

  assert.equal(result.skipped, true);
  assert.equal(called, 0);
});

test("submits to IndexNow without calling retired sitemap ping endpoints", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);

    if (url === "https://deepbreathingexercises.com/sitemap.xml") {
      return {
        ok: true,
        status: 200,
        text: async () => "<urlset><url><loc>https://deepbreathingexercises.com/</loc></url></urlset>",
      };
    }

    if (url === "https://api.indexnow.org/indexnow") {
      return { ok: true, status: 202, text: async () => "" };
    }

    throw new Error(`Unexpected URL in mock: ${url}`);
  };

  const result = await runSitemapPingWorkflow({
    ci: true,
    fetchImpl,
    logger: silentLogger,
  });

  assert.equal(result.skipped, false);
  assert.equal(result.indexNowSubmitted, true);
  assert.deepEqual(calls, [
    "https://deepbreathingexercises.com/sitemap.xml",
    "https://api.indexnow.org/indexnow",
  ]);
});

test("IndexNow failure does not fail the build", async () => {
  const fetchImpl = async (url) => {
    if (url === "https://deepbreathingexercises.com/sitemap.xml") {
      return {
        ok: true,
        status: 200,
        text: async () => "<urlset><url><loc>https://deepbreathingexercises.com/</loc></url></urlset>",
      };
    }

    return { ok: false, status: 500, text: async () => "boom" };
  };

  const result = await runSitemapPingWorkflow({
    ci: true,
    fetchImpl,
    logger: silentLogger,
  });

  assert.equal(result.skipped, false);
  assert.equal(result.indexNowSubmitted, false);
});

test("isCiEnvironment recognizes Vercel builds (CI=1, VERCEL=1), not just CI=true", async () => {
  const { isCiEnvironment } = await import("../ping-sitemap-lib.mjs");
  assert.equal(isCiEnvironment({ CI: "true" }), true);
  assert.equal(isCiEnvironment({ CI: "1" }), true);          // Vercel sets CI=1
  assert.equal(isCiEnvironment({ VERCEL: "1" }), true);      // belt and braces
  assert.equal(isCiEnvironment({}), false);                  // local dev
  assert.equal(isCiEnvironment({ CI: "" }), false);
  assert.equal(isCiEnvironment({ CI: "false" }), false);
});
