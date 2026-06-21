# App Store Connect — Listing Copy

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

**Resolution — name vs subtitle split:**
```
Name (30):     Deep Breathing Exercises: Calm     ← 30 ch exactly, unique
Subtitle (30): Sleep, Box & 4-7-8 Breathing       ← carries "Sleep" + keywords
```
This is unique (distinct string from the taken bare name), fits, leads with the
full brand, and still surfaces Calm + Sleep + the techniques.

Alternatives if "…: Calm" is reserved: `Deep Breathing Exercises: Box` (29) or
`Deep Breathing Exercises: Relax` (31 — too long, drop). If the takeover DID
include the existing app, transfer it and use the clean **`Deep Breathing
Exercises`** as the name with the subtitle above. Confirm in ASC tomorrow.

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
Deep Breathing Exercises guides you through scientifically studied breathing techniques with a smooth, animated orb visualizer. Just open the app and breathe — no sign-up required.

BREATHING MODES

• Box Breathing (4-4-4-4) — equal inhale, hold, exhale, hold. A go-to for focus and stress relief used by athletes and first responders.
• 4-7-8 Breathing — extended exhale and hold pattern associated with relaxation and sleep onset.
• Coherent Breathing (5.5-5.5) — slow, even rhythm at roughly 5 breaths per minute, studied for heart rate variability and calm.
• Physiological Sigh — double inhale followed by a long exhale. A fast reset for acute stress and panic moments.
• Wim Hof Method — 30 power breaths followed by breath retention, across 3 rounds. For energy and cold-tolerance training.

FEATURES

• Animated orb visualizer — a gentle, pulsing cue that expands and contracts with each phase of your breath.
• Audio soundscapes — drone tones, binaural beats, and pink noise to deepen focus. Phase cue tones mark each breath transition.
• Haptic feedback — subtle vibrations guide your breath on exhale, so you can breathe eyes-closed.
• Session timer — open-ended or timed sessions (1, 2, 5, or 10 minutes).
• Adjustable speed — slow down or speed up any pattern to match your capacity.
• Local session stats — sessions and minutes tracked on-device, no account required.
• Keep-awake mode — screen stays on during your session.
• Optional account — sign in to sync your stats and settings across devices.
• Dark and light mode support.

BREATHING AND YOUR HEALTH

Deep Breathing Exercises provides timed breathing guidance based on established techniques. It is not a medical device and does not diagnose, treat, or prevent any condition. Consult a qualified healthcare provider before starting any new breathing practice, especially if you have a respiratory condition, cardiovascular issue, or are pregnant.

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

## Support URL

```
https://deepbreathingexercises.com/support
```

(Page does not yet exist — create `src/app/support/page.tsx`. See note in submission-checklist.md.)

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
