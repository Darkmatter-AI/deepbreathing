import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [settingsResult, statsResult] = await Promise.all([
    pool.query("SELECT * FROM user_settings WHERE user_id = $1", [userId]),
    pool.query("SELECT * FROM user_stats WHERE user_id = $1", [userId]),
  ]);

  const settings = settingsResult.rows[0] ?? null;
  const stats = statsResult.rows[0] ?? null;

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
  });
}
