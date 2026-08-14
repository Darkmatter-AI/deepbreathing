import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const validator = path.join(root, "scripts/release/validate-ios-release.mjs");

test("Build 18 release hygiene contract passes", () => {
  const output = execFileSync(process.execPath, [validator], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(output, /iOS release hygiene: PASS/);
});
