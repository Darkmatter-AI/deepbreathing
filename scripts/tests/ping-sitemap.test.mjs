import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  deriveChangedCanonicalUrls,
  getChangedFilesForDeployment,
  isIndexNowSubmissionEnvironment,
  runSitemapPingWorkflow,
} from "../ping-sitemap-lib.mjs";

const silentLogger = {
  log() {},
  warn() {},
};

const productionEnv = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_PROJECT_ID: "prj_zcWnwD9I2TinOJjvzFyamBJMLL8T",
  VERCEL_DEPLOYMENT_ID: "dpl_abc123",
  VERCEL_GIT_PROVIDER: "github",
};

test("allows IndexNow only for this project's Vercel production deployments", () => {
  assert.equal(isIndexNowSubmissionEnvironment(productionEnv), true);

  for (const env of [
    { ...productionEnv, VERCEL_ENV: "preview" },
    { ...productionEnv, VERCEL_ENV: "development" },
    { ...productionEnv, VERCEL_PROJECT_ID: "prj_other" },
    { ...productionEnv, VERCEL_DEPLOYMENT_ID: undefined },
    { ...productionEnv, VERCEL_GIT_PROVIDER: undefined },
    { CI: "1" },
    {},
  ]) {
    assert.equal(isIndexNowSubmissionEnvironment(env), false);
  }
});

test("Vercel keeps building while exposing the previous successful SHA", () => {
  const config = JSON.parse(fs.readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.ignoreCommand, "exit 1");
});

test("skips all network access outside an authorized production deployment", async () => {
  let called = 0;
  const result = await runSitemapPingWorkflow({
    ci: false,
    changedUrls: ["https://deepbreathingexercises.com/about"],
    fetchImpl: async () => {
      called += 1;
      throw new Error("must not be called");
    },
    logger: silentLogger,
  });

  assert.equal(result.skipped, true);
  assert.equal(result.submittedCount, 0);
  assert.equal(called, 0);
});

test("fails closed when the deployment diff is unavailable or invalid", () => {
  const sha = "a".repeat(40);
  let called = 0;
  const execFileSyncImpl = () => {
    called += 1;
    throw new Error("missing history");
  };

  assert.equal(
    getChangedFilesForDeployment({ previousSha: "bad", currentSha: sha, execFileSyncImpl }),
    null,
  );
  assert.equal(called, 0);
  assert.equal(
    getChangedFilesForDeployment({ previousSha: sha, currentSha: sha, execFileSyncImpl }),
    null,
  );
  assert.equal(called, 0);
  assert.equal(
    getChangedFilesForDeployment({
      previousSha: sha,
      currentSha: "b".repeat(40),
      execFileSyncImpl,
    }),
    null,
  );
  assert.equal(called, 1);
});

test("deduplicates the changed-file deployment diff", () => {
  const previousSha = "a".repeat(40);
  const currentSha = "b".repeat(40);
  const files = getChangedFilesForDeployment({
    previousSha,
    currentSha,
    execFileSyncImpl(command, args, options) {
      assert.equal(command, "git");
      assert.deepEqual(args, [
        "diff",
        "--name-only",
        "--diff-filter=ACMRT",
        previousSha,
        currentSha,
        "--",
      ]);
      assert.deepEqual(options, { encoding: "utf8" });
      return "src/app/(site-en)/about/page.tsx\nsrc/app/(site-en)/about/page.tsx\n";
    },
  });

  assert.deepEqual(files, ["src/app/(site-en)/about/page.tsx"]);
});

test("selects each changed canonical route exactly once without unchanged locales", () => {
  const changedUrls = deriveChangedCanonicalUrls({
    changedFiles: [
      "docs/SEO-EXPERIMENTS.md",
      "src/app/(site-en)/about/page.tsx",
      "src/app/(site-en)/about/page.tsx",
    ],
    canonicalUrls: [
      "https://deepbreathingexercises.com/",
      "https://deepbreathingexercises.com/about",
      "https://deepbreathingexercises.com/es/about",
      "https://deepbreathingexercises.com/es/about",
      "https://deepbreathingexercises.com/origin-only",
    ],
  });

  assert.deepEqual(changedUrls, [
    "https://deepbreathingexercises.com/about",
  ]);
});

test("returns an empty manifest when no indexable page entry changed", () => {
  assert.deepEqual(
    deriveChangedCanonicalUrls({
      changedFiles: ["docs/SEO-EXPERIMENTS.md", "scripts/ping-sitemap-lib.mjs"],
      canonicalUrls: ["https://deepbreathingexercises.com/"],
    }),
    [],
  );
});

test("fails closed for shared, localized, dynamic, or malformed route inputs", () => {
  const canonicalUrls = ["https://deepbreathingexercises.com/about"];

  for (const changedFiles of [
    ["src/components/header.tsx"],
    ["src/data/breathing-pages.ts"],
    ["src/app/(site-en)/about/about-page.tsx"],
    ["src/app/(site-localized)/[locale]/about/page.tsx"],
    ["src/app/(site-en)/embed/[slug]/page.tsx"],
  ]) {
    assert.equal(deriveChangedCanonicalUrls({ changedFiles, canonicalUrls }), null);
  }

  assert.equal(
    deriveChangedCanonicalUrls({
      changedFiles: ["src/app/(site-en)/about/page.tsx"],
      canonicalUrls: ["https://origin.deepbreathingexercises.com/about"],
    }),
    null,
  );
});

test("a production deployment with no changed routes makes zero requests", async () => {
  let called = 0;
  const result = await runSitemapPingWorkflow({
    ci: true,
    changedUrls: [],
    fetchImpl: async () => {
      called += 1;
      throw new Error("must not be called");
    },
    logger: silentLogger,
  });

  assert.equal(result.indexNowSubmitted, false);
  assert.equal(result.submittedCount, 0);
  assert.equal(called, 0);
});

test("submits only deduplicated canonical HTTPS URLs to the mocked endpoint", async () => {
  const calls = [];
  const endpoint = "https://indexnow.invalid/mock";
  const result = await runSitemapPingWorkflow({
    ci: true,
    changedUrls: [
      "https://deepbreathingexercises.com/about",
      "https://deepbreathingexercises.com/about",
      "https://deepbreathingexercises.com/privacy?draft=1",
      "http://deepbreathingexercises.com/support",
      "https://origin.deepbreathingexercises.com/support",
    ],
    indexNowEndpoint: endpoint,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 202, text: async () => "" };
    },
    logger: silentLogger,
  });

  assert.equal(result.indexNowSubmitted, true);
  assert.equal(result.submittedCount, 1);
  assert.deepEqual(result.statuses, [202]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, endpoint);
  assert.deepEqual(JSON.parse(calls[0].init.body).urlList, [
    "https://deepbreathingexercises.com/about",
  ]);
});

test("batches changed URLs without truncating them", async () => {
  const batches = [];
  const changedUrls = Array.from(
    { length: 5 },
    (_, index) => `https://deepbreathingexercises.com/changed-${index}`,
  );

  const result = await runSitemapPingWorkflow({
    ci: true,
    changedUrls,
    batchLimit: 2,
    indexNowEndpoint: "https://indexnow.invalid/mock",
    fetchImpl: async (_url, init) => {
      batches.push(JSON.parse(init.body).urlList);
      return { ok: true, status: 200, text: async () => "" };
    },
    logger: silentLogger,
  });

  assert.deepEqual(batches.map((batch) => batch.length), [2, 2, 1]);
  assert.deepEqual(batches.flat(), changedUrls);
  assert.equal(result.submittedCount, 5);
  assert.deepEqual(result.statuses, [200, 200, 200]);
});

test("IndexNow failure does not fail the build or retry against a real endpoint", async () => {
  let called = 0;
  const result = await runSitemapPingWorkflow({
    ci: true,
    changedUrls: ["https://deepbreathingexercises.com/about"],
    indexNowEndpoint: "https://indexnow.invalid/mock",
    fetchImpl: async () => {
      called += 1;
      return { ok: false, status: 500, text: async () => "boom" };
    },
    logger: silentLogger,
  });

  assert.equal(called, 1);
  assert.equal(result.indexNowSubmitted, false);
  assert.equal(result.submittedCount, 0);
  assert.deepEqual(result.statuses, []);
});
