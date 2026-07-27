#!/usr/bin/env node
/**
 * Refresh the Indexed column of docs/indexing-queue.md from the GSC URL Inspection API.
 *
 * Auth is a service-account JWT (no OAuth, nothing to expire). The account must be an
 * Owner of the property; Editor returns 403 on urlInspection.
 *
 * Usage:
 *   GSC_SA_KEY_FILE=~/.config/dbe-ga-visibility-sa.json node scripts/gsc-index-status.mjs [--pending-only] [--limit N] [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createSign } from "node:crypto";
import {
  classifyCanonicalSelection,
  selectRows,
  shouldStopAfterFailures,
  updateIndexedMarker,
} from "./gsc-index-status-lib.mjs";

const SITE_URL = "sc-domain:deepbreathingexercises.com";
const QUEUE_FILE = new URL("../docs/indexing-queue.md", import.meta.url).pathname;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
// GSC allows 600 inspections/min per property. Starts are also paced below,
// so concurrency can absorb the API's long response latency without bursts.
const CONCURRENCY = 20;
const REQUEST_START_INTERVAL_MS = 250;
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_FAILURES = 10;

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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
  return {
    indexed: status.verdict === "PASS",
    verdict: status.verdict ?? "unknown",
    coverageState: status.coverageState ?? "unknown",
    googleCanonical: status.googleCanonical ?? null,
    lastCrawlTime: status.lastCrawlTime ?? null,
  };
}

// A failed inspection must not discard the results already collected — a long run
// costs hundreds of API calls. Failures are recorded per item and reported at the end.
async function mapWithConcurrency(items, limit, fn, onProgress = () => {}) {
  const results = new Array(items.length);
  let next = 0;
  let completed = 0;
  let failureCount = 0;
  let stopped = false;
  let nextRequestStart = Date.now();
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length && !stopped) {
        const i = next++;
        try {
          const scheduledStart = Math.max(Date.now(), nextRequestStart);
          nextRequestStart = scheduledStart + REQUEST_START_INTERVAL_MS;
          const waitMs = scheduledStart - Date.now();
          if (waitMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
          }
          results[i] = { ok: true, value: await fn(items[i]) };
        } catch (error) {
          results[i] = { ok: false, error };
          failureCount++;
          if (shouldStopAfterFailures(failureCount, MAX_FAILURES)) stopped = true;
        } finally {
          completed++;
          onProgress(completed, items.length);
        }
      }
    })
  );
  return { results, stopped, failureCount };
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
const pendingOnly = args.includes("--pending-only");
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
const selected = selectRows(rows, { pendingOnly, limit });

console.log(
  `${rows.length} rows, ${selected.length} to inspect` +
    `${pendingOnly ? " (pending only)" : " (full sweep)"}` +
    `${dryRun ? " (dry run)" : ""}`,
);

const inspectionRun = await mapWithConcurrency(
  selected,
  CONCURRENCY,
  async (row) => ({
    row,
    ...(await inspect(token, row.cells[1])),
  }),
  (completed, total) => {
    if (completed % 25 === 0 || completed === total) {
      console.log(`Inspected ${completed}/${total} URLs...`);
    }
  },
);
const { results } = inspectionRun;
const completedCount = results.filter(Boolean).length;

let indexedCount = 0;
let newlyIndexed = 0;
let newlyUnindexed = 0;
let changedRows = 0;
const failures = [];
const coverageCounts = new Map();
const canonicalIssues = [];

results.forEach((result, i) => {
  if (!result) return;
  if (!result.ok) {
    failures.push({ url: selected[i].cells[1], error: result.error });
    return;
  }
  const {
    row,
    indexed,
    verdict,
    coverageState,
    googleCanonical,
    lastCrawlTime,
  } = result.value;
  const wasIndexed = row.cells[2].includes("✓");
  indexedCount += indexed ? 1 : 0;
  newlyIndexed += indexed && !wasIndexed ? 1 : 0;
  newlyUnindexed += !indexed && wasIndexed ? 1 : 0;
  coverageCounts.set(coverageState, (coverageCounts.get(coverageState) ?? 0) + 1);

  const canonicalIssue = classifyCanonicalSelection(
    row.cells[1],
    googleCanonical,
  );
  if (canonicalIssue) {
    canonicalIssues.push({
      url: row.cells[1],
      verdict,
      lastCrawlTime,
      ...canonicalIssue,
    });
  }

  console.log(
    `${indexed ? "✓" : " "} ${row.cells[1]} — ${coverageState}` +
      `${googleCanonical ? ` — canonical: ${googleCanonical}` : ""}`,
  );

  if (indexed !== wasIndexed) {
    changedRows++;
    if (!dryRun) {
      const cells = updateIndexedMarker(row.cells, indexed);
      lines[row.lineNo] = `| ${cells.join(" | ")} |`;
    }
  }
});

console.log(
  `\n${indexedCount}/${completedCount} completed inspections are indexed; ` +
    `${newlyIndexed} newly indexed, ${newlyUnindexed} newly unindexed.`,
);
console.log("\nCoverage states:");
for (const [state, count] of [...coverageCounts].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${count} ${state}`);
}

if (!dryRun && changedRows > 0) {
  writeFileSync(QUEUE_FILE, lines.join("\n"));
  console.log(`Wrote ${QUEUE_FILE}`);
}

if (canonicalIssues.length > 0) {
  console.error(`\n${canonicalIssues.length} canonical selection issue(s):`);
  for (const issue of canonicalIssues) {
    console.error(
      `  [${issue.type}] ${issue.url} -> ${issue.googleCanonical}` +
        `${issue.lastCrawlTime ? ` (last crawled ${issue.lastCrawlTime})` : ""}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} inspection(s) failed:`);
  for (const { url, error } of failures) console.error(`  ${url}: ${error.message}`);
  process.exitCode = 1;
}

if (inspectionRun.stopped) {
  console.error(
    `\nFailure circuit opened at ${MAX_FAILURES} errors; ` +
      `${inspectionRun.failureCount} requests failed after in-flight work settled, and ` +
      `${selected.length - completedCount} URLs were not attempted.`,
  );
  process.exitCode = 1;
}

if (canonicalIssues.some(({ type }) => type === "off-domain")) {
  process.exitCode = 2;
}
