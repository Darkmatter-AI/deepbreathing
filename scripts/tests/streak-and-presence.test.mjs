import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { computeStreak } from "./helpers/streak-logic.mjs";

const ROOT = process.cwd();

// ── Streak transition logic ────────────────────────────────────────────────

test("streak: no prior session → 1", () => {
  assert.equal(computeStreak(0, null, "2026-06-13"), 1);
});

test("streak: session on the same day → unchanged", () => {
  assert.equal(computeStreak(3, "2026-06-13", "2026-06-13"), 3);
});

test("streak: consecutive day → current + 1", () => {
  assert.equal(computeStreak(3, "2026-06-12", "2026-06-13"), 4);
});

test("streak: gap of 2+ days → reset to 1", () => {
  assert.equal(computeStreak(5, "2026-06-10", "2026-06-13"), 1);
});

test("streak: streak=1, first day is the same as session → unchanged", () => {
  assert.equal(computeStreak(1, "2026-06-01", "2026-06-01"), 1);
});

// ── Migration file ────────────────────────────────────────────────────────

const MIGRATION = path.join(
  ROOT,
  "src/lib/db/migrations/002_presence_and_streak.sql"
);

test("migration 002 exists", () => {
  assert.ok(fs.existsSync(MIGRATION), "missing 002_presence_and_streak.sql");
});

test("migration 002 creates presence_sessions table", () => {
  const sql = fs.readFileSync(MIGRATION, "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS presence_sessions/);
  assert.match(sql, /session_token\s+TEXT\s+PRIMARY KEY/i);
  assert.match(sql, /last_seen\s+TIMESTAMPTZ/i);
});

test("migration 002 adds streak columns to user_stats", () => {
  const sql = fs.readFileSync(MIGRATION, "utf8");
  assert.match(sql, /ADD COLUMN IF NOT EXISTS last_session_date/i);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS current_streak/i);
});

// ── Presence routes ───────────────────────────────────────────────────────

const HEARTBEAT_ROUTE = path.join(
  ROOT,
  "src/app/api/v1/presence/heartbeat/route.ts"
);
const COUNT_ROUTE = path.join(
  ROOT,
  "src/app/api/v1/presence/count/route.ts"
);

test("presence heartbeat route exists", () => {
  assert.ok(fs.existsSync(HEARTBEAT_ROUTE), "missing presence/heartbeat/route.ts");
});

test("presence heartbeat route prunes stale rows", () => {
  const src = fs.readFileSync(HEARTBEAT_ROUTE, "utf8");
  assert.match(src, /10 minutes/i, "heartbeat must prune rows older than 10 minutes");
});

test("presence count route exists", () => {
  assert.ok(fs.existsSync(COUNT_ROUTE), "missing presence/count/route.ts");
});

test("presence count route uses 5-minute active window", () => {
  const src = fs.readFileSync(COUNT_ROUTE, "utf8");
  assert.match(src, /5 minutes/i, "count must use a 5-minute active window");
});

test("presence count route sets s-maxage cache header", () => {
  const src = fs.readFileSync(COUNT_ROUTE, "utf8");
  assert.match(src, /s-maxage/i, "count route must set s-maxage cache header");
});

// ── Stats route ───────────────────────────────────────────────────────────

const STATS_ROUTE = path.join(
  ROOT,
  "src/app/api/v1/sync/stats/route.ts"
);

test("stats route accepts sessionDate from the client", () => {
  const src = fs.readFileSync(STATS_ROUTE, "utf8");
  assert.match(src, /sessionDate/i, "stats route must read sessionDate from body");
});

test("stats route contains streak CASE expression", () => {
  const src = fs.readFileSync(STATS_ROUTE, "utf8");
  assert.match(src, /current_streak\s*=\s*CASE/i, "stats route must update current_streak with a CASE expression");
  assert.match(src, /current_streak \+ 1/i, "CASE must handle consecutive-day increment");
});

// ── Bootstrap route ───────────────────────────────────────────────────────

const BOOTSTRAP_ROUTE = path.join(
  ROOT,
  "src/app/api/v1/sync/bootstrap/route.ts"
);

test("bootstrap route includes currentStreak in response", () => {
  const src = fs.readFileSync(BOOTSTRAP_ROUTE, "utf8");
  assert.match(src, /currentStreak/i, "bootstrap must return currentStreak to the client");
});
