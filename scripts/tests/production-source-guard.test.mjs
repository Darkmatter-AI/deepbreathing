import test from "node:test";
import assert from "node:assert/strict";

import {
  isProductionEnvironment,
  validateProductionMetadata,
} from "../release/verify-production-source.mjs";

const mainSha = "8e5f28477abfd2c2eda875b039a61e37e6801354";

test("production source guard skips local and preview builds", () => {
  assert.equal(isProductionEnvironment({}), false);
  assert.equal(isProductionEnvironment({ VERCEL_ENV: "preview" }), false);
  assert.deepEqual(
    validateProductionMetadata(
      { VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "feature", VERCEL_GIT_COMMIT_SHA: mainSha },
      mainSha
    ),
    []
  );
});

test("production source guard accepts only the current GitHub main commit", () => {
  assert.deepEqual(
    validateProductionMetadata(
      { VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main", VERCEL_GIT_COMMIT_SHA: mainSha },
      mainSha
    ),
    []
  );
});

test("production source guard rejects feature-branch production deployments", () => {
  const failures = validateProductionMetadata(
    {
      VERCEL_TARGET_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "codex/ios-v1-release",
      VERCEL_GIT_COMMIT_SHA: mainSha,
    },
    mainSha
  );
  assert.match(failures.join("\n"), /must come from main/);
});

test("production source guard rejects stale or missing production metadata", () => {
  const staleSha = "bb9ff535efae1b3714a31cce04ac7106ec3ace91";
  assert.match(
    validateProductionMetadata(
      { VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main", VERCEL_GIT_COMMIT_SHA: staleSha },
      mainSha
    ).join("\n"),
    /does not match GitHub main/
  );
  assert.match(validateProductionMetadata({ VERCEL_ENV: "production" }, mainSha).join("\n"), /valid VERCEL_GIT_COMMIT_SHA/);
  assert.match(
    validateProductionMetadata(
      { VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main", VERCEL_GIT_COMMIT_SHA: mainSha },
      ""
    ).join("\n"),
    /could not resolve/
  );
});
