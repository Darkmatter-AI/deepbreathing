# Product Experiments Log

Track product/UX changes with hypothesis, baselines, and results. Mirror of `SEO-EXPERIMENTS.md` but for changes that affect the funnel (start → pause → complete → return → engaged minutes → signup).

## How to use this file

1. **Before shipping a non-trivial UX/product change**: add an entry with hypothesis, baseline metrics, and **pre-committed success criteria** (write the "I'll call this Success if X moves by Y%" line *before* shipping — not after).
2. **When shipping**: link the commit, mark `🔄 Implemented`, set a `measure-after` date.
3. **At the measure-after date** (and the next weekly funnel refresh): pull the metrics, compare to baseline, write the result, graduate to ✅ Success / ❌ Failed / ⚪ Inconclusive.
4. **When adding entries**: also add a row to the Index below.

**What goes here:** UX changes (orb pause cue, hero placement, conversion prompt timing), tracking changes (new events, fixes to event firing), and any code change where success/failure is measured by the funnel.

**What goes in `SEO-EXPERIMENTS.md` instead:** title rewrites, meta description changes, sitemap/redirect work, indexing remediation — anything where success is measured by GSC/Bing/Ahrefs metrics.

**What goes in `UX-BACKLOG.md` instead:** ideas you haven't shipped yet. Once shipped, move it here.

---

## Index

Reverse chronological. Legend: ✅ Success · ❌ Failed · ⚪ Inconclusive · 🟡 Mixed · ⏳ Waiting · 🔄 Implemented (not yet measured) · 📊 Snapshot/Checkpoint.

| Date | Entry | Status |
|------|-------|--------|
| 2026-06-01 | [Fix `conversion_prompt_shown` double-fire (impure setState updaters)](#2026-06-01-fix-conversion_prompt_shown-double-fire-impure-setstate-updaters) | 🔄 Implemented |
| 2026-06-01 | [Conversion Prompt B (social proof + personal stats), 100% challenger](#2026-06-01-conversion-prompt-b-social-proof--personal-stats-100-challenger) | 🔄 Implemented |
| 2026-05-12 | [Direct +47% WoW — hypothesis: organic shares from PT/DE translations](#2026-05-12-direct-47-wow--hypothesis-organic-shares-from-ptde-translations) | 🟡 Inconclusive |
| 2026-05-12 | [UTM-tag share buttons (attribute outbound shares back to GA4)](#2026-05-12-utm-tag-share-buttons-attribute-outbound-shares-back-to-ga4) | 🔄 Implemented |
| 2026-05-11 | [Mobile homepage: pills mode picker + full-screen orb + restore hero text](#2026-05-11-mobile-homepage-pills-mode-picker--full-screen-orb--restore-hero-text) | 🔄 Implemented |
| 2026-05-08 | [Unify session-end events + commit-on-pause](#2026-05-08-unify-session-end-events--commit-on-pause) | 🔄 Implemented |
| 2026-05-05 | [Engaged-Minutes Tracking — Fix Double-Counting + Stop-Event Sync](#2026-05-05-engaged-minutes-tracking--fix-double-counting--stop-event-sync) | 🔄 Implemented |
| 2026-05-05 | [GA4 User Identification (user_id + signed_up property)](#2026-05-05-ga4-user-identification-user_id--signed_up-property) | 🔄 Implemented |
| 2026-05-05 | [Tap-to-Pause Hint Inside Orb](#2026-05-05-tap-to-pause-hint-inside-orb) | 🔄 Implemented |
| 2026-04-27 | [Duration Chips Below Orb](#2026-04-27-duration-chips-below-orb) | 🔄 Implemented |
| 2026-04-27 | [Mobile Hero Above the Fold](#2026-04-27-mobile-hero-above-the-fold) | 🔄 Implemented |
| 2026-04-27 | [page_viewed_breathing Event + sessions_completed Sync Fix](#2026-04-27-page_viewed_breathing-event--sessions_completed-sync-fix) | 🔄 Implemented |

**Roll-up by status (11 entries):** 🔄 10 Implemented · 🟡 1 Inconclusive (the 2026-05-12 Direct surge). First read on the 2026-05-19 checkpoint, full read 2026-06-02; mobile-redesign + UTM-tagging reads 2026-05-22 / 2026-06-05.

See also: [docs/FUNNEL-DASHBOARD.md](FUNNEL-DASHBOARD.md) for the current state, [docs/UX-BACKLOG.md](UX-BACKLOG.md) for what's next, [docs/runbooks/weekly-funnel-refresh.md](runbooks/weekly-funnel-refresh.md) for how to pull the numbers.

---

## Active Experiments

### 2026-06-01: Fix `conversion_prompt_shown` double-fire (impure setState updaters)

**What/why:** `conversion_prompt_shown` was firing **twice** per qualifying breathing session (caught while verifying GA on prod after the Conversion Prompt B ship, by wrapping `window.gtag`). `breathing_session_end` fired once in the same session. Root cause: the `onSessionComplete` and `onSettingsChange` callbacks in [`src/lib/conversion/use-conversion-triggers.ts`](../src/lib/conversion/use-conversion-triggers.ts) ran their side effects (`trackEvent`, `setTimeout(... setShowSessionPrompt)`, `setShowSettingsNudge`) **inside** the `setState(prev => {…})` updater. React re-invokes updater functions (Strict Mode double-invokes in dev; concurrent rendering can re-run them in prod), so each re-invocation re-fired the analytics event. `breathing_session_end` was immune because it lives in the plain `endSession` body, not in an updater. That asymmetry is what confirmed the cause.

**Fix:** Updaters are now pure. Every state write routes through one synchronous `commit(next)` helper backed by a `stateRef`, and the analytics + UI side effects moved into the callback bodies, which React does not re-invoke. The event now fires once per qualifying trigger. tsc clean, eslint clean. No behavior change to when the prompt shows or to any other event.

**Impact on the live Conversion Prompt B experiment:** this is a denominator correction. **Only `conversion_prompt_shown` lived inside an updater, so only it was inflated.** `conversion_signup_completed` (markConverted) and both `conversion_prompt_dismissed` events fire in the callback body and were never affected. So the Conversion Prompt B baseline ([`conversion_prompt_shown: 52 / wk`](#2026-06-01-conversion-prompt-b-social-proof--personal-stats-100-challenger), set 2026-06-01) is inflated while the event numerators are clean. Two consequences for the 2026-06-15 read:

1. **Every rate with `conversion_prompt_shown` in the denominator shifts up post-fix, with zero change in user behavior.** That covers intent (`signup_completed / shown`, the primary metric), the dismiss rate (`dismissed / shown`), and the truth guardrail (`signup_user_identified / shown`). The true pre-fix intent rate was already higher than the logged 11.5%.
2. **The dismiss-rate guardrail can flip the verdict.** Conversion Prompt B calls **❌ Failed** if "dismiss rate clearly up" and requires dismiss **≤ +5pp** for ✅ Success. This fix makes `dismissed / shown` look clearly up as a pure artifact, risking a false ❌ Failed. The truth guardrail also rises, but that is harmless (it is a floor).

So do **not** compare post-fix rates against the pre-fix logged baseline. Recompute the baseline on a post-fix `conversion_prompt_shown` count, or compare post-fix to post-fix, before applying the Conversion Prompt B criteria. The fix changes the count, not when the prompt shows or any user behavior.

**Status:** 🔄 Implemented — shipping to prod 2026-06-01 (pending push approval). Commit: forthcoming. This is a tracking-correctness fix with no measure-after verdict of its own; its effect is folded into the Conversion Prompt B read (2026-06-15 first read, 2026-06-29 verdict), which must account for the prompt_shown drop.

**Prod verification:** fresh logged-out session on deepbreathingexercises.com, `resonance_conversion` cleared, `window.gtag` recorder installed, one auto-completed 1-min session. Assert `conversion_prompt_shown` appears exactly once (was twice), `signin_prompt_view` still fires, and the prompt still opens after ~1.5s.

---

### 2026-06-01: Conversion Prompt B (social proof + personal stats), 100% challenger

**Hypothesis:** The post-session signup leak is desire, not mechanics (~88% who see the prompt walk past; the form itself converts fine). Reframing the prompt around **social proof** ("people breathing right now" + avatars) and **endowment** (your own blurred week stats, revealed on signup), instead of the current "Save your progress" sheet, lifts prompt_shown → signup.

**Change:** Replace the control `SignInSheet` with `SocialStatsSignInSheet` in `SessionCompletePrompt` for all visitors (`SOCIAL_STATS_SHARE = 1`). One primary path (Continue with Google) with email magic-link fallback. Funnel events (`conversion_prompt_shown`, `conversion_prompt_dismissed`, `conversion_signup_completed`, `signup_user_identified`) carry a `variant` param; converted users get a `conversion_variant` GA4 user property, so the post-change period is cleanly segmentable. `SOCIAL_STATS_SHARE = 0` is the instant rollback.

**Measurement design:** 100% challenger, read **pre/post** against the baseline below (a concurrent 50/50 split is underpowered at current traffic, ~52 prompt impressions/wk). Primary metric is signup **intent**; `signup_user_identified` is the **truth** guardrail.

**Baseline (week of 2026-06-01, from FUNNEL-DASHBOARD.md):**
- conversion_prompt_shown: 52 / wk
- conversion_signup_completed: 6 = **11.5% of prompt-shown** (intent) ← primary
- signup_user_identified: 4 = ~7.7% of prompt-shown (truth) ← guardrail
- prior-period intent rate: 23.5% (high variance on small N)

**Pre-committed criteria** (set 2026-06-01, before ship; first read 2026-06-15, verdict 2026-06-29):
- ✅ **Success** if, over the window, prompt_shown → conversion_signup_completed is **≥ 16%** (from 11.5%, ≈ +4.5pp / +40% rel), AND signup_user_identified / prompt_shown does not regress below ~7%, AND conversion_prompt_dismissed rate is not materially higher (≤ +5pp).
- ❌ **Failed** if signup_completed rate ≤ 11.5% (no lift) OR dismiss rate clearly up.
- 🟡 **Mixed/Inconclusive** if intent rises but truth (signup_user_identified) stays flat or falls, OR if fewer than ~150 prompt impressions accrue by the verdict date (underpowered → extend, do not call it).

**Power caveat:** pre/post at ~52 impressions/wk only reliably detects large effects. A null result is "inconclusive at this N," not proof of no effect. Watch the dashboard's other lines for confounding co-movement (seasonality, concurrent changes).

**Known caveats:** social proof (live count + avatars) is **simulated** for launch (founder-approved); `dayStreak` is also simulated and unblurs to a non-real number on the email path; only `yourMinutes` is real (stats gated on > 0). See [docs/design/conversion-prompt-B-rollout.md](design/conversion-prompt-B-rollout.md). Make the live count and streak real before leaning on the endowment mechanic.

**Status:** 🔄 Implemented — shipped to prod 2026-06-01. measure-after: 2026-06-15 (first read), 2026-06-29 (verdict).

---

### 2026-05-12: Direct +47% WoW — hypothesis: organic shares from PT/DE translations

**Hypothesis:** Last 7d (May 5–11) showed Active users 325 (+31.0% WoW) and New users 295 (+32.3%). Channel breakdown of new users:
- (direct) / (none): 115 (+47.4%, +37 users) — biggest single contributor
- google / organic: 72 (+30.9%, +17)
- bing / organic: 48 (+26.3%, +10)
- duckduckgo / organic: 18 (+50%, +6); ecosia / organic: 6 (+100%, +3)
- chatgpt.com (referral + not set, combined): 15 (−32%, −7)

Country lift was concentrated in translated/EU markets: Portugal +1,000%, Germany +275%, Poland +243%, UK +93%. No manual outbound sharing was done in the window (confirmed with founder). F5Bot wasn't tracking the relevant keywords, but a manual Reddit search found no posts.

**Best hypothesis:** The Direct surge is organic word-of-mouth — users finding the site via search and re-sharing the URL via mobile messengers (WhatsApp, iMessage, in-app browsers) which strip referrers and land as Direct. PT/DE country distribution matches: those locales' translations (deployed Mar–Apr 2026, indexed via Bing + GSC May 5) are now generating shareable, in-language content. Direct's engagement actually *improved* (engaged-sessions/user 0.46 → 0.67, +45%), so this isn't bot traffic.

**Alternative hypotheses (less likely):**
- iOS Safari ITP increased referrer stripping — but no platform-wide change in the window.
- A specific link shared in a closed channel (Slack/Discord group) — possible but unobservable.
- Returning users mis-attributed as new — unlikely; new-user count rose more than returning-user count (+32% vs +19%).

**Pre-committed read criteria (2026-05-22, verdict 2026-06-05):**
- ✅ Confirmed if: in the next 7d window with UTM-tagged shares live (see [the 2026-05-12 UTM tagging entry below](#2026-05-12-utm-tag-share-buttons-attribute-outbound-shares-back-to-ga4)), `utm_source=share` appears in GA4 with ≥10 new users AND Direct remains elevated (>100 new users / 7d).
- ❌ Rejected if: `utm_source=share` shows <3 new users in 14d AND Direct falls back to <80 new users / 7d (i.e. the surge was a one-week anomaly, not a sustained share-driven channel).
- 🟡 Mixed if: `utm_source=share` shows traffic but Direct stays elevated independently (i.e. only a fraction of the share traffic was passing through our buttons).

**Status:** 🟡 Inconclusive — can't attribute Direct surge without instrumentation. UTM-tagging change (below) is the instrumentation; this entry will get a verdict on 2026-06-05.

---

### 2026-05-12: UTM-tag share buttons (attribute outbound shares back to GA4)

**Hypothesis:** Direct is currently the largest channel for new-user growth (115 of 295 new users last 7d, +47% WoW), but we have no visibility into how much of that is shares from our own share buttons vs untagged third-party shares vs pure brand-typed traffic. Tagging the URLs that flow through `ShareButton`, `HolidayShareButton`, and the `for/share-button.tsx` variant with `utm_source=share&utm_medium=<native|copy>&utm_campaign=user_share` will turn anonymous Direct traffic into a measurable channel — at least for users who share via the in-product UI.

This won't capture pure copy-paste from the browser URL bar (out of our control) or shares of pages that don't have a share button, but it will give a lower-bound signal: "≥X new users came from the share button itself."

**Baseline (May 5–11, 2026):**
- Direct new users: 115 / 7d (+47.4% WoW)
- `utm_source` parameters observed in GA4: 0 (no shares are tagged today)
- Pages with a share button: all `/breathe/*` patterns (via `pattern-page.tsx`), all `/for/*` use cases (via `use-case-page.tsx`), `/holiday-breathing-exercises`, and the 1/2/5-minute timer pages.

**Change:**
- New helper: [src/lib/share-utm.ts](../src/lib/share-utm.ts) — `appendShareUtm(url, medium)` returns the input URL with `utm_source=share`, `utm_medium=<native|copy>`, `utm_campaign=user_share` appended (idempotent — re-tagging overwrites instead of appending).
- Wired into all three share-button implementations:
  - [src/components/ui/share-button.tsx](../src/components/ui/share-button.tsx) — the main popover variant. Tags the URL passed to `navigator.share`, the auto-copied URL, the manual "Copy" button, and the URL displayed in the popover's input field so the user sees what they're actually copying.
  - [src/app/holiday-breathing-exercises/share-button.tsx](../src/app/holiday-breathing-exercises/share-button.tsx)
  - [src/app/for/share-button.tsx](../src/app/for/share-button.tsx)
- The iframe embed snippet (in the main ShareButton popover) is intentionally **not** tagged — embeds live on third-party pages and we already get attribution via the referrer header.
- Test: [scripts/tests/share-utm.test.mjs](../scripts/tests/share-utm.test.mjs) — verifies the helper exists, sets the three UTM params, is idempotent, and that all three share-button files import and call it.

**Pre-committed success criteria (read 2026-05-22, verdict 2026-06-05):**
- ✅ Success if: by 2026-06-05, GA4 shows ≥10 new users with `session_source = share` (or `utm_source=share` in event params) in the prior 14d. AND `utm_medium=native` vs `utm_medium=copy` are both non-zero (means both paths are firing).
- ❌ Failed if: by 2026-06-05, zero `utm_source=share` traffic in GA4 despite >50 share button impressions in the same window (means the params aren't surviving the share flow — likely because messenger apps are stripping query strings).
- ⚪ Inconclusive if: <5 share-button clicks in the window (no signal either way).

**Risk to watch:** Some messengers (Slack, iMessage, WhatsApp) preserve query strings; others (older Facebook, some email clients) strip them. If `utm_source=share` shows up at much lower volume than expected, the medium-stripping hypothesis is the first thing to check, not the share button itself being unused.

---

### 2026-05-11: Mobile homepage: pills mode picker + full-screen orb + restore hero text

**Hypothesis:** Three coupled mobile homepage problems compound to suppress engagement:
1. The "Pick a mode" section was a horizontal-scroll carousel of large cards. Users couldn't see what modes existed without swiping, so mode discovery was poor and the picker felt buried. `mode_switch` only fired 2× in the 7d to 2026-05-07 (1.7% of starts).
2. The orb wasn't full-screen on mobile — a cream-colored hero block sat above it in document flow, and the page background showed below the orb. When a user pressed play, the immersive effect was broken by visible page chrome (content cards visible below the fold).
3. The label ("FREE BREATHING VISUALIZER") and subtitle ("Visual pacing that helps your body downshift…") were `hidden sm:block` — mobile users got the H2 + buttons only, no context, no value-prop. The Apr 27 "Mobile Hero Above the Fold" change moved the hero up but didn't restore the supporting copy.

Restoring intent: small pills make modes visible at a glance (5 visible + "All techniques" pill), the orb fills `min-h-screen` and hero text is absolutely positioned at the bottom so when running it fades to invisible and the orb takes over the full viewport, and the label/subtitle are visible on mobile again. Expect: more mode exploration, lower mid-session abandon (the immersive payoff is what keeps users in the orb), and slightly higher start rate from better context above the fold.

**Baseline (7d May 1–7, 2026, GA4 from FUNNEL-DASHBOARD.md):**
- `breathing_session_start`: 119 users
- start → pause: 47.9% (57 users)
- start → complete: 21.0% (25 users)
- `mode_switch`: 2 (1.7% of starts) — mode picker barely engaged with
- `conversion_prompt_shown` → signup: 11.5%
- Mobile abandonment last reading (May 5 GA4 28d): 74.3% (from Apr 27 hero experiment)
- Mobile vs desktop split not pulled in the 2026-05-08 refresh — next refresh on 2026-05-15 should pick this up before the measure-after window.

**Change:**
- Commit: [a900369](https://github.com/Darkmatter-AI/deepbreathing/commit/a900369)
- Files: `src/app/page.tsx`, `src/components/breathe/fading-hero-title.tsx`, `src/components/breathing-visualizer.tsx`, `src/components/resonance/Resonance.tsx`
- Mode picker: mobile shows `flex-wrap` pills (per-mode color border, ~36px tall) instead of `snap-x` carousel of cards; desktop unchanged (2-col card grid).
- Hero layout: outer section is `min-h-screen`; BreathingVisualizer stretches via `flex-1` so Resonance fills the full viewport; mobile hero text is `absolute bottom-0 pb-20` so it overlays the bottom of the orb section and fades to `opacity-0` when running (FadingHeroTitle and HomeHeroActions both listen to `resonance:run-state`).
- Resonance gained a `noMobileBottomPad` prop that swaps mobile `pb-44` for `pb-24`, so the duration chips clear the absolute hero text below without overlap.
- FadingHeroTitle: removed `hidden sm:block` from label and subtitle so they render on mobile.

**Pre-committed success criteria (read 2026-05-22, verdict 2026-06-05):**
- ✅ Success if **any 2 of these 3 move** by 2026-06-05 vs the 2026-05-01–07 baseline:
  - `mode_switch` event rate ≥4% of starts (currently 1.7%) — direct mode picker engagement.
  - Mobile `start → complete` rate up ≥5 pp (mobile-only when split is pulled; if mobile split missing, fall back to overall start → complete ≥26% vs 21.0% baseline). Hypothesis: full-screen orb keeps users engaged through the whole session.
  - Mobile `breathing_session_start` per `page_viewed_breathing` up ≥3 pp. Hypothesis: visible label + subtitle adds enough context to convert a hover into a start.
- ❌ Failed if `mode_switch` stays ≤2% AND `start → complete` stays ≤22% AND start rate doesn't move. (No movement on any leading indicator = the redesign isn't paying for itself.)
- ⚪ Inconclusive if traffic in the measurement window is <80 starts (cohort too small for the 5 pp swing to be detectable).

**Risk to watch:** the `noMobileBottomPad` prop changed Resonance's mobile main padding from `pb-44` to `pb-24` for the homepage path. The original `pb-44` was reserving space for the fixed `bottom-6` sound-hint banner. If a user lands on the homepage, hits play with sound muted, and the banner appears, it may now overlap with the duration chips area. Worth a real-device test on iPhone Safari. Also: the absolute-positioned hero on mobile means hero text and the orb's particle field overlap visually — this is intentional (transparent over particles) but watch GSC/PSI for any CLS regression on mobile.

---

### 2026-05-08: Unify session-end events + commit-on-pause

**Hypothesis:** Three near-identical events (`breathing_session_pause`, `breathing_session_complete`, `breathing_session_stop`) made GA4 noisy and were structurally incoherent. There's no Stop button in the UI, so `breathing_session_stop` only fired from the AI mode-switch path (rare). Worse: pause never called `commitSession`, so a user who tapped to pause and walked away — the modal mobile flow — got 0 minutes and 0 session credit. That's why `sessions_completed = 0` even for engaged users like Eugene (168 min): minutes came from the pre-fix per-tick double-count, not from real session-end commits.

Collapsing to a single `breathing_session_end` event with a `reason` parameter (`paused` | `completed` | `mode_switched`), and crediting time on every commit (including pause), should give a complete and de-duplicated picture of session length and count.

**Baseline (May 8, 2026, from 7d GA4 + Neon DB):**
- 7d events fired: `breathing_session_pause` 57 users, `breathing_session_complete` 25 users, `breathing_session_stop` 0 users (UI never reachable)
- DB `sessions_completed > 0`: 0 of 17 successful signups (structural bug — see prior experiment)
- Pause-and-walk-away credits 0 minutes today; only auto-complete (timer hit) and AI mode-switch credit anything

**Change:**
- File: [src/components/resonance/Resonance.tsx](../src/components/resonance/Resonance.tsx)
- Commit: forthcoming
- Single `endSession(reason, seconds, hard)` callback replaces `commitSession` + the three trackEvent sites.
- New session-level state: `sessionId` (UUID, set on true start) and `sessionCommittedSeconds` (per-session running total already credited).
- Pause = soft end: commits the new delta (so pause-and-leave still credits time), keeps `sessionId` + `sessionSeconds` so resume continues. The next pause/complete only credits the new delta — the row only ever grows for that session.
- Complete + AI mode-switch = hard end: commit final delta, reset `sessionSeconds` + `sessionId`.
- `sessions_completed` increments exactly once per `sessionId`, on the first commit. Subsequent pause→resume→pause cycles update minutes but not the session count.
- Resume (toggle play while `sessionSeconds > 0`) does NOT emit a fresh `breathing_session_start` and does NOT regenerate the id.

**Pre-committed success criteria (read 2026-05-22, verdict 2026-06-05):**
- ✅ Success if: by 2026-06-05, ≥80% of new (post-2026-05-08) signups with `total_minutes > 0` also have `sessions_completed > 0`. AND `breathing_session_end` (any reason) fires for ≥90% of `breathing_session_start` events in 14d (vs ~63% pause+complete coverage today).
- ❌ Failed if: `sessions_completed > 0` rate stays below 50% for new engaged users, OR end-event coverage stays below 75% of starts.
- ⚪ Inconclusive if: fewer than 5 new engaged users in the measurement window.

**Risk to watch:** the soft-end-on-pause means a user who paces — pause / resume / pause / resume — emits multiple `breathing_session_end` events for the same session. GA4 funnel reports may need to count distinct `sessionId` (param) not distinct events. Tracked in UX-BACKLOG #20 (custom dimension).

---

### 2026-05-05: Engaged-Minutes Tracking — Fix Double-Counting + Stop-Event Sync

**Hypothesis:** `total_minutes` was being incremented twice per minute (once by the per-second interval, once by the `commitSession` block at end-of-session). On top of that, the auto-complete branch (when a duration timer fires) and the manual-stop branch had divergent commit logic, so users who stopped early sometimes had their minutes synced and sometimes didn't. Net effect: the `total_minutes` we read out of the DB was unreliable — Eugene's 168 min could be 84 actual minutes (double count) or 168 actual (no double count) and we couldn't tell which. Hypothesis: collapse both paths into a single `commitSession` callback that runs once on stop OR auto-complete, and remove the per-second mutation.

**Baseline (May 5, 2026, from Neon DB query):**
- Top engaged user (eugene): 168 min total — actual value uncertain due to double-counting
- 4 of 16 users had non-zero `total_minutes` (Eugene, Megan, Matt, Bruna)
- `sessions_completed = 0` for ALL users (including Eugene with 168 min) — structural bug

**Change:**
- File: [src/components/resonance/Resonance.tsx](../src/components/resonance/Resonance.tsx)
- Commit: [35e7f0a](https://github.com/abiassi/deepbreathing/commit/35e7f0a)
- Removed per-minute `setTotalMinutes` mutation from the 1s interval
- Extracted `commitSession(seconds)` useCallback shared by `handleStop` and the auto-complete effect
- `commitSession` now also resets `setSessionSeconds(0)` to prevent the auto-complete effect re-firing on a new session

**Pre-committed success criteria:**
- ✅ Success if: by 2026-06-02, the average `total_minutes` per engaged user is 30–60% lower than current (because we were double-counting). AND new signups in the last 14 days have non-zero `sessions_completed > 0` whenever `total_minutes > 0` (currently broken).
- ❌ Failed if: `total_minutes` per engaged user is unchanged (means double-count wasn't real or fix didn't work) OR `sessions_completed` is still 0 across the board.
- ⚪ Inconclusive if: too few new engaged users in the measurement window to compare meaningfully (<3).

**Measure-after:** 2026-05-19 (read), 2026-06-02 (verdict).

---

### 2026-05-05: GA4 User Identification (user_id + signed_up property)

**Hypothesis:** GA4 currently can't distinguish signed-up users from guests in its reports — every user looks like an anonymous `client_id`. By calling `gtag('set', 'user_id', user.id)` and `gtag('set', 'user_properties', { signed_up: true })` once `session.user` resolves in `AuthProvider`, GA4 will (a) stitch the same user across devices, (b) let us segment "signed-up vs guest" in funnel reports, and (c) attribute future behavior to the right cohort. Also fire a one-shot `signup_user_identified` marker the first time GA4 sees a given user_id in this browser.

**Baseline (May 5, 2026, last 28d):**
- `conversion_signup_completed`: 12 unique users
- Cross-device stitching: not happening (a signed-up user on phone+laptop counts as 2 users in GA4)
- Cohort comparison "signed-up vs guest": impossible
- Retention curves segmented by signed-up: impossible
- 17 actual users in DB; ~10 active in last 14d but not segmentable in GA4

**Change:**
- File: [src/components/auth/auth-provider.tsx](../src/components/auth/auth-provider.tsx)
- Commit: [eb3337e](https://github.com/abiassi/eb3337e)
- Sets `user_id` (better-auth UUID, non-PII) on session resolve
- Sets `user_properties: { signed_up: true }` on session resolve
- Clears `user_id` to null on logout
- Fires one-shot `signup_user_identified` event gated by per-user-id `localStorage` flag

**Pre-committed success criteria:**
- ✅ Success if: by 2026-05-19, GA4 reports show non-zero distinct users with `user_properties.signed_up = true` (means the property is firing) AND the `signup_user_identified` event count matches the count of users who logged in at least once in the last 14d.
- ❌ Failed if: `signed_up` user property never appears in GA4 (gtag call broken) OR shows in <50% of expected users.
- ⚪ Inconclusive if: GA4 user_property indexing latency hasn't completed by the measurement date (Google takes 24-48h).

**Caveats:**
- Existing 12 already-signed-up users won't get retroactively user_id'd. Only future signups + future logins by existing users.
- Requires GDPR-compliant non-PII id (UUID — confirmed safe).

**Measure-after:** 2026-05-19.

---

### 2026-05-05: Tap-to-Pause Hint Inside Orb

**Hypothesis:** Mobile abandonment is 74.3% (vs desktop 49.3%) and a chunk of those mobile users likely don't realize the orb is interactive — the play triangle disappears on session start with no replacement cue, and there's no hover state on touch devices. Adding a subtle `⏸ TAP TO PAUSE` hint inside the running overlay should give those users a visible affordance and reduce abandonment-without-pause.

**Baseline (May 5, 2026, last 28d, GA4):**
- Mobile users start: 140
- Mobile users pause: 36
- **Mobile abandonment (no pause, no complete): 74.3%**
- Desktop abandonment: 49.3%
- Mobile complete: 8 / 140 = 5.7%

**Change:**
- File: [src/components/resonance/components/Visualizer.tsx](../src/components/resonance/components/Visualizer.tsx)
- Commit: [42f1fc3](https://github.com/abiassi/deepbreathing/commit/42f1fc3)
- 14px Pause icon + "TAP TO PAUSE" text, white at 60% opacity, brightens to 95% on `group-hover`
- Positioned below the phase text inside the running overlay
- No JS state (CSS-only), no a11y regression (orb button still has aria-label)

**Pre-committed success criteria:**
- ✅ Success if: by 2026-05-19, mobile abandonment drops to ≤66% (-8 percentage points or more — half-way to desktop level). Equivalent to roughly +12 mobile pauses per 28d at current volume.
- ❌ Failed if: mobile abandonment doesn't move (within ±2pp) by 2026-05-19. Suggests the issue isn't visibility of the pause control.
- 🟡 Mixed if: mobile pause rate moves but mobile complete rate doesn't (we got pauses but they still bail).
- ⚪ Inconclusive if: mobile-traffic volume in the measurement window is <100 users (not enough signal).

**Risks to watch:** The hint is a small visual addition during a meditative session; it might feel intrusive. If user complaints arrive, consider fade-out after 5 seconds or first-session-only.

**Measure-after:** 2026-05-19.

---

### 2026-04-27: Duration Chips Below Orb

**Hypothesis:** `breathing_session_complete` only fires when a duration timer is set and reaches 0. Per the April 27 audit, 95%+ of users started without a timer (the picker was buried in Settings), so the completion event almost never fired and the funnel showed an artificially low `start → complete` rate of 3.8%. Adding visible `30s / 1 min / 3 min / 5 min / 10 min` chip buttons next to the orb should massively boost the *measurable* completion rate, even if actual user behavior is unchanged.

**Baseline (Apr 27, 2026, GA4 30d, Mar–Apr 2026):**
- `breathing_session_start`: 338 users
- `breathing_session_complete`: 13 users (3.8%)

**Change:**
- Commit: [280620c](https://github.com/abiassi/deepbreathing/commit/280620c)
- Adds chip-style duration buttons in the Resonance component
- Tappable on mobile, no Settings drawer required

**Result (May 5, 2026, GA4 28d, Apr 7 – May 4):**
- `breathing_session_start`: 361 users (+6.8%)
- `breathing_session_complete`: 22 users (6.1%, +69% relative)
- Conversion: **3.8% → 6.1%, +2.3 percentage points absolute**

**Verdict:** ✅ Success on visible-completion metric, but the effect is partly measurement (chips made the timer easier to set, which made the event fire). Real user-behavior change is smaller than the +69% suggests. Engaged-minutes tracking (separate experiment, 2026-05-05) will give a clearer picture of actual session-length change.

**Status:** ✅ Success (visible-completion metric only).

---

### 2026-04-27: Mobile Hero Above the Fold

**Hypothesis:** Mobile users were landing on the homepage and seeing only the orb — the H1, description, and CTAs were rendered below the visualizer section, requiring a scroll past the orb to find any context. This was hypothesized to contribute to the 76% mobile abandonment.

**Baseline (Apr 27, 2026):**
- Mobile abandonment (start without pause): 76%
- Desktop abandonment: 53%

**Change:**
- Commit: [c308f68](https://github.com/abiassi/deepbreathing/commit/c308f68)
- Hero header (H1, description, CTAs) moved above the visualizer section on mobile
- Orb shrunk from 320px to 256px on mobile
- `min-h-screen` removed on mobile, kept on `lg+`

**Result (May 5, 2026, GA4 28d):**
- Mobile abandonment: **74.3% (−1.7 pp)**
- Desktop abandonment: 49.3% (−3.7 pp, control group)

**Verdict:** Modest move on mobile. Desktop dropped more than mobile, suggesting the hero placement wasn't the dominant factor (since desktop wasn't supposed to change). Could be co-correlated with the duration-chips ship (same day), Vercel cache warmup, or other concurrent traffic shifts. Status: 🟡 Mixed — bigger leverage probably comes from the pause-cue change.

**Status:** 🟡 Mixed.

---

### 2026-04-27: page_viewed_breathing Event + sessions_completed Sync Fix

**Hypothesis (event):** Funnel had no upstream signal from `breathing_session_start` — we couldn't tell what fraction of breathing-page visitors actually started a session. Adding a `page_viewed_breathing` event firing on Resonance mount would give us a top-of-funnel reference.

**Hypothesis (sync fix):** `sessions_completed` was always being written to the DB as 0, regardless of actual completions, due to a stale closure in the sync call.

**Baseline (Apr 27, 2026):**
- No `page_viewed_breathing` event existed
- `user_stats.sessions_completed = 0` for all users including engaged ones

**Change:**
- Commit: [81a35cf](https://github.com/abiassi/deepbreathing/commit/81a35cf)
- Adds `page_viewed_breathing` event on Resonance mount with mode label
- Tracks sessionsCompleted in component state and passes it to syncStats (was always 0)
- Handles both stop-early and auto-complete paths

**Result (May 5, 2026, GA4 28d):**
- `page_viewed_breathing`: 232 users (only 6-7 days of data because deployment was Apr 28-29)
- `sessions_completed` in DB: STILL 0 for all 17 users including new ones

**Verdict (event):** ✅ Success — top of funnel signal now exists. Will normalize over the next 28d window.

**Verdict (sync fix):** ❌ Partial / didn't fix the user-visible problem. The DB still shows `sessions_completed = 0` everywhere. The 2026-05-05 commit ([35e7f0a](https://github.com/abiassi/deepbreathing/commit/35e7f0a)) — which extracted `commitSession` — is the actual structural fix. This experiment is superseded.

**Status:** 🟡 Mixed (event ✅, sync fix superseded by 35e7f0a).
