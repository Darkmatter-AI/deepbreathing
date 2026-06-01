# Tools and Data Sources

Per-task lookup table for "how do I do X" on the deepbreathingexercises.com project. Read this BEFORE starting any analytics, SEO, or DB work — it'll save you the time of rediscovering that GSC analytics returns 403 for this site, that GA4 is on the DKMT account not Abiassi, and that the proxy strips locales before Next.js sees URLs.

This file is the operational counterpart to:
- [docs/FUNNEL-DASHBOARD.md](../FUNNEL-DASHBOARD.md) — the *what* (current state)
- [docs/PRODUCT-EXPERIMENTS.md](../PRODUCT-EXPERIMENTS.md) and [docs/SEO-EXPERIMENTS.md](../SEO-EXPERIMENTS.md) — the *why* (changes & results)
- This file — the *how* (tools & queries)

---

## Project identifiers

| Resource | Value |
|---|---|
| Production domain | `https://deepbreathingexercises.com` |
| Vercel project ID | `prj_zcWnwD9I2TinOJjvzFyamBJMLL8T` |
| Vercel team ID | `team_Mol8uj8iHUTzXkMbObf8tz8w` |
| GA4 account | `DKMT` (NOT Abiassi) |
| GA4 property | `Deep Breathing Exercises` (ID `527524722`) |
| GA4 measurement ID | `G-53DLCBMRL3` |
| ⚠️ OLD GA4 measurement ID (deprecated) | `G-7GG9WVNBBP` (Abiassi account, has Q1 data only) |
| dkmt-cc project slug | `deep-breathing` |
| Neon DB host (no creds) | `ep-bold-feather-anszztep.c-6.us-east-1.aws.neon.tech` |
| GitHub repo | `abiassi/deepbreathing` |
| Logged-in Google account | `amorim.a.ferreira@gmail.com` |
| Bing Webmaster account | same Google login |

If any of these change, update this file FIRST, then update FUNNEL-DASHBOARD.md and any active runbooks.

---

## Per-task lookup table

### Pull GA4 funnel data

**Tool:** Chrome MCP (`mcp__Claude_in_Chrome__*`)
**Why not an MCP tool:** GA4 has no first-party MCP available; `mcp__plugin_data_amplitude__*` is for Amplitude, not GA. We navigate the GA4 UI directly.
**Steps:**
1. Navigate to `https://analytics.google.com/analytics/web/#/p527524722/realtime/overview`
2. If wrong account is showing (says "AMORIM ABIASSI FERREIRA"), click breadcrumb → DKMT → Deep Breathing Exercises
3. Use Reports → Engagement → Events for event counts
4. Use Explore → Funnel exploration for custom funnels
5. See [weekly-funnel-refresh.md](weekly-funnel-refresh.md) for the canonical event list

**Gotcha:** Window resize via `mcp__Claude_in_Chrome__resize_window` does NOT shrink the rendered viewport below desktop breakpoints (innerWidth stays >1500). Don't try to capture mobile renders this way; capture desktop and zoom into the orb area instead.

### Pull GSC search performance data

**Tool:** `mcp__mass-translate-backend__sync_gsc_performance` then `mcp__mass-translate-backend__get_search_performance`
**Why not `mcp__gsc__*`:** Returns 403 for this site (`User does not have sufficient permission for site 'sc-domain:deepbreathingexercises.com'`). The mass-translate-backend tools have a separate OAuth scope that works.
**Steps:**
```
mcp__mass-translate-backend__sync_gsc_performance \
  site_url=https://deepbreathingexercises.com/ \
  start_date=2026-04-01 end_date=2026-05-05

mcp__mass-translate-backend__get_search_performance \
  page_url=https://deepbreathingexercises.com/breathe/coherent
```

**For per-query data on a specific page** (the mass-translate `get_search_performance` doesn't break down by query): use Chrome MCP to navigate GSC Performance with URL parameters:

```
https://search.google.com/search-console/performance/search-analytics?
  resource_id=https%3A%2F%2Fdeepbreathingexercises.com%2F&
  num_of_days=90&
  page=!https%3A%2F%2Fdeepbreathingexercises.com%2Fbreathe%2Fcoherent&
  metrics=CLICKS%2CIMPRESSIONS%2CCTR%2CPOSITION
```

The `page=!URL` syntax means "exact URL match." Replace the page URL portion to filter to any page.

**Gotcha:** OAuth tokens expire; if you get an auth error, run `mcp__mass-translate-backend__start_gsc_oauth` and complete the flow.

### Pull Bing Webmaster Tools data

**Tool:** `mcp__mass-translate-backend__sync_bing_performance` then `mcp__mass-translate-backend__get_bing_search_performance`
**Gotcha:** Bing OAuth was bricked once (May 5) and re-authed. If 401 errors appear, `mcp__mass-translate-backend__start_bing_oauth`.

### Submit URLs for indexing

**Google:** `mcp__mass-translate-backend__request_indexing` with `type="URL_UPDATED"` (recrawl) or `type="URL_DELETED"` (remove from index — faster than waiting for Validate Fix recrawl).

**Bing:** `mcp__mass-translate-backend__submit_urls_bing` (batch endpoint) or browser-based BWT URL Submission UI as fallback.

### Run a SerpApi search to inspect SERP layout

**Tool:** `mcp__serpapi__search`
**When:** Before deciding on title rewrites or content changes — see whether the SERP has Top Stories carousel, Answer Box, PAA, video pack, or just plain organic. CTR-killer features (carousel, AB) can't be beaten by titles.
**Example:**
```
mcp__serpapi__search params={"q": "physiological sigh", "location": "United States", "num": 10}
```

### Verify a redirect or page in production

**Tool:** `curl -sI` from terminal (Bash tool).
**Required:** Cache-busting query string (`?cb=$(date +%s%N)`) because Cloudflare may serve stale 404s for ~5 min after a redirect deploys.
**Example:**
```
curl -sI -o /dev/null -w "HTTP %{http_code}  Location: %{redirect_url}\n" \
  "https://deepbreathingexercises.com/de/es/breathe/wim-hof?cb=$(date +%s%N)"
```

### Check Vercel deploy status

**Tool:** `mcp__2dbd7705-06ab-4ea1-a16f-bb0b7b961e9f__list_deployments` and `get_deployment`
**Required:** project ID `prj_zcWnwD9I2TinOJjvzFyamBJMLL8T`, team ID `team_Mol8uj8iHUTzXkMbObf8tz8w` (above).
**For waiting until deploy is live:** poll prod URL with `until [ "$(curl -sI -o /dev/null -w "%{http_code}" "URL?cb=$(date +%s%N)")" = "200" ]; do sleep 5; done` via `Bash` with `run_in_background: true`.

### Query the Neon DB

**Tool:** `darkmatter-db` skill — use the eval pattern, never paste connection strings.

```bash
# Preferred
eval "$(dkmt-cc env pull deep-breathing --export 2>/dev/null)" && \
  psql "$POSTGRES_URL_NON_POOLING" -f docs/runbooks/sql/cohort-check.sql
```

**If dkmt-cc returns 403 / token expired:**
1. Run `dkmt-cc login` and complete the browser OAuth (~30 sec).
2. If still failing, fall back to Vercel direct env pull (see weekly-funnel-refresh.md step 2).

**Schema notes** (also useful for new queries):
- `"user"` (lowercase, quoted) — better-auth user table
- `account` — OAuth provider links (`providerId` = "google", "magic-link", etc.)
- `session` — login sessions (createdAt = first login, updatedAt = last seen, refreshes ~1×/day)
- `user_settings` — mode, speed_multiplier, selected_duration, muted, theme
- `user_stats` — total_minutes, sessions_completed, updated_at
- `verification` — magic-link tokens

⚠️ The DB has tables from OTHER projects too (`User` uppercase = Darkmatter shared user table for PI/agents/etc, `etl_*` = PI scraper, `item_base_*` = Parfois). Don't query those — they're not our data.

### Schedule a recurring or one-time task

**Tool:** `mcp__scheduled-tasks__create_scheduled_task`
**For one-off reminders:** `fireAt` ISO timestamp with timezone offset.
**For recurring:** `cronExpression` evaluated in LOCAL TZ (not UTC).
**Example (weekly Friday refresh):**
```
mcp__scheduled-tasks__create_scheduled_task \
  taskId=deepbreathing-weekly-funnel-refresh \
  cronExpression="0 9 * * 5" \
  description="Weekly funnel refresh per docs/runbooks/weekly-funnel-refresh.md"
```

### Run a browser smoke test after deploy

**Tool:** Chrome MCP — navigate prod URL, click through a session start, verify no console errors.
**Skill:** `qa-swarm` (parallel Sonnet subagents) for broader regression after a UI change.

---

## Common gotchas (do not repeat)

These have all bitten us before. Document in this file the FIRST time they bite, not the third.

1. **GSC `mcp__gsc__*` analytics endpoints return 403 for this site.** Use mass-translate-backend instead. (May 5)

2. **GA4 was migrated from Abiassi → DKMT account at some point.** Old measurement ID `G-7GG9WVNBBP` shows zero data. Always confirm you're on `527524722` / `G-53DLCBMRL3` before pulling. (May 5)

3. **The mass-translate proxy strips one locale prefix before forwarding to Next.js.** Redirect rules in `next.config.js` must target the post-proxy URL (single locale form), not the user-typed URL (double locale form). Test both in dev AND in production — dev has no proxy. (May 5, [SEO-EXPERIMENTS.md 2026-05-05 entry](../SEO-EXPERIMENTS.md))

4. **Cross-locale anchors get mangled by the proxy.** Don't render server-side anchors to other locales in components that get translated (homepage, breathing pages). The `/languages` page is `EN_ONLY_ROUTES` because of this; the language-switcher is client-only for the same reason.

5. **`sessions_completed` only fires when a duration timer is set.** Users without a timer hit `breathing_session_stop` (or just close the tab), neither of which currently increments the counter consistently. Don't read engagement off this metric until [35e7f0a](https://github.com/abiassi/deepbreathing/commit/35e7f0a)'s effect can be measured (2026-05-19).

6. **Cloudflare + Vercel cache** can serve stale responses (especially 404s) for several minutes after a deploy. Always cache-bust with `?cb=$(date +%s%N)` when verifying.

7. **Chrome MCP `resize_window` doesn't shrink the rendered viewport below desktop breakpoints.** `window.innerWidth` stays >1500 even after resize. Capture desktop renders and zoom into a region for mobile-density approximation.

8. **dkmt-cc creds expire ~30 days.** `dkmt-cc login` to refresh, or fall back to `vercel env pull` from any Vercel-linked repo. Both paths give the same Neon DB URL.

9. **GA4 user_property indexing latency is 24-48h.** Don't conclude a `user_id` deploy failed because the property doesn't show same-day.

10. **The Neon DB host pattern `ep-bold-feather-anszztep` (non-pooler)** is the right URL for ad-hoc psql queries. The `-pooler` variant runs on PgBouncer transaction mode and silently drops multi-statement SQL — see `pi-data` skill for the full gotcha.

11. **Post-deploy "skew window" = the real cause of "language resets / Application error on translated pages".** The MassTranslate proxy caches translated HTML, which embeds versioned `/_next/static/.../page-<hash>.js` chunk URLs. When the app redeploys, those hashes change but the proxy keeps serving the previous build's HTML for `/ja/...` etc. until its cache catches up. During that window the locale page either crashes (ChunkLoadError → React #423 → "Application error") or reverts to English on soft navigation. **It is transient and self-heals**, which is why it looked fixed and kept "regressing" — each deploy reopens it. Verified 2026-06-01: `/ja/breathe/coherent` served chunk `cb496ce7…`(404) while EN served `617e571a…`(200); both matched again ~minutes later. Don't patch this in app code (a client-side nav guard makes it *worse* — it forces a full reload of the stale-chunk HTML, turning a survivable revert into a guaranteed crash). **Durable fix (root):** purge / re-run `deploy_translations` on the MassTranslate proxy after each app deploy so its cached HTML re-renders against the current build. **Mitigation:** enable Vercel **Skew Protection** (Project Settings → Advanced) so prior builds' chunks keep resolving during the proxy lag — but it has a retention bound (~12h default); verify retention ≥ the proxy cache TTL or chunks can still 404. **Detect it:** `pnpm check:locale-build` (`scripts/check-locale-build-consistency.mjs`) fails when a chunk referenced by a locale page returns non-200 *and still 404s after a settle re-check* (so it doesn't cry wolf on the benign version drift seen mid-rollout — the origin serves mixed builds for a minute or two after deploy). EN-vs-locale drift is logged as INFO only. Runs every 15 min + post-deploy via `.github/workflows/locale-build-consistency.yml`. Guards the crash/skew window, not the (RSC-layer) silent English revert.

---

## Skills + MCPs cheat-sheet (most-used)

| Skill / MCP | Use for |
|---|---|
| `darkmatter-db` skill | Neon DB queries (any DKMT project) |
| `mcp__mass-translate-backend__*` | GSC/Bing perf, indexing API, audits |
| `mcp__serpapi__search` | SERP layout inspection |
| `mcp__Claude_in_Chrome__*` | GSC/GA4 navigation, prod browser checks |
| `mcp__2dbd7705-...__*` | Vercel deploys |
| `mcp__scheduled-tasks__*` | Recurring/one-off tasks |
| `seo-audit` skill | Comprehensive Ahrefs + sitemap audit |
| `qa-swarm` skill | Parallel browser regression after UI change |
| `add-language` skill | Onboarding a new translated locale |
| `seo-keywords` skill | Pinning keywords for a target locale |
| `daily-indexing` skill | Submitting pending URLs from indexing-queue.md |

---

## When this file is wrong

If you discover a tool/data-source detail that contradicts this doc (e.g., GA4 property changed, new MCP available, dkmt-cc behavior shifted), **update this file in the same commit** as your work. Don't leave the next person to rediscover the same thing — that's the entire point of this runbook.
