import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  decodeSessionCursor,
  encodeSessionCursor,
  validateSessionEvent,
} from "../../src/lib/sync/session-events.ts";

const ROOT = process.cwd();

const VALID_EVENT = {
  id: "018f3e02-ff1d-7c55-9bd1-2f32672a95d8",
  practiceId: "018f3e02-ff1d-7c55-9bd1-2f32672a95d9",
  guestId: "guest_018f3e02",
  startedAt: "2026-07-11T09:00:00.000Z",
  endedAt: "2026-07-11T09:05:00.000Z",
  seconds: 300,
  mode: "Box Breathing",
  completed: true,
  endReason: "completed",
  platform: "ios",
  localDate: "2026-07-11",
  clientVersion: "1.0.0",
};

test("session event validation accepts a canonical completed session", () => {
  const result = validateSessionEvent(VALID_EVENT);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.event, VALID_EVENT);
});

test("session event validation rejects impossible and unbounded durations", () => {
  for (const seconds of [0, -1, 3601, 3.5]) {
    const result = validateSessionEvent({ ...VALID_EVENT, seconds });
    assert.equal(result.ok, false, `seconds=${seconds} must be rejected`);
  }
});

test("session event validation rejects unknown modes and platforms", () => {
  assert.equal(
    validateSessionEvent({ ...VALID_EVENT, mode: "Hyperventilate" }).ok,
    false
  );
  assert.equal(
    validateSessionEvent({ ...VALID_EVENT, platform: "watchos" }).ok,
    false
  );
});

test("session event validation rejects an end before its start", () => {
  const result = validateSessionEvent({
    ...VALID_EVENT,
    endedAt: "2026-07-11T08:59:59.000Z",
  });
  assert.equal(result.ok, false);
});

test("session event validation requires a real local calendar date", () => {
  assert.equal(
    validateSessionEvent({ ...VALID_EVENT, localDate: "2026-02-30" }).ok,
    false
  );
});

test("session cursors round-trip a stable timestamp and id pair", () => {
  const createdAt = "2026-07-11T09:06:00.123Z";
  const id = VALID_EVENT.id;
  assert.deepEqual(decodeSessionCursor(encodeSessionCursor(createdAt, id)), {
    createdAt,
    id,
  });
});

test("session cursor decoder rejects malformed values", () => {
  assert.equal(decodeSessionCursor("not-a-cursor"), null);
});

const MIGRATION = path.join(
  ROOT,
  "src/lib/db/migrations/004_session_events.sql"
);

test("migration 004 creates an immutable, cascading session ledger", () => {
  assert.ok(fs.existsSync(MIGRATION), "missing 004_session_events.sql");
  const sql = fs.readFileSync(MIGRATION, "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS session_events/i);
  assert.match(sql, /id\s+TEXT\s+PRIMARY KEY/i);
  assert.match(sql, /practice_id\s+TEXT\s+NOT NULL/i);
  assert.match(sql, /REFERENCES\s+"user"\s*\(id\)\s+ON DELETE CASCADE/i);
  assert.match(sql, /CHECK\s*\(seconds BETWEEN 1 AND 3600\)/i);
  assert.match(sql, /ledger_baseline_minutes/i);
  assert.match(sql, /ledger_baseline_sessions/i);
  assert.doesNotMatch(sql, /ON UPDATE/i, "ledger rows must not be mutable");
});

const ROUTE = path.join(
  ROOT,
  "src/app/api/v1/sync/session-events/route.ts"
);

test("session events route authenticates and inserts idempotently", () => {
  assert.ok(fs.existsSync(ROUTE), "missing sync/session-events route");
  const source = fs.readFileSync(ROUTE, "utf8");
  assert.match(source, /auth\.api\.getSession/);
  assert.match(source, /ON CONFLICT\s*\(id\)\s*DO NOTHING/i);
  assert.match(source, /MAX_BATCH_SIZE/);
  assert.match(source, /encodeSessionCursor/);
});

const BOOTSTRAP_ROUTE = path.join(
  ROOT,
  "src/app/api/v1/sync/bootstrap/route.ts"
);

test("sync bootstrap includes the first canonical session page and cursor", () => {
  const source = fs.readFileSync(BOOTSTRAP_ROUTE, "utf8");
  assert.match(source, /FROM session_events/i);
  assert.match(source, /sessionEvents/);
  assert.match(source, /nextCursor/);
  assert.match(source, /serverTime/);
});
