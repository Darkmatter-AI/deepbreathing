#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPKCS8, SignJWT } from "jose";

// Reuse the existing app-bound submission credential only in process memory.
const require = createRequire(import.meta.url);
const EAS = "/opt/homebrew/lib/node_modules/eas-cli/build";
const APP_ID = "6786431781";
const KEY_ID = "29XP636685";
const ISSUER_ID = "2ad3ae3e-17b6-49ee-9d1b-fdd9f6b1c6b9";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Read-only report: node scripts/appstore/with-eas-credentials.mjs [funnel-report options]\nOne-time authorized setup: node scripts/appstore/with-eas-credentials.mjs --enable-reports\nUses the existing DBE EAS credential in memory; no private key is saved.");
    return;
  }
  const enable = args.length === 1 && args[0] === "--enable-reports";
  if (!enable && args.includes("--enable-reports")) throw new Error("setup_arguments");
  const { createGraphqlClient } = require(`${EAS}/commandUtils/context/contextUtils/createGraphqlClient.js`);
  const { UserQuery } = require(`${EAS}/graphql/queries/UserQuery.js`);
  const { resolveAscApiKeyForAppCredentialsAsync } = require(`${EAS}/credentials/ios/actions/AscApiKeyUtils.js`);
  const accessToken = process.env.EXPO_TOKEN || null;
  const sessionSecret = accessToken ? null : JSON.parse(readFileSync(`${homedir()}/.expo/state.json`, "utf8")).auth?.sessionSecret;
  if (!accessToken && !sessionSecret) throw new Error("eas_auth_missing");
  const graphqlClient = createGraphqlClient({ accessToken, sessionSecret });
  const actor = await UserQuery.currentUserAsync(graphqlClient);
  const account = actor?.accounts?.find((item) => item.name === "abiabiassi");
  if (!account) throw new Error("eas_account_mismatch");
  const bound = await resolveAscApiKeyForAppCredentialsAsync({ graphqlClient, app: { account, projectName: "deep-breathing", bundleIdentifier: "com.deepbreathing.app" } });
  const key = bound?.ascApiKey;
  if (!key?.keyP8 || key.keyId !== KEY_ID || key.issuerId !== ISSUER_ID) throw new Error("eas_bound_key_mismatch");
  if (!enable) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./funnel-report.mjs", import.meta.url)), ...args], {
      stdio: "inherit",
      env: { ...process.env, ASC_KEY_ID: KEY_ID, ASC_ISSUER_ID: ISSUER_ID, ASC_PRIVATE_KEY: key.keyP8 },
    });
    process.exitCode = result.status ?? 1;
    return;
  }
  const privateKey = await importPKCS8(key.keyP8, "ES256");
  const token = await new SignJWT({}).setProtectedHeader({ alg: "ES256", kid: KEY_ID, typ: "JWT" }).setIssuer(ISSUER_ID).setAudience("appstoreconnect-v1").setIssuedAt().setExpirationTime("10m").sign(privateKey);
  const request = async (path, options = {}) => {
    const response = await fetch(`https://api.appstoreconnect.apple.com/v1${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`apple_http_${response.status}`);
    return response.json();
  };
  const app = await request(`/apps/${APP_ID}`);
  if (app.data?.id !== APP_ID || app.data?.attributes?.bundleId !== "com.deepbreathing.app") throw new Error("apple_app_mismatch");
  const existing = await request(`/apps/${APP_ID}/analyticsReportRequests?filter%5BaccessType%5D=ONGOING&limit=200`);
  if (existing.links?.next) throw new Error("unexpected_request_pagination");
  let result = existing.data?.find((item) => item.attributes?.accessType === "ONGOING");
  let created = false;
  if (!result) {
    const response = await request("/analyticsReportRequests", { method: "POST", body: JSON.stringify({ data: { type: "analyticsReportRequests", attributes: { accessType: "ONGOING" }, relationships: { app: { data: { type: "apps", id: APP_ID } } } } }) });
    result = response.data;
    created = true;
  }
  const verified = await request(`/analyticsReportRequests/${result.id}`);
  console.log(JSON.stringify({ appId: APP_ID, appName: app.data.attributes.name, requestId: verified.data.id, created, accessType: verified.data.attributes.accessType, stoppedDueToInactivity: verified.data.attributes.stoppedDueToInactivity, verifiedAt: new Date().toISOString() }, null, 2));
}

main().catch(() => {
  console.error("Apple setup/report failed. No credentials were printed. Check the existing EAS session, app-bound key, and Apple report permissions.");
  process.exitCode = 1;
});
