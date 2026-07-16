import type { Metadata } from "next";
import { headers } from "next/headers";

import type { StatsContent } from "@/i18n/content/bespoke/stats/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { streakWindowDays } from "@/lib/stats/streak-calendar";

import { StatsDisplay, StatsSignedOut } from "./stats-display";

const siteUrl = "https://deepbreathingexercises.com";

export function createStatsMetadataFromContent(
  content: StatsContent,
  canonicalPath?: string,
): Metadata {
  return {
    title: content["metadata.title"],
    description: content["metadata.description"],
    ...(canonicalPath
      ? {
          alternates: {
            canonical: new URL(canonicalPath, siteUrl).toString(),
          },
        }
      : {}),
    robots: { index: false },
  };
}

export async function StatsPage({
  content,
  renderContext,
}: {
  content: StatsContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const clientRenderContext = {
    appHref: renderContext
      ? resolveNativeInternalHref(
          "/",
          renderContext.locale,
          renderContext.linkMode,
        )
      : "/",
    authLocale: renderContext?.locale ?? "en",
    locale: renderContext?.locale ?? "en-US",
  };
  const session = await auth.api.getSession({ headers: headers() });

  if (!session?.user) {
    return (
      <StatsSignedOut content={content} renderContext={clientRenderContext} />
    );
  }

  const userId = session.user.id;

  const [statsResult, settingsResult] = await Promise.all([
    pool.query(
      `SELECT total_minutes, sessions_completed, current_streak, last_session_date
       FROM user_stats WHERE user_id = $1`,
      [userId],
    ),
    pool.query(`SELECT mode FROM user_settings WHERE user_id = $1`, [userId]),
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

  // Per-day practice history for the breath garden. Pull ~20 weeks so the 18-week
  // garden fills in any timezone (18×7 days + the leading Sunday + slack). Falls
  // back to the streak window if the user_active_days table isn't migrated/
  // backfilled yet, so the page never 500s.
  let dbDays: string[] = [];
  try {
    const daysResult = await pool.query(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day
       FROM user_active_days
       WHERE user_id = $1 AND day >= CURRENT_DATE - interval '140 days'`,
      [userId],
    );
    dbDays = daysResult.rows.map((resultRow) => resultRow.day as string);
  } catch {
    // Table not present yet — rely on the streak-window floor below.
  }
  const activeDays = Array.from(
    new Set([...dbDays, ...streakWindowDays(currentStreak, lastSessionDate)]),
  );

  return (
    <StatsDisplay
      activeDays={activeDays}
      content={content}
      currentMode={currentMode}
      currentStreak={currentStreak}
      lastSessionDate={lastSessionDate}
      renderContext={clientRenderContext}
      sessionsCompleted={sessionsCompleted}
      totalMinutes={totalMinutes}
    />
  );
}
