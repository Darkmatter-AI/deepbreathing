// DBE new-accounts report. Run from INSIDE the app repo so `pg` resolves:
//   cd /Users/abi/Sites/deepbreathing && \
//     vercel env pull /tmp/.db-env --environment=production --yes 2>/dev/null && \
//     eval "$(grep -E '^(POSTGRES|DATABASE)' /tmp/.db-env | sed 's/^/export /')" && \
//     rm -f /tmp/.db-env && \
//     DB_URL="${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}" node <path-to-this-file>
// Read-only. No local psql exists on this machine — that's why we use the app's pg driver.
import { Pool } from "pg";
const url = process.env.DB_URL;
if (!url) { console.error("no DB_URL"); process.exit(1); }
const pool = new Pool({ connectionString: url });
const q = (sql, p) => pool.query(sql, p).then(r => r.rows);
try {
  const total = (await q(`SELECT COUNT(*)::int n FROM "user"`))[0].n;
  const windows = (await q(`SELECT
      COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '24 hours')::int AS d1,
      COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '7 days')::int  AS d7,
      COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '14 days' AND "createdAt" < now() - interval '7 days')::int AS d7_prev,
      COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '30 days')::int AS d30
    FROM "user"`))[0];
  const daily = await q(`SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::int n
    FROM "user" WHERE "createdAt" >= now() - interval '14 days' GROUP BY 1 ORDER BY 1`);
  let byProvider = [];
  try {
    byProvider = await q(`SELECT COALESCE(a."providerId", 'magic-link / email') AS provider, COUNT(DISTINCT u.id)::int n
      FROM "user" u LEFT JOIN "account" a ON a."userId" = u.id GROUP BY 1 ORDER BY 2 DESC`);
  } catch (e) { byProvider = [{ provider: "(join failed: " + e.message + ")", n: 0 }]; }
  const verified = (await q(`SELECT COUNT(*) FILTER (WHERE "emailVerified")::int AS verified,
      COUNT(*) FILTER (WHERE NOT "emailVerified")::int AS unverified FROM "user"`))[0];
  const recent = await q(`SELECT to_char("createdAt",'YYYY-MM-DD HH24:MI') AS at, "emailVerified" AS v, ("name" IS NOT NULL) AS named
    FROM "user" ORDER BY "createdAt" DESC LIMIT 8`);
  console.log(JSON.stringify({ total, windows, verified, byProvider, daily, recent }, null, 2));
} catch (e) { console.error("ERR:", e.message); } finally { await pool.end(); }
