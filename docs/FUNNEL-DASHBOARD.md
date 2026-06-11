# Funnel Dashboard

**Last refreshed:** 2026-06-08 *(verdict-pass refresh — applied the overdue experiment verdicts; funnel snapshot + cohort updated. The "Search engine traffic — last 7d" and "Trends since Apr 27" sections below are still from the 2026-05-08 weekly refresh — next full search re-pull is due Friday.)*
**Refresh cadence:** Weekly (Friday). Runbook: [docs/runbooks/weekly-funnel-refresh.md](runbooks/weekly-funnel-refresh.md)
**Source of truth:** GA4 property `Deep Breathing Exercises` in DKMT account, ID `527524722`, measurement ID `G-53DLCBMRL3`. ⚠️ NOT the old Abiassi property `G-7GG9WVNBBP` (which has stale 2026-Q1 data only).

---

## Top-line snapshot — last 28 days (May 11 – Jun 7, 2026)

> Pulled 2026-06-08 for the verdict pass. Note the event model changed on 2026-05-08: `breathing_session_pause` / `_complete` / `_stop` are now unified into a single `breathing_session_end` (with a `reason` param). Read rates on **users**, not events — `conversion_prompt_shown` event count is inflated pre-2026-06-01 by the double-fire bug (unique users are unaffected; see PRODUCT-EXPERIMENTS Prompt B "Measurement correction").

### Engagement funnel (GA4, 28d)

| Step | Users | Events | Note |
|------|---:|---:|---|
| `first_visit` | 1,009 | 1,018 | — |
| `page_viewed_breathing` | 1,001 | 2,816 | — |
| `breathing_session_start` | **413** | 1,002 | 100% of start (users) |
| `breathing_session_end` | 287 | 829 | 69.5% of start-users · 82.7% of start-events (unified pause/complete/mode-switch) |
| `mode_switch` | 15 | 75 | 3.6% of starts (was 1.7%) |
| `conversion_prompt_shown` | 297 | 1,351 | ⚠️ events inflated pre-Jun-1 double-fire — use users |
| `conversion_prompt_dismissed` | 131 | 133 | 44% of prompt-shown users |
| `conversion_signup_completed` | 26 | 41 | **8.8% of prompt-shown users** (28d blended; clean control read 10.7% — see Prompt B entry) |
| `signup_user_identified` | 22 | 37 | ✅ firing (was 4 at first appearance May 8) |

`breathing_session_stop`: 0 events (dead — moot since the May 8 unify). Legacy `_pause`/`_complete`: 2 / 5 residual events.

### Device split (28d, users)

| | Mobile | Desktop |
|---|---:|---:|
| `breathing_session_start` | 202 | 211 |
| `breathing_session_end` | 130 | 156 |
| Abandonment (no end / start) | **35.6%** | 26.1% |

Mobile−desktop abandonment gap narrowed from ~25pp (May baseline) to 9.5pp — though most of the absolute drop is the event-model change, not the tap-to-pause hint (see Tap-to-Pause verdict).

### Sign-up cohort quality (Neon DB, all-time, pulled 2026-06-08)

| Metric | Count | % | vs 2026-05-08 |
|---|---:|---:|---|
| Total users | 42 | — | +22 |
| Failed signups (no session row, likely test accounts) | 4 | — | +1 |
| **Successful signups** | **38** | 100% | +21 |
| Signups in last 7 days | 5 | — | flat |
| Returned after day 1 | 26 | **62%** | 65% → 62% |
| Logged any minutes | 16 | 38% | 24% → 38% |
| Logged 30+ minutes | 4 | 10% | — |
| Active in last 14 days | 15 | 36% | — |
| `sessions_completed > 0` | **15** | 36% | **0% → 36% ✅ (Engaged-minutes / Unify fix working)** |

**Structural win:** `sessions_completed > 0` went from **0 of all users → 15**, and **11 of 11** new (post-May-8) engaged signups now credit a session — confirms the Engaged-minutes + Unify-session-end fixes. Top engaged users: margoshats (49 min / 16 sessions — new, post-fix), eugene (168 min / 0 sessions — frozen pre-fix legacy row, last synced Apr 18), megan (40 / 0, legacy). The frozen legacy rows are why the "minutes 30–60% lower" leg is unverifiable.

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
| 2026-06-01 | [Conversion Prompt B (social proof + stats)](PRODUCT-EXPERIMENTS.md#2026-06-01-conversion-prompt-b-social-proof--personal-stats-100-challenger) | 2026-06-15 read, 2026-06-29 verdict | prompt_shown→signup ≥16% **user-based** vs 10.7% control; dismiss not up; truth not down |
| 2026-05-06 | [9D Breathwork cluster (2 pages)](SEO-EXPERIMENTS.md#2026-05-06-9d-breathwork-cluster--2-pages-riding-the-breakout-trend) | 2026-06-17 | both pages top-5 on head terms; ≥30 clicks/mo combined |
| 2026-05-06 | [E-E-A-T wellness-class overhaul](SEO-EXPERIMENTS.md#2026-05-06-e-e-a-t-wellness-class-overhaul--founder-byline--lineage--light-citations) | 2026-07-01 | 22-page cohort avg Google position improves ≥2 points |

**⚠️ Conversion Prompt B early read (Jun 2–7, underpowered):** user-based intent **6.25%** (5/80) — trending *below* the 10.7% control, not toward the ≥16% target. N far under the ~150-impression floor; directional only. Hypothesis: the simulated social-proof count may be suppressing intent. Make the live count real before the 6/29 verdict.

---

## Recent results (graduated)

| Experiment | Status | Key finding |
|---|---|---|
| **Graduated 2026-06-08:** | | |
| [Engaged-minutes tracking fix](PRODUCT-EXPERIMENTS.md#2026-05-05-engaged-minutes-tracking--fix-double-counting--stop-event-sync) | ✅ Success | `sessions_completed` 0 → 15 users; 11/11 new engaged signups credit a session. Magnitude leg unverifiable (frozen legacy rows) |
| [GA4 user identification](PRODUCT-EXPERIMENTS.md#2026-05-05-ga4-user-identification-user_id--signed_up-property) | ✅ Success | `signup_user_identified` firing for 22 users (was 4); user-ID + signed_up path confirmed end-to-end |
| [Bing translated-page indexing push](SEO-EXPERIMENTS.md#2026-05-05-bing-translated-page-indexing-push--url--content-submission) | ✅ Success | ≥45 translated URLs now in Bing data (vs 2); refutes the "external-authority" failure hypothesis — submission/crawl was the bottleneck |
| [Unify session-end events](PRODUCT-EXPERIMENTS.md#2026-05-08-unify-session-end-events--commit-on-pause) | 🟡 Mixed | sessions_completed leg ✅ (100%); end-event coverage 83% of starts — better than 63% but below 90% target (tab-close gap) |
| [Tap-to-pause hint](PRODUCT-EXPERIMENTS.md#2026-05-05-tap-to-pause-hint-inside-orb) | 🟡 Mixed (confounded) | Mobile abandonment 74% → 36%, but mostly the co-shipped event redefinition; only clean signal is mobile−desktop gap 25pp → 9.5pp |
| [UTM-tag share buttons](PRODUCT-EXPERIMENTS.md#2026-05-12-utm-tag-share-buttons-attribute-outbound-shares-back-to-ga4) | 🟡 Mixed | `share/native` works (36 sessions/28d) but `share/copy` never fired; volume decaying (4/14d) |
| [Direct +47% surge](PRODUCT-EXPERIMENTS.md#2026-05-12-direct-47-wow--hypothesis-organic-shares-from-ptde-translations) | 🟡 Mixed | Direct sustained at 131 new/7d but share buttons explain ~4 sessions/14d → real but unattributable |
| [Mobile homepage redesign](PRODUCT-EXPERIMENTS.md#2026-05-11-mobile-homepage-pills-mode-picker--full-screen-orb--restore-hero-text) | ⚪ Inconclusive | `mode_switch` 1.7% → 3.6% (under 4% bar); completion leg obsoleted by Unify ship — re-pin & re-read |
| [Coherent title rewrite](SEO-EXPERIMENTS.md#2026-05-05-coherent-page-title-rewrite--timer-intent-match) | ⚪ Inconclusive | Target timer queries still 0% CTR but only 12–33 imp each (underpowered); deprioritize |
| [Fix 5 GSC 404s](SEO-EXPERIMENTS.md#2026-05-05-fix-5-gsc-404s--double-locale--sub-path-redirects) | ❌ Failed | 404 count grew 5 → 17, validation failed; proxy still minting double-locale + localized-EN-only URLs |
| **Earlier:** | | |
| [Duration chips below orb](PRODUCT-EXPERIMENTS.md#2026-04-27-duration-chips-below-orb) | ✅ Success (measurable metric only) | Visible completion 3.8% → 6.1%; mostly measurement effect, not behavior change |
| [Mobile hero above fold](PRODUCT-EXPERIMENTS.md#2026-04-27-mobile-hero-above-the-fold) | 🟡 Mixed | Mobile abandonment moved -1.7pp, desktop moved more (-3.7pp) — co-shipped with chips |
| [page_viewed_breathing event](PRODUCT-EXPERIMENTS.md#2026-04-27-page_viewed_breathing-event--sessions_completed-sync-fix) | 🟡 Mixed | Top-of-funnel signal now exists; sessions_completed sync superseded by 35e7f0a (now fixed — see Engaged-minutes ✅) |

---

## Known measurement issues

- **✅ RESOLVED — `sessions_completed = 0`:** now 15 users with > 0, and 11/11 new engaged signups credit a session. The Engaged-minutes + Unify fixes work. (Legacy pre-fix rows stay frozen — don't read magnitude off them.)
- **✅ MOOT — `breathing_session_stop` not firing:** the May 8 unify collapsed pause/complete/stop into `breathing_session_end`; stop is intentionally dead (0 events). Count engagement off `breathing_session_end`.
- **⚠️ NEW — `conversion_prompt_shown` event count inflated pre-2026-06-01** by a double-fire bug (fixed Jun 1, commit `a97d0fa`). Inflation was ~1.3–1.5× on **events only**; unique **users** were never affected. Always read conversion rates on users. See PRODUCT-EXPERIMENTS Prompt B "Measurement correction."
- **⚠️ NEW — GSC "Not found (404)" regressed 5 → 17, validation failed (5/30).** The mass-translate proxy keeps emitting double-locale (`/pt/fr/...`) and localized-EN-only (`/fr/languages`) URLs Google indexes as 404, plus www/http homepage variants. Root cause is the proxy's URL generation, not the redirect rules. See SEO-EXPERIMENTS Fix-5-404s ❌.
- **End-event coverage is 83% of starts, not 100%** — tab-close / hard-nav sessions emit no `breathing_session_end`. Fix with `sendBeacon` on `visibilitychange` (UX-BACKLOG).
- **Search-traffic section below is stale (2026-05-08 weekly refresh)** — GSC/Bing top-5-by-clicks tables and the trends table were not re-pulled in this verdict pass. Next Friday's weekly refresh should refresh them (and note the coherent page now shows 6 clicks / 0.4% CTR / pos 7.3 over 28d, and ≥45 translated URLs now register on Bing).
- **Apr 27 ↔ May 5 cross-property GA4 comparison** still has indexing noise (Abiassi → DKMT). Trends are directionally OK; absolute numbers shouldn't be compared with full confidence across the property migration.

---

## What this dashboard is FOR (and isn't)

**For:** Knowing the current state of the funnel at a glance. Linking experiments to the metrics they're supposed to move. Catching regressions between weekly refreshes.

**Not for:** One-off investigations (use a date-stamped doc like `ctr-investigation-2026-05-05.md`). Per-page deep dives. Long-form analysis of *why* something is happening.

**When to update:**
- Weekly (Friday) automated refresh — see [runbook](runbooks/weekly-funnel-refresh.md)
- Immediately after a measurement-date verdict in PRODUCT-EXPERIMENTS or SEO-EXPERIMENTS
- Whenever the GA4 property / measurement ID changes (DON'T leave the old one in place)
