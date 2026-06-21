-- Per-day practice log: one row per (user, local calendar day) the user practiced.
-- Powers the full-month practice calendar on /stats. Additive + idempotent.
--
-- NOTE: this is a purpose-built, lean store for the user-facing calendar. It is
-- intentionally NOT the larger `session_events` table planned in PHASE-0-SPEC
-- (Task 0.3), which carries per-session granularity, guest tracking, page slugs
-- and quality scoring for the agent-pages feature. When session_events lands,
-- this table can be derived from it (SELECT DISTINCT user_id, date) or kept as a
-- fast denormalized index. (Spec migration numbering is stale: it labels
-- session_events as `002`, but `002` is presence_and_streak.)
CREATE TABLE IF NOT EXISTS user_active_days (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  day     DATE NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_user_active_days_user_day
  ON user_active_days (user_id, day);

-- Backfill: existing users only have an aggregate streak window, not per-day
-- history. Seed the consecutive window [last_session_date - (streak-1) .. last]
-- so the calendar isn't empty on launch. Those days were genuinely active.
INSERT INTO user_active_days (user_id, day)
SELECT
  s.user_id,
  (s.last_session_date - g.n)::date AS day
FROM user_stats s
CROSS JOIN LATERAL generate_series(0, GREATEST(s.current_streak, 1) - 1) AS g(n)
WHERE s.last_session_date IS NOT NULL
  AND s.current_streak > 0
ON CONFLICT (user_id, day) DO NOTHING;
