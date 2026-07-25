import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HELPER = path.join(ROOT, "src", "lib", "og-fonts.ts");
const ROUTES = [
  "src/app/og/route.tsx",
  "src/app/og/[slug]/route.tsx",
];

test("og-fonts helper exists and exports a font loader", () => {
  assert.ok(fs.existsSync(HELPER), `expected ${HELPER}`);
  const src = fs.readFileSync(HELPER, "utf8");
  // Renamed from loadInterFonts when Noto Sans JP support was added; a
  // back-compat `loadInterFonts` alias still exists but nothing imports it.
  assert.match(src, /export async function loadOgFonts/);
  assert.match(src, /name:\s*['"]Inter['"]/);
  assert.match(src, /weight:\s*(400|700)/);
});

for (const rel of ROUTES) {
  test(`${rel} passes fonts to ImageResponse so satori has glyphs to render`, () => {
    const full = path.join(ROOT, rel);
    assert.ok(fs.existsSync(full), `missing ${rel}`);
    const src = fs.readFileSync(full, "utf8");
    assert.match(src, /loadOgFonts/, `${rel} should import + call loadOgFonts`);
    // Must pass fonts to ImageResponse — accept either a literal array or
    // a function call result (e.g. `fonts: await loadOgFonts()`).
    assert.match(src, /fonts:\s*(\[|await\s+loadOgFonts)/, `${rel} should pass a fonts option to ImageResponse`);
  });
}
