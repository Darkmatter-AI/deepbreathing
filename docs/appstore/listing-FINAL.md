# App Store Connect — Build 18 Listing Draft (gated)

> This is the **Build 18 correction draft**, not a submission-ready or already-entered
> App Store listing. The copy is intentionally conservative and must remain pending until
> the physical-device gate in `submission-checklist.md` passes. The longer `listing.md`
> keeps the naming-decision history; both files must describe the same Build 18 behavior.
> Do not paste this draft into App Store Connect before the owner signs off the gate.
>
> Scope: **FREE v1, no in-app purchases.** Every field below advertises only features that
> actually work for a guest user on a fresh install.

---

## App Store name (≤30) — 28 chars
```
Deep Breathing: Calm & Sleep
```

## Home-screen name (CFBundleDisplayName) — matches app.json
```
Deep Breathing
```

## Subtitle (≤30) — 27 chars  *(chosen: Option B, keyword-rich)*
```
Box, 4-7-8 & Calm Breathing
```

## Promotional Text (≤170) — 163 chars
```
Free guided breathing for calm, focus, and sleep. Try box breathing, 4-7-8, coherent breathing, and the physiological sigh, with soothing audio and gentle haptics.
```

## Full Description (≤4000) — 2017 chars
```
Deep Breathing Exercises guides you through established breathing patterns with a smooth, animated orb visualizer. Open the app and follow a session; no sign-up or account is required for the core experience.

BREATHING MODES

• Box Breathing (4-4-4-4) — equal inhale, hold, exhale, hold. A commonly practiced rhythm for a focused breathing break; individual experiences vary.
• 4-7-8 Breathing — extended-exhale pattern often used in a wind-down routine; it is not a sleep treatment.
• Coherent Breathing (5.5-5.5) — slow, even rhythm at roughly 5 breaths per minute. The app makes no heart-rate or other health-outcome promise.
• Physiological Sigh — double inhale followed by a long exhale. A brief guided pattern for stressful moments; effects vary by person.

Plus more guided patterns inside the app: Ujjayi, Belly Breathing, and Pursed-Lip Breathing.

FEATURES

• Animated orb visualizer — a gentle, pulsing cue that expands and contracts with each phase of your breath.
• Audio soundscapes — drone tones, binaural beats, and pink noise to deepen focus. Phase cue tones mark each breath transition.
• Haptic feedback — subtle vibrations guide your breath, so you can breathe eyes-closed.
• Session timer — choose a 1, 3, 5, or 10 minute session.
• Adjustable speed — slow down or speed up any pattern to match your capacity.
• Local session stats — sessions and minutes tracked on-device, no account required.
• Keep-awake mode — screen stays on during your session.
• Dark and light mode support.

BREATHING AND YOUR HEALTH

Deep Breathing Exercises provides timed breathing guidance based on established patterns. It is not a medical device and does not diagnose, treat, or prevent any condition. Breathing practices are not a substitute for professional care, and individual results are not guaranteed. Consult a qualified healthcare provider before starting a new practice, especially if you have a respiratory condition, cardiovascular issue, or are pregnant.

PRIVACY

We do not sell your data. Analytics are aggregated and not tied to advertising. The app works fully without an account; optional sign-in syncs practice sessions and settings across devices. See our Privacy Policy at deepbreathingexercises.com/privacy.
```

## Keywords (≤100) — 98 chars
```
breathing,calm,box breathing,4-7-8,sleep,anxiety,meditation,relax,stress,breathe,focus,mindfulness
```

## URLs
- Support URL: `https://deepbreathingexercises.com/support`  (live, HTTP 200)
- Marketing URL: `https://deepbreathingexercises.com`
- Privacy Policy URL: `https://deepbreathingexercises.com/privacy`  (live, HTTP 200)

## Category
- Primary: **Health & Fitness**
- Secondary (optional): Lifestyle

## Copyright
```
© 2026 Darkmatter AI Labs
```
> ⚠️ CONFIRM: the ASC legal entity / Apple account team is **Reentry Systems Unipessoal Lda**.
> The public "seller" name shown on the App Store is the legal entity (or a registered DBA).
> The copyright field above is free text (brand name is fine). Decide whether the store
> should show "Reentry Systems Unipessoal Lda" or a configured DBA, and whether copyright
> should read "Darkmatter AI Labs" or the legal entity.

## Age rating — health/wellness topics present → expected 9+ on Apple's updated system
Use these answers in the current App Store Connect questionnaire. Apple's definition of
**Health or Wellness Topics** includes self-care or lifestyle recommendations such as
exercise recommendations; the app's guided breathing practices meet that definition.

- **Health or Wellness Topics: Yes** — guided breathing is the core self-care/lifestyle
  recommendation in the app.
- **Medical or Treatment Information: No / None** — the app does not diagnose, manage, or
  treat a medical condition; it provides general breathing guidance and displays a safety
  disclaimer.
- **Unrestricted Web Access: No** — corrected justification:
  > No in-app web browser or arbitrary navigation; the app renders only bundled local UI and never loads external web pages.

All other capability, mature-theme, sexuality, violence, substance, gambling, contest,
social-media, messaging, advertising, parental-control, and age-assurance answers remain
**No / None**. With Health or Wellness Topics enabled, Apple's current ratings reference
maps this to **9+** globally (and region-specific A10 Brazil, All Korea, and 12+ Vietnam).
Ratings can differ on OS versions earlier than iOS 26; App Store Connect displays both
systems where applicable.

## Pricing & Availability
- Price: **Free** (no in-app purchases in v1)
- Availability: All territories (or a selected list)
- Release: **Manual release** (hold until you approve) for the first submission

## Review notes (paste into ASC) — NO demo account needed

> ⚠️ SUPERSEDED 2026-07-28: v1 now ships optional Apple/Google sign-in + sync. Use the
> review notes in `submission-checklist.md` §13 (verified against code 2026-07-22), which
> disclose the optional sign-in, email-confirmed account deletion, and the local-content
> WKWebView. The paragraph below predates the account work — do not paste it.

```
[superseded — see submission-checklist.md §13]
```
Leave the ASC "Sign-in required" toggle OFF and the demo username/password fields empty
(sign-in is optional; reviewers can use Sign in with Apple).

## Screenshots (phone-only v1, no iPad set; provisional)

> **Build 18 correction hold:** the checked-in captures and marketing compositions are
> pre-gate assets. They are useful fidelity references only; do not upload them or call
> them final. After the Build 18 physical-device gate passes, capture a fresh 6.5-inch set
> from the approved binary and verify every frame against the final copy. Do not generate
> final screenshots as part of this docs pass.

When the gate is complete, ship 5–6 screenshots from a clean install of the approved EAS
build (real icon, not the Expo placeholder):
1. Active Box session (orb mid-expansion, phase label) — hero shot
2. Mode Library sheet open (Box, 4-7-8, Coherent, Physiological Sigh, Ujjayi, Belly, Pursed-Lip). **Do not show Wim Hof.**
3. Timer / duration selector (1/3/5/10 minute chips) — must match the approved Build 18 UI
4. Adjustable-speed control + settings (speed slider, keep-awake)
5. Completion summary — local stats card (sessions, minutes)
6. (optional) Dark-mode active session

---

## Deferred to v1.1 (NOT advertised in v1)
- **Wim Hof Method** — fully coded but unreachable on fresh install; exposing it safely needs
  (a) adding it to `ModeLibrarySheet`, and (b) a mandatory breath-retention safety warning
  screen (not yet built), which also adds Guideline 1.4.1 medical-claim review surface.
  Removed from the v1 listing. Revisit in v1.1 alongside the Pro tier.
- **Pro tier / IAP** (RevenueCat) — per the ship-free-now decision.
