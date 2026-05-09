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
| 2026-05-08 | [Unify session-end events + commit-on-pause](#2026-05-08-unify-session-end-events--commit-on-pause) | 🔄 Implemented |
| 2026-05-05 | [Engaged-Minutes Tracking — Fix Double-Counting + Stop-Event Sync](#2026-05-05-engaged-minutes-tracking--fix-double-counting--stop-event-sync) | 🔄 Implemented |
| 2026-05-05 | [GA4 User Identification (user_id + signed_up property)](#2026-05-05-ga4-user-identification-user_id--signed_up-property) | 🔄 Implemented |
| 2026-05-05 | [Tap-to-Pause Hint Inside Orb](#2026-05-05-tap-to-pause-hint-inside-orb) | 🔄 Implemented |
| 2026-04-27 | [Duration Chips Below Orb](#2026-04-27-duration-chips-below-orb) | 🔄 Implemented |
| 2026-04-27 | [Mobile Hero Above the Fold](#2026-04-27-mobile-hero-above-the-fold) | 🔄 Implemented |
| 2026-04-27 | [page_viewed_breathing Event + sessions_completed Sync Fix](#2026-04-27-page_viewed_breathing-event--sessions_completed-sync-fix) | 🔄 Implemented |

**Roll-up by status (6 entries):** 🔄 6 Implemented (all post-2026-04-27, none yet measured against pre-committed criteria — first read on the 2026-05-19 checkpoint, full read 2026-06-02).

See also: [docs/FUNNEL-DASHBOARD.md](FUNNEL-DASHBOARD.md) for the current state, [docs/UX-BACKLOG.md](UX-BACKLOG.md) for what's next, [docs/runbooks/weekly-funnel-refresh.md](runbooks/weekly-funnel-refresh.md) for how to pull the numbers.

---

## Active Experiments

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
