# Tools and Data Sources

Per-task lookup table for "how do I do X" on the deepbreathingexercises.com project. Read this BEFORE starting any analytics, SEO, or DB work — it'll save you the time of rediscovering that GA4 is on the DKMT account not Abiassi, that the proxy strips locales before Next.js sees URLs, and that one service account (`ga-visibility@deepbreathingexercises.iam.gserviceaccount.com`) is the durable credential for GSC + GA4 everywhere.

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
| YouTube channel | `@deepbreathingexercises` (ID `UC17_GvnAKkxsv39BMVE3MdQ`) |
| YouTube Data API key | `~/.config/dbe-youtube-api-key` (mbp14 + mbp16) · `task/youtube-api-key.txt` (orangepi digest) — restricted to `youtube.googleapis.com`, never expires |

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

**Tool (preferred, durable): `mcp__gsc__search_analytics`** with `siteUrl=sc-domain:deepbreathingexercises.com`. Working since 2026-07-10: the repo's `.mcp.json` (mbp14 + mbp16) points the gsc MCP at `~/.config/dbe-ga-visibility-sa.json` — the `ga-visibility` service account, now an **Owner** of the property. Nothing expires. The old 403 was the previous key (`gsc-service-account.json`, an ungranted SA); if you see 403 again, check which key `.mcp.json` names. `mcp__gsc__index_inspect` and the sitemap tools work too. On orangepi the same data comes from `task/gsc_query.py`.

**Fallback (avoid): mass-translate-backend** `sync_gsc_performance` + `get_search_performance`. Its OAuth expires ~2-weekly and re-auth is interactive with two silent failure modes (wrong account, unticked scope checkboxes). Only reach for it if the gsc MCP is somehow down:
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

**Gotcha:** OAuth tokens expire; if you get an auth error (`Token has been expired or revoked`), run `mcp__mass-translate-backend__start_gsc_oauth` and complete the flow. **This re-auth is interactive — an autonomous/scheduled run cannot complete it** (it needs a human to visit the auth URL). When the GSC API is dead mid-refresh, fall back to the **GSC Performance UI via Chrome MCP** — you're logged in as `amorim.a.ferreira@gmail.com`. URL: `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:deepbreathingexercises.com&num_of_days=7`; the PAGES tab gives top pages, and `…/search-console/index?resource_id=…` gives the indexing buckets. This is the proven fallback as of 2026-05-22. Bing OAuth is independent and was fine.

### Pull Bing Webmaster Tools data

**Tool:** `mcp__mass-translate-backend__sync_bing_performance` then `mcp__mass-translate-backend__get_bing_search_performance`
**Gotcha:** Bing OAuth was bricked once (May 5) and re-authed. If 401 errors appear, `mcp__mass-translate-backend__start_bing_oauth`.

### Pull YouTube channel stats

**Tool:** YouTube Data API v3 with the API key above (public data: subscribers, total views, per-video views/likes/comments). On orangepi the digest runs `task/youtube_pull.py`; ad-hoc from a Mac:
```bash
curl -s "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UC17_GvnAKkxsv39BMVE3MdQ&key=$(cat ~/.config/dbe-youtube-api-key)"
```
**Gotcha (2026-07-10):** do NOT use the RSS feed (`feeds/videos.xml`) or page scraping as a primary source — RSS caps at 15 entries (the channel has 45+), YouTube's edge IP-blocked orangepi on 2026-07-09, and `subscriberCountText` was never readable from the page source. **Private** metrics (watch time, impressions, thumbnail CTR, traffic sources) need the YouTube Analytics API, which only supports channel-owner OAuth (no service-account path) — deliberately not wired up while the channel is small; revisit when watch-time decisions matter.

### Check index status (do NOT submit URLs)

**Tool:** `GSC_SA_KEY_FILE=~/.config/dbe-ga-visibility-sa.json node scripts/gsc-index-status.mjs`
Service-account auth (`ga-visibility@…`), self-signed JWT, nothing expires. The SA must be an **Owner** of the property; Editor 403s on URL Inspection. Refreshes the `Indexed` column of `docs/indexing-queue.md` and prints a `coverageState` for each unindexed URL. See the `daily-indexing` skill.

**Gotcha — URL submission is dead on this site (audited 2026-07-09).** Do not reach for these:
- `mcp__mass-translate-backend__request_indexing` posts to Google's Indexing API, which Google restricts to `JobPosting` / `BroadcastEvent` pages. It returns **HTTP 200 for ineligible URLs**, so it looks like it worked and does nothing.
- `google.com/ping?sitemap=` → **404** (retired 2023). `bing.com/ping?sitemap=` → **410 Gone**.
- `mcp__mass-translate-backend__submit_urls_bing` is redundant: `postbuild` submits every sitemap URL to **IndexNow** on each production deploy (`scripts/ping-sitemap-lib.mjs`). Google does not participate in IndexNow. (True since 2026-07-10 — before that the CI gate checked `CI === "true"` while Vercel sets `CI=1`, so IndexNow silently never ran on deploys.)

Google discovers pages via the sitemap and the `/languages` crawl hub. `Crawled - currently not indexed` is a quality verdict, not a submission problem. Full reasoning in the 2026-07-09 entry of `SEO-EXPERIMENTS.md`.

**Consequence:** the mass-translate GSC OAuth (which expired roughly every two weeks) is no longer needed for indexing. It remains only for translation work.

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

### Warm the locale-page cache (after deploy / before a crawl)

**Why:** locale pages (`/es|pt|fr|de|ja/*`) are served by the mass-translate edge Worker, which on a cold cache fetches the Vercel origin + assembles the translation per request. After a deploy the Vercel origin cache is flushed, so a cold locale page can take **5–21 s** — enough to time out a crawler. This is what crashed the Ahrefs health score to 40 on 13 Jun 2026 (see gotcha #17).

**Durable fix:** `GET /api/warm-cache` (route at `src/app/api/warm-cache/route.ts`) fetches every sitemap `<loc>` with a Googlebot UA, English canonicals first (warms the Vercel origin the proxy reuses for all locales) then locale URLs (warms the Worker KV translation cache). A Vercel Cron in `vercel.json` runs it every 2 h. Protected by `CRON_SECRET` (Vercel prod env; Cron sends it as a bearer token).

```bash
# Manual warm (e.g. right after a prod deploy, before the weekly Ahrefs crawl):
curl -s "https://deepbreathingexercises.com/api/warm-cache?token=$CRON_SECRET" | python3 -m json.tool
# Returns: succeeded/failed counts, proxyCache hit/miss, slowest URLs.
```

Concurrency is capped at 6 in the route — **do not raise it**, the proxy 503s spoofed bot UAs at ~10 concurrent (gotcha #16d).

### Query the Neon DB

**Preferred (2026-07-10+): the `dbe_read` role via `POSTGRES_URL_READONLY`.** SELECT-only role (all current + future public tables; writes denied), stored in Vercel env (Production + Development). Read queries never need owner creds anymore:

```bash
vercel env pull /tmp/dbenv.txt --environment=production --yes && \
  eval "$(grep -E '^POSTGRES_URL_READONLY=' /tmp/dbenv.txt | sed 's|^|export |')" && \
  psql "$POSTGRES_URL_READONLY" -f docs/runbooks/sql/cohort-check.sql && \
  rm -f /tmp/dbenv.txt
```

Use the eval pattern, never paste connection strings. To rotate the role's password: connect with `POSTGRES_URL_NON_POOLING` (owner) and `ALTER ROLE dbe_read WITH PASSWORD '...'`, then `vercel env rm/add POSTGRES_URL_READONLY`.

Owner-cred fallback (writes, migrations, role admin): `POSTGRES_URL_NON_POOLING` from the same `vercel env pull`. `dkmt-cc env pull` is deprecated (gotcha 11).

**Schema notes** (also useful for new queries):
- `"user"` (lowercase, quoted) — better-auth user table
- `account` — OAuth provider links (`providerId` = "google", "magic-link", etc.)
- `session` — login sessions (createdAt = first login, updatedAt = last seen, refreshes ~1×/day)
- `user_settings` — mode, speed_multiplier, selected_duration, muted, theme
- `user_stats` — total_minutes, sessions_completed, updated_at
- `verification` — magic-link tokens

⚠️ The DB has tables from OTHER projects too (`User` uppercase = Darkmatter shared user table for PI/agents/etc, `etl_*` = PI scraper, `item_base_*` = Parfois). Don't query those — they're not our data.

### Manage Resend (transactional email + bounce/complaint webhook)

**What sends email:** `src/lib/auth.ts` — welcome email on `user.create.after`, magic-link on `sendMagicLink`. Both call `resend.emails.send()` with `RESEND_API_KEY`. Both `isSuppressed()`-check first against the `email_suppressions` table.

**The bounce/complaint webhook:** `src/app/api/webhooks/resend/route.ts` verifies a **svix** signature with `RESEND_WEBHOOK_SECRET`, then upserts `email_suppressions` (PK on `email`, `reason` CHECK in `('bounce','complaint')`). Resend webhook id `67fe6d42-e334-472a-a131-576d8a2a385c`, events `email.bounced` + `email.complained`.

**⚠️ The webhook endpoint MUST be the `origin.` subdomain, not the apex.** Resend posts to `https://origin.deepbreathingexercises.com/api/webhooks/resend` — NOT the apex. The apex routes through the mass-translate i18n proxy, which mutates the request and breaks the svix signature (svix signs exact raw bytes), so the apex always returns `401 {"error":"invalid signature"}`. See gotcha #13.

**Resend API (when the dashboard SPA hangs — it did, 2026-06-04):** the `darkmatterai` Resend account is shared; the **"Deep Breathing Prod"** key is `RESEND_API_KEY`. Use raw curl with a browser `User-Agent` (a bare UA gets Cloudflare-1010-blocked):
```bash
KEY=$(grep '^RESEND_API_KEY=' /tmp/dbenv.prod.txt | cut -d= -f2- | tr -d '"')
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
# list webhooks (status, endpoint, signing_secret all returned):
curl -s https://api.resend.com/webhooks -H "Authorization: Bearer $KEY" -H "User-Agent: $UA"
# repoint / re-enable a webhook (PATCH; keeps the signing secret):
curl -s -X PATCH https://api.resend.com/webhooks/<id> -H "Authorization: Bearer $KEY" -H "User-Agent: $UA" \
  -H "Content-Type: application/json" -d '{"endpoint":"https://origin.deepbreathingexercises.com/api/webhooks/resend","status":"enabled"}'
```
`GET /emails` lists **account-wide** and does NOT honour `domain`/`recipient` filters — you can't easily pull just our domain's sends via API. For per-domain delivery receipts use the dashboard Logs filtered by domain (`deepbreathingexercises.com` domain id `08d3cefb-de71-43f5-b40d-0df562d1b27b`).

**Test the webhook locally** with the real svix lib (`node_modules/svix`): `new Webhook(secret).sign(msgId, new Date(), payload)` → POST to origin with `svix-id`/`svix-timestamp`/`svix-signature` headers. A correct request returns `200 {"received":true}` and writes a row.

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

1. **FIXED 2026-07-10 — `mcp__gsc__*` works now.** The historical 403 came from `.mcp.json` naming an ungranted SA key. It now names `~/.config/dbe-ga-visibility-sa.json` (Owner of the property) on mbp14 + mbp16. Prefer `mcp__gsc__*` over mass-translate for all GSC reads; if 403 recurs, check the key path in `.mcp.json` first. (May 5 → fixed Jul 10)

2. **GA4 was migrated from Abiassi → DKMT account at some point.** Old measurement ID `G-7GG9WVNBBP` shows zero data. Always confirm you're on `527524722` / `G-53DLCBMRL3` before pulling. (May 5)

3. **The mass-translate proxy strips one locale prefix before forwarding to Next.js.** Redirect rules in `next.config.js` must target the post-proxy URL (single locale form), not the user-typed URL (double locale form). Test both in dev AND in production — dev has no proxy. (May 5, [SEO-EXPERIMENTS.md 2026-05-05 entry](../SEO-EXPERIMENTS.md))

4. **Cross-locale anchors get mangled by the proxy.** Don't render server-side anchors to other locales in components that get translated (homepage, breathing pages). The `/languages` page is `EN_ONLY_ROUTES` because of this; the language-switcher is client-only for the same reason.

5. **`sessions_completed` only fires when a duration timer is set.** Users without a timer hit `breathing_session_stop` (or just close the tab), neither of which currently increments the counter consistently. Don't read engagement off this metric until [35e7f0a](https://github.com/abiassi/deepbreathing/commit/35e7f0a)'s effect can be measured (2026-05-19).

6. **Cloudflare + Vercel cache** can serve stale responses (especially 404s) for several minutes after a deploy. Always cache-bust with `?cb=$(date +%s%N)` when verifying.

7. **Chrome MCP `resize_window` doesn't shrink the rendered viewport below desktop breakpoints.** `window.innerWidth` stays >1500 even after resize. Capture desktop renders and zoom into a region for mobile-density approximation.

8. **dkmt-cc creds expire ~30 days.** `dkmt-cc login` to refresh, or fall back to `vercel env pull` from any Vercel-linked repo. Both paths give the same Neon DB URL.

9. **GA4 user_property indexing latency is 24-48h.** Don't conclude a `user_id` deploy failed because the property doesn't show same-day.

10. **The Neon DB host pattern `ep-bold-feather-anszztep` (non-pooler)** is the right URL for ad-hoc psql queries. The `-pooler` variant runs on PgBouncer transaction mode and silently drops multi-statement SQL — see `pi-data` skill for the full gotcha.

11. **`dkmt-cc env <slug> --export` is deprecated and now returns API 404.** As of 2026-05-22 the command prints a deprecation banner and fails. For the Neon DB URL, use `vercel env pull /tmp/dbenv.txt --environment=production --yes` from this repo (it's Vercel-linked as `darkmatterai/deepbreathing-tmmj`), then `grep -E '^POSTGRES_URL_NON_POOLING=' /tmp/dbenv.txt`. The weekly-funnel-refresh runbook's "preferred" `dkmt-cc env pull` line no longer works — go straight to the Vercel fallback.

12. **`pod install` in `apps/mobile/ios` needs `LANG=en_US.UTF-8`** in non-login shells (agent Bash). Without it CocoaPods crashes with `Unicode Normalization not appropriate for ASCII-8BIT`. Same applies to `npx expo run:ios`, which shells out to pod install. Prefix: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.

13. **The shared audio engine (`@resonance/audio`) runs on react-native-audio-api on iOS** (since 2026-07-22): same WebAudio code as web, driven natively by `apps/mobile/src/breathing/native-soundscape.ts` off webview events. Gotchas: (a) RNAA doesn't pull side-branch AnalyserNodes, so `getMeterValues()` reads -120dB on native even while audio plays — verify liveness via the `[soundscape]` dev log's `t=`/gain probes instead (ctx.currentTime must advance, layer gains must ramp to targets); (b) DynamicsCompressor and HRTF PannerNode are unimplemented in RNAA 0.13 — the engine auto-falls back to a WaveShaper soft-clip and StereoPanner orbit; upgrade when RNAA ships the real nodes.

12. **GSC API OAuth (mass-translate-backend) expires and can't be re-authed autonomously.** See the "Pull GSC search performance data" section above — when `sync_gsc_performance` returns `Token has been expired or revoked`, an unattended run must fall back to the GSC Performance UI via Chrome MCP. First hit 2026-05-22.

13. **The mass-translate proxy breaks signed webhooks on the apex — webhooks must hit `origin.`** A POST to `https://deepbreathingexercises.com/api/webhooks/resend` (apex) returns `401 invalid signature` even with the correct secret, because the proxy mutates the request body/headers and svix verifies over exact raw bytes. The identical signed request to `https://origin.deepbreathingexercises.com/api/webhooks/resend` returns `200`. Any future signed inbound webhook (Stripe, etc.) has the same constraint: point it at `origin.`, not the apex. (2026-06-04)

14. **`vercel env` values can carry a trailing newline that silently breaks strict consumers.** Both `RESEND_WEBHOOK_SECRET` and `RESEND_API_KEY` were stored in Vercel prod with a trailing `\n` (set in one session, likely an `echo`/paste). Effect was asymmetric and that's the trap: the Resend SDK **tolerated** the bad key (outbound email kept working), but svix's strict base64 decoder **threw** `Base64Coder: incorrect characters` on the bad secret, so `new Webhook()` threw and the handler returned `401` to *every* event → Resend auto-disabled the webhook. It looked like "email works, webhook is just broken." When an env-derived credential misbehaves, byte-check it: `vercel env pull /tmp/e.txt --environment=production --yes` then `python3 -c "print(repr(open('/tmp/e.txt').read()))"` and look for `\n`/quotes inside the value. Re-add cleanly with `printf '%s' 'value' | vercel env add NAME production` (no trailing newline), then **redeploy + promote** (env changes only take effect on a new deployment). (2026-06-04)

15. **Localized pages serve English server HTML; translation is applied CLIENT-SIDE (~1.5 s after load).** `curl -A "Mozilla/5.0" https://deepbreathingexercises.com/ja/<path>` returns an **all-English** page — H1 *and* body, with target-language strings absent — even for content that renders translated in a real browser. In a headless browser the target language only appears ~1.5 s in (verified by time-series: the Japanese body marker is absent at t=0–900 ms, present from ~1500 ms). Consequences: (a) any non-JS fetch / pre-render crawl sees English, so don't judge translation coverage with `curl` — drive a real browser and wait; (b) "is this page translated?" must be answered against the *settled* DOM, not server HTML; (c) some content **never** gets converted by the client pass and stays English permanently — the standalone tool-page H1 (`FadingHeroTitle`, e.g. `/ja/4-7-8-breathing-timer`) and recurring science/step-by-step body sections — see [UX-BACKLOG.md #23/#24](../UX-BACKLOG.md) and [the Jun 2026 QA report](../qa-reports/traction-pages-2026-06-06.md). Ownership (repo client-components escaping the pass vs. mass-translate coverage) is unconfirmed. (2026-06-06)

16. **The proxy dynamic-renders per User-Agent — what Google sees ≠ what `curl` sees (refines #15).** Allowlisted crawler UAs (Googlebot, Bingbot, AhrefsBot, DuckDuckBot, Yandex, Semrush, facebookexternalhit, Twitterbot) get FULLY translated server HTML — title, hreflang, `lang`, and body H1/H2/prose. Browsers and unknown UAs get the English HTML + client-side swap described in #15. So: (a) to see what Google sees, `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" <url>`; (b) `AhrefsSiteAudit` is NOT allowlisted — Ahrefs Site Audit content findings on localized URLs describe the English fallback, not what Google ranks; (c) any query string (`?duration=30`) bypasses translation entirely, even for bots; (d) do NOT bulk-fetch with spoofed bot UAs — anti-spoofing rate limits kick in at ~10 concurrent and then 503 persistently for a while (real Googlebot shows <1% 5xx in GSC crawl stats). Full audit: control repo `seo-error-audit-2026-06-10.md`. (2026-06-10)

17. **A deploy can crash the Ahrefs/Google crawl health score via cold-cache locale timeouts — it's an artifact, not an outage.** Locale pages (`/es|pt|fr|de|ja/*`) are proxy-served: on a cold cache the Worker fetches the Vercel origin (single region `iad1`, US-East) + assembles the translation per request, so a cold locale page from the EU edge can take **5–21 s**. A prod deploy flushes the Vercel origin cache; if a crawler (esp. AhrefsBot crawling the flat 270-URL locale sitemap at depth-0) hits during that window, hundreds of URLs time out and the Ahrefs Health Score tanks (40/Fair on 13 Jun 2026, ~508 "timed out"). The pages return 200 on a single request — verify with `curl -w '%{time_total}'` before assuming an outage. Fix shipped: `/api/warm-cache` + a 2 h Vercel Cron keep both the Vercel origin and Worker KV warm (see "Warm the locale-page cache" above). After any prod deploy, manually hit the warm endpoint before the next crawl. Note: locale pages **do** earn clicks (e.g. `/es/breathing-visualizer` 50% CTR, `/ja/4-7-8-breathing-timer` #1 on Bing as of Jun 2026) — protect them. (2026-06-13)

18. **The mass-translate proxy PRESERVES `rel` attributes when rewriting anchors.** Source-side `rel="nofollow"` (or any `rel`) on `<a>` / Next.js `<Link>` survives the proxy's locale-prefix anchor rewrite and reaches the locale variant pages unchanged — so you can control crawl signals for locale URLs from the English source. Confirmed 2026-06-15 by reading the edge-proxy Worker source.

19. **`public/robots.txt` was a stale duplicate of `src/app/robots.ts` — deleted 2026-06-15.** Next.js App Router serves `robots.txt` from `app/robots.ts`; the `public/robots.txt` copy was redundant and a silent drift risk (it would not carry new rules). Single source of truth is `src/app/robots.ts` — edit only there.

20. **GA4 `engagedSessions` matures over ~48h; `sessions` lands within hours.** Any reporting window that touches the last 2 days systematically understates engagement rate (verified 2026-07-10: a 10h-old day read 8.6% vs ~60% matured). This produced a fake "3-run engagement decline" in the visibility digest (runs 14-16: 48.2%→44.6%→41.3%; matured values were flat ~56-62%). Clamp GA4 windows to end at `today-2` — `funnel_pull.py` on orangepi does this now, same as `search_pull.py` does for GSC. Never compare engagement rates across windows of different maturity. (Jul 10)

21. **The proxy's query-string canonical asymmetry: English strips `?duration=`, locale pages keep it.** The English origin canonicalizes `/breathe/coherent?duration=60` → `/breathe/coherent`; the proxy preserves `?duration=` in the canonical + hreflang it injects on locale pages, so the `en`/`x-default` hreflang points at a non-canonical URL — this caused 50 Ahrefs "hreflang to non-canonical" errors (2026-06-15). Source-side fix shipped: robots disallow `/*?duration=` + `rel="nofollow"` on all `?duration=` links. The **durable proxy-side fix** is to add `duration` to the tenant's `strip_query_params` in mass-translate KV — but the setting REPLACES the defaults, so the value must include `utm_*,fbclid,gclid,ref,_ga,mc_*`. Requires the mass-translate team to write tenant KV; no `set_site_config` MCP tool exists. (2026-06-15)

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
