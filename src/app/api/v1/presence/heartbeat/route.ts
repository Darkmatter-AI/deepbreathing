import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token || token.length > 128) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO presence_sessions (session_token, last_seen)
     VALUES ($1, now())
     ON CONFLICT (session_token) DO UPDATE SET last_seen = now()`,
    [token]
  );

  // Prune rows idle for more than 10 minutes on each write (cheap — indexed).
  await pool.query(
    `DELETE FROM presence_sessions WHERE last_seen < now() - interval '10 minutes'`
  );

  return NextResponse.json({ ok: true });
}
