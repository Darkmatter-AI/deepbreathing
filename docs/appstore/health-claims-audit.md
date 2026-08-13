# App Review Risk Audit — Health Claims & Minimum Functionality

> **Build 18 correction note:** this audit is a wording and review-risk guard, not medical
> evidence or an approval prediction. The iOS candidate must use neutral practice language,
> keep the disclaimer visible, and avoid promising a clinical, sleep, stress, or heart-rate
> outcome. Wim Hof is not exposed in the current iOS mode library; do not advertise it or imply
> that an unbuilt warning screen exists.

For the avoidance of doubt: **Wim Hof is excluded from the iOS mode library for Build 18.**

## Guideline 1.4.1 — Physical Harm (Medical Claims)

### Risk level: Requires explicit wording review

Apple Guideline 1.4.1 flags claims about diagnosing, treating, preventing, or reliably changing a
medical condition. A disclaimer does not make an overconfident claim safe by itself. Treat each
store field and in-app label as a separate review surface; if a phrase sounds like a promise,
remove it or describe the practice without an outcome.

---

### Risky phrases to audit before submission

Scan all strings in the app (mode descriptions, UI copy, onboarding text, and the listing copy) for these patterns:

| Phrase type | Example to remove or soften | Safer replacement |
|---|---|---|
| Diagnoses | "reduces anxiety disorder" | "guided breathing practice for a pause" |
| Treats | "treats insomnia" | "often used in a wind-down routine; not a sleep treatment" |
| Clinical outcomes | "lowers blood pressure" | "slow, even breathing pattern; no heart-rate outcome promised" |
| Medical device claims | "FDA-cleared" | (do not use) |
| Guarantees | "will calm you in 60 seconds" | "a brief guided pattern for stressful moments; effects vary" |

#### Current mode descriptions (from engine) — risk assessment

| Mode | Description string | Risk | Action |
|---|---|---|---|
| Box | "Focus & Stress Reduction (4-4-4-4)" | Review | Prefer "a focused breathing break"; do not promise stress reduction |
| Relax | "Sleep & Deep Relaxation (4-7-8)" | Review | Prefer "wind-down breathing pattern"; do not promise sleep or treatment |
| Coherent | "Heart Rate Variability (5.5-5.5)" | Review | Remove the biometric outcome from store-facing copy; describe the slow rhythm |
| Sigh | "Stress Reset (Double Inhale)" | Review | Prefer "brief pattern for stressful moments"; effects vary |
| Pursed Lip | "Gentle Longer Exhale (2-4 ratio)" | Review | Keep it as a technique description; do not connect it to COPD or another condition |
| Wim Hof | Not in the iOS mode library | Blocked | Do not advertise or expose until a separate safety review and warning flow exist |

#### Protocol modes — explicitly out of Build 18 scope

Protocol modes that include rapid breathing or breath retention require their own safety
warning, user-flow review, and store-copy review. Build 18 does not expose Wim Hof in the iOS
mode library. Do not describe the dormant protocol engine as a shipped feature, and do not tell
Apple that a warning screen exists. Re-open this audit only if a future build adds the complete
warning and stop-flow.

---

### Required disclaimer wording

Keep this disclaimer in the app and in the App Store description. It sets scope; it does not
support a clinical claim.

```
Deep Breathing Exercises provides timed breathing guidance based on established
patterns. It is not a medical device and does not diagnose, treat, or prevent
any condition. Individual results are not guaranteed. Consult a qualified
healthcare provider before starting a new breathing practice, especially if you
have a respiratory condition, cardiovascular issue, or are pregnant.
```

Shorten for in-app UI where space is limited:

```
Not medical advice. Individual results vary. Consult a healthcare professional
before beginning if you have a health condition.
```

---

## Guideline 4.2 — Minimum Functionality (Webview Wrapper)

### Risk level: Evidence required at review time

Apple 4.2 asks whether an app provides meaningful utility beyond opening a URL in Safari. The
review notes should describe only native behavior that was exercised on the Build 18 binary;
do not rely on this document as proof of functionality.

### Argument for approval

The following native capabilities are implemented in the Expo/React Native layer and are **not available in the browser**:

| Native capability | Evidence |
|---|---|
| Haptic feedback per breath phase | `expo-haptics` called in `index.tsx` on each phase transition |
| Audio session management (AVAudioSession) | `expo-audio` plugin configured; audio continues while screen is locked |
| Screen keep-awake during sessions | `expo-keep-awake` / `useKeepAwake` active during breathing sessions |
| Persistent local stats | `AsyncStorage` (`resonance_settings`, `resonance_stats`) — survives app restarts, no login required |
| Native phase-transition cue audio | `playCue` in `lib/audio.ts` — discrete tones on inhale/exhale cues |
| Completion moment | Session complete state with stats written to storage |
| Optional cross-device sync | Better Auth account system — not available on the open web without login |
| Native splash screen | `expo-splash-screen` configured |
| Portrait lock | `orientation: portrait` enforced natively |

### Strongest points to emphasise in review notes

1. Haptics: verify the phase feedback on a physical device and describe only what passed.
2. Audio session: verify silent-switch, background, and lock-screen behavior on the candidate.
3. Offline: verify which assets are bundled before claiming that a session works without network.

### If Apple still flags 4.2

Standard remediation is to add at least one more screen of native-only content. Options in priority order:

1. A native stats / history screen (already exists in the engine data model — `resonance_stats`)
2. A native settings screen with haptic-preview on toggle
3. A native onboarding carousel

---

## Go / No-Go Readiness Checklist

### Green (already done or low risk)
- [ ] Store and in-app copy reviewed against the Build 18 wording table
- [x] No IDFA / ATT trigger
- [x] `ITSAppUsesNonExemptEncryption = false` in `infoPlist`
- [x] Guest-first flow — no login wall
- [x] Haptics, audio, keep-awake all native
- [x] `AsyncStorage` for local persistence
- [x] Export compliance declaration set

### Amber (needs action before submission)
- [x] "Panic Reset" mobile label renamed to "Stress Reset"
- [x] Wim Hof excluded from the iOS mode library and listing
- [x] Short safety/disclaimer text visible in the mobile Settings sheet
- [x] Receiving support contact selected (`hi@abiassi.com`; domain MX verified)
- [ ] Updated support page deployed and its live `mailto:` verified
- [ ] Privacy page and App Store nutrition label rechecked against the Build 18 binary
- [ ] Optional sign-in/reviewer notes rechecked on a physical device

### Red (blockers)
- [ ] Build 18 physical-device gate is still pending; no store submission until it passes
- [ ] Live support page still exposes the old non-receiving branded address until deployment
