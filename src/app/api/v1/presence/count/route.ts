import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Never prerendered at build time. These handlers read request state (session,
// database) and a build-time prerender attempt evaluates that state with no env
// configured, which crashed the static worker on deployments without secrets.
// Cacheability is expressed per-response via Cache-Control, not by prerendering.
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM presence_sessions WHERE last_seen > now() - interval '5 minutes'`
  );

  const count: number = result.rows[0]?.count ?? 0;
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "public, s-maxage=30" } }
  );
}
