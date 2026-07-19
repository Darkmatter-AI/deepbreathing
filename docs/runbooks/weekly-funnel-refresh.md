# Weekly Funnel Refresh Runbook

**Cadence:** Every Friday morning.
**Output:** Update [docs/FUNNEL-DASHBOARD.md](../FUNNEL-DASHBOARD.md) with last-7-day numbers; flag any experiments past their measure-after date.
**Scheduled task:** `deepbreathing-weekly-funnel-refresh` (recurring Fri 09:00 ET, see `mcp__scheduled-tasks__list_scheduled_tasks`).

The point of this runbook is reproducibility — same numbers pulled the same way each week. Without this, drift creeps in (different date ranges, wrong GA4 property, missing events) and trend lines lose meaning.

---

## Step 1 — GA4 events report

**GA4 property:** `Deep Breathing Exercises` in DKMT account, ID `527524722` (G-53DLCBMRL3).
**NOT:** the old Abiassi property `G-7GG9WVNBBP` — it's stale Q1 data only.

1. Open GA4: `https://analytics.google.com/analytics/web/#/p527524722/reports/intelligenthome` (Chrome MCP, you're logged in as `amorim.a.ferreira@gmail.com`).
2. If the account picker shows "AMORIM ABIASSI FERREIRA" or any Abiassi property, click the breadcrumb → "All accounts" → DKMT → Deep Breathing Exercises.
3. Navigate: search bar → "events report" → click `Reports > Life cycle > Engagement > Events`.
4. **Date range:** "Last 7 days" for weekly refresh. (Use 28 days for monthly comparisons against the May 5 baseline.)
5. **Add comparison** (top right) → check "Mobile traffic" + "Web traffic" (desktop) → Apply.
6. Capture **Total Users** column for these events:

| Event | Notes |
|---|---|
| `first_visit` | Top-of-funnel; new visitors only |
| `page_viewed_breathing` | Top of breathing-page funnel; deployed Apr 28-29 |
| `breathing_session_start` | Funnel start |
| ~~`breathing_session_pause`~~ | REMOVED — 0 events since ~mid-June 2026; do not expect it |
| ~~`breathing_session_complete`~~ | REMOVED — same; `breathing_session_end` is the only end-of-session event now |
| `breathing_session_end` | Sole session-end signal (fires ~80% of starts as of Jul 2026) |
| `mode_switch` | Engagement signal — explored techniques |
| `conversion_prompt_shown` | Bottom-of-funnel ask |
| `conversion_signup_completed` | Conversion |
| `signup_user_identified` | One-shot marker (deployed May 5; first appearance gates GA4 user_id setup) |

7. Compute funnel ratios per device (overall, mobile, desktop):
   - start → pause
   - start → complete
   - prompt_shown → signup_completed (the 24% conversion rate)
   - Mobile abandonment = (start - pause - complete) / start

---

## Step 2 — Neon DB sign-up cohort check

**Preferred (2026-07-10+): the read-only role.** A SELECT-only Postgres role `dbe_read` exists (created 2026-07-10; `GRANT SELECT` on all current + future public tables, writes denied). Its connection string is stored as **`POSTGRES_URL_READONLY`** in Vercel env (Production + Development). This avoids handling owner creds for a read query — use it for all analytics pulls:

```bash
vercel env pull /tmp/dbenv.txt --environment=production --yes && \
  eval "$(grep -E '^POSTGRES_URL_READONLY=' /tmp/dbenv.txt | sed 's|^|export |')" && \
  psql "$POSTGRES_URL_READONLY" -f docs/runbooks/sql/cohort-check.sql && \
  rm -f /tmp/dbenv.txt
```

Fallback if `POSTGRES_URL_READONLY` is ever missing: same pull, grep `POSTGRES_URL_NON_POOLING` instead (owner creds — expect a permission prompt). `dkmt-cc env pull` is deprecated and returns 404 (see tools-and-data-sources gotcha 11).

The query returns:
- Total users, last 28d signups, last 7d signups
- Returned-after-day-1 count
- Engaged-minutes distribution (any min, ≥30 min)
- Active-in-last-7d, active-in-last-14d
- Most recent signup details (email domain, device, IP)

**What to look for in the result:**
- New signups since last refresh — are they real Gmail or burner pattern?
- `sessions_completed > 0` for any user (was 0 for all on May 5; should change as the 35e7f0a fix takes effect)
- Did Eugene's `total_minutes` drop dramatically? (would confirm the double-count fix)

---

## Step 3 — Search engine performance (Google + Bing)

Both engines pulled every refresh. Bing matters for this site — click volumes are roughly at parity with Google (the old "≈ 6× Google traffic" line was a misquote of the May 5 audit's **CTR** ratio, corrected 2026-07-18; Bing clicks actually stepped up ~2× in June 2026). Never report Google numbers without the matching Bing pull alongside.

### 3a. Google Search Console

```
# Re-auth via mcp__mass-translate-backend__start_gsc_oauth if expired
mcp__mass-translate-backend__sync_gsc_performance
  site_url=https://deepbreathingexercises.com/
  start_date=YYYY-MM-DD end_date=YYYY-MM-DD

# Read totals + daily + top pages
mcp__mass-translate-backend__get_search_performance
  start_date=YYYY-MM-DD end_date=YYYY-MM-DD
```

For an active experiment page (e.g. /breathe/coherent), pass `page_url`:

```
mcp__mass-translate-backend__get_search_performance
  page_url=https://deepbreathingexercises.com/breathe/coherent
  start_date=YYYY-MM-DD end_date=YYYY-MM-DD
```

**Per-query data:** `mcp__gsc__*` analytics endpoints return 403; use Chrome MCP to navigate GSC Performance UI directly with `?page=!URL` URL param. See `tools-and-data-sources.md` for the URL pattern.

### 3b. Bing Webmaster Tools

```
# Re-auth via mcp__mass-translate-backend__start_bing_oauth if 401
mcp__mass-translate-backend__sync_bing_performance
  site_url=https://deepbreathingexercises.com/
  start_date=YYYY-MM-DD end_date=YYYY-MM-DD

mcp__mass-translate-backend__get_bing_search_performance
  start_date=YYYY-MM-DD end_date=YYYY-MM-DD
```

Capture for the dashboard:
- **Totals:** clicks, impressions, CTR, avg position
- **Top 5 pages by clicks** (with imp/CTR/pos)
- **Translated-page presence** (count of /es/, /pt/, /fr/, /de/, /ja/ pages in top 20) — Bing has historically indexed translated content much slower than Google; close monitoring matters

### 3c. Cross-engine sanity checks

After both pulls, verify in the dashboard:
- Active SEO experiments visible on **both** engines (a Google-only result may be SERP-feature noise; a Bing-confirmed signal is more robust).
- Translated-page traffic delta — if Bing-translated impressions are still 0 after 2+ weeks of an indexing remediation, escalate.
- Position differences — if a page is top-3 on Bing but pos 15+ on Google, that's a SERP-feature problem on Google, not a ranking problem.

### 3d. Bing-specific actions

If a fresh URL needs to be indexed on Bing fast:

```
mcp__mass-translate-backend__submit_urls_bing
  site_url=https://deepbreathingexercises.com/
  urls=["url1", "url2", ...]

# Or sitemap:
mcp__mass-translate-backend__submit_sitemap_bing
  site_url=https://deepbreathingexercises.com/
  sitemap_url=https://deepbreathingexercises.com/sitemap.xml
```

**Gotcha:** Bing OAuth was bricked once (May 5) and re-authed; it is **dead again as of 2026-07-10** ("Refresh token is invalid or expired"). Preferred path now: read Bing totals from the orangepi visibility digest (`~/automations/deepbreathing-visibility/digests/latest.md` on orangepi), which pulls Bing via a durable API key. Only re-auth via `start_bing_oauth` if you need per-page MCP queries.

---

## Step 4 — Update FUNNEL-DASHBOARD.md

Open [docs/FUNNEL-DASHBOARD.md](../FUNNEL-DASHBOARD.md) and:

1. Update the "Last refreshed" date.
2. Replace the "Top-line snapshot" table with new numbers.
3. Update the "Trends" section by appending a new column (don't replace prior columns — keep the trend line).
4. Update the "Sign-up cohort quality" section with the latest DB pull.
5. Move any experiment whose measure-after date passed from "Active experiments awaiting measurement" to "Recent results (graduated)" with the verdict.

---

## Step 5 — Check for experiments past their measure-after date

In [PRODUCT-EXPERIMENTS.md](../PRODUCT-EXPERIMENTS.md) and [SEO-EXPERIMENTS.md](../SEO-EXPERIMENTS.md):

1. List all entries with status `🔄 Implemented` and `measure-after` date in the past.
2. For each, pull the relevant metric and apply the **pre-committed success criteria** (no relitigating — if the criteria says "Success if X moves by ≥8pp" and it moved by 5pp, that's ❌ Failed, not ⚪ Inconclusive).
3. Update status, write the result section, mark the change in the dashboard.

---

## Step 6 — Note any anomalies

In the "Known measurement issues" section of FUNNEL-DASHBOARD.md, log:
- New events not previously seen
- Events that disappeared (might be a tracking regression)
- Sudden spikes/drops (>20%) — investigate if real or measurement
- Property migrations (rare but high-impact)

---

## Common gotchas (learned the hard way)

- **GA4 property migration noise:** the Apr 27 → May 5 jump from Abiassi (`G-7GG9WVNBBP`) → DKMT (`G-53DLCBMRL3`) created discontinuity. If you see another big jump, check `src/lib/analytics/google-analytics.ts` for the current measurement ID.
- **GA4 user_property indexing latency:** `signed_up=true` properties take 24-48h to surface in reports. Don't assume the GA4 user identification deploy failed if you check next day.
- **`mcp__gsc__search_analytics` returns 403** for this site — use `mcp__mass-translate-backend__get_search_performance` instead. The mcp__gsc tools work for `list_sites` only.
- **Cloudflare cache + Vercel cache** can serve stale 404s for 1-5 minutes after a redirect deploys. Use `?cb=$(date +%s%N)` cache-buster when verifying.
- **dkmt-cc creds expire ~30 days** — `dkmt-cc login` to refresh, or fall back to `vercel env pull` from any Vercel-linked repo.

---

## SQL queries used

The `docs/runbooks/sql/cohort-check.sql` file (also in this folder) contains the canonical sign-up cohort query. Run with `psql $POSTGRES_URL_NON_POOLING -f` to keep the analysis reproducible.
