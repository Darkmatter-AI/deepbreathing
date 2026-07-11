import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CLIENT = path.join(ROOT, "src/lib/sync/web-session-events.ts");
const EXPERIENCE = path.join(ROOT, "src/components/resonance/Resonance.tsx");
const SYNC_HOOK = path.join(ROOT, "src/lib/sync/use-sync.ts");

test("web keeps an offline session-event outbox and retry metadata", () => {
  assert.ok(fs.existsSync(CLIENT), "missing browser session-event sync client");
  const source = fs.readFileSync(CLIENT, "utf8");
  assert.match(source, /localStorage/);
  assert.match(source, /nextAttemptAt/);
  assert.match(source, /api\/v1\/sync\/session-events/);
  assert.match(source, /idempotencyKey/);
});

test("web breathing writes immutable segments before attempting sync", () => {
  const source = fs.readFileSync(EXPERIENCE, "utf8");
  assert.match(source, /enqueueWebSessionEvent/);
  assert.match(source, /practiceId:\s*sessionId/);
  assert.match(source, /previouslyCommittedSeconds:\s*sessionCommittedSeconds/);
});

test("guest merge flushes ledger events before reconciling aggregates", () => {
  const source = fs.readFileSync(SYNC_HOOK, "utf8");
  const flush = source.indexOf("flushWebSessionOutbox");
  const merge = source.indexOf('fetch("/api/v1/sync/merge"');
  assert.ok(flush >= 0, "missing guest ledger flush");
  assert.ok(merge > flush, "ledger must flush before aggregate baseline reconciliation");
});
