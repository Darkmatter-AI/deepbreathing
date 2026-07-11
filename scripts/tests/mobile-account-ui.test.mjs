import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

test("native auth actions present Apple before Google", () => {
  const file = path.join(ROOT, "apps/mobile/src/auth/AuthActions.tsx");
  assert.ok(fs.existsSync(file), "missing native auth actions");
  const source = fs.readFileSync(file, "utf8");
  const apple = source.indexOf("AppleAuthenticationButton");
  const google = source.indexOf("Continue with Google");
  assert.ok(apple >= 0, "missing native Apple button");
  assert.ok(google > apple, "Google must be secondary to Apple");
  assert.match(source, /identityToken/);
});

test("account sheet supports sign out and verified deletion", () => {
  const file = path.join(ROOT, "apps/mobile/src/auth/AccountSheet.tsx");
  assert.ok(fs.existsSync(file), "missing account sheet");
  const source = fs.readFileSync(file, "utf8");
  assert.match(source, /signOut/);
  assert.match(source, /deleteUser/);
  assert.match(source, /Alert\.alert/);
  assert.match(source, /permanently/i);
});

test("completion UI branches between guest receipt and registered banner", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/components/CompletionSummary.tsx"),
    "utf8"
  );
  assert.match(source, /isAuthenticated/);
  assert.match(source, /Keep your practice/);
  assert.match(source, /PanResponder/);
  assert.doesNotMatch(source, /AUTO_DISMISS_MS/);
});
