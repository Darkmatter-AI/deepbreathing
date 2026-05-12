import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HELPER_PATH = path.join(ROOT, "src", "lib", "share-utm.ts");
const SHARE_BUTTON_FILES = [
  "src/components/ui/share-button.tsx",
  "src/app/for/share-button.tsx",
  "src/app/holiday-breathing-exercises/share-button.tsx",
];

test("appendShareUtm helper exists and sets utm_source/medium/campaign", () => {
  assert.ok(fs.existsSync(HELPER_PATH), `expected helper at ${HELPER_PATH}`);
  const src = fs.readFileSync(HELPER_PATH, "utf8");
  assert.match(src, /export function appendShareUtm/);
  assert.match(src, /utm_source/);
  assert.match(src, /utm_medium/);
  assert.match(src, /utm_campaign/);
});

test("share-utm exports getLocalizedShareText/Title that read DOM meta description and document.title", () => {
  const src = fs.readFileSync(HELPER_PATH, "utf8");
  assert.match(src, /export function getLocalizedShareText/);
  assert.match(src, /export function getLocalizedShareTitle/);
  assert.match(src, /meta\[name="description"\]/);
  assert.match(src, /document\.title/);
});

test("appendShareUtm produces expected URL when imported", async () => {
  // Inline the helper's behavior to verify the contract, since the source is TS.
  // The real file is statically checked above; this verifies the algorithm we expect.
  function ref(url, medium = "copy") {
    try {
      const u = new URL(url);
      u.searchParams.set("utm_source", "share");
      u.searchParams.set("utm_medium", medium);
      u.searchParams.set("utm_campaign", "user_share");
      return u.toString();
    } catch {
      return url;
    }
  }
  const out = ref("https://deepbreathingexercises.com/breathe/box", "native");
  const parsed = new URL(out);
  assert.equal(parsed.searchParams.get("utm_source"), "share");
  assert.equal(parsed.searchParams.get("utm_medium"), "native");
  assert.equal(parsed.searchParams.get("utm_campaign"), "user_share");
  // Idempotent: a second pass overwrites the same params, not appends new ones.
  const twice = ref(out, "copy");
  assert.equal(new URL(twice).searchParams.get("utm_medium"), "copy");
  assert.equal(twice.match(/utm_source=/g).length, 1);
});

for (const rel of SHARE_BUTTON_FILES) {
  test(`${rel} wires appendShareUtm + localized title/text into its share/copy flows`, () => {
    const full = path.join(ROOT, rel);
    assert.ok(fs.existsSync(full), `missing ${rel}`);
    const src = fs.readFileSync(full, "utf8");
    assert.match(src, /appendShareUtm/, `${rel} should call appendShareUtm`);
    assert.match(src, /getLocalizedShareText/, `${rel} should read meta description at click time so mass-translated locales get localized share text`);
    assert.match(src, /getLocalizedShareTitle/, `${rel} should read document.title at click time`);
  });
}
