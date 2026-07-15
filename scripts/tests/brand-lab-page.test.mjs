import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGE_FILE = path.join(
  ROOT,
  "src",
  "app",
  "(site-en)",
  "brand-lab",
  "page.tsx",
);

test("brand lab page exists with metadata and multiple visual concept sections", () => {
  assert.ok(
    fs.existsSync(PAGE_FILE),
    "expected the English brand-lab page to exist"
  );

  const source = fs.readFileSync(PAGE_FILE, "utf8");

  assert.match(
    source,
    /export\s+const\s+metadata\s*:\s*Metadata\s*=/,
    "brand lab page should export page metadata"
  );

  assert.match(
    source,
    /openGraph\s*:\s*\{[\s\S]*?images\s*:/,
    "brand lab page should define openGraph.images"
  );

  assert.match(
    source,
    /twitter\s*:\s*\{[\s\S]*?images\s*:/,
    "brand lab page should define twitter.images"
  );

  for (const label of [
    "Soft Orbit",
    "Signal Glow",
    "Quiet Editorial",
  ]) {
    assert.match(
      source,
      new RegExp(label),
      `brand lab page should include the concept section "${label}"`
    );
  }
});
