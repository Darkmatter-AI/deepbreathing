import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

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
