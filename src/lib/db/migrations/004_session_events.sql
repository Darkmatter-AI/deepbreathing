-- Canonical per-practice ledger. Rows are append-only in application code and
-- client-generated UUIDs make retrying a batch idempotent. Account deletion is
-- the intentional exception to immutability, handled by the user FK cascade.
CREATE TABLE IF NOT EXISTS session_events (
  id             TEXT PRIMARY KEY,
  practice_id    TEXT NOT NULL,
  user_id        TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  guest_id       TEXT,
  started_at     TIMESTAMPTZ NOT NULL,
  ended_at       TIMESTAMPTZ NOT NULL,
  seconds        INTEGER NOT NULL CHECK (seconds BETWEEN 1 AND 3600),
  mode           TEXT NOT NULL,
  completed      BOOLEAN NOT NULL,
  end_reason     TEXT NOT NULL CHECK (end_reason IN ('completed', 'paused', 'mode_switched')),
  platform       TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  local_date     DATE NOT NULL,
  client_version TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_session_events_user_cursor
  ON session_events (user_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_session_events_user_local_date
  ON session_events (user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_session_events_user_practice
  ON session_events (user_id, practice_id, started_at);

-- Preserve aggregate history collected before the ledger existed. These
-- values are captured once; all subsequent totals are baseline + ledger.
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS ledger_baseline_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS ledger_baseline_sessions INTEGER;

UPDATE user_stats
SET
  ledger_baseline_minutes = COALESCE(ledger_baseline_minutes, total_minutes),
  ledger_baseline_sessions = COALESCE(ledger_baseline_sessions, sessions_completed)
WHERE ledger_baseline_minutes IS NULL OR ledger_baseline_sessions IS NULL;

ALTER TABLE user_stats
  ALTER COLUMN ledger_baseline_minutes SET DEFAULT 0,
  ALTER COLUMN ledger_baseline_minutes SET NOT NULL,
  ALTER COLUMN ledger_baseline_sessions SET DEFAULT 0,
  ALTER COLUMN ledger_baseline_sessions SET NOT NULL;
