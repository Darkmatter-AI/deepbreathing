import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userId = session.user.id;
  const { settings, stats } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (settings) {
      await client.query(
        `INSERT INTO user_settings (user_id, mode, speed_multiplier, selected_duration, muted, theme, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now())
         ON CONFLICT (user_id) DO UPDATE SET
           mode = EXCLUDED.mode,
           speed_multiplier = EXCLUDED.speed_multiplier,
           selected_duration = EXCLUDED.selected_duration,
           muted = EXCLUDED.muted,
           theme = EXCLUDED.theme,
           updated_at = now()`,
        [
          userId,
          settings.mode ?? "Box Breathing",
          settings.speed ?? 1.0,
          settings.duration ?? null,
          false,
          "system",
        ]
      );
    }

    if (stats) {
      await client.query(
        `WITH ledger AS (
           SELECT
             FLOOR(COALESCE(SUM(seconds), 0) / 60.0)::integer AS minutes,
             COUNT(*) FILTER (WHERE completed)::integer AS sessions
           FROM session_events
           WHERE user_id = $1
         ), incoming AS (
           SELECT
             GREATEST(0, $2::integer) AS total_minutes,
             GREATEST(0, $3::integer) AS sessions_completed
         )
         INSERT INTO user_stats (
           user_id, total_minutes, sessions_completed,
           ledger_baseline_minutes, ledger_baseline_sessions, updated_at
         )
         SELECT
           $1,
           incoming.total_minutes,
           incoming.sessions_completed,
           GREATEST(0, incoming.total_minutes - ledger.minutes),
           GREATEST(0, incoming.sessions_completed - ledger.sessions),
           now()
         FROM ledger, incoming
         ON CONFLICT (user_id) DO UPDATE SET
           total_minutes = GREATEST(user_stats.total_minutes, EXCLUDED.total_minutes),
           sessions_completed = GREATEST(user_stats.sessions_completed, EXCLUDED.sessions_completed),
           ledger_baseline_minutes = GREATEST(
             user_stats.ledger_baseline_minutes,
             EXCLUDED.ledger_baseline_minutes
           ),
           ledger_baseline_sessions = GREATEST(
             user_stats.ledger_baseline_sessions,
             EXCLUDED.ledger_baseline_sessions
           ),
           updated_at = now()`,
        [userId, stats.totalMinutes ?? 0, stats.sessionsCompleted ?? 0]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // Seed the guest's streak window into the practice calendar so pre-signup days
  // appear. Run AFTER commit (a failed statement inside a txn poisons it) and
  // best-effort (skip silently if user_active_days isn't migrated yet).
  if (stats) {
    const lastSessionDate: string | null =
      typeof stats.lastSessionDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(stats.lastSessionDate)
        ? stats.lastSessionDate
        : null;
    const guestStreak: number = Number.isFinite(stats.currentStreak)
      ? Math.max(0, Math.floor(stats.currentStreak))
      : 0;
    if (lastSessionDate && guestStreak > 0) {
      try {
        await pool.query(
          `INSERT INTO user_active_days (user_id, day)
           SELECT $1, ($2::date - g.n)::date
           FROM generate_series(0, $3 - 1) AS g(n)
           ON CONFLICT (user_id, day) DO NOTHING`,
          [userId, lastSessionDate, guestStreak]
        );
      } catch {
        // user_active_days not yet present — non-fatal for the merge.
      }
    }
  }

  return NextResponse.json({ ok: true });
}
