-- Presence sessions: anonymous per-tab tokens, no PII.
-- Heartbeat upserts keep each token alive; reads count within 5 minutes.
CREATE TABLE IF NOT EXISTS presence_sessions (
  session_token TEXT PRIMARY KEY,
  last_seen     TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS presence_sessions_last_seen_idx ON presence_sessions (last_seen);

-- Streak columns: real day streak derived from client-supplied sessionDate.
-- Existing users start at streak 1 on their first post-migration session (no backfill).
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS last_session_date DATE,
  ADD COLUMN IF NOT EXISTS current_streak    INTEGER NOT NULL DEFAULT 0;
