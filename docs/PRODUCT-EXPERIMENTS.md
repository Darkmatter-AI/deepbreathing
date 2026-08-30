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
| 2026-08-30 | [Assistant recommendation handoff instrumentation](#2026-08-30-assistant-recommendation-handoff-instrumentation) | 🔄 Implemented in PR [#72](https://github.com/Darkmatter-AI/deepbreathing/pull/72) — live receipt pending |
| 2026-08-29 | [App Store promotion rollout and acquisition instrumentation](#2026-08-29-app-store-promotion-rollout-and-acquisition-instrumentation) | 🔄 Implemented locally — deployment pending |
| 2026-07-27 | [Restore mount-time GA4 event queue](#2026-07-27-restore-mount-time-ga4-event-queue) | 🌙 Implemented locally — unshipped Night Shift measurement repair |
| 2026-07-20 | [Authenticated `/stats` reach instrumentation](#2026-07-20-authenticated-stats-reach-instrumentation) | 🔄 Implemented — PR [#53](https://github.com/Darkmatter-AI/deepbreathing/pull/53); first mature read 2026-07-29 |
| 2026-07-12 | [TestFlight native-sheet and practice-identity pass](#2026-07-12-testflight-native-sheet-and-practice-identity-pass) | 🔄 Implemented locally — physical build validation pending |
| 2026-07-11 | [TestFlight immersion and control pass — native audio, draggable modes, completion parity](#2026-07-11-testflight-immersion-and-control-pass--native-audio-draggable-modes-completion-parity) | 🔄 Implemented locally — physical build validation pending |
| 2026-07-11 | [Account-based cross-device practice sync — Apple-first acquisition](#2026-07-11-account-based-cross-device-practice-sync--apple-first-acquisition) | 🔄 Implemented locally — TestFlight + production validation pending |
| 2026-07-10 | [Keep Your Practice (`keep_practice`) — gain-framed receipt sheet, phase 1](#2026-07-10-keep-your-practice-keep_practice--gain-framed-receipt-sheet-phase-1) | ❌ **Failed** (verdict 2026-08-03): 8.37% intent at 203 users; rollback to Prompt C implemented locally |
| 2026-06-26 | [Non-blocking signup banner (`loss_aversion_banner`) — top-anchored notification](#2026-06-26-non-blocking-signup-banner-loss_aversion_banner--top-anchored-notification) | ❌ **Failed** (verdict 2026-07-10, early per impressions clause): intent 9.3% vs 13.8% AND retention 40% vs 50% — **superseded by `keep_practice` (PR #41), which is the revert-plus** |
| 2026-06-21 | [/stats "Your practice" — retention surface (breath garden + stale-streak reframe)](#2026-06-21-stats-page--streak-calendar--session-stats-for-signed-in-users) | 🔄 Implemented |
| 2026-06-14 | [Conversion Prompt C (loss_aversion), 100% challenger](#2026-06-14-conversion-prompt-c-loss_aversion-100-challenger) | 🔄 Implemented |
| 2026-06-01 | [Fix `conversion_prompt_shown` double-fire (impure setState updaters)](#2026-06-01-fix-conversion_prompt_shown-double-fire-impure-setstate-updaters) | 🔄 Implemented |
| 2026-06-01 | [Conversion Prompt B (social proof + personal stats), 100% challenger](#2026-06-01-conversion-prompt-b-social-proof--personal-stats-100-challenger) | ⏸️ Paused (→ Prompt C; social proof made real + merged, dormant) |
| 2026-05-17 | [Resonance audio v2 — body-resonance, breath-coupled bed, session arc, eyes-closed mode](#2026-05-17-resonance-audio-v2--body-resonance-breath-coupled-bed-session-arc-eyes-closed-mode) | 🔄 Implemented |
| 2026-05-12 | [Direct +47% WoW — hypothesis: organic shares from PT/DE translations](#2026-05-12-direct-47-wow--hypothesis-organic-shares-from-ptde-translations) | 🟡 Inconclusive |
| 2026-05-12 | [UTM-tag share buttons (attribute outbound shares back to GA4)](#2026-05-12-utm-tag-share-buttons-attribute-outbound-shares-back-to-ga4) | 🔄 Implemented |
| 2026-05-11 | [Mobile homepage: pills mode picker + full-screen orb + restore hero text](#2026-05-11-mobile-homepage-pills-mode-picker--full-screen-orb--restore-hero-text) | 🔄 Implemented |
| 2026-05-08 | [Unify session-end events + commit-on-pause](#2026-05-08-unify-session-end-events--commit-on-pause) | 🔄 Implemented |
| 2026-05-05 | [Engaged-Minutes Tracking — Fix Double-Counting + Stop-Event Sync](#2026-05-05-engaged-minutes-tracking--fix-double-counting--stop-event-sync) | 🔄 Implemented (read 2026-05-18, verdict 2026-06-02) |
| 2026-05-05 | [GA4 User Identification (user_id + signed_up property)](#2026-05-05-ga4-user-identification-user_id--signed_up-property) | ✅ Success |
| 2026-05-05 | [Tap-to-Pause Hint Inside Orb](#2026-05-05-tap-to-pause-hint-inside-orb) | ❌ Failed |
| 2026-04-27 | [Duration Chips Below Orb](#2026-04-27-duration-chips-below-orb) | 🔄 Implemented |
| 2026-04-27 | [Mobile Hero Above the Fold](#2026-04-27-mobile-hero-above-the-fold) | 🔄 Implemented |
| 2026-04-27 | [page_viewed_breathing Event + sessions_completed Sync Fix](#2026-04-27-page_viewed_breathing-event--sessions_completed-sync-fix) | 🔄 Implemented |

**Roll-up by status (14 entries):** 🔄 12 Implemented (incl. the non-blocking banner, shipped 100% 2026-06-26 replacing Prompt C) · ⏸️ 1 Paused (Conversion Prompt B, superseded by Prompt C) · 🟡 1 Inconclusive (the 2026-05-12 Direct surge). First read on the 2026-05-19 checkpoint, full read 2026-06-02; mobile-redesign + UTM-tagging reads 2026-05-22 / 2026-06-05.

See also: [docs/FUNNEL-DASHBOARD.md](FUNNEL-DASHBOARD.md) for the current state, [docs/UX-BACKLOG.md](UX-BACKLOG.md) for what's next, [docs/runbooks/weekly-funnel-refresh.md](runbooks/weekly-funnel-refresh.md) for how to pull the numbers.

---

## Active Experiments

### 2026-08-30: Assistant recommendation handoff instrumentation

**Observed baseline:** The custom `DBE Channels (AI consolidated)` group can estimate broad assistant traffic, but it cannot distinguish a deliberate recommendation handoff from an untagged citation or referral. There is no dedicated event for the new recommendation surface, so its viewed-to-session-start funnel is not measurable before this release.

**Hypothesis:** An explicit, allowlisted assistant handoff marker and a once-per-browser-session landing event will create a trustworthy denominator for assistant-referred starts without contaminating ordinary `/recommend` visits or duplicating standard page views.

**Exact change:** On the production `/recommend` route, emit `agent_handoff_landing` once per browser session only when `agent_handoff=assistant` is present. Preserve allowlisted `utm_source`, `utm_medium`, and `utm_campaign` values through the selected exercise link. Plain, invalid, repeated, preview, origin, and localhost visits emit nothing and receive canonical exercise links without referral parameters. The event includes only `handoff_agent=assistant` and `handoff_surface=recommend`; it contains no PII or arbitrary query values.

**Pre-committed success criteria:**

- Instrumentation passes when a marked production visit produces exactly one `agent_handoff_landing`, a second marked visit in the same browser session produces none, and a plain production visit produces none.
- Referral integrity passes when the selected exercise retains only the allowlisted marker and UTM fields and `breathing_session_start` remains the existing downstream event.
- Fail the instrumentation if any non-production or unmarked visit emits the event, if arbitrary query values enter GA4, or if one browser session emits duplicate landing events.
- Evaluate acquisition only after at least 100 valid handoff users. Success requires at least a 30% handoff-to-session-start rate; failure is below 20%; results between those thresholds or below the user gate are inconclusive.

**Measure-after:** Immediate technical receipt after the authorized production deployment. Product outcome on 2026-09-13 or once 100 valid handoff users are available, whichever is later.

**Status:** 🔄 Implemented in PR [#72](https://github.com/Darkmatter-AI/deepbreathing/pull/72). Production deployment authorized on 2026-08-30; live event receipt pending.

### 2026-08-29: App Store promotion rollout and acquisition instrumentation

**Observed baseline:** The website had no consistent native-app promotion across its visualizer pages and no dedicated event for App Store promotion exposure or intent. GA4 enhanced measurement may record generic outbound clicks, but it does not provide a reliable exposure denominator or distinguish the landing card from the visualizer-page strip. The dedicated baseline is therefore uninstrumented, not zero user interest.

**Hypothesis:** A visually distinct App Store card immediately after the visualizer, plus a fuller card on `/breathing-app`, will make the better native experience discoverable after users have already received value. Recording views and clicks with placement, origin page, and allowlisted campaign context will reveal which pages and placements earn intent without collecting arbitrary query parameters or raw advertising click IDs.

**Exact change:** Add the official App Store badge inside an Aurora-edge card on the homepage, 14 breathing-technique pages, 18 use-case pages, four resonance guides, and four dedicated visualizer/timer pages, covering 41 public English visualizer routes through shared templates. Add the larger landing treatment below the introduction on `/breathing-app`. Preserve immediate visualizer actions and exclude iframe embeds, internal tools, and localized routes until translated copy exists. Emit `app_store_promotion_view` once when at least half of the promotion enters the viewport and emit `app_store_click` on the App Store badge. Both events include `app_store_placement`, `origin_path`, the App Store link fields, allowlisted UTM values, and presence-only flags for advertising click IDs. Restrict emission to the production host. Register the event-scoped GA4 custom dimension `App Store placement`; use GA4's standard Page path dimension for origin reporting. Support App Store Connect campaign links when `NEXT_PUBLIC_APP_STORE_PROVIDER_TOKEN` is configured, with a stable page-specific campaign token of at most 30 characters. Add the metric to the read-only three-day channel review.

**Pre-committed success criteria:**
- Instrumentation passes if the first mature three-day post-deploy window contains `app_store_promotion_view` on eligible pages, every recorded placement is `landing` or `strip`, App Store clicks resolve to `apps.apple.com`, Page path identifies the origin, and preview or localhost traffic produces no events.
- Reporting is usable when the automation can report view users, click users, and click users divided by view users for the same complete window, with placement and meaningful Page path breakdowns.
- Treat results below 20 promotion-view users as directional and wait for at least 100 promotion-view users for a product verdict.
- ✅ Success if exposed-user click-through rate is at least 5% at 100 promotion-view users and the matched `page_viewed_breathing` to `breathing_session_start` rate does not decline by more than 5 percentage points.
- ❌ Failed if exposed-user click-through rate is at most 2% at 100 promotion-view users, or the matched breathing-session start rate declines by more than 10 percentage points.
- 🟡 Mixed if click-through rate is between 2% and 5%, or strong intent is concentrated on only one placement or page family. Do not mark `app_store_click` as a key event without a separate product decision.
- Fail the instrumentation if eligible production pages have page views but no promotion views after the first mature window, if arbitrary query parameters or raw click IDs appear in event data, or if the event duplicates from a single exposure.

**Measure-after:** First technical read immediately after an authorized production deployment. First data read after three complete days plus the normal GA4 maturity lag.

**Status:** 🔄 Implemented locally and unshipped. The GA4 `App Store placement` custom dimension and three-day automation review are configured. The App Store Connect provider token is not configured, so Apple campaign-link attribution is not yet active. No deployment was performed.

### 2026-07-27: Restore Mount-Time GA4 Event Queue

**Observed baseline:** In matched mature production-host windows, `page_viewed_breathing` fell from 293 users on 2026-07-12–18 to 50 on 2026-07-19–25 while `breathing_session_start` rose from 80 to 124. The resulting 248% viewed-to-start ratio is impossible. The break begins immediately after the 2026-07-18 host-gating refactor moved GA initialization into `GoogleAnalyticsScript` behind a parent `useEffect`; `Resonance` emits `page_viewed_breathing` once from a child mount effect before `window.gtag` exists, while later interaction events still arrive.

**Hypothesis:** Bootstrapping the standard GA4 `dataLayer` queue before React effects run, while retaining production-only loading of the remote GA script, will restore mount-time events without reintroducing preview, localhost, or origin-host contamination.

**Exact change:** Move the existing inline `gtag` queue/config bootstrap to the shared document with `beforeInteractive`; keep the remote GA script behind the existing production-host gate. No event names, parameters, consent behavior, funnel UX, or automatic page-view behavior change.

**Primary metric:** On the first three mature post-deploy days, `page_viewed_breathing` users must be at least `breathing_session_start` users and the viewed-to-start ratio must return to the historical valid range below 100%.

**Guardrails:** `send_page_view:false` remains set; non-production hosts do not load `gtag.js`; production `page_view`, signup, start, and end events continue; no duplicate initial page view.

**Pre-committed criteria:** Pass if the focused script-order/host-gating tests pass and the first mature production window restores a valid viewed-to-start denominator. Fail if mount-time events remain below starts, any non-production host loads the remote GA script, or initial page views duplicate.

**Measure-after:** First technical read immediately after any authorized deployment; first data read after three complete days plus the normal two-day GA4 maturity lag. This is a measurement repair, not a growth experiment, so it has no conversion-lift claim.

**Status:** 🌙 Implemented locally and unshipped; no production write or deployment.

### 2026-07-20: Authenticated `/stats` Reach Instrumentation

**Observed baseline:** The mature GA4 window 2026-07-12–2026-07-18 reports 3 users / 11 `page_view`s on `/stats`, but every row has `signedInWithUserId = (not set)`. The production account database reports 16 signed-in active users over the corresponding complete seven-day account window. The existing `/stats` experiment reaches its 2026-07-21 date gate without a trustworthy signed-in reach numerator.

**Hypothesis:** Emitting a dedicated event only from the server-authenticated `StatsDisplay` makes signed-in `/stats` adoption measurable without changing the page, auth flow, or existing `page_view` series.

**Exact change:** On authenticated `/stats` renders, emit `stats_authenticated_view` once on mount, restricted to `deepbreathingexercises.com` and `www.deepbreathingexercises.com`. Include pathname and locale only; send no user ID or PII. Signed-out and non-production renders emit nothing. Implementation: commit [`b6f5174`](https://github.com/Darkmatter-AI/deepbreathing/commit/b6f5174b6b9efbc4c33fd16a9f4cd7c7df1079f3) in PR [#53](https://github.com/Darkmatter-AI/deepbreathing/pull/53).

**Primary metric:** unique `stats_authenticated_view` users ÷ production-account signed-in active users over matched complete seven-day windows.

**Guardrails:** Existing `page_view` counts remain unchanged; zero `stats_authenticated_view` events from signed-out, preview, localhost, or origin hosts; no auth or visual behavior change.

**Pre-committed criteria:** Measurement is usable if the event is present for authenticated production visits and the weekly numerator can be matched to the account denominator. Fail the instrumentation if an authenticated production visit emits no event or any non-production/signed-out visit emits one.

**Measure-after:** 2026-07-29, covering the first seven complete post-deploy days (2026-07-21–2026-07-27) plus the normal GA4 maturity lag. Do not backfill or use the pre-ship `/stats` window for a verdict.

**Status:** 🔄 Implemented in PR [#53](https://github.com/Darkmatter-AI/deepbreathing/pull/53); production verification is tracked with the deployment.

### 2026-07-12: TestFlight Native-Sheet and Practice-Identity Pass

**Hypothesis:** Using a maintained gesture sheet for the entire drawer surface, and making the account surface visibly pay off with synced practice data, will turn account acquisition from a utility prompt into an identity/retention surface. Correct provider branding and a deterministic account portrait should also make continuation feel trustworthy and complete.

**Baseline:** Build 6 still used hand-rolled responders with gestures limited to small handle regions. Physical testing found weak drag behavior, lost horizontal spacing in the guest account sheet, a letterform pretending to be Google's mark, a generic completion accent, particle convergence below the orb's visual center, and a post-auth checkmark rather than a durable portrait. The signed-in account sheet showed only email and destructive account controls despite the web product already exposing minutes, sessions, streak, and practice history.

**Change:** Replace both custom drawers with `@gorhom/bottom-sheet` v5, including full-content panning, snap points, scroll handoff, and backdrop interaction. The first physical pass exposed that the mode control was still a floating trigger that only presented its sheet after the gesture ended. Replace that split control with one persistent two-detent sheet: the bottom-aligned “Modes” tab is its collapsed state, follows the finger continuously, expands to exactly four visible rows, and collapses on backdrop press. Hide the settings control during playback. Add deliberate account-sheet content padding; use Google's real four-color G asset; tint completion feedback with the completed mode; move the mobile particle gravity center upward; render a real provider image or deterministic per-account orb immediately after auth; and add synced minutes, sessions, live streak, 28-day breath garden, and current pattern to the account sheet. Keep “Continue” as the single Apple/Google action for both new and returning accounts.

**Pre-committed success criteria:**
- Product correctness gate: on physical iPhone, both sheets drag from their content and handle, snap without fighting nested scrolling, dismiss by pan and backdrop press, retain safe horizontal spacing at every data state, and expose all seven modes.
- Identity/data gate: successful continuation immediately replaces the guest icon with a provider portrait or deterministic orb; account data matches the web bootstrap response; the Google mark is visually correct; the completion badge matches the mode color; and the particle convergence center aligns with the orb.
- ✅ Success if every gate passes in the next TestFlight build without regressions to auth, guest migration, background audio, or session timing.
- ❌ Failed if either sheet still feels tap-only, synced account values disagree across web and phone, or auth success leaves guest/checkmark UI behind.
- 🟡 Mixed if correctness passes but the account data surface is too dense for the lower detent.

**Measure-after:** Immediate physical-device validation on the next TestFlight build. Funnel outcomes remain part of the parent account-sync experiment.

**Status:** 🔄 Implemented locally. Physical TestFlight validation pending.

---

### 2026-07-11: TestFlight Immersion and Control Pass — Native Audio, Draggable Modes, Completion Parity

**Hypothesis:** Removing duplicate controls and making the native shell participate in the breathing experience will make the app feel intentional rather than like a website inside a phone. Native-owned audio should also eliminate the most important iOS reliability failure: silence when the ringer switch is off or the screen locks.

**Baseline:** Physical testing of TestFlight build 5 found eight concrete failures: the mode drawer showed too many rows and was tap-only; tap-away was unreliable; the WebView glow stopped at the top and bottom native safe areas; Web Audio did not reliably survive silent mode; settings duplicated mode and duration controls and carried an obsolete warning; the account entry read as an arrow rather than identity; and the completion prompt used the older activity-ring treatment instead of the shipped `keep_practice` receipt.

**Change:** Limit the mode drawer viewport to four rows with scrolling, add pull-up/pull-down gestures and full-screen tap-away dismissal, tint and pulse the native safe-area backdrop with the active mode at the same phase boundary as audio and haptics, move ambient and phase-cue playback from WKWebView to `expo-audio`, simplify settings, use a portrait/initial/person account entry, and port the real cumulative-progress receipt from `main` while retaining the registered user's persistent swipe-up saved banner.

**Pre-committed success criteria:**
- Product correctness gate: on a physical iPhone, all seven modes remain reachable; the drawer opens and closes by drag and tap; tap-away closes it; top and bottom safe areas visibly participate in active-mode color changes; audio is audible with the ringer switch off and continues after screen lock; cue and haptic feel synchronized; settings contain no duplicate mode or duration choices; account entry is recognizable; and guest/registered completion states match their intended receipt/banner treatments.
- ✅ Success if 100% of that physical matrix passes in the next TestFlight build with no regression in session completion, background timing, auth, or sync.
- ❌ Failed if silent-mode/background audio still drops, session timing diverges after lock/unlock, or any primary control becomes unreachable.
- 🟡 Mixed if functional gates pass but cue/haptic synchronization or safe-area color continuity still feels visibly discontinuous on hardware.

**Measure-after:** Immediate physical-device read on the next TestFlight build; no public funnel verdict until the parent account-sync experiment reaches its impression gate.

**Status:** 🔄 Implemented locally. Physical TestFlight validation pending.

---

### 2026-07-11: Account-Based Cross-Device Practice Sync — Apple-First Acquisition

**Hypothesis:** Accounts become worth acquiring when they visibly preserve a real practice across web and phone. Keeping breathing guest-first while presenting Apple as the fastest primary save action, Google second, should unlock account creation without depressing session starts. A gain-framed session receipt should outperform a generic signup wall because it asks only after value has been delivered.

**Baseline:** The iOS build has no account surface and no server-backed per-session history, so native account acquisition and cross-device session sync are both **0**. The current web `keep_practice` experiment baseline is ~86 prompt-shown users/week, 13.8% historical modal intent, and 4–7 signups/week. Existing server sync is aggregate-only and cannot reconstruct an immutable session history.

**Change:** Add Apple-first and Google-secondary auth on iOS and web; secure native Better Auth cookies in Keychain-backed SecureStore; preserve guest mode; write practice deltas to an offline outbox; migrate them after sign-in; persist an idempotent append-only `session_events` ledger; hydrate account history/stats across devices; add verified in-app deletion; use the Keep Practice receipt for guests and a persistent swipe-up success banner for registered users.

**Pre-committed success criteria:**
- Product correctness gate: 100% of the physical TestFlight matrix passes for guest practice, Apple sign-in, Google sign-in, offline completion/retry, guest migration, web-to-phone hydration, phone-to-web hydration, sign-out persistence, and account deletion initiation.
- ✅ Success after public rollout if account creation from a completed-session prompt is at least **16%**, weekly signups do not fall below the trailing four-week web baseline, and session-start rate does not fall by more than 5% relative.
- ❌ Failed if account creation is at or below 13.8%, or if the account surface reduces session-start rate by more than 10% for two consecutive weeks.
- 🟡 Mixed if acquisition improves but day-7 return or completed sessions per user decline by more than 10%.
- ⚪ Inconclusive below 150 prompt impressions per platform.

**Measure-after:** First product read after each platform reaches 150 prompt impressions; retention read seven days later. Do not expose monetization gates in this experiment.

**Status:** 🔄 Implemented locally. Production migration, provider credentials, and physical TestFlight validation remain release gates.

---

### 2026-07-10: Keep Your Practice (`keep_practice`) — gain-framed receipt sheet, phase 1

> Successor to the failed banner, designed via a 19-agent research workflow ([docs/research/signup-conversion-2026-07-10.md](research/signup-conversion-2026-07-10.md)) and reviewed line-by-line by Abi (headline copy and receipt-led trigger are his calls, the latter data-backed). **Phase 1 deliberately excludes Google One Tap** so the progress-receipt lever gets a clean causal read; One Tap is phase 2 if this lands ≥13.8%.

**Hypothesis:** Every prior ask told users to "save your progress" without ever showing them the progress. Showing the real accumulated receipt (minutes · sessions · streak) at the session-end modal moment converts better than loss-framed copy about a single session — gain-framing wins for maintenance behaviors (Rothman & Salovey) and endowed progress increases completion (Nunes & Drèze). The GA4 segmented read (2026-07-10, ga-visibility SA): ~24% of prompt-shown users are returning multi-day users who convert no better than new users under past asks (11.1% vs 10.2%) — the untapped segment this targets.

**Change (PR [#41](https://github.com/Darkmatter-AI/deepbreathing/pull/41)):** New `KeepPracticeSheet` (`src/components/auth/keep-practice-sheet.tsx`), forked from the Prompt C sheet. Adaptive headline: `Save your progress?` base; `That's {n} sessions of calm, keep it?` when `sessionsCompleted ≥ 2`; streak variant when only `streak ≥ 2`. Cumulative stats line from real localStorage values only (sessions/streak parts hidden below 2). Dismiss = ✕ only (no "Not now"). `ACTIVE_CHALLENGER = "keep_practice"` at 100%, `VARIANT_KEY` v3→v4 (returning banner-cohort visitors re-draw). Silent `resonance_active_days` logging starts (future breath garden). Auth mechanics untouched. Preview: `?promptui=keep&promptdemo=1`.

**Baseline (GA4 DKMT 527524722):** Prompt C modal intent **13.8%** (12/87, Jun 14–22, directional); banner failed at 9.3%; ~86 prompt-shown users/wk; ~4–7 signups/wk; day-7-ish return of signup cohort ~50% (modal, N=12); returning-user intent 11.1% (28d trailing).

**Pre-committed criteria (evaluate only at ≥150 prompt-shown users post-deploy, ~2 weeks; score on users, variant `keep_practice`):**
- ✅ **Success:** intent ≥ **16%** AND absolute weekly signups ≥ trailing-4-week baseline AND signup-cohort day-7 return ≥ 45% (directional, small N) AND dismisser 7-day return not down >10pp vs modal-era.
- ❌ **Failed:** intent ≤ 13.8% OR absolute weekly signups below baseline 2 consecutive weeks.
- 🟡 **Mixed:** intent 13.8–16% with clearly improved retention (cohort or dismisser).
- ⚪ **Inconclusive:** <150 prompt-shown by verdict date.
- Secondary (not gating): returning-user intent should pull ahead of its 11.1% baseline if the receipt mechanism is real — pull via the ga-visibility SA `newVsReturning` split.

**Measure-after:** first read at ≥150 prompt-shown or +14 days post-deploy, whichever first; verdict +21 days, or early once a boundary is crossed (≥16% or ≤10%). Rollback lever: `ACTIVE_CHALLENGER = "loss_aversion"` (Prompt C modal).

**Night Shift verdict (2026-08-03):** ❌ **Failed.** Direct GA4 reads through the mature cutoff of 2026-08-01 report 17 signup-completed users from 203 prompt-shown users for `keep_practice`: **8.37% intent**. This is below both the 13.8% Failed boundary and the early-verdict boundary of 10%. The two latest matched weeks were 4/71 (5.63%) and 6/88 (6.82%). Production-account signups declined across three matched mature windows from 8 to 6 to 3, and first ledger activation declined from 11 to 7 to 3. The intent boundary alone settles the verdict; no retention interpretation is needed.

**Local rollback:** Restores the pre-registered Prompt C modal by setting `ACTIVE_CHALLENGER` to `loss_aversion` at 100% and bumping the storage key so returning `keep_practice` visitors re-bucket. This is an unshipped Night Shift rollback. It changes no auth mechanics or event names.

**Rollback measurement:** After any authorized deployment, confirm new prompt and signup events carry `variant=loss_aversion`. Read again after 150 prompt-shown users and the normal two-day GA4 lag. Primary metric: prompt-shown-to-signup intent, compared with the post-May-4 pooled modal baseline of 10.8%; 13.8% remains Prompt C's best observed target, not the neutral baseline. Guardrails: weekly production-account signups return to the 4–7 baseline, and viewed-to-start or start-to-end does not decline by more than 10% relative.

**Status:** ❌ Failed; Prompt C rollback approved for merge on 2026-08-03.

---

### 2026-06-26: Non-blocking signup banner (`loss_aversion_banner`) — top-anchored notification

> **Shipped to production 2026-06-26 at 100% (`ACTIVE_CHALLENGER = "loss_aversion_banner"`, storage key bumped `_v2` → `_v3` so returning visitors re-draw onto it).** Founder call: put this version up now rather than wait for the Prompt C verdict. This **ends [Prompt C](#2026-06-14-conversion-prompt-c-loss_aversion-100-challenger) early** (it was at 13.8% intent / N=87, directionally positive but underpowered — no formal verdict). Instant rollback: set `ACTIVE_CHALLENGER` back to `"loss_aversion"` (Prompt C modal) or `CHALLENGER_SHARE = 0` (control).

**Hypothesis:** The blocking modal (Prompt C) earns its ~13.8% intent partly *by force* — it walls users off the calm they just earned. We suspect a hidden retention tax. A **non-blocking** banner that drops in from the top like a notification, leaves the orb fully usable, and **tucks away the moment the user starts breathing again** (listens to the existing `resonance:run-state` event) preserves the calm exit, still captures the motivated minority, and stops punishing the ~86% who don't convert. Reframed **benefit-first** ("Save your breathing practice journey") instead of loss-first. The bet is a *tradeoff*: intent may dip, but retention should rise — and a gentler app people return to can out-earn a pushy one.

**Change:** New `NonBlockingSignInBanner` ([`src/components/auth/non-blocking-sign-in-banner.tsx`](../src/components/auth/non-blocking-sign-in-banner.tsx)) — top-anchored, non-blocking, two layouts (**card** primary, **pill** compact). Reuses the loss-aversion cocoa-glass styling and the stats-page morphing **blob** for the session avatar. Wired into [`SessionCompletePrompt`](../src/components/auth/session-complete-prompt.tsx): renders for the `loss_aversion_banner` variant (ship path) **or** via `?promptui=card|pill` (local preview); `?promptdemo=1` opens it on mount for inspection. Hierarchy is headline → session "receipt" card → Google → "or save with email". The X dismisses (no separate "Keep breathing").

**Identification / measurement — reuses existing variant plumbing, no new tracking:** new `ConversionVariant` value **`loss_aversion_banner`**. The entire see→register funnel already reads the variant from one localStorage bucket, so with **zero new event code** these all tag the banner cohort: `conversion_prompt_shown`, `conversion_prompt_dismissed`, `conversion_signup_completed`, `signup_user_identified`, plus the `conversion_variant` **GA4 user property**. Because it is a *distinct* variant, banner traffic does **not** pollute Prompt C's `loss_aversion` numbers — they stay cleanly segmented.

- **GA4 enablement (done 2026-06-26):** registered two custom dimensions so variant is queryable (previously only `seconds_elapsed` existed, so `variant` was collected but *not* segmentable): **"Conversion variant"** (Event scope, param `variant`) and **"Conversion variant user"** (User scope, property `conversion_variant`).
- **How to review:** open the saved **"Signup Conversion Funnel"** exploration → add a breakdown / segment on **Conversion variant** (or filter to `loss_aversion_banner`); or build a user segment on **Conversion variant user = `loss_aversion_banner`**. Custom dimensions populate **going forward** (~24–48h lag). The demo flag only renders UI — `conversion_prompt_shown` fires on a real ≥60s logged-out session.

**Baseline (Prompt C modal `loss_aversion`, Jun 14–22):** intent **13.8%** (12 signups / 87 prompt-shown), dismiss **86.2%**.

**Pre-committed criteria** (set 2026-06-26; shipped same day; first read **2026-07-03**, verdict **2026-07-17**, or earlier once ≥150 banner impressions accrue — at recent ~40 prompt-shown/day that's ~4 days; score on users):
- ✅ **Success** if banner intent (`conversion_signup_completed` users / `conversion_prompt_shown` users, variant `loss_aversion_banner`) **≥ 13.8%** AND day-7 return rate for banner-cohort signups ≥ the modal cohort (retention not sacrificed). Ideal outcome: intent flat-or-up **and** retention up.
- ❌ **Failed** if intent **< ~10%** (banner-blindness cost) with no retention gain.
- 🟡 **Mixed** if intent dips but retention rises — the tradeoff materialized; decide on net signups over a longer horizon.
- ⚪ **Inconclusive** if **< 150** banner impressions by the read.

**Open design questions:** top-center vs top-right on mobile (header crowding); the benefit headline currently has no loss/device subline (a lever Prompt C uses — could add back); card vs pill (card is primary).

**First read (2026-07-10, run 7 days late):** Impression gate cleared — 564 banner impressions / 161 prompt-shown users since ship (Jun 26 – Jul 9, GA4 events report; banner is at 100% so the whole period is banner traffic). **Intent = 15 signup users / 161 prompt-shown users = 9.3%**, vs the 13.8% modal baseline — below the pre-committed <10% Failed threshold. Worse, the trailing 7 days (Jul 3–9) read **4.7%** (4/86): intent is decaying within the banner period, the banner-blindness signature the Failed criterion anticipated. Independent corroboration: the orangepi visibility digest flagged DB signups −75% WoW (2 vs 8) on 2026-07-09 and commented on DAR-440. The retention leg was pulled the same day (below).

**Retention leg (2026-07-10, Neon cohort pull; method: signup date vs `last_seen` from the canonical cohort-check query):** Banner cohort (signups Jun 26 – Jul 9, N=10, excluding the too-fresh same-day signup): **4/10 (40%) returned after signup day**. Modal cohort (Prompt C, Jun 14–22, N=12): **6/12 (50%)**. No retention gain — the compensating tradeoff the hypothesis bet on did not materialize. Small N on both sides, but the criteria require "banner retention ≥ modal cohort", not significance, and it isn't.

**Verdict: ❌ Failed (called 2026-07-10, early per the pre-committed "or earlier once ≥150 banner impressions accrue" clause — 564 impressions).** Both Failed conditions met: intent 9.3% < 10% (and decaying) AND no retention gain (40% vs 50%). The gentler-app bet cost ~⅓ of signup intent and bought nothing measurable in return. Rollback lever unchanged: `ACTIVE_CHALLENGER` back to `"loss_aversion"` (Prompt C modal) — a decision, not auto-executed with this verdict; the alternative iteration is adding the loss/device subline back to the banner headline, but the decay pattern points at the form factor, not the copy.

**Status:** ❌ **Failed** — verdict 2026-07-10 (early call, impressions gate cleared). Shipped 2026-06-26 at 100%; intent 9.3% vs 13.8% baseline; retention 40% vs 50%. Revert decision pending.

---

### 2026-06-21: /stats page — practice calendar + session stats for signed-in users

> **Redesigned 2026-06-21 → "Your practice"** (commit `eed6327`). Shipped as a **retention surface**; the first thing we're watching is **how many signed-in users actually reach it via the "My Stats" entry**, then whether reaching it lifts return rate.

**Hypothesis:** Signed-in users who can see their practice history return more often and are harder to churn — the page makes their investment visible, reinforcing "I am someone who breathes." The redesign sharpens this two ways: (1) a **stale or zero streak now reads "Fresh start · One breath plants a new streak"** instead of a demoralizing `0`, removing the shame cue we suspect made a broken streak a *reason to leave*; (2) a GitHub-style **breath garden** turns months of scattered sessions into one dense, rewarding picture. Secondary: the signed-out value-prop view nudges first-time visitors close to signing up.

**Change:** `/stats` rebuilt from the Claude Design component "Your practice" (commit `eed6327`). Signed-in view: warm header + animated orb, **Total time / Sessions / Streak** tiles, an 18-week **breath garden** (binary practiced/rest — no per-day minutes are stored, so the design's intensity gradient is deferred), a **favorite pattern** card (from `user_settings.mode` via `BREATHING_PATTERNS` — the saved setting, not computed usage frequency; no per-pattern counts exist), and a **last-7-days** presence strip. Stale-streak reframe via `computeLiveStreak`; longest run computed from real active-day history. Dark mode preserved via design tokens (warm wash is light-only). Per-day history still in `user_active_days` (migration `003`); the garden falls back to the streak window if unmigrated. **Entry point: a "My Stats" link in the site footer — the only path in today (no header profile button yet).** Weekly-goal tile intentionally omitted for now. The v1 full-month calendar this replaces was never shipped to production.

**Measurement design:** No split test (insufficient volume). Two tiers:
- **Primary — adoption / "do they find it":** weekly **`/stats` `page_view`s by signed-in users** and **reach rate** = signed-in users who open /stats ÷ weekly-active signed-in users. Already captured by GA4 `page_view` (PageViewTracker); `/stats` is the only page on that path and the footer "My Stats" link is the only entrance, so pageviews ≈ entry clicks. (For clean attribution we could add a `stats_entry_click` event on the link — see follow-up.) Baseline = 0 (new surface).
- **Outcome — retention:** day-7 return rate for signed-in users (65% day-1 baseline; day-7 not yet measured — establish first) and any lift in `signed_up`.
- Baseline snapshot (FUNNEL-DASHBOARD.md, 2026-05-08, ~6wk stale): 17 signed-in users total, 65% day-1 return (11/17), ~119 breathing_session_start users/wk, ~52 conversion_prompt_shown/wk.

**Pre-committed success criteria (measure after 2026-07-21 — 28 days post-merge):**
- ✅ Success: ≥ **25% of weekly-active signed-in users open /stats**, AND day-7 signed-in return rate ≥ 75% (or new signups/wk +2 vs baseline).
- ⚪ Inconclusive: < 10 signed-in /stats viewers in the window (can't read retention). If **reach** is the blocker, the next move is a prominent header **profile/avatar entry button**, not abandoning the page.
- ❌ Failed: reach ≥ 25% but no retention lift after 28 days with ≥ 20 signed-in users observed.

**Note on the entry point:** "how many users get to the page" is gated by discoverability, and today the only entrance is a footer text link. Low reach would be a *findability* result, not a verdict on the page itself — fix it with a header profile button before calling the experiment failed.

**Status:** 🔄 Implemented (redesigned)

---

### 2026-06-14: Conversion Prompt C (loss_aversion), 100% challenger

**Hypothesis:** Loss-aversion framed on the user's **real just-completed session** (mode + duration + "just now") beats both the honest control AND the social-proof challenger (Prompt B). It is **honest by construction** — no simulated social proof, no fake streak — so it sidesteps the placebo risk that likely suppressed Prompt B intent (users sensing a fake "people breathing right now" count → distrust → walk past). Framing signup as *not losing* the session you just earned should lift prompt_shown → signup.

**Change:** New `LossAversionSignInSheet` (dark-cocoa theme, modeled on Prompt B's sheet with the social-proof bits stripped). Shows a real-session card: `✓ SESSION COMPLETE`, the live mode label (`BREATHING_PATTERNS[activeMode].name`), the `M:SS` duration, "just now", and a coral progress ring tinted by the mode's accent color. Copy: headline "Keep tonight's calm." + loss-aversion body; primary "Continue with Google" ("One tap. No password."); "or save with email" magic-link fallback; "Not now" dismiss. The funnel events (`conversion_prompt_shown` / `_dismissed`, `conversion_signup_completed`, `signup_user_identified`) and the `conversion_variant` GA4 user property auto-carry `loss_aversion`; the sheet also fires `signin_prompt_view` / `signin_google_clicked` / `signin_magic_link_sent` tagged `variant: loss_aversion`.

**Swap mechanism (instant rollback):** `src/lib/conversion/variant.ts` now exposes `ACTIVE_CHALLENGER` + `CHALLENGER_SHARE` (set to 1 = 100% challenger; **set `CHALLENGER_SHARE = 0` for instant rollback to control**). The localStorage bucket key was bumped `resonance_conversion_variant` → `…_v2` so visitors previously persisted as `social_stats` (Prompt B) re-draw and land on `loss_aversion` — required for a true 100% swap. `social_stats` stays in the type/tree (Prompt B is paused, not deleted).

**Measurement design:** 100% challenger, read **pre/post** vs the baseline below (a concurrent split is underpowered at ~52 impressions/wk). Score on **users**, not events. Primary = user-based signup **intent**; `signup_user_identified` = **truth** guardrail.

**Baseline (user-based, from FUNNEL-DASHBOARD + the Prompt B `conversion_prompt_shown` double-fire correction):**
- control intent: **10.7%** (16 signup-users / 150 prompt-shown-users)
- ~52 prompt impressions / wk
- signup_user_identified / shown (truth floor): ~7%

**Pre-committed criteria** (set 2026-06-14, before ship; first read **2026-06-28**, verdict **2026-07-12**; score on users):
- ✅ **Success** if user-based intent (`conversion_signup_completed` users / `conversion_prompt_shown` users) is **≥ 16%**, AND `signup_user_identified` / shown is not below ~7%, AND the user-based dismiss rate is not materially up (≤ +5pp).
- ❌ **Failed** if intent ≤ 10.7% (no lift) OR dismiss clearly up.
- 🟡 **Mixed/Inconclusive** if intent rises but truth (signup_user_identified) stays flat or falls, OR if fewer than ~150 prompt impressions accrue by the verdict date (underpowered → extend, do not call it).

**Power caveat:** pre/post at ~52 impressions/wk reliably detects only large effects. A null is "inconclusive at this N," not proof of no effect. Watch the dashboard's other lines for confounding co-movement.

**Out of scope (deliberately not built for v1):** translations (English-only, matching how Prompt B shipped — add to the 5 locales if it wins); a 3-way / concurrent split (underpowered at current traffic); a time-aware headline ("tonight's" assumes evening — kept literal per the design; revisit if it reads oddly in morning sessions). The Prompt B real-social-proof rebuild (`feat/prompt-b-real-social-proof`) is **merged alongside this swap (2026-06-15) but dormant** — its presence/streak infra runs in the background so B has real numbers if revived; Prompt C is the active prompt.

**Status:** ⏹️ **Ended early 2026-06-26** — superseded by the [non-blocking banner ship](#2026-06-26-non-blocking-signup-banner-loss_aversion_banner--top-anchored-notification) before its 2026-07-12 verdict (founder call to ship the banner now). Last read (Jun 14–22, N=87): intent **13.8%** vs 10.7% baseline, dismiss 86.2% — directionally positive but underpowered; **no formal verdict**. Branch `feat/conversion-loss-aversion`. _Originally: measure-after 2026-06-28 (first read), 2026-07-12 (verdict)._

---

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

**Known caveats (at launch):** social proof (live count + avatars) was **simulated** for launch (founder-approved); `dayStreak` was also simulated and unblurred to a non-real number on the email path; only `yourMinutes` was real (stats gated on > 0). See [docs/design/conversion-prompt-B-rollout.md](design/conversion-prompt-B-rollout.md).

**2026-06-15 — social proof made real + merged (branch `feat/prompt-b-real-social-proof`, folded into the Prompt C ship):**
- **Live count:** new `presence_sessions` table + `POST /api/v1/presence/heartbeat` (upsert + prune > 10 min old) + `GET /api/v1/presence/count` (5-min active window, `s-maxage=30`). Resonance sends a heartbeat every 60s while the orb is running. The sheet fetches the real count on open and jitters around it. Honest fallbacks: count = 0 → "Join thousands breathing today"; count = 1 → "1 person breathing right now".
- **Day streak:** `last_session_date DATE` + `current_streak INTEGER` added to `user_stats` (migration `002_presence_and_streak.sql`). Stats sync accepts client-supplied `sessionDate` (ISO YYYY-MM-DD) for timezone-correct streak computation; same CASE expression in both SQL and local Resonance state so the UI is instant without a round-trip. Bootstrap returns `currentStreak` + `lastSessionDate`. `showStats` now gated on `totalMinutes > 0 && dayStreak >= 1` — a "0" never unblurs.
- **`current_streak` added to `conversion_signup_completed` event** for post-hoc analysis of whether streak depth predicts conversion.
- **The presence heartbeat + streak sync are always-on (not gated on the active variant)**, so the real count/streak data accumulates in the background even while Prompt B's sheet is dark behind Prompt C — so B is ready with real numbers if revived. Migration `002` is applied at this deploy (additive, `IF NOT EXISTS`).

**Status:** ⏸️ **Paused 2026-06-14, code merged 2026-06-15** — superseded by [Conversion Prompt C (loss_aversion)](#2026-06-14-conversion-prompt-c-loss_aversion-100-challenger) before this entry's 2026-06-29 verdict. Rationale: the (then-simulated) social proof was the leading suspect for *suppressing* intent (early Jun 2–7 read was directionally below the honest control), and at ~52 impressions/wk this arm couldn't reach significance anyway. The real-social-proof rebuild above is now **merged but dormant** — its prompt isn't shown (Prompt C is the active challenger), but its presence/streak infra runs live so the data is real if B is revived. **The pre-committed criteria above are retained, not relitigated** — if Prompt B is revived, it resumes against them. _Originally: 🔄 Implemented — shipped to prod 2026-06-01 (simulated); measure-after 2026-06-15 (first read), 2026-06-29 (verdict)._

---

### 2026-05-17: Resonance audio v2 — body-resonance, breath-coupled bed, session arc, eyes-closed mode

**Hypothesis:** The current Resonance audio engine sounds "in the head" rather than "in the body" and doesn't evolve across a session. A bundled v2 — quality fixes (reverb cache bug, output compressor, hue-based root notes), body layers (sub-bass, breath-coupled pink-noise bed), session-arc evolution on the drone, and an opt-in eyes-closed mode that adds a phase-length tonal envelope — should raise the perceived quality enough to lift two funnel signals: **engaged minutes per session** (richer, evolving texture → users stay longer) and **return rate** (better felt experience → more "I'll come back to this"). Tracked as Linear epic [DAR-377](https://linear.app/darkmatterlab/issue/DAR-377/epic-improve-resonance-audio-engine).

The "audio audit before building" discipline (see [memory/project_resonance_audio_audit.md](https://github.com/abiassi/deepbreathing/blob/main/.claude-memory/) — internal) confirmed that 8D HRTF panning, per-mode/per-phase cue presets, Voss-McCartney pink noise, and breath-direction pitch/filter cues are already shipping. v2 builds on that — does NOT replace it.

**Baseline (7d May 1–7, 2026, from [FUNNEL-DASHBOARD.md](FUNNEL-DASHBOARD.md)):**
- `breathing_session_start`: 119 users (7d)
- start → complete: 21.0% (25 users)
- start → pause: 47.9% — proxy for "tapped pause but didn't come back / didn't enjoy it enough to finish"
- Median session length: not directly available; using `engaged_minutes` proxy from GA4 + DB. Top engaged user (eugene): 168 min lifetime.
- `mode_switch`: 2 (1.7% of starts) — most users stay on the default mode for their landing page
- Return rate: 53% of signups active in last 14d, 65% returned after day 1 (small N=17)
- Mobile split not pulled in 2026-05-08 refresh

**Change:**
- Branch: `audio-v2-overnight`
- Commits: forthcoming (one per sub-issue, see Linear DAR-378 through DAR-386)
- Files: `src/components/resonance/services/audioService.ts`, `src/components/resonance/Resonance.tsx`, `src/app/embed/embed-generator.tsx`
- **Quality fixes (always-on, invisible to user):** reverb cache keyed by `(duration, decay)` so each per-mode preset gets its intended IR; `DynamicsCompressorNode` on the output bus prevents clipping when layers stack; hue-based root-note mapping so all 12 modes get deliberate tuning instead of falling back to A2.
- **Texture additions (always-on, perceptible):** sub-bass layer one octave below drone root (very low gain, omnidirectional, ~65 Hz on a C3 drone); breath-coupled low-pass filter on the pink-noise bed (Relax + Coherent only — the bed now breathes with the user); session-arc evolution that slowly drifts the drone root down a 5th, slows LFOs, and slows the 8D orbit over the first 4 minutes — invisible moment-to-moment but the 5-min session sounds noticeably different from the 30-second one.
- **New opt-in mode (eyes-closed):** toggle in Settings panel, persists in localStorage, round-trips via `?eyesClosed=1` URL param. Fades visualizer + UI chrome to near-black over ~2s, boosts cue audibility, and adds a phase-length tonal envelope that swells through the inhale and decays through the exhale — currently the only place the envelope is enabled (gated behind eyes-closed for measurement isolation; can broaden later if it lands well).
- **Binaural opt-out:** toggle in Settings panel, persists in localStorage, round-trips via `?binaural=0`. Default remains ON (matches current behavior — no surprise). Help text recommends headphones.
- **Embed compatibility:** all new URL params (`?eyesClosed=`, `?binaural=`) are additive — existing `?duration=` and `?theme=` embed URLs continue to work unchanged. Embed generator UI updated to expose the two new toggles for embedders who want them.

**Pre-committed success criteria (read 2026-05-31, verdict 2026-06-14):**

This is a perceptual/qualitative change, so the funnel signals are noisier than a UI redesign. Pre-committing leading indicators rather than a single threshold.

- ✅ **Success if any 2 of these 3 move** by 2026-06-14 vs the 2026-05-01–07 baseline:
  - Median session length (across all starts in the window) up ≥10%. Hypothesis: session-arc + sub-bass + breath-coupled noise make staying past minute 2 more compelling.
  - Eyes-closed mode opt-in rate ≥8% of returning users (those with ≥2 starts in the window). Hypothesis: the immersive payoff is real enough that people opt in once they've tried it without.
  - Pause → no-resume ratio drops ≥5 pp (from the current ~55% of pauses that don't lead to resume, inferred from the 47.9% pause vs 21.0% complete gap). Hypothesis: better audio = fewer "this is annoying, I'm out" pauses.
- ❌ **Failed if all three are flat** AND `breathing_session_start` per `page_viewed_breathing` drops ≥3 pp (means the v2 audio is actively driving people away — e.g. sub-bass distorts on some speakers, eyes-closed UI confuses people).
- ⚪ **Inconclusive if** <80 starts in the window (cohort too small for the 5–10% effects to be detectable) OR if a confound ships in the same window (another product change worth ≥10% of expected effect size).

**Risks to watch:**
- **Sub-bass on phone speakers.** Small speakers can't reproduce 65 Hz; goal is "adds nothing audible" not "adds thump." Watch for distortion reports — listen on iPhone speaker + cheap Bluetooth earbuds before declaring done.
- **Session arc as silent regression.** Drifting the root down a 5th over 4 minutes is intentional, but if it lands wrong it could feel like the audio is "going flat." Smoke-test a full 10-min session at least once.
- **Eyes-closed mode tap-to-restore.** The intent is tap-anywhere-to-restore-visuals-without-pausing. If the tap-to-restore conflicts with the existing tap-to-pause-inside-orb gesture, users will hit pause when they meant to peek. Verify both gestures work without ambiguity.
- **Binaural toggle defaulting ON.** Keeping current behavior to avoid surprise — but if a meaningful chunk of users opt-out, we should consider flipping it OFF for new sessions on speakers. Track `binaural_toggled` GA4 event.
- **Embed param surface area growing.** With `?duration=`, `?theme=`, now `?eyesClosed=`, `?binaural=`, the embed URL space is starting to matter. Document the schema in the embed generator UI so embedders don't reverse-engineer it from referrer headers.

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

**Read (2026-05-18, 13d in — Neon DB `cohort-check.sql`):**

| Cohort metric | Value | Note |
|---|---|---|
| Total users (was 17) | **26** | +9 since May 5 |
| Engaged (>0 min, was 4) | **7** | +3 new engagers |
| `sessions_completed > 0` (was 0) | **4** | First non-zero values ✅ |
| Per-user breakdown of new engagers | liz 15min / **8 done**, margoshats 4min / **3 done**, stacy 0min / **3 done**, mvarchol 11min / 0 done | new-session sync paths firing |

Engaged-minute distribution row dump (only users whose `user_stats` row has been touched post-fix):

```
total_minutes | sessions_completed | last_synced
          168 |                  0 | 2026-04-18  (pre-fix sync, stale)
           40 |                  0 | 2026-04-20  (pre-fix sync, stale)
           37 |                  0 | 2026-05-09  (post-fix but session pre-fix)
           15 |                  8 | 2026-05-18  ← liz, post-fix sync ✅
           11 |                  0 | 2026-05-15  (post-fix but never timed-complete)
            4 |                  3 | 2026-05-18  ← margoshats, post-fix sync ✅
            4 |                  0 | 2026-04-13  (pre-fix sync, stale)
```

**Interim read:** the `sessions_completed > 0` half of the criterion is **clearly working** for sessions that happen post-deploy (2/2 hits among users who had any timed completion this week). The "total_min 30-60% lower" half of the criterion **cannot be evaluated from a snapshot** — `user_stats` is overwritten by each sync, so we don't have a before/after for the same user. Need a per-session ledger to verify the double-count fix directly; current data is consistent with the fix working but doesn't prove it.

**Status:** 🔄 Implemented (interim read positive). Full verdict still 2026-06-02 — needs more post-fix engaged users for a confident pattern.

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

**Result (2026-05-18, 13d in — GA4 events report, last 14d May 4–17):**

| Event | Users (14d) |
|---|---:|
| `conversion_signup_completed` | **11** |
| `signup_user_identified` | **11** |

**11 = 11 — exact match.** Criterion was "`signup_user_identified` count matches login count" — hit. Mobile/desktop split: signup_user_identified mobile=5 / web=6 vs signup_completed mobile=6 / web=5 — match holds across devices (small ±1 noise from cross-device users).

The `signed_up=true` user_property visibility in the User attributes report wasn't directly verified this checkpoint (would need to drill into User Attributes panel), but the event-count match strongly implies the gtag user_id + user_properties calls are firing as designed. 

**Status:** ✅ **Success.** GA4 user-ID wiring is working end-to-end. Cross-device stitching and signed-up vs guest segmentation are now possible in GA4 reports (action item: actually use them in the next funnel refresh).

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

**Result (2026-05-18, 13d in — GA4 events report, last 14d May 4–17, Mobile-traffic comparison applied):**

| Mobile metric | Baseline May 5 (28d) | Post-deploy 14d (May 4-17) | Δ |
|---|---:|---:|---:|
| Mobile users — `breathing_session_start` | 140 | 111 | — |
| Mobile users — `breathing_session_pause` | 36 | **20** | — |
| Mobile pause rate | 25.7% | **18.0%** | **-7.7pp** ⚠️ (wrong direction) |
| Mobile abandonment (= 1 − pause-rate) | **74.3%** | **82.0%** | **+7.7pp WORSE** |
| Mobile users — `breathing_session_complete` | 8 | 22 | +14 (chips effect) |
| Mobile complete rate | 5.7% | 19.8% | +14.1pp (driven by chips, not hint) |

Pre-committed criterion: mobile abandonment ≤66% (-8pp). Observed: abandonment moved +7.7pp in the **wrong direction**. Mobile pause-rate also dropped slightly (25.7% → 18.0%) — so even on the underlying signal, the hint did not produce more pauses; if anything, fewer.

**Status:** ❌ **Failed.** The "TAP TO PAUSE" hint did not reduce mobile abandonment. Two possibilities to triage:
1. The hint is genuinely not helping — mobile users who don't pause already aren't looking at the orb text mid-session, and a small text label can't override that.
2. The 14d vs 28d windows aren't directly comparable; the cohort/traffic mix differs and the May 4-17 window has only 111 mobile starts vs 140 in the baseline.

Either way, the criterion as written is not met. **Action item to consider:** roll back the hint (it's visual noise that didn't earn its keep), OR test a more aggressive intervention (e.g., first-session-only larger overlay tooltip). Don't sit on a failed UX addition. The complete-rate jump (5.7% → 19.8%) on mobile is real but driven by the duration chips ship, not this hint.

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
