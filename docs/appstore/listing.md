# App Store Connect — Listing Copy

> ⚠️ **2026-06-24 audit reconciliation:** the feature copy below is PRE-AUDIT and advertises
> features not reachable in the shipped free v1 (Wim Hof, optional account/sync, a 2-min timer).
> **Use [`listing-FINAL.md`](./listing-FINAL.md) for the actual values you paste into App Store
> Connect.** This file is kept for the naming-decision history only.

> **Build 18 correction:** the copy below is retained as naming history, not as a second
> source of store truth. In particular, do not restore open-ended sessions, a 30-second
> duration, Wim Hof, or any health-outcome wording from this historical draft. The approved
> duration choices for the Build 18 candidate are 1, 3, 5, and 10 minutes; use the gated
> draft in [`listing-FINAL.md`](./listing-FINAL.md) only after the physical-device check.

## App Name

Brand: **Deep Breathing Exercises** (we own the deepbreathingexercises.com
domain — strengthens the listing, the marketing URL, and ASO). Three fields,
often confused:

1. **Home-screen name** = `CFBundleDisplayName`. Not globally unique; iOS
   truncates to ~12 chars under the icon anyway. Set **`Deep Breathing`**.
2. **App Store listing name** (30 char, MUST be globally unique).
3. **Subtitle** (separate 30 char field, shown under the name — NOT subject to
   the name-uniqueness rule). This is where the extra keywords go.

⚠️ **Two constraints collide:**
- **Taken:** the exact name **"Deep Breathing Exercises"** (24 ch) is held by
  another live app (Thach Nguyen Trong). Unless our domain/brand takeover also
  acquired that app/developer account, ASC will reject the bare exact name.
- **Length:** the desired **"Deep Breathing Exercises: Calm & Sleep" = 38 ch**,
  over the 30 limit. "& Sleep" must move to the Subtitle field.

**Resolution — name vs subtitle split (LOCKED):**
```
Name (30):     Deep Breathing: Calm & Sleep      ← 28 ch, no exact live match
Subtitle (30): Box Breathing, 4-7-8 & Timer      ← techniques + "timer" keyword
```
Decided 2026-06-21:
- The brand takeover was the **domain only** (prior owner let
  deepbreathingexercises.com lapse) — it did NOT include the existing
  "Deep Breathing Exercises" App Store app, so that bare name is unavailable.
- Chose the cleaner consumer headline **"Deep Breathing: Calm & Sleep"** over
  "Deep Breathing Exercises: Calm". Tradeoff: drops the literal "Exercises"
  (slightly less domain-literal) but leads with "Deep Breathing", reads better,
  and surfaces the two highest-intent benefits (Calm, Sleep). The
  deepbreathingexercises.com domain still serves as the marketing/support URL.
- Verified against the live US store (iTunes Search API): no exact app named
  "Deep Breathing: Calm & Sleep" or close variants. The bare "Deep Breathing"
  (Oratu) exists but a distinct "Brand: Tagline" string is allowed.

Backup names if the primary is reserved in ASC (reserved ≠ visible in the public
store): `Deep Breathing Exercises: Calm` (30) or `Deep Breathing: Box & Calm`.
Confirm the primary in App Store Connect tomorrow.

---

## Subtitle (30 char max) — pick one

**Option A (clarity + calm)**
```
Guided Breathing & Calm
```
(23 characters)

**Option B (keyword-rich)**
```
Box, 4-7-8 & Calm Breathing
```
(28 characters)

**Option C (benefit-led)**
```
Calm Your Mind, Breathe Better
```
(30 characters — exactly at limit)

Recommendation: Option B surfaces the two highest-search techniques and fits well.

---

## Promotional Text (170 char max)
Promotional text can be updated any time without a new app version. Use this for seasonal or timely messaging.

```
Free guided breathing for calm, focus, and sleep. Try box breathing, 4-7-8, coherent breathing, and more — with soothing audio and gentle haptics.
```
(147 characters)

---

## Full Description (4,000 char max, keyword-rich, no medical claims)

```
Deep Breathing Exercises guides you through established breathing patterns with a smooth, animated orb visualizer. Open the app and follow a session — no sign-up required for the core experience.

BREATHING MODES

• Box Breathing (4-4-4-4) — equal inhale, hold, exhale, hold. A commonly practiced rhythm for a focused breathing break; individual experiences vary.
• 4-7-8 Breathing — extended-exhale pattern often used in a wind-down routine; it is not a sleep treatment.
• Coherent Breathing (5.5-5.5) — slow, even rhythm at roughly 5 breaths per minute. The app makes no heart-rate or other health-outcome promise.
• Physiological Sigh — double inhale followed by a long exhale. A brief guided pattern for stressful moments; effects vary by person.

FEATURES

• Animated orb visualizer — a gentle, pulsing cue that expands and contracts with each phase of your breath.
• Audio soundscapes — drone tones, binaural beats, and pink noise to deepen focus. Phase cue tones mark each breath transition.
• Haptic feedback — subtle vibrations guide your breath on exhale, so you can breathe eyes-closed.
• Session timer — choose a 1, 3, 5, or 10 minute session.
• Adjustable speed — slow down or speed up any pattern to match your capacity.
• Local session stats — sessions and minutes tracked on-device, no account required.
• Keep-awake mode — screen stays on during your session.
• Optional account — sign in to sync your stats and settings across devices.
• Dark and light mode support.

BREATHING AND YOUR HEALTH

Deep Breathing Exercises provides timed breathing guidance based on established patterns. It is not a medical device and does not diagnose, treat, or prevent any condition. Breathing practices are not a substitute for professional care, and individual results are not guaranteed. Consult a qualified healthcare provider before starting a new practice, especially if you have a respiratory condition, cardiovascular issue, or are pregnant.

PRIVACY

We do not sell your data. Analytics are aggregated and not tied to advertising. Optional accounts use email or Google sign-in only. See our Privacy Policy at deepbreathingexercises.com/privacy.
```

---

## Keywords Field (100 char max, comma-separated)

ASO targeting: high-volume breathing/calm/sleep/anxiety terms.

```
breathing,calm,box breathing,4-7-8,sleep,anxiety,meditation,relax,stress,breathe,focus,mindfulness
```
(99 characters — fits)

Alternate if any term triggers rejection:
```
breathing,calm,box breathing,4-7-8,sleep,stress relief,meditation,relax,focus,mindfulness,inhale
```

---

## Support URL (historical field; candidate contact selected)

```
https://deepbreathingexercises.com/support
```

The branded apex has no MX record and cannot receive replies. Candidate source now uses the
established receiving mailbox `hi@abiassi.com`, whose domain has inbound MX. The live support
page must be deployed and rechecked before Build 18 metadata is entered; see
[`submission-checklist.md`](./submission-checklist.md).

## Marketing URL

```
https://deepbreathingexercises.com
```

---

## Category

- **Primary:** Health & Fitness
- **Secondary (optional):** Lifestyle

---

## Age Rating Answers

Complete the age rating questionnaire in App Store Connect as follows:

| Question | Answer |
|---|---|
| Made for Kids | No |
| Unrestricted Web Access | No (WKWebView loads only deepbreathingexercises.com — a single controlled domain) |
| Cartoon or Fantasy Violence | No |
| Realistic Violence | No |
| Sexual Content or Nudity | No |
| Profanity or Crude Humor | No |
| Mature/Suggestive Themes | No |
| Horror/Fear Themes | No |
| Medical/Treatment Information | No (breathing guidance only; standard disclaimer present) |
| Alcohol, Tobacco, Drugs | No |
| Gambling | No |
| Contests | No |
| Social Networking | No |
| User-Generated Content | No |

**Expected age rating: 4+**

---

## Copyright

```
© 2026 Darkmatter AI Labs
```
