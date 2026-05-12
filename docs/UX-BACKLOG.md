# UX Backlog

Compiled from session audit on 2026-04-27. Refreshed 2026-05-05 with post-deploy GA4 data.

## Context

### Funnel refresh — 2026-05-05 (last 28 days, Apr 7 – May 4)

GA4 property: **DKMT > Deep Breathing Exercises** (ID 527524722, measurement ID `G-53DLCBMRL3`). The Apr 27 baseline was on the Abiassi property (`G-7GG9WVNBBP`); current data is on this property after migration.

| Step | Users (last 28d) | Mobile | Desktop | vs Apr 27 (30d) |
|------|---:|---:|---:|---|
| `first_visit` | 780 | 293 | 475 | — (not tracked then) |
| `page_viewed_breathing` | 232* | 80 | 147 | new event (deployed Apr 28-29) |
| `breathing_session_start` | 361 | 140 | 217 | +6.8% (was 338) |
| `breathing_session_pause` | 150 | 36 | 110 | +16% (was 129) |
| `breathing_session_complete` | 22 | 8 | 14 | +69% (was 13) |
| `conversion_prompt_shown` | 51 | 22 | 27 | new (was 0) |
| `conversion_signup_completed` | 12 | 8 | 4 | new (was 0) |

*`page_viewed_breathing` only has ~6 days of data; ratio to start vs first_visit will normalize over time.

### Funnel ratios

|  | Apr 27 (30d) | May 5 (28d) | Δ |
|---|---:|---:|---|
| start → pause (overall) | 38% | **41.6%** | +3.6 pp |
| start → complete (overall) | 3.8% | **6.1%** | +2.3 pp |
| **mobile** start → pause | 24% | **25.7%** | +1.7 pp |
| **desktop** start → pause | 47% | **50.7%** | +3.7 pp |
| **mobile** abandonment (no pause, no complete) | 76% | **74.3%** | -1.7 pp |
| **desktop** abandonment | 53% | **49.3%** | -3.7 pp |
| signup completions | 0 | **12** | +12 |

### What changed since 2026-04-27

- ✅ **`page_viewed_breathing` deployed** — gives clean top-of-funnel signal (was missing before, the funnel had no upstream from `breathing_session_start`).
- ✅ **`sessions_completed` DB sync fix** — now writes the actual count (was always 0).
- ✅ **Mobile hero above the fold** ([c308f68](https://github.com/abiassi/deepbreathing/commit/c308f68)) — possible contributor to the small mobile-abandonment improvement (76% → 74%).
- ✅ **Duration chips below orb** ([280620c](https://github.com/abiassi/deepbreathing/commit/280620c)) — completion went from 13 → 22 users (almost 2× in the *measurable* metric). The biggest fraction of this is probably *visibility* (more users now have a timer set, which is the only way `breathing_session_complete` fires) rather than user behavior change. The real engagement improvement may be smaller.
- ✅ **Auth flow now functional** — 12 signups in the last 28 days, vs 0 before. `conversion_prompt_shown` 51 → 12 conversions = ~24% prompt-to-signup rate (good for a one-shot prompt).

### What's still open (top of stack, P0)

| # | Item | Status | Why still relevant |
|---|---|---|---|
| 1 | Orb is the only pause control, no visual cue | **OPEN** | Mobile abandonment is still 74% — likely a chunk of these users don't know the orb is clickable. |
| 2 | Sign-up button kills running session | **OPEN** | Now that 12 users are signing up (and 51 have seen the prompt), this is even more pressing. |
| 3 | No timer / progress / phase counter on screen | **OPEN** | The duration chips ship the *picker*, but the in-session display still has no progress indicator. |
| 4 | Duration picker visibility | **DONE** (chips shipped) | Visible completion rate improved but is still 6.1%; can iterate on chip presentation. |
| 5 | Mobile orb play-icon + phase text overlap | **OPEN** | Visual bug, still in code. |

### Mobile is still the bigger lever

- **Mobile users are 39% of the base** (140/361 starts) but **74% abandon without pausing**.
- If mobile abandonment matched desktop (49%), we'd have ~35 more mobile users pausing per 28 days, and proportional gains in completion.
- All three open P0s (#1, #2, #3) primarily affect mobile UX (no hover states on touch, smaller screens hide affordances faster).

Note: `session_complete` only fires when a duration timer is set. Now that chips are visible, more users *should* be hitting it — and the +69% complete number suggests they are. But the absolute number (22 users in 28 days) is still tiny vs 361 starts; the next leverage is keeping users engaged long enough to *want* a timer (P0 #1, #3).

---

## ✅ Shipped this session

- [x] **Add `page_viewed_breathing` event** — top of funnel, fires on mount in `Resonance.tsx` ([81a35cf](https://github.com/abiassi/deepbreathing/commit/81a35cf))
- [x] **Fix `sessions_completed` sync bug** — was always writing 0 to DB ([81a35cf](https://github.com/abiassi/deepbreathing/commit/81a35cf))
- [x] **Show hero above the fold on mobile homepage** — H1, description, CTAs were rendered below the orb on mobile, requiring a scroll past it to find any context ([c308f68](https://github.com/abiassi/deepbreathing/commit/c308f68))
- [x] **Duration chips below orb** — addresses P0 #4 below; `breathing_session_complete` now fires for users who tap a chip ([280620c](https://github.com/abiassi/deepbreathing/commit/280620c))

---

## P0 — Likely explains the start→pause and start→complete drop-offs

### 1. Orb is the only pause control, with no visual cue
The play triangle disappears once breathing starts. There's no overlay hint that the orb is clickable to pause. Users may abandon thinking they're stuck.
- Add a persistent low-opacity pause icon that fades in on mouse move / tap
- Or add a small "tap to pause" tooltip on first session

### 2. Clicking "Sign up" silently kills the running session
The header sign-up button opens a modal that stops the breathing animation. Users curious about the button lose progress.
- Keep session running behind modal, OR
- Hide Sign up button while a session is active

### 3. No timer / progress / phase counter on screen
Users have no sense of "how long have I been doing this" or "how much longer." The single biggest UX gap.
- Add elapsed time display somewhere near the orb
- If a duration is set, show circular progress around the orb

### 4. No visible duration picker before starting
`breathing_session_complete` only fires when a timer is set, but the duration picker is buried in Settings. 95%+ of users start with no timer → no completion event fires.
- Add 1/3/5/10 min chip buttons next to the orb (or below it on mobile)
- This single change should massively boost the visible completion rate in funnels

### 5. Mobile in-session orb shows play icon AND phase text overlapping
Visual conflict during sessions on mobile. The play icon should fully transition out when running.

---

## P1 — First-impression friction

### 6. Two redundant CTAs above the fold (desktop)
"Start session" button + the giant orb. Pick one. The orb is the experience — let it be the only CTA, with a small "or pick a mode" link.

### 7. Default mode is invisible until you click "Pick a mode"
Default is Box Breathing but it's not labeled anywhere. Users have no idea what they're about to do.
- Show "Box · 4-4-4-4" as a small tag near the orb, or in the FadingHeroTitle eyebrow

### 8. No quick mode switcher during session
All pattern selection is in the Settings drawer. Users on `/breathe/box` have no way to jump to `/breathe/4-7-8` without going back to homepage.

### 9. No sound state indicator
Can't tell from the UI if audio is on or muted. Mute toggle only exists in Settings.
- Add a small speaker icon next to the orb

### 10. Mode picker carousel is clipped on mobile
"Pick a mode" cards use horizontal-scroll but only ~1.5 cards fit with no swipe indicator or arrows. Users may not realize there are more patterns.

### 11. Header crowding on mobile
Top-right = `EN | Sign up | settings gear` in a 390px viewport, ~180px wide with no apparent affordance for what each does. The `EN` chip is mystery meat for non-English speakers who haven't seen it before.

---

## P1 — Sign-up conversion (0 of historical 13 user journeys hit the prompt)

### 12. "Save your progress" is weak copy
Most users have no progress to save (avg session is short, sessions_completed stat was always 0 anyway). Try benefit-led:
- "Track your streak across devices"
- "Pick up where you left off, anywhere"
- "Save your favorite patterns"

### 13. Conversion-prompt trigger fires too late
The prompt only shows after a 60+ second session. Most users don't last that long. Consider alternative triggers:
- After 2+ sessions in a single visit (any duration)
- After actively changing settings (already tracked but maybe not fully wired)
- After favoriting a pattern (would need new feature)

### 14. Magic-link button low-contrast disabled state
"Send magic link" appears greyed-out until you type, but the visual state isn't dramatically different. Make disabled vs enabled more obvious.

---

## P2 — Content & navigation

### 15. No "Try other patterns" surface on pattern pages
A user on `/breathe/box` has no in-page link to `/breathe/coherent` or `/breathe/4-7-8` above the fold. Internal linking helps both UX and SEO.

### 16. No reading affordance for editorial content below the fold
The "What is box breathing" / "How do Navy SEALs breathe" content is excellent but no scroll cue suggests it's there. Add a subtle "↓ Learn more" hint.

### 17. Settings drawer location
38px gear icon top-right competes visually with Sign up + Language. On mobile this stacks awkwardly.

### 18. Vercel toolbar visible on production (verify)
Bottom-left dark icon during the audit was the Vercel team toolbar. Should be hidden in production builds for non-team users. Could be local-only — verify.

---

## P1 — Known bugs

### 22. OG image route returns 0 bytes (WhatsApp / iMessage / Slack get no preview image)

**Symptom:** `/og/[slug]` and `/og?title=…` both return `200 OK` with `content-type: image/png` and `cache-control: public, immutable, max-age=31536000` — but `content-length: 0`. Confirmed Tue 2026-05-12 against `origin.deepbreathingexercises.com` (bypasses Cloudflare + mass-translate proxy, so they're not the cause). All slugs fail identically, including unknown slugs that hit the fallback path. Vercel runtime logs show no errors. The 1-year `cache-control` means once an empty body is generated, Vercel + CDN cache it for a year unless busted.

**Why it matters:** confirmed via a WhatsApp share test on 2026-05-12 — share card shows title + description (mass-translate / og:title works) but no preview image. Same likely true for iMessage, Slack, Discord, Telegram, LinkedIn, Twitter card-large-image.

**Likely root cause (untested):** `@vercel/og` 0.8.5 + Next.js 13.5.6 + edge runtime — common failure mode is missing explicit `fonts` config in `ImageResponse`, which silently returns empty body instead of erroring. Worth a 30-min spike to try one of: (a) bump `@vercel/og` to latest, (b) bump Next.js to 14.x, (c) add explicit Inter font to the `ImageResponse` options.

**Quick verification:** `curl -sI https://origin.deepbreathingexercises.com/og/box` — should show non-zero `content-length`. If still zero after a fix attempt, the issue is deeper than fonts.

**Impact on share traffic:** untaggable, but Direct +47% WoW (current spike) likely under-counts because previews-with-no-image have lower click-through than previews-with-image. Estimate ~10–20% lift in click-through once fixed.

---

## P2 — Tracking gaps

So future audits aren't guesswork:

### 19. Add discovery events
Currently we can't see who's even discovering the controls:
- `duration_picker_opened`
- `mode_switcher_opened`
- `settings_opened`

### 20. Send `seconds_elapsed` as a custom GA4 dimension
Currently it's an event parameter on `breathing_session_end` but not queryable as a session dimension. Adding it as a custom dimension lets us see avg session length without manual exploration.

### 21. Track `orb_clicked` separately from session end
To know if users discover the orb-as-pause pattern. Today we infer it from `breathing_session_end` with `reason=paused`, but a click that doesn't go through (e.g. user lifts off-target) is invisible.

---

## Suggested first sprint

The 3 P0 items that compound:
1. **#3 timer display** — answers "how long?"
2. **#4 duration chips** — sets the timer that #3 displays AND fires `breathing_session_complete`
3. **#1 pause indicator** — keeps users from bouncing mid-session

Together these directly address the start→pause (62% drop) and start→complete (96% drop) gaps. Re-measure after 2 weeks.
