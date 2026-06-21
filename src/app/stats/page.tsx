import { type Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { StatsDisplay, StatsSignedOut } from "./stats-display";

export const metadata: Metadata = {
  title: "Your Practice Stats — Deep Breathing Exercises",
  description:
    "See your total breathing minutes, session count, streak, and 14-day practice calendar.",
  robots: { index: false },
};

export default async function StatsPage() {
  const session = await auth.api.getSession({ headers: headers() });

  if (!session?.user) {
    return <StatsSignedOut />;
  }

  const userId = session.user.id;

  const [statsResult, settingsResult] = await Promise.all([
    pool.query(
      `SELECT total_minutes, sessions_completed, current_streak, last_session_date
       FROM user_stats WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT mode FROM user_settings WHERE user_id = $1`,
      [userId]
    ),
  ]);

  const row = statsResult.rows[0];
  const settings = settingsResult.rows[0];

  const totalMinutes: number = row?.total_minutes ?? 0;
  const sessionsCompleted: number = row?.sessions_completed ?? 0;
  const currentStreak: number = row?.current_streak ?? 0;
  const lastSessionDate: string | null = row?.last_session_date
    ? new Date(row.last_session_date).toISOString().slice(0, 10)
    : null;
  const currentMode: string | null = settings?.mode ?? null;

  return (
    <StatsDisplay
      totalMinutes={totalMinutes}
      sessionsCompleted={sessionsCompleted}
      currentStreak={currentStreak}
      lastSessionDate={lastSessionDate}
      currentMode={currentMode}
      userName={session.user.name ?? session.user.email}
    />
  );
}
