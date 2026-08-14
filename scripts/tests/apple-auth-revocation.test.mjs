import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const authSource = fs.readFileSync(path.join(ROOT, "src/lib/auth.ts"), "utf8");
const appleAuthSource = fs.readFileSync(
  path.join(ROOT, "src/lib/apple-auth.ts"),
  "utf8",
);
const nativeAuthSource = fs.readFileSync(
  path.join(ROOT, "apps/mobile/src/auth/AuthActions.tsx"),
  "utf8",
);
const nativeHomeSource = fs.readFileSync(
  path.join(ROOT, "apps/mobile/src/app/index.tsx"),
  "utf8",
);

test("native Apple sign-in forwards the one-time authorization code", () => {
  assert.match(nativeAuthSource, /additionalData/);
  assert.match(nativeAuthSource, /authorizationCode/);
  assert.match(authSource, /appleNativeTokenExchangePlugin/);
  assert.match(appleAuthSource, /auth\/token/);
  assert.match(appleAuthSource, /accessToken: exchanged\.token/);
});

test("account deletion revokes stored Apple tokens without blocking deletion", () => {
  assert.match(authSource, /beforeDelete:\s*async/);
  assert.match(appleAuthSource, /auth\/revoke/);
  assert.match(appleAuthSource, /"providerId" = 'apple'/);
  assert.match(appleAuthSource, /if \(response\.ok\)/);
  assert.match(appleAuthSource, /must not block account deletion/);
  assert.match(authSource, /\[apple-revocation\] deletion cleanup incomplete/);
  assert.match(authSource, /remove Deep Breathing Exercises from your Apple ID settings/);
});

test("account deletion verification is never suppressed and surfaces mail errors", () => {
  const start = authSource.indexOf("sendDeleteAccountVerification");
  const end = authSource.indexOf("beforeDelete", start);
  assert.ok(start >= 0 && end > start, "delete-email callback should be present");
  const deleteEmailSource = authSource.slice(start, end);
  assert.doesNotMatch(deleteEmailSource, /isSuppressed/);
  assert.match(deleteEmailSource, /const result = await getResend\(\)\.emails\.send/);
  assert.match(deleteEmailSource, /if \(result\.error\)/);
  assert.match(
    deleteEmailSource,
    /Failed to send account deletion verification email/,
  );
});

test("native deletion emails use a deep-link handoff while web keeps HTTPS", () => {
  assert.match(authSource, /accountDeletionEmailURL/);
  assert.match(authSource, /expo-origin/);
  assert.match(authSource, /deepbreathing:\/\/\/\?accountDeletionToken=/);
  assert.match(authSource, /sendDeleteAccountVerification: async \(\{ user, url, token \}, request\)/);
  assert.doesNotMatch(authSource, /accountDeletionEmailPlugin/);
  assert.doesNotMatch(authSource, /delete-user\/email-callback/);
});

test("native deletion deep links require explicit confirmation and retry safely", () => {
  assert.match(nativeHomeSource, /Linking\.getInitialURL\(\)/);
  assert.match(nativeHomeSource, /Linking\.addEventListener\('url'/);
  assert.match(nativeHomeSource, /Alert\.alert\(\s*'Confirm account deletion'/s);
  assert.match(nativeHomeSource, /authClient\.deleteUser\(\{ token \}\)/);
  assert.match(nativeHomeSource, /handledDeletionTokensRef\.current\.delete\(token\)/);
  assert.match(nativeHomeSource, /Could not delete account/);
});
