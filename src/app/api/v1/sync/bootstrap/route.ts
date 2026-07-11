import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";
import { encodeSessionCursor } from "@/lib/sync/session-events";

export async function GET() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [settingsResult, statsResult, sessionEventsResult] = await Promise.all([
    pool.query("SELECT * FROM user_settings WHERE user_id = $1", [userId]),
    pool.query("SELECT * FROM user_stats WHERE user_id = $1", [userId]),
    pool.query(
      `SELECT
         id, practice_id, guest_id, started_at, ended_at, seconds, mode, completed,
         end_reason, platform, local_date::text, client_version, created_at
       FROM session_events
       WHERE user_id = $1
       ORDER BY created_at, id
       LIMIT 100`,
      [userId]
    ),
  ]);

  const settings = settingsResult.rows[0] ?? null;
  const stats = statsResult.rows[0] ?? null;
  const lastSessionEvent = sessionEventsResult.rows.at(-1);

  return NextResponse.json({
    settings: settings
      ? {
          mode: settings.mode,
          speedMultiplier: settings.speed_multiplier,
          selectedDuration: settings.selected_duration,
          muted: settings.muted,
          theme: settings.theme,
          updatedAt: settings.updated_at,
        }
      : null,
    stats: stats
      ? {
          totalMinutes: stats.total_minutes,
          sessionsCompleted: stats.sessions_completed,
          currentStreak: stats.current_streak ?? 0,
          lastSessionDate: stats.last_session_date ?? null,
          updatedAt: stats.updated_at,
        }
      : null,
    sessionEvents: sessionEventsResult.rows.map((event) => ({
      id: event.id,
      practiceId: event.practice_id,
      ...(event.guest_id ? { guestId: event.guest_id } : {}),
      startedAt: event.started_at.toISOString(),
      endedAt: event.ended_at.toISOString(),
      seconds: event.seconds,
      mode: event.mode,
      completed: event.completed,
      endReason: event.end_reason,
      platform: event.platform,
      localDate: event.local_date,
      ...(event.client_version ? { clientVersion: event.client_version } : {}),
    })),
    nextCursor: lastSessionEvent
      ? encodeSessionCursor(
          lastSessionEvent.created_at.toISOString(),
          lastSessionEvent.id
        )
      : null,
    serverTime: new Date().toISOString(),
  });
}
