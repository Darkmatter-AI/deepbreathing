import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";

// Never prerendered at build time. These handlers read request state (session,
// database) and a build-time prerender attempt evaluates that state with no env
// configured, which crashed the static worker on deployments without secrets.
// Cacheability is expressed per-response via Cache-Control, not by prerendering.
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userId = session.user.id;

  // Client must supply sessionDate (YYYY-MM-DD) in the user's local timezone.
  // We never use server CURRENT_DATE — the user might be in UTC-12 at midnight.
  const sessionDate =
    typeof body.sessionDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.sessionDate)
      ? body.sessionDate
      : null;

  await pool.query(
    `INSERT INTO user_stats (user_id, total_minutes, sessions_completed, last_session_date, current_streak, updated_at)
     VALUES ($1, $2, $3, $4::date, CASE WHEN $4::date IS NOT NULL THEN 1 ELSE 0 END, now())
     ON CONFLICT (user_id) DO UPDATE SET
       total_minutes      = GREATEST(user_stats.total_minutes, EXCLUDED.total_minutes),
       sessions_completed = GREATEST(user_stats.sessions_completed, EXCLUDED.sessions_completed),
       current_streak     = CASE
         WHEN $4::date IS NULL                                              THEN user_stats.current_streak
         WHEN user_stats.last_session_date IS NULL                         THEN 1
         WHEN user_stats.last_session_date = $4::date                      THEN user_stats.current_streak
         WHEN user_stats.last_session_date = $4::date - interval '1 day'  THEN user_stats.current_streak + 1
         ELSE 1
       END,
       last_session_date  = CASE
         WHEN $4::date IS NULL                                                               THEN user_stats.last_session_date
         WHEN user_stats.last_session_date IS NULL OR $4::date > user_stats.last_session_date THEN $4::date
         ELSE user_stats.last_session_date
       END,
       updated_at         = now()`,
    [userId, body.totalMinutes ?? 0, body.sessionsCompleted ?? 0, sessionDate]
  );

  // Record the active day for the practice calendar (best-effort: never block the
  // core stats sync if the user_active_days table isn't migrated yet).
  if (sessionDate) {
    try {
      await pool.query(
        `INSERT INTO user_active_days (user_id, day)
         VALUES ($1, $2::date)
         ON CONFLICT (user_id, day) DO NOTHING`,
        [userId, sessionDate]
      );
    } catch {
      // user_active_days not yet present — calendar falls back to streak window.
    }
  }

  return NextResponse.json({ ok: true });
}
