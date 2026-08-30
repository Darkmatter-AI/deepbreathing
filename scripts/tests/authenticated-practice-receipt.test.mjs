import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(
  ROOT,
  "src",
  "components",
  "resonance",
  "authenticated-practice-receipt.tsx",
);
const RESONANCE_PATH = path.join(
  ROOT,
  "src",
  "components",
  "resonance",
  "Resonance.tsx",
);
const KEEP_PRACTICE_PATH = path.join(
  ROOT,
  "src",
  "components",
  "auth",
  "keep-practice-sheet.tsx",
);

function readReceipt() {
  assert.ok(fs.existsSync(RECEIPT_PATH), `receipt expected at ${RECEIPT_PATH}`);
  return fs.readFileSync(RECEIPT_PATH, "utf8");
}

function telemetryPayload(source) {
  const match = source.match(
    /gtag\("event", eventName, \{([\s\S]*?)\}\);/,
  );
  assert.ok(match, "the telemetry boundary must send one explicit params object");
  return match[1];
}

test("receipt exposes the localized post-session component contract", () => {
  const source = readReceipt();

  assert.match(source, /["']use client["']/);
  assert.match(source, /export function AuthenticatedPracticeReceipt\s*\(/);
  assert.match(source, /open:\s*boolean/);
  assert.match(source, /labels:\s*AuthenticatedPracticeReceiptLabels/);
  assert.match(source, /summary:\s*string/);
  assert.match(source, /statsHref:\s*string/);
  assert.match(source, /onDismiss:\s*\(\)\s*=>\s*void/);
  assert.match(source, /sessionMode:\s*string/);
  assert.match(source, /sessionSeconds:\s*number/);
  assert.doesNotMatch(source, /\bany\b/, "the component must not use any");
});

test("receipt telemetry has the two event names, sources, and exact safe params", () => {
  const source = readReceipt();
  const payload = telemetryPayload(source);
  const payloadKeys = [...payload.matchAll(/^\s*([a-z_]+)\s*:/gm)].map(
    ([, key]) => key,
  );

  assert.deepEqual(
    payloadKeys.sort(),
    ["mode", "session_seconds", "source"].sort(),
    "telemetry params must stay limited to the approved fields",
  );
  assert.match(
    source,
    /export type StatsEntryEventName = "stats_entry_shown"\s*\|\s*"stats_entry_click"/,
  );
  assert.match(source, /trackStatsEntryEvent\("stats_entry_shown",\s*"session_receipt"/);
  assert.match(source, /source:\s*"session_receipt"/);
  assert.match(source, /source:\s*"account_menu"/);
  assert.match(source, /session_seconds:\s*normalizeSessionSeconds\(sessionSeconds\)/);

  const telemetry = source.slice(
    source.indexOf("type StatsEntryEventParams"),
    source.indexOf("function formatSessionDuration"),
  );
  for (const forbidden of ["email", "user_id", "page_path", "page_location", "href"]) {
    assert.doesNotMatch(
      telemetry,
      new RegExp(`\\b${forbidden}\\b`, "i"),
      `telemetry must not include ${forbidden}`,
    );
  }
});

test("receipt gates the validated gtag boundary to production hosts", () => {
  const source = readReceipt();

  assert.match(source, /import\s+\{\s*PRODUCTION_HOSTNAMES\s*\}/);
  assert.match(source, /typeof window === "undefined"/);
  assert.match(source, /PRODUCTION_HOSTNAMES\.has\(window\.location\.hostname\)/);
  assert.match(source, /const candidate = \(window as unknown as \{ gtag\?: unknown \}\)\.gtag/);
  assert.match(source, /function isStatsEntryGtag\(value: unknown\): value is StatsEntryGtag/);
  assert.match(source, /typeof value === "function"/);
  assert.match(source, /return isStatsEntryGtag\(candidate\) \? candidate : undefined/);
});

test("receipt is non-blocking and keyboard/screen-reader accessible", () => {
  const source = readReceipt();
  const renderedCard = source.slice(source.indexOf("return ("));

  assert.match(renderedCard, /<aside/);
  assert.match(renderedCard, /role="status"/);
  assert.match(renderedCard, /aria-live="polite"/);
  assert.match(renderedCard, /aria-labelledby=\{titleId\}/);
  assert.match(renderedCard, /<h2 id=\{titleId\}/);
  assert.match(renderedCard, /labels\.sessionComplete/);
  assert.match(renderedCard, /labels\.yourPractice/);
  assert.match(renderedCard, /statsHref/);
  assert.match(renderedCard, /<button[\s\S]*?type="button"/);
  assert.match(renderedCard, /aria-label=\{labels\.close\}/);
  assert.match(renderedCard, /onClick=\{onDismiss\}/);
  assert.match(renderedCard, /pointer-events-none/);
  assert.match(renderedCard, /pointer-events-auto/);
});

test("shown tracking is one-shot per open cycle and click helpers are typed", () => {
  const source = readReceipt();

  assert.match(source, /const hasReportedOpenRef = useRef\(false\)/);
  assert.match(source, /if \(!open\) \{[\s\S]*?hasReportedOpenRef\.current = false/);
  assert.match(source, /if \(hasReportedOpenRef\.current\) return/);
  assert.match(source, /hasReportedOpenRef\.current = true/);
  assert.match(source, /export function trackStatsEntryClick\(/);
  assert.match(source, /export function trackAccountMenuStatsEntryClick\(/);
  assert.match(source, /source:\s*"account_menu"/);

  const link = source.slice(source.indexOf("<Link"), source.indexOf("</Link>"));
  assert.match(link, /href=\{statsHref\}/);
  assert.match(link, /onClick=\{handleStatsClick\}/);
  assert.match(source, /trackStatsEntryClick\(\{[\s\S]*?source:\s*"session_receipt"/);
  assert.match(source, /if \(!open\) return null/);
});

test("receipt stays authenticated-only, including the local preview", () => {
  const source = fs.readFileSync(RESONANCE_PATH, "utf8");
  const receipt = source.slice(
    source.indexOf("<AuthenticatedPracticeReceipt"),
    source.indexOf("</AuthenticatedPracticeReceipt>"),
  );

  assert.match(
    receipt,
    /open=\{[\s\S]*?isAuthenticated\s*&&[\s\S]*?authenticatedReceipt/,
    "signed-out visitors must never see the authenticated practice receipt",
  );
});

test("the signed-out save-stats prompt keeps Apple and Google signup options", () => {
  const source = fs.readFileSync(KEEP_PRACTICE_PATH, "utf8");

  assert.match(source, /signIn\.social\(\{ provider: "apple"/);
  assert.match(source, /signIn\.social\(\{ provider: "google"/);
  assert.match(source, /t\("auth\.continue_apple"\)/);
  assert.match(source, /t\("auth\.continue_google"\)/);
});
