---
name: dbe-accounts-auth
description: Check real new-account signups for deepbreathingexercises.com directly in its Neon Postgres DB, and verify the signup/auth flow is working via the browser. Use when asked "how many new accounts / signups", "check accounts on Neon", "is signup/login working", or to debug DBE auth. Pairs with the dbe-analytics skill (GA4 funnel).
---

# DBE Accounts & Auth

Ground truth for **registered accounts** is the Neon Postgres `"user"` table — GA4's `conversion_signup_completed` is only an event proxy. See [[dbe-analytics]] for the GA4 side.

## Where the app lives

One repo holds both the app (DB + auth) and the SEO/control-surface docs: `/Users/abi/Sites/deepbreathing` (Vercel project `deepbreathing`). Run all commands from there. (A stale empty clone at `/Users/abi/Sites/darkmatter/deepbreathing` predates the merge — ignore it.)

DB is **Neon** (`ep-bold-feather-...neon.tech`, us-east-1). Auth is **better-auth** (`src/lib/auth.ts`) with **Google OAuth + magic link** (Resend for email).

## Querying new accounts

⚠️ There is **no `psql` on this machine.** Query via the app's bundled `pg` driver, running a Node script *from inside the app repo* so `pg` resolves. The ready-made script is `scripts/accounts.mjs` (total / 24h / 7d / 30d, daily trend, provider split, verified count, recent rows):

```bash
cd /Users/abi/Sites/deepbreathing && \
  vercel env pull /tmp/.db-env --environment=production --yes 2>/dev/null && \
  eval "$(grep -E '^(POSTGRES|DATABASE)' /tmp/.db-env | sed 's/^/export /')" && \
  rm -f /tmp/.db-env && \
  DB_URL="${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}" \
  node .claude/skills/dbe-accounts-auth/scripts/accounts.mjs
```

Always pull creds fresh from Vercel and `rm -f /tmp/.db-env` in the same chain. Read-only; never run UPDATE/DELETE/DDL without explicit confirmation. The `pg` driver may emit a non-fatal SSL deprecation warning — expected, script still runs.

### Schema notes (better-auth, Postgres)

- Tables are camelCase **quoted**: `"user"`, `"account"`, `"session"`, `"verification"`. `user` is a reserved word — always quote it.
- Columns: `"createdAt"`, `"emailVerified"` (bool), `id`, `email`, `name`, `image`.
- **Signup method** = `account."providerId"` joined on `account."userId" = user.id`. `google` = Google OAuth; **no `account` row = magic-link/email** signup.
- Custom app tables (migration `src/lib/db/migrations/001_custom_tables.sql`): `user_settings`, `user_stats`, plus `email_suppressions` (auth checks this before sending welcome/magic-link emails).
- "New accounts" = rows in `"user"`. Do NOT report GA4 "New users" as accounts — that's first-time *visitors*.

## Auth health probe (browser, non-destructive)

Use /chrome to confirm signup works **without creating an account or logging in**:

1. `GET https://deepbreathingexercises.com/api/auth/get-session` → expect **200** (body is `{}` or null JSON = logged out, healthy).
2. `GET https://origin.deepbreathingexercises.com/api/auth/get-session` → expect **200**. The OAuth **callback routes through the `origin.` subdomain** (Cloudflare-bypass) — this is the historic "500 behind Cloudflare proxy" spot, so always check it.
3. On the homepage click **"Sign up"** → the "Save your progress" modal should render (Continue with Google + email magic link).
4. Click **Continue with Google** → should redirect to `accounts.google.com` with a valid PKCE URL (`code_challenge`, `state`, `redirect_uri=.../origin.../api/auth/callback/google`). **STOP at Google's screen** — that proves the server path works.

### Hard limits (safety)
- **Never complete a Google login or create an account** on the user's behalf — prohibited. To test the full callback (session-cookie write + user-row creation), have the *user* do a real signup, then re-run `accounts.mjs` to confirm a new row appeared.
- The **magic-link send** test (enter email → "Send magic link" → check the POST returns 200) sends a **real email** via Resend — only do it with explicit permission, and use the owner's own address (`abi@deepbreathingexercises.com`).

## Reading the result

A 5-day-plus gap in new accounts while traffic is up is worth probing, but at low volume (~0.4/day) a random multi-day zero is plausible — confirm with the auth probe before calling it an outage. All-verified, no unverified rows = the signup experience itself is clean; low counts mean a top-of-funnel problem (see [[dbe-analytics]] funnel).
