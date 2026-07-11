import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

test("Better Auth server supports Expo, Apple, native origins, and deletion", () => {
  const source = fs.readFileSync(path.join(ROOT, "src/lib/auth.ts"), "utf8");
  assert.match(source, /from "@better-auth\/expo"/);
  assert.match(source, /expo\(\)/);
  assert.match(source, /apple:/);
  assert.match(source, /appBundleIdentifier/);
  assert.match(source, /deepbreathing:\/\//);
  assert.match(source, /https:\/\/appleid\.apple\.com/);
  assert.match(source, /deleteUser:\s*{[\s\S]*?enabled:\s*true/);
  assert.match(source, /sendDeleteAccountVerification/);
});

test("native auth client stores Better Auth cookies in SecureStore", () => {
  const clientPath = path.join(ROOT, "apps/mobile/src/auth/auth-client.ts");
  assert.ok(fs.existsSync(clientPath), "missing native auth client");
  const source = fs.readFileSync(clientPath, "utf8");
  assert.match(source, /expoClient/);
  assert.match(source, /expo-secure-store/);
  assert.match(source, /scheme:\s*['"]deepbreathing['"]/);
  assert.match(source, /storagePrefix:\s*['"]deepbreathing['"]/);
  assert.match(source, /https:\/\/origin\.deepbreathingexercises\.com/);
});

test("iOS app config enables native Sign in with Apple", () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(ROOT, "apps/mobile/app.json"), "utf8")
  ).expo;
  assert.equal(config.ios.usesAppleSignIn, true);
  assert.ok(config.plugins.includes("expo-apple-authentication"));
  assert.equal(config.scheme, "deepbreathing");
});

test("mobile pins SDK-compatible secure auth dependencies", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "apps/mobile/package.json"), "utf8")
  );
  for (const dependency of [
    "@better-auth/expo",
    "better-auth",
    "expo-apple-authentication",
    "expo-network",
    "expo-secure-store",
  ]) {
    assert.ok(pkg.dependencies[dependency], `missing ${dependency}`);
  }
});
