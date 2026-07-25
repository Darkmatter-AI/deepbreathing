# UX Backlog

Compiled from session audit on 2026-04-27. Refreshed 2026-05-05 with post-deploy GA4 data.

## Mobile app (iOS)

- **In-app theme toggle doesn't reach native chrome** (found 2026-07-22 pre-submission QA): the webview settings' light/dark toggle only themes the webview (`themeOverride` in `BreathingExperience.tsx` is never emitted via `onEvent`). Native side (`apps/mobile/src/app/index.tsx:79`) follows `useColorScheme()` only, so with device-dark + in-app-light the status bar clock is white-on-cream (illegible) and CompletionSummary/account button render dark over a light webview. Fix: emit a `theme_changed` event from the webview and let it override the native theme + `expo-status-bar` style. Cosmetic, only when in-app toggle diverges from system theme; not a 1.0 blocker.
- **One-off: session auto-completed immediately on resume tap** (observed once 2026-07-22, simulator): pause → resume showed the completion receipt with full 0:30 credited despite ~20s paused. Deliberate repro (pause 5s → wait 40s → resume) behaves correctly, so likely a double-fired tap (pause+resume) letting the session run out in the background. Watch for it in TestFlight; if real users report instant completions, instrument `handleTogglePlay` re-entry.

## Email / deliverability

- **Apple private-relay signups never get the welcome email** (found 2026-07-25): all 3 `@privaterelay.appleid.com` users sit in `email_suppressions` as bounces. Apple rejects mail whose sender address isn't registered under *Apple Developer → Certificates, IDs & Profiles → Sign in with Apple for Email Communication*. Fix is portal-side, no code: register `abi@` and `noreply@deepbreathingexercises.com`. Matters more once the iOS app ships and Apple sign-in becomes a main signup path.
- **No DMARC record on `deepbreathingexercises.com`** (found 2026-07-25): `_dmarc` is empty. Note the apex has no SPF either — Resend uses a custom MAIL FROM, so SPF (TXT+MX) lives on `send.deepbreathingexercises.com` and DKIM on `resend._domainkey`, both `verified`. Since DKIM signs with `d=deepbreathingexercises.com` it aligns with the apex, so adding DMARC should pass on the DKIM leg. Free inbox-placement win — start at `p=none` with a reporting address, then tighten.
- **Considered and rejected: give the domain a real inbox.** The apex has no MX and cannot receive (see the Resend section of [`runbooks/tools-and-data-sources.md`](runbooks/tools-and-data-sources.md)). Rather than stand up Cloudflare Email Routing or Workspace, the welcome email's `replyTo` now points at `hi@abiassi.com`. Revisit only if support volume justifies a branded mailbox.

## In-flight / queued (tracked in PRODUCT-EXPERIMENTS.md)

- **Non-blocking signup banner (`loss_aversion_banner`)** — ✅ **shipped to prod 2026-06-26 at 100%**, replacing the Prompt C modal (top-anchored notification, tucks away on play, benefit-framed). Full hypothesis + pre-committed intent/retention criteria + GA4 review method: [PRODUCT-EXPERIMENTS.md → 2026-06-26](PRODUCT-EXPERIMENTS.md#2026-06-26-non-blocking-signup-banner-loss_aversion_banner--top-anchored-notification).

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

## QA — Traction-page sweep (2026-06-06)

Browser QA of the ~16 pages earning the Jun 1–3 Bing spike, desktop 1280px + mobile 375px, on **production**. Full report + verdict table + evidence screenshots: [`docs/qa-reports/traction-pages-2026-06-06.md`](qa-reports/traction-pages-2026-06-06.md) and `docs/qa-evidence/traction-2026-06-06/`. Headline: **EN traction set 9/11 leverageable; localized set 0/5** (correct hero, but half-English body). Gate: don't push more indexing/links at the localized URLs until #23/#24 are resolved.

**Ownership split (resolved after investigation):** of the four findings, **only #25 is a repo bug** (fixed below). **#23, #24, #26 are all the mass-translate layer** — handed to the mass-translate agent. The deciding evidence for #24 (which clarifies #23): `get_site_content` for `/4-7-8-breathing-timer` shows mass-translate has the page at 95.6% ja-jp coverage, **last crawled 2026-06-02**, with its indexed heading segment as `"4-7-8 Breathing Timer: Fall Asleep Faster"` — but the **live code renders `"4-7-8 breathing timer (free online)"`**. Mass-translate translates by matching `source_text` against the live DOM; because the on-page copy drifted from what it indexed, the match fails and the H1 stays English. (The Japanese `…より早く眠りに落ちる` / "fall asleep faster" seen once is the translation of *its* indexed heading, not of the code's literal.) So these are content-drift / coverage / re-crawl issues, not repo render bugs. **Architecture note** (`tools-and-data-sources.md` #15): a real browser only shows the translation ~1.5 s after load and `curl` sees all-English, so judge coverage against the settled DOM in a browser, not `curl`.

### 23. [P0] Localized traction pages are half-English in the body
On all 5 localized traction URLs (`/ja/4-7-8-breathing-timer`, `/ja/breathe/wim-hof`, `/ja/for/kids`, `/pt/breathe/wim-hof`, `/es/for/kids`) the hero/above-the-fold renders correctly in-language, but large blocks of deeper body content (science / mechanism / step-by-step sections) **stay English** — the client translation pass never converts them (still English at t=4 s; not a transient flash). The same English blocks recur across pages → specific content sections the pass doesn't cover, not random misses. English-run counts in body `innerText`: ja-478-timer 27, ja-wim-hof 49, ja-for-kids 58, pt-wim-hof 71, es-for-kids 91. Evidence: `qa-evidence/traction-2026-06-06/ja-wim-hof-halfenglish.png`, `es-for-kids-halfenglish.png`. **Severity:** high — these rank at pos 1–8 and a half-English page wastes the traction (and a pre-render crawl sees the all-English server HTML). **Not** the known benign meta/og limitation; this is visible body copy. **→ mass-translate** (coverage / re-crawl — see section header; same root as #24).

### 24. [P0] `/ja/4-7-8-breathing-timer` renders an English H1 — **→ mass-translate** (content drift)
The #1 traction page (top click query `478タイマー`, pos 1, 3 clicks) shows H1 `4-7-8 breathing timer (free online)` in **English** — reliably (5/5 fresh loads, both viewports; English at every timestamp t=0–4 s) — while the rest of the body translates to Japanese around it. **Root cause (confirmed via `get_site_content`):** mass-translate's indexed heading segment for this URL is `"4-7-8 Breathing Timer: Fall Asleep Faster"` (last crawled 2026-06-02), but the live code renders `"4-7-8 breathing timer (free online)"`. The DOM-text match fails on the drifted string, so the H1 isn't replaced. **Fix = mass-translate re-crawl + re-translate the current strings** (same handoff as #23); not a repo render bug — a `FadingHeroTitle`/structure refactor would not change which string mass-translate has indexed. (Side note for product: mass-translate's own SEO title "Fall Asleep Faster" may be a stronger H1 than "free online" — worth a copy decision.) Evidence: `qa-evidence/traction-2026-06-06/ja-478-timer-english-h1.png`.

### 25. [P1] ✅ FIXED 2026-06-06 — Mobile: breathing orb not tappable (8 bespoke hero pages)
At 375px the orb (`button[aria-label="Start Session"]`, z-20) was covered by a hero-content overlay (`div … inset-y-0 left-0 max-w-xl justify-end`, z-30, **no `pointer-events`**) that **intercepted pointer events** — tapping the orb (the only in-page start control) did nothing. Locale-independent (the markup ships on the English source page too; confirmed on live English production, blocked 2/2). Desktop was unaffected (the overlay re-centers at `sm:`). A sweep of the codebase found the **same broken bespoke overlay on 8 pages** — not just the two from the traction set:
`/breathing-visualizer`, `/4-7-8-breathing-timer`, `/box-breathing-app`, `/physiological-sigh-panic-attack`, `/box-breathing-before-presentation`, `/breathing-exercises-for-labor`, `/breathing-exercises-before-surgery`, `/4-7-8-breathing-for-insomnia`.
Not affected (already correct): the `/breathe/*` (`pattern-page.tsx`) and `/for/*` (`use-case-page.tsx`) templates, and the home page — all already use `pointer-events-none` overlays; verified home/`box`/`tummo` orbs work on mobile. The `/embed/[slug]` page has only a small corner badge, not a covering overlay.
**Fix:** adopted the proven `pattern-page.tsx` overlay on all 8 — `pointer-events-none` on the overlay + `pointer-events-auto` on the inner content, and mobile `inset-x-0 bottom-0` (bottom strip) instead of full-height `inset-y-0` so it no longer covers the orb (desktop keeps `sm:inset-y-0 sm:left-0 sm:justify-center`). **Verified locally** (dev server, no proxy needed): orb starts the animation at 375px on all 8, desktop unchanged (no regression), in-overlay CTAs still clickable. Evidence: before `breathing-visualizer-mobile-orb-dead.png`, after `FIX25-478timer-mobile-orb-now-starts.png`. Commits `d6a8865` (first 2) + this commit (other 6).

### 26. [P2] React hydration errors on localized `/breathe` + `/for` templates — **→ mass-translate** (translation-layer-coupled)
`/ja/breathe/wim-hof`, `/pt/breathe/wim-hof`, `/ja/for/kids`, `/es/for/kids` throw `Minified React error #418/#423/#425` (hydration mismatch) on load (intermittent on `/ja/4-7-8-breathing-timer`). **Why it's not a clean repo fix:** the *same* React components render the EN pages with **zero** hydration errors — the only differing variable on the localized routes is the mass-translate layer mutating the served/hydrating DOM, so it is translation-layer-coupled. `suppressHydrationWarning` would only silence the #425 text warning (one level deep), not the #418/#423 failures, so there's no effective repo-side fix. User-visible impact is minor (the brief first-paint English flash settles correct). Hand to mass-translate alongside #23/#24. *(Caveat on mechanism: `curl` ≠ a real browser's hydration input, and the t=0 sample was post-`domcontentloaded` — so "proxy injects nodes" is the leading hypothesis, not proven; the ownership call holds regardless since the repo can't fix it either way.)*

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

## Resolved bugs

### 22. ✅ RESOLVED 2026-05-12 — OG image route returns 0 bytes (WhatsApp / iMessage / Slack get no preview image)

**Was:** `/og/[slug]` and `/og?title=…` both returned `200 OK` with `content-type: image/png` and `content-length: 0` — every social platform showed shared deepbreathingexercises.com links with no preview image. Vercel runtime logs were initially silent.

**Root cause:** three compounding satori issues, only the first of which surfaced any error signal at all:
1. **No `fonts` option** passed to `ImageResponse` — satori silently failed mid-stream and Vercel logged nothing. Without fonts, every error after this point was masked.
2. **Particles container had 20 children but no `display: flex`** — satori rejection became visible in runtime logs only after fix #1 was deployed.
3. **Multiple satori-unfriendly CSS features** in the orb template (`radial-gradient(circle at X%)`, `inset` box-shadow, `filter: blur`, `textShadow`, `textTransform`, `letterSpacing`, absolutely-positioned subtitle without explicit dimensions). Each kept the 0-byte symptom going until the template was rewritten.

**Fix:** three commits in the order they unblocked the next error:
- [`6b9e198`](https://github.com/Darkmatter-AI/deepbreathing/commit/6b9e198) — add `src/lib/og-fonts.ts` (fetch Inter 400/700 TTF from Google Fonts at request time, force TTF via desktop UA), wire into both `/og` routes.
- [`c9a2895`](https://github.com/Darkmatter-AI/deepbreathing/commit/c9a2895) — add `display: flex` to the particles container.
- [`a56921f`](https://github.com/Darkmatter-AI/deepbreathing/commit/a56921f) — rewrite both routes to a satori-safe subset (flex column, linear-gradient background, solid-color orb, uppercase title, plain subtitle).

**Verification:** `scripts/check-og-image.sh` hits 4 representative endpoints (`/og/box`, `/og/4-7-8`, `/og/coherent`, `/og?title=Box+Breathing&color=…`) and asserts HTTP 200, `image/png` content-type, body >10 KB, and a valid PNG header signature. Run post-deploy or after any change to the OG routes.

**Lessons for future satori work:**
- Always pass an explicit `fonts: [...]` option to `ImageResponse` — without it, errors are silent.
- Any div with multiple children needs `display: flex` (or `display: none`).
- Avoid: `radial-gradient(circle at X% Y%)`, `inset` in `boxShadow`, `filter: blur`, `textShadow`, `textTransform`, `letterSpacing` — all have partial-to-no satori support and can crash rendering depending on version.
- `position: absolute` children need explicit width/height (or all four insets).
- Vercel runtime logs truncate error messages — query with `level=error` filter and grep for `Expected <div>` to find satori violations.

**Remaining (separate work):** WhatsApp card *title* on `/pt/` and `/de/` is still English because the mass-translate proxy doesn't translate `og:title` / `twitter:title` ok keys. Tracked by the forensic agent in `mass-translate-frontend`; not a deep-breathing-repo concern.

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
