import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type { PoolClient } from "pg";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import {
  decodeSessionCursor,
  encodeSessionCursor,
  validateSessionEvent,
} from "@/lib/sync/session-events";

// Never prerendered at build time. These handlers read request state (session,
// database) and a build-time prerender attempt evaluates that state with no env
// configured, which crashed the static worker on deployments without secrets.
// Cacheability is expressed per-response via Cache-Control, not by prerendering.
export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 100;
const DEFAULT_PAGE_SIZE = 100;

type LedgerRow = {
  id: string;
  practice_id: string;
  guest_id: string | null;
  started_at: Date;
  ended_at: Date;
  seconds: number;
  mode: string;
  completed: boolean;
  end_reason: string;
  platform: "web" | "ios" | "android";
  local_date: string;
  client_version: string | null;
  created_at: Date;
};

function serializeRow(row: LedgerRow) {
  return {
    id: row.id,
    practiceId: row.practice_id,
    ...(row.guest_id ? { guestId: row.guest_id } : {}),
    startedAt: row.started_at.toISOString(),
    endedAt: row.ended_at.toISOString(),
    seconds: row.seconds,
    mode: row.mode,
    completed: row.completed,
    endReason: row.end_reason,
    platform: row.platform,
    localDate: row.local_date,
    ...(row.client_version ? { clientVersion: row.client_version } : {}),
  };
}

async function recomputeStats(client: PoolClient, userId: string) {
  await client.query(
    `INSERT INTO user_stats (
       user_id, total_minutes, sessions_completed,
       ledger_baseline_minutes, ledger_baseline_sessions, updated_at
     )
     VALUES ($1, 0, 0, 0, 0, now())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  const days = await client.query<{ day: string }>(
    `SELECT day::text AS day
     FROM user_active_days
     WHERE user_id = $1
     ORDER BY day DESC`,
    [userId]
  );

  let currentStreak = 0;
  let previousDay: number | null = null;
  for (const row of days.rows) {
    const day = Date.parse(`${row.day}T00:00:00.000Z`);
    if (previousDay !== null && previousDay - day !== 86_400_000) break;
    currentStreak += 1;
    previousDay = day;
  }
  const lastSessionDate = days.rows[0]?.day ?? null;

  await client.query(
    `UPDATE user_stats AS stats
     SET
       total_minutes = stats.ledger_baseline_minutes + ledger.total_minutes,
       sessions_completed = stats.ledger_baseline_sessions + ledger.sessions_completed,
       last_session_date = $2::date,
       current_streak = $3,
       updated_at = now()
     FROM (
       SELECT
         FLOOR(COALESCE(SUM(seconds), 0) / 60.0)::integer AS total_minutes,
         COUNT(*) FILTER (WHERE completed)::integer AS sessions_completed
       FROM session_events
       WHERE user_id = $1
     ) AS ledger
     WHERE stats.user_id = $1`,
    [userId, lastSessionDate, currentStreak]
  );
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload =
    typeof body === "object" && body !== null && "payload" in body
      ? (body as { payload?: unknown }).payload
      : null;
  const events =
    typeof payload === "object" && payload !== null && "events" in payload
      ? (payload as { events?: unknown }).events
      : null;

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "At least one event is required" }, { status: 400 });
  }
  if (events.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `A batch may contain at most ${MAX_BATCH_SIZE} events` },
      { status: 413 }
    );
  }

  const validated = events.map(validateSessionEvent);
  const invalidIndex = validated.findIndex((result) => !result.ok);
  if (invalidIndex !== -1) {
    const invalid = validated[invalidIndex];
    return NextResponse.json(
      { error: invalid.ok ? "Invalid event" : invalid.error, eventIndex: invalidIndex },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  let acceptedCount = 0;
  try {
    await client.query("BEGIN");
    for (const result of validated) {
      if (!result.ok) continue;
      const event = result.event;
      const inserted = await client.query(
        `INSERT INTO session_events (
           id, practice_id, user_id, guest_id, started_at, ended_at, seconds, mode,
           completed, end_reason, platform, local_date, client_version
         )
         VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9, $10, $11, $12::date, $13)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [
          event.id,
          event.practiceId,
          session.user.id,
          event.guestId ?? null,
          event.startedAt,
          event.endedAt,
          event.seconds,
          event.mode,
          event.completed,
          event.endReason,
          event.platform,
          event.localDate,
          event.clientVersion ?? null,
        ]
      );
      if (inserted.rowCount === 1) {
        acceptedCount += 1;
        await client.query(
          `INSERT INTO user_active_days (user_id, day)
           VALUES ($1, $2::date)
           ON CONFLICT (user_id, day) DO NOTHING`,
          [session.user.id, event.localDate]
        );
      }
    }

    if (acceptedCount > 0) await recomputeStats(client, session.user.id);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to sync session events", error);
    return NextResponse.json({ error: "Unable to sync sessions" }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({
    accepted: true,
    acceptedCount,
    duplicateCount: events.length - acceptedCount,
    serverTime: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursorValue = request.nextUrl.searchParams.get("cursor");
  const cursor = cursorValue ? decodeSessionCursor(cursorValue) : null;
  if (cursorValue && !cursor) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_BATCH_SIZE)
    : DEFAULT_PAGE_SIZE;

  const result = await pool.query<LedgerRow>(
    `SELECT
       id, practice_id, guest_id, started_at, ended_at, seconds, mode, completed,
       end_reason, platform, local_date::text, client_version, created_at
     FROM session_events
     WHERE user_id = $1
       AND ($2::timestamptz IS NULL OR (created_at, id) > ($2::timestamptz, $3::text))
     ORDER BY created_at, id
     LIMIT $4`,
    [session.user.id, cursor?.createdAt ?? null, cursor?.id ?? null, limit]
  );

  const last = result.rows.at(-1);
  return NextResponse.json({
    events: result.rows.map(serializeRow),
    nextCursor: last
      ? encodeSessionCursor(last.created_at.toISOString(), last.id)
      : cursorValue,
    hasMore: result.rows.length === limit,
    serverTime: new Date().toISOString(),
  });
}
