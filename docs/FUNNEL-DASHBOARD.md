# Funnel Dashboard

**Last refreshed:** 2026-05-18 (indexing-recovery checkpoint)
**Refresh cadence:** Weekly (Friday). Runbook: [docs/runbooks/weekly-funnel-refresh.md](runbooks/weekly-funnel-refresh.md)
**Source of truth:** GA4 property `Deep Breathing Exercises` in DKMT account, ID `527524722`, measurement ID `G-53DLCBMRL3`. ⚠️ NOT the old Abiassi property `G-7GG9WVNBBP` (which has stale 2026-Q1 data only).

---

## Top-line snapshot — last 14 days (May 4 – May 17, 2026)

### Engagement funnel (unique users, GA4, mobile + web split)

| Step | All users | Mobile | Web |
|------|---:|---:|---:|
| `first_visit` | 535 | 213 | 317 |
| `page_viewed_breathing` | 519 | 217 | 299 |
| `breathing_session_start` | **234** | **111** | 122 |
| `breathing_session_pause` | 61 | 20 | 41 |
| `breathing_session_complete` | 46 | 22 | 24 |
| `breathing_session_end` ⚠️ NEW finding — was reported missing | **70** | 31 | 38 |
| `mode_switch` | 10 | 6 | 3 |
| `conversion_prompt_shown` | 149 | 71 | 76 |
| `conversion_signup_completed` | **11** | 6 | 5 |
| `signup_user_identified` | **11** | 5 | 6 |
| `eyes_closed_toggled` | 1 | 0 | 1 |

Total active users (14d): 589. Total events: 7,591.

### Funnel ratios (14d)

| | All | Mobile | Web |
|---|---:|---:|---:|
| start → pause | 26.1% | **18.0%** | 33.6% |
| start → complete | 19.7% | **19.8%** | 19.7% |
| start → end (stop) | 29.9% | 27.9% | 31.1% |
| prompt_shown → signup | 7.4% | 8.5% | 6.6% |

**Mobile pause rate (18.0%) is well below web (33.6%)** — mobile users still abandon without using the pause control more than desktop users. The 2026-05-05 tap-to-pause hint experiment was [❌ Failed](PRODUCT-EXPERIMENTS.md#2026-05-05-tap-to-pause-hint-inside-orb) (mobile abandonment moved 74.3% → 82.0%, wrong direction).

### Sign-up cohort quality (Neon DB, all-time, pulled 2026-05-18)

| Metric | Count | % |
|---|---:|---:|
| Total users | **26** (+9 since May 8) | — |
| Failed signups (no session row) | 2 | — |
| **Successful signups** | **24** | 100% |
| Signups in last 7 days | 5 | — |
| Returned after day 1 | 15 | 63% |
| Logged any minutes | 7 | 29% |
| Logged 30+ minutes | 3 | 13% |
| Active in last 14 days | 13 | 54% |
| `sessions_completed > 0` | **4** | 17% (was 0 on May 8) ✅ — engaged-minutes fix is firing for post-deploy sessions |

**New engaged users this fortnight:** liz.dawson55 (15 min / 8 done) and margoshats (4 min / 3 done) both show non-zero `sessions_completed` — first time we have any users with that field populated. The [engaged-minutes tracking fix](PRODUCT-EXPERIMENTS.md#2026-05-05-engaged-minutes-tracking--fix-double-counting--stop-event-sync) is working for new sessions; old pre-fix DB rows still show 0.

---

## Top-line snapshot — last 7 days (May 1 – May 7, 2026) — previous refresh, kept for trend reference

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

## Search engine traffic — last 14 days (May 4 – May 17, 2026) + GSC indexing status

Both engines pulled together; Bing+DDG+Yahoo combined ≈ 6× Google traffic for this site.

### GSC Page indexing (pulled via Chrome MCP, last update 5/15/26)

| Bucket | May 5 | May 18 | Δ |
|---|---:|---:|---|
| **Indexed** | 200 | **246** | +46 ✅ best gain since April |
| Not indexed total | 147 | 146 | -1 |
| ↳ Discovered – currently not indexed | 113 | **77** | -36 ✅ (target was <50, trending right) |
| ↳ Crawled – currently not indexed | n/a | 32 | — |
| ↳ Alternate page with proper canonical | n/a | 13 | — |
| ↳ Duplicate, Google chose different canonical | n/a | 10 | — |
| ↳ Not found (404) | 5 | 10 | **+5** — Google found additional double-locale variants pre-deploy; all 10 are caught by the May 5 redirect rule (curl-verified), Validation "Started" |
| ↳ Page with redirect | n/a | 4 | — |

### Google Search Console — 14d (May 4 – May 17)

### Google Search Console — 7d (May 1 – May 7, 2026) — prior refresh

| Metric | Value | vs 28d May 5 baseline |
|---|---:|---:|
| Clicks | 62 | (28d was ~445 March → ~15.5/wk pace; 62/wk = +300%) |
| Impressions | 13,069 | strong week (May 28d was ~111K → ~28K/wk; 13K/wk indicates softer week) |
| CTR | 0.47% | comparable |
| Avg position | 9.86 | improving (was 11.5 March) |

### Google Search Console — 14d (May 4 – May 17, 2026) — current

| Metric | Value | Note |
|---|---:|---|
| Clicks | 135 | ~270/28d-pace vs 445 March 28d → softer (Google traffic dipping) |
| Impressions | 23,061 | ~46K/28d-pace vs 111K March → significant decline |
| CTR | 0.59% | comparable |
| Avg position | 11.0 | comparable |

**Top 5 GSC pages by clicks (14d):**

| Page | Clicks | Imp | CTR | Pos |
|---|---:|---:|---:|---:|
| /4-7-8-breathing-timer | 22 | 448 | 4.9% | 8.8 |
| /breathing-visualizer | 21 | 288 | 7.3% | 6.4 |
| /breathe/hope-cartel-9d-breathwork | **12** | 393 | 3.1% | 9.4 ← new May 6 page paying off |
| /coherent-breathing-app | 9 | 800 | 1.1% | 7.3 |
| /box-breathing-app | 8 | 234 | 3.4% | 9.0 |

GSC translated-page presence in top 20: /es/breathing-visualizer (3 clicks), /es/breathing-app (2), /de/breathing-app (2), /es/box-breathing-app (2) — 4 translated pages with clicks.

**Top 5 GSC pages by clicks:**

| Page | Clicks | Imp | CTR | Pos |
|---|---:|---:|---:|---:|
| /breathing-visualizer | 15 | 167 | 9.0% | 6.0 |
| /4-7-8-breathing-timer | 9 | 209 | 4.3% | 9.7 |
| /for/huberman | 6 | 1,323 | 0.45% | 7.3 |
| /coherent-breathing-app | 5 | 529 | 0.95% | 6.6 |
| /box-breathing-app | 4 | 107 | 3.7% | 10.3 |

GSC translated-page presence in top 20: /pt/breathing-visualizer (2 clicks, pos 1.7), /es/breathing-app (1 click), /de/breathing-app (1 click). Three translated pages with clicks — first material click signal from translated content on Google.

### Bing Webmaster Tools — 28d (Apr 20 – May 17, 2026)

Bing API still returns weekly chunks (Apr 24, May 1, May 8 only). Recent days not yet synced.

| Metric | Value | vs May 5 baseline |
|---|---:|---|
| Clicks | 111 | 126 → 111 (-12%) |
| Impressions | 4,361 | 4,590 → 4,361 (-5%) |
| CTR | 2.55% | 2.7% (comparable) |
| Avg position | 5.6 | 5.3 (slightly worse) |

**Translated-page presence on Bing — 7+ pages with impressions (up from 2 at May 5 baseline)** — strongest signal yet that the [Bing translated-page indexing push](SEO-EXPERIMENTS.md#2026-05-05-bing-translated-page-indexing-push--url--content-submission) is working. Full 4-week verdict 2026-06-02:

| Page | Clicks | Imp | Pos |
|---|---:|---:|---:|
| /fr/breathing-visualizer | 6 | 12 | 3.2 |
| /ja/breathe/tummo | 2 | 12 | 4.0 |
| /ja/for/huberman | 2 | 5 | 6.0 |
| /fr/breathe/coherent | 1 | 191 | 8.0 |
| /ja/for/high-blood-pressure | 1 | 19 | 7.6 |
| /de/breathe/buteyko | 1 | 2 | 8.0 |
| /pt/breathe/breath-of-fire | 1 | 2 | 7.0 |
| /es/breathing-visualizer | 1 | 1 | 1.0 |

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

| Metric | Apr 27 (30d) | May 5 (28d) | May 8 (7d) | **May 18 (14d)** | Δ vs May 8 |
|---|---:|---:|---:|---:|---|
| `breathing_session_start` (users) | 338 | 361 | 119 | **234** | ~117/wk vs 119/wk — flat |
| `breathing_session_pause` (users) | 129 | 150 | 57 | **61** | ~30/wk vs 57/wk — DOWN |
| `breathing_session_complete` (users) | 13 | 22 | 25 | **46** | ~23/wk vs 25/wk — sustained, not a fluke |
| `breathing_session_end` (users) | — | — | reported as not firing | **70** | actual event name = `_end`, not `_stop` (correction) |
| start → pause | 38% | 41.6% | 47.9% | **26.1%** | -21.8 pp (May 8's 47.9% was a small-N spike) |
| start → complete | 3.8% | 6.1% | 21.0% | **19.7%** | similar — confirms the chips/event-fix combo lift is real, not noise |
| signup completions (users) | 0 | 12 | 6 | **11** | ~5.5/wk — steady |
| signup_user_identified (users) | n/a | not seen | 4 | **11** | matches signups → ✅ GA4 user-ID experiment graduates |

**The complete-rate held at ~20% across both weekly windows (May 1-7: 21.0% and May 4-17 14d: 19.7%) — the May 8 spike was real and the lift has stuck.** That's the most-important trend confirmation this checkpoint.

**The pause-rate "drop" (47.9% → 26.1%) is partially window-mix:** May 8's 7d had only 57 paused / 119 started — small N with a high day. The 14d number (61 paused / 234 started = 26.1%) is closer to the true rate. Mobile pause rate specifically is **18.0%** — see Tap-to-Pause [❌ Failed](PRODUCT-EXPERIMENTS.md#2026-05-05-tap-to-pause-hint-inside-orb) verdict.

---

## Active experiments awaiting measurement

| Date shipped | Experiment | Measure-after | Pre-committed criteria summary |
|---|---|---|---|
| 2026-05-17 | [Resonance audio v2 — body-resonance bed, session arc, eyes-closed mode](PRODUCT-EXPERIMENTS.md#2026-05-17-resonance-audio-v2--body-resonance-breath-coupled-bed-session-arc-eyes-closed-mode) | TBD | (entry pre-dates pre-criteria) |
| 2026-05-12 | [UTM-tagged share buttons](PRODUCT-EXPERIMENTS.md#2026-05-12-utm-tag-share-buttons-attribute-outbound-shares-back-to-ga4) | 2026-06-05 | Direct surge attributable via UTM tags |
| 2026-05-12 | [Direct +47% WoW investigation](PRODUCT-EXPERIMENTS.md#2026-05-12-direct-47-wow--hypothesis-organic-shares-from-ptde-translations) | 2026-06-05 | UTM evidence ties Direct lift to translated-page shares |
| 2026-05-11 | [Mobile homepage: pills + full-screen orb + hero text](PRODUCT-EXPERIMENTS.md#2026-05-11-mobile-homepage-pills-mode-picker--full-screen-orb--restore-hero-text) | 2026-05-25 | Mobile abandonment moves; mobile complete-rate ≥ desktop |
| 2026-05-08 | [Unify session-end events + commit-on-pause](PRODUCT-EXPERIMENTS.md#2026-05-08-unify-session-end-events--commit-on-pause) | 2026-05-22 | More engaged users with `total_min > 0` |
| 2026-05-06 | [9D breathwork cluster — 2 pages](SEO-EXPERIMENTS.md#2026-05-06-9d-breathwork-cluster--2-pages-riding-the-breakout-trend) | 2026-06-03 | Top-3 on `9d breathwork`/`hope cartel`; ≥50 clicks/mo |
| 2026-05-05 | [Engaged-minutes tracking fix](PRODUCT-EXPERIMENTS.md#2026-05-05-engaged-minutes-tracking--fix-double-counting--stop-event-sync) | 2026-06-02 verdict | `sessions_completed > 0` ✅ confirmed for post-deploy sessions; `total_min` dedupe still needs per-session ledger to verify |
| 2026-05-05 | [Bing translated-page indexing push](SEO-EXPERIMENTS.md#2026-05-05-bing-translated-page-indexing-push--url--content-submission) | 2026-06-02 | ≥30 translated URLs in Bing perf (interim 7+ → trending ⚪ Inconclusive zone) |

---

## Recent results (graduated)

| Experiment | Status | Key finding |
|---|---|---|
| [GA4 user identification](PRODUCT-EXPERIMENTS.md#2026-05-05-ga4-user-identification-user_id--signed_up-property) | ✅ **Success** (2026-05-18) | `signup_user_identified` (11 users) exactly matches `conversion_signup_completed` (11) over 14d — wiring proven end-to-end |
| [Tap-to-pause hint inside orb](PRODUCT-EXPERIMENTS.md#2026-05-05-tap-to-pause-hint-inside-orb) | ❌ **Failed** (2026-05-18) | Mobile abandonment moved 74.3% → 82.0% (wrong direction); mobile pause-rate dropped 25.7% → 18.0%. Consider removing the hint. |
| [Coherent page title rewrite](SEO-EXPERIMENTS.md#2026-05-05-coherent-page-title-rewrite--timer-intent-match) | ❌ **Failed** (2026-05-18) | Top-3 timer-intent queries still 0% CTR; SERP features (Answer Box + YouTube) crowd organic below the fold. Reaffirms link-authority > metadata at DR 0.2. |
| [Fix 5 GSC 404s](SEO-EXPERIMENTS.md#2026-05-05-fix-5-gsc-404s--double-locale--sub-path-redirects) | 🟡 **Mixed** (2026-05-18) | Engineering ✅ (curl: all 10 patterns 308 to canonical), criterion ❌ (5 → 10 because Google found more variants pre-deploy). Should clear as Google re-crawls. |
| [Duration chips below orb](PRODUCT-EXPERIMENTS.md#2026-04-27-duration-chips-below-orb) | ✅ Success (measurable metric only) | Visible completion 3.8% → 6.1% → now sustained at 19.7% in 14d — likely real lift, not just measurement |
| [Mobile hero above fold](PRODUCT-EXPERIMENTS.md#2026-04-27-mobile-hero-above-the-fold) | 🟡 Mixed | Mobile abandonment moved -1.7pp, desktop moved more (-3.7pp) — co-shipped with chips |
| [page_viewed_breathing event](PRODUCT-EXPERIMENTS.md#2026-04-27-page_viewed_breathing-event--sessions_completed-sync-fix) | ✅ Event ships, ❌ sessions_completed sync fix superseded | Top-of-funnel signal now exists; sessions_completed fix shipped May 5 ([35e7f0a](https://github.com/abiassi/deepbreathing/commit/35e7f0a)) and is now confirmed working — 4 users have `sessions_completed > 0` (was 0) |

---

## Known measurement issues

- **~~`breathing_session_stop` not firing~~** — **RESOLVED 2026-05-18.** The event actually fires as **`breathing_session_end`** (159 events / 70 users in 14d). The dashboard, runbook, and any code that references `breathing_session_stop` should be updated to `breathing_session_end`. Action item: grep for `breathing_session_stop` references in `src/lib/analytics/` and `docs/` and align naming.
- **~~`sessions_completed = 0` for everyone~~** — **RESOLVED 2026-05-18.** The [35e7f0a](https://github.com/abiassi/deepbreathing/commit/35e7f0a) fix is now confirmed propagating. 4 of 7 engaged users have `sessions_completed > 0`. Old pre-fix user_stats rows still show 0 (because user_stats is overwritten on each sync; the next session those users complete will refresh the row).
- **Bing API still returns sparse weekly chunks** — Apr 24, May 1, May 8 only in the 28d window. Bing reporting lag remains typical. Don't compare day-by-day; use 28d totals.
- **Sustained complete-rate (19.7%–21.0%)** across two consecutive windows confirms the May 8 spike was not noise — the chips/event-fix combo did move the needle ~3× on visible completions. Likely a mix of real behavior change (more users now set timers) + the event reliably firing on timed completes.
- **Mobile pause rate (18.0%) is structurally lower than web (33.6%)** — the [tap-to-pause hint](PRODUCT-EXPERIMENTS.md#2026-05-05-tap-to-pause-hint-inside-orb) did not fix this. Open UX question for next product cycle.
- **GSC traffic softening** — March 28d was ~111K impressions; the May 4-17 14d ran at ~46K/28d pace. Position held at ~11. Likely a Google-side ranking shift or seasonality. Watch over the next 2 weeks.
- **Apr 27 ↔ May 5 cross-property GA4 comparison** still has indexing noise (Abiassi → DKMT). Trends are directionally OK; absolute numbers shouldn't be compared with full confidence across the property migration.

---

## What this dashboard is FOR (and isn't)

**For:** Knowing the current state of the funnel at a glance. Linking experiments to the metrics they're supposed to move. Catching regressions between weekly refreshes.

**Not for:** One-off investigations (use a date-stamped doc like `ctr-investigation-2026-05-05.md`). Per-page deep dives. Long-form analysis of *why* something is happening.

**When to update:**
- Weekly (Friday) automated refresh — see [runbook](runbooks/weekly-funnel-refresh.md)
- Immediately after a measurement-date verdict in PRODUCT-EXPERIMENTS or SEO-EXPERIMENTS
- Whenever the GA4 property / measurement ID changes (DON'T leave the old one in place)
