#!/usr/bin/env node
/**
 * Refresh the Indexed column of docs/indexing-queue.md from the GSC URL Inspection API.
 *
 * Auth is a service-account JWT (no OAuth, nothing to expire). The account must be an
 * Owner of the property; Editor returns 403 on urlInspection.
 *
 * Usage:
 *   GSC_SA_KEY_FILE=~/.config/dbe-ga-visibility-sa.json node scripts/gsc-index-status.mjs [--limit N] [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createSign } from "node:crypto";

const SITE_URL = "sc-domain:deepbreathingexercises.com";
const QUEUE_FILE = new URL("../docs/indexing-queue.md", import.meta.url).pathname;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
// GSC allows 600 inspections/min per property; 5 in flight stays well inside it.
const CONCURRENCY = 5;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(
    JSON.stringify(claim)
  )}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function inspect(token, url) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
  });
  if (res.status === 403) {
    throw new Error(
      `403 for ${url}. The service account must be an Owner of ${SITE_URL}, not an Editor.`
    );
  }
  if (!res.ok) throw new Error(`Inspect failed for ${url}: ${res.status} ${await res.text()}`);
  const status = (await res.json()).inspectionResult?.indexStatusResult ?? {};
  return { indexed: status.verdict === "PASS", coverageState: status.coverageState ?? "unknown" };
}

// A failed inspection must not discard the results already collected — a long run
// costs hundreds of API calls. Failures are recorded per item and reported at the end.
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        try {
          results[i] = { ok: true, value: await fn(items[i]) };
        } catch (error) {
          results[i] = { ok: false, error };
        }
      }
    })
  );
  return results;
}

function parseRows(lines) {
  const rows = [];
  lines.forEach((line, lineNo) => {
    if (!line.trimStart().startsWith("|")) return;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells.length < 5) return;
    if (/^(p|priority)$/i.test(cells[0])) return;
    if (/^[-: ]+$/.test(cells[0])) return;
    if (!/^https?:\/\//.test(cells[1])) return;
    rows.push({ lineNo, cells });
  });
  return rows;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitFlag = args.indexOf("--limit");
let limit = Infinity;
if (limitFlag !== -1) {
  limit = Number(args[limitFlag + 1]);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`--limit needs a positive integer, got: ${args[limitFlag + 1] ?? "(nothing)"}`);
  }
}

const keyFile = process.env.GSC_SA_KEY_FILE?.replace(/^~/, process.env.HOME ?? "");
if (!keyFile) throw new Error("Set GSC_SA_KEY_FILE to the service-account JSON path.");

const key = JSON.parse(readFileSync(keyFile, "utf8"));
const token = await getAccessToken(key);

const lines = readFileSync(QUEUE_FILE, "utf8").split("\n");
const rows = parseRows(lines);
const pending = rows.filter((r) => !r.cells[2].includes("✓")).slice(0, limit);

console.log(`${rows.length} rows, ${pending.length} to inspect${dryRun ? " (dry run)" : ""}`);

const results = await mapWithConcurrency(pending, CONCURRENCY, async (row) => ({
  row,
  ...(await inspect(token, row.cells[1])),
}));

let newlyIndexed = 0;
const failures = [];

results.forEach((result, i) => {
  if (!result.ok) {
    failures.push({ url: pending[i].cells[1], error: result.error });
    return;
  }
  const { row, indexed, coverageState } = result.value;
  console.log(`${indexed ? "✓" : " "} ${row.cells[1]} — ${coverageState}`);
  if (!indexed) return;
  newlyIndexed++;
  if (!dryRun) {
    const cells = [...row.cells];
    cells[2] = "✓";
    lines[row.lineNo] = `| ${cells.join(" | ")} |`;
  }
});

console.log(`\n${newlyIndexed}/${pending.length} now indexed.`);

if (!dryRun && newlyIndexed > 0) {
  writeFileSync(QUEUE_FILE, lines.join("\n"));
  console.log(`Wrote ${QUEUE_FILE}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} inspection(s) failed:`);
  for (const { url, error } of failures) console.error(`  ${url}: ${error.message}`);
  process.exitCode = 1;
}
