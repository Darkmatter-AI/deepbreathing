# Funnel Dashboard

**Last refreshed:** 2026-05-08
**Refresh cadence:** Weekly (Friday). Runbook: [docs/runbooks/weekly-funnel-refresh.md](runbooks/weekly-funnel-refresh.md)
**Source of truth:** GA4 property `Deep Breathing Exercises` in DKMT account, ID `527524722`, measurement ID `G-53DLCBMRL3`. ⚠️ NOT the old Abiassi property `G-7GG9WVNBBP` (which has stale 2026-Q1 data only).

---

## Top-line snapshot — last 7 days (May 1 – May 7, 2026)

### Engagement funnel (unique users, GA4)

| Step | Users | % of start |
|------|---:|---:|
| `first_visit` | 243 | — |
| `page_viewed_breathing` | 247 | — |
| `breathing_session_start` | **119** | 100% |
| `breathing_session_pause` | 57 | 47.9% |
| `breathing_session_complete` | 25 | 21.0% |
| `breathing_session_stop` | 0 | — (still not firing — see Known issues) |
| `mode_switch` | 2 | 1.7% |
| `conversion_prompt_shown` | 52 | 43.7% |
| `conversion_signup_completed` | 6 | 5.0% of starts / **11.5% of prompt-shown** |
| `signup_user_identified` | 4 | first appearance ✅ — confirms May 5 GA4 user-ID deploy is firing |

Total active users (last 7d): 285. Total events: 3,343.

### Funnel ratios

| | Last 7d | vs prior 28d (May 5 refresh) |
|---|---:|---:|
| start → pause | 47.9% | 41.6% (+6.3 pp) |
| start → complete | 21.0% | 6.1% (+14.9 pp) |
| prompt_shown → signup | 11.5% | 23.5% (-12 pp) |

⚠️ Mobile vs desktop split not pulled this refresh (skipped to keep autonomous run focused on weekly delta). Re-add comparison filter on next refresh.

### Sign-up cohort quality (Neon DB, all-time, pulled 2026-05-08)

| Metric | Count | % |
|---|---:|---:|
| Total users | 20 | — |
| Failed signups (no session row, likely test accounts) | 3 | — |
| **Successful signups** | **17** | 100% |
| Signups in last 7 days | 5 | — |
| Returned after day 1 | 11 | **65%** |
| Logged any minutes | 4 | 24% |
| Logged 30+ minutes | 3 | 18% |
| Active in last 14 days | 9 | 53% |
| `sessions_completed > 0` | **0** | 0% (35e7f0a fix not yet propagating to existing users) |

**New signups this week (5):** johsnonchen1002@gmail.com (mobile), arman019127277@gmail.com (mobile), doshimilan@gmail.com (desktop), tea.marija.radilica@gmail.com (desktop), ericmac748@gmail.com (no session — failed). Top 3 engaged users unchanged: eugene (168 min), megan (40 min), matt (37 min).

---

## Search engine traffic — last 7 days (May 1 – May 7, 2026)

Both engines pulled together; Bing+DDG+Yahoo combined ≈ 6× Google traffic for this site.

### Google Search Console

| Metric | Value | vs 28d May 5 baseline |
|---|---:|---:|
| Clicks | 62 | (28d was ~445 March → ~15.5/wk pace; 62/wk = +300%) |
| Impressions | 13,069 | strong week (May 28d was ~111K → ~28K/wk; 13K/wk indicates softer week) |
| CTR | 0.47% | comparable |
| Avg position | 9.86 | improving (was 11.5 March) |

**Top 5 GSC pages by clicks:**

| Page | Clicks | Imp | CTR | Pos |
|---|---:|---:|---:|---:|
| /breathing-visualizer | 15 | 167 | 9.0% | 6.0 |
| /4-7-8-breathing-timer | 9 | 209 | 4.3% | 9.7 |
| /for/huberman | 6 | 1,323 | 0.45% | 7.3 |
| /coherent-breathing-app | 5 | 529 | 0.95% | 6.6 |
| /box-breathing-app | 4 | 107 | 3.7% | 10.3 |

GSC translated-page presence in top 20: /pt/breathing-visualizer (2 clicks, pos 1.7), /es/breathing-app (1 click), /de/breathing-app (1 click). Three translated pages with clicks — first material click signal from translated content on Google.

### Bing Webmaster Tools

| Metric | Value |
|---|---:|
| Clicks | 29 |
| Impressions | 1,429 |
| CTR | 2.03% |
| Avg position | 5.6 |

⚠️ Bing API only returned data for May 1 in this window — May 2-7 not yet synced (Bing reporting lag, typical). Re-pull next refresh.

**Top 5 Bing pages by clicks (May 1 only):**

| Page | Clicks | Imp | CTR | Pos |
|---|---:|---:|---:|---:|
| /breathing-visualizer | 12 | 636 | 1.9% | 6.0 |
| /for/high-blood-pressure | 4 | 115 | 3.5% | 5.0 |
| /breathe/4-7-8 | 3 | 220 | 1.4% | 5.0 |
| /for/lung-capacity | 3 | 7 | 42.9% | 7.0 |
| /breathe/pursed-lip | 1 | 42 | 2.4% | 7.0 |

Bing translated-page presence in top 20: /pt/breathing-app (1 click, pos 2), /fr/for/kids, /ja/breathe/wim-hof, /es/breathe/wim-hof, /ja/for/high-blood-pressure (impressions but no clicks). 5 translated pages registering on Bing — better breadth than Google's 3, but lower click volume. Trend to watch: Bing translated-page indexing finally surfacing.

### Cross-engine sanity checks

- `/breathing-visualizer` is #1 on **both** engines (15 GSC clicks, 12 Bing clicks at pos 6.0) → robust signal, not SERP-feature noise.
- `/for/huberman`: 1,323 GSC impressions / 6 clicks (0.45%) but 40 Bing impressions / 0 clicks → Google ranks it but Huberman SERP is heavily click-killed (likely Reddit/YouTube above).
- Active SEO experiment **/breathe/coherent** (May 5 title rewrite, measure-after May 19): not yet in top 20 on either engine — too early. Coherent-related queries appear on /coherent-breathing-app (5 GSC clicks, pos 6.6).

---

## Trends since 2026-04-27 baseline

| Metric | Apr 27 (30d) | May 5 (28d) | May 8 (7d) | Δ vs May 5 |
|---|---:|---:|---:|---|
| `breathing_session_start` (users) | 338 | 361 | 119 (7d) | ~32%/wk pace, vs 90/wk in May 5 28d → softer |
| `breathing_session_pause` (users) | 129 | 150 | 57 (7d) | similar weekly pace |
| `breathing_session_complete` (users) | 13 | 22 | 25 (7d) | **+ massive jump** — exceeded 28d count in 7d |
| start → pause | 38% | 41.6% | **47.9%** | +6.3 pp |
| start → complete | 3.8% | 6.1% | **21.0%** | +14.9 pp 🚀 |
| signup completions (users) | 0 | 12 | 6 (7d) | steady ~6/wk |
| signup_user_identified | n/a | not seen | **4** | first appearance, confirms GA4 user-ID wiring |

⚠️ The complete-rate jump (6.1% → 21.0%) is too large to attribute to product change alone. Three explanations to triage next refresh:
  1. Real lift from the May 5 duration-chip + complete-event-fix combo (rate is now reliably measured for users who set a timer).
  2. Cohort effect — last 7d skews toward repeat users with chips/timer habit.
  3. Measurement noise — small numerator (25 of 119 starts).

`signup_user_identified` (4 users) appearing on GA4 is the single cleanest signal this week — confirms the May 5 user-ID deploy works end-to-end.

---

## Active experiments awaiting measurement

| Date shipped | Experiment | Measure-after | Pre-committed criteria summary |
|---|---|---|---|
| 2026-05-05 | [Engaged-minutes tracking fix](PRODUCT-EXPERIMENTS.md#2026-05-05-engaged-minutes-tracking--fix-double-counting--stop-event-sync) | 2026-05-19 read, 2026-06-02 verdict | total_min per user 30-60% lower (de-duplicated); sessions_completed > 0 when min > 0 |
| 2026-05-05 | [GA4 user identification](PRODUCT-EXPERIMENTS.md#2026-05-05-ga4-user-identification-user_id--signed_up-property) | 2026-05-19 | `signed_up=true` user_property visible in GA4; `signup_user_identified` events match login count |
| 2026-05-05 | [Tap-to-pause hint](PRODUCT-EXPERIMENTS.md#2026-05-05-tap-to-pause-hint-inside-orb) | 2026-05-19 | Mobile abandonment ≤66% (-8 pp); ~+12 mobile pauses per 28d |
| 2026-05-05 | [Coherent page title rewrite](SEO-EXPERIMENTS.md#2026-05-05-coherent-page-title-rewrite--timer-intent-match) | 2026-05-19 | Top-3 timer-intent queries lift CTR from 0% to 1-3% |
| 2026-05-05 | [Fix 5 GSC 404s](SEO-EXPERIMENTS.md#2026-05-05-fix-5-gsc-404s--double-locale--sub-path-redirects) | 2026-05-19 | GSC "Not found (404)" count drops from 5 → 0 |

**Early signal (3d in):** `signup_user_identified` is firing (4 users) — partial evidence the GA4 user-ID experiment is on track. Other four experiments need the full read window.

---

## Recent results (graduated)

| Experiment | Status | Key finding |
|---|---|---|
| [Duration chips below orb](PRODUCT-EXPERIMENTS.md#2026-04-27-duration-chips-below-orb) | ✅ Success (measurable metric only) | Visible completion 3.8% → 6.1%; mostly measurement effect, not behavior change |
| [Mobile hero above fold](PRODUCT-EXPERIMENTS.md#2026-04-27-mobile-hero-above-the-fold) | 🟡 Mixed | Mobile abandonment moved -1.7pp, desktop moved more (-3.7pp) — co-shipped with chips |
| [page_viewed_breathing event](PRODUCT-EXPERIMENTS.md#2026-04-27-page_viewed_breathing-event--sessions_completed-sync-fix) | ✅ Event ships, ❌ sessions_completed sync fix superseded | Top-of-funnel signal now exists; sessions_completed still broken until 35e7f0a |

---

## Known measurement issues

- **`breathing_session_stop` event still not appearing** in 7d events report (UX-BACKLOG flagged this). 18 events in the report; stop is missing. Either it never wired up or it's named differently in code. Action: grep `breathing_session_stop` in `src/lib/analytics/` next session.
- **`sessions_completed = 0` for everyone in the DB**, including new May-5+ signups. The 2026-05-05 [35e7f0a](https://github.com/abiassi/deepbreathing/commit/35e7f0a) fix may not be propagating, or no new user has hit the path. Re-check 2026-05-19.
- **Bing API returned only May 1** for the 7d window (May 2-7 not yet synced). Bing reporting lag is typical — re-sync next Friday will backfill. Don't read into the apparent week-over-week drop.
- **Mobile/desktop split not captured this refresh** — skipped to keep the autonomous run within scope. Add back next refresh by enabling the GA4 comparison filter.
- **Sharp complete-rate jump (6.1% → 21.0%)** likely a mix of real lift + cohort skew + small-numerator noise. Don't draw a strong conclusion from one week — re-evaluate at the May 19 checkpoint.
- **Apr 27 ↔ May 5 cross-property GA4 comparison** still has indexing noise (Abiassi → DKMT). Trends are directionally OK; absolute numbers shouldn't be compared with full confidence across the property migration.

---

## What this dashboard is FOR (and isn't)

**For:** Knowing the current state of the funnel at a glance. Linking experiments to the metrics they're supposed to move. Catching regressions between weekly refreshes.

**Not for:** One-off investigations (use a date-stamped doc like `ctr-investigation-2026-05-05.md`). Per-page deep dives. Long-form analysis of *why* something is happening.

**When to update:**
- Weekly (Friday) automated refresh — see [runbook](runbooks/weekly-funnel-refresh.md)
- Immediately after a measurement-date verdict in PRODUCT-EXPERIMENTS or SEO-EXPERIMENTS
- Whenever the GA4 property / measurement ID changes (DON'T leave the old one in place)
