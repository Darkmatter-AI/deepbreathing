# App Review Risk Audit — Health Claims & Minimum Functionality

## Guideline 1.4.1 — Physical Harm (Medical Claims)

### Risk level: Low-to-Medium (manageable with disclaimers)

Apple Guideline 1.4.1 flags apps that make claims about diagnosing, treating, or preventing medical conditions. Breathing apps are common on the App Store and routinely approved, but specific phrasing can trigger a rejection or a request for medical documentation.

---

### Risky phrases to audit before submission

Scan all strings in the app (mode descriptions, UI copy, onboarding text, and the listing copy) for these patterns:

| Phrase type | Example to remove or soften | Safer replacement |
|---|---|---|
| Diagnoses | "reduces anxiety disorder" | "may help you feel calmer" |
| Treats | "treats insomnia" | "associated with relaxation and sleep onset" |
| Clinical outcomes | "lowers blood pressure" | "studied for its effects on heart rate variability" |
| Medical device claims | "FDA-cleared" | (do not use) |
| Guarantees | "will calm you in 60 seconds" | "a fast reset for stress moments" |

#### Current mode descriptions (from engine) — risk assessment

| Mode | Description string | Risk | Action |
|---|---|---|---|
| Box | "Focus & Stress Reduction (4-4-4-4)" | Low | Fine as-is |
| Relax | "Sleep & Deep Relaxation (4-7-8)" | Low-Medium | "Relaxation" is fine; avoid claiming it "treats" sleep disorders |
| Coherent | "Heart Rate Variability (5.5-5.5)" | Low | HRV is a measurable biometric, not a medical diagnosis; fine as scientific context |
| Sigh | "Panic Reset (Double Inhale)" | Medium | "Panic Reset" could imply treatment of panic disorder. Consider "Stress Reset" |
| Wim Hof | "Energy & Resilience (30 breaths × 3 rounds)" | High (see below) | |

#### Wim Hof — elevated scrutiny

The Wim Hof method involves intentional hyperventilation and breath retention. Apple reviewers and human rights/medical bodies have noted risks including:

- Loss of consciousness (hypocapnia) during retention, especially in water
- Cardiovascular strain for users with cardiac conditions

The app currently includes this mode and the `WIM_HOF_PROTOCOL` engine. **This is the single highest App Review risk factor.** Mitigations:

1. Add an in-app warning screen before the first Wim Hof session: "This technique involves intentional breath retention. Do not practice in or near water. Consult a doctor if you have a heart condition, are pregnant, or have a respiratory condition. Stop if you feel dizzy."
2. In the App Store listing and review notes, describe it as "the Wim Hof-style breathing sequence" and note the disclaimer is present in the app.
3. Do not use words like "therapeutic" or "treatment" anywhere near this mode.

---

### Required disclaimer wording

Add this disclaimer to the app — ideally in an Info/About screen and in the App Store description. It is already included in the listing.md draft.

```
Deep Breathing Exercises provides timed breathing guidance based on established
techniques. It is not a medical device and does not diagnose, treat, or prevent
any condition. Consult a qualified healthcare provider before starting any new
breathing practice, especially if you have a respiratory condition, cardiovascular
issue, or are pregnant. Do not practice breath-retention techniques in or near water.
```

Shorten for in-app UI where space is limited:

```
Not medical advice. Consult a doctor before beginning if you have a health condition.
Do not practice breath retention near water.
```

---

## Guideline 4.2 — Minimum Functionality (Webview Wrapper)

### Risk level: Low (strong native differentiators exist)

Apple 4.2 rejects apps that are "simply a repackaged website." The concern is an app that adds no value over opening a URL in Safari. This app is a WKWebView wrapper, which is the single biggest structural risk.

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

1. Haptics: the website cannot trigger device haptics. The app does, on every breath phase.
2. Audio session: AVAudioSession with background audio entitlement keeps cue tones playing when the user locks the screen. Safari cannot do this.
3. Offline: once installed, the breathing engine and audio assets load without network. The web requires an internet connection.

### If Apple still flags 4.2

Standard remediation is to add at least one more screen of native-only content. Options in priority order:

1. A native stats / history screen (already exists in the engine data model — `resonance_stats`)
2. A native settings screen with haptic-preview on toggle
3. A native onboarding carousel

---

## Go / No-Go Readiness Checklist

### Green (already done or low risk)
- [x] No medical device claims in current mode descriptions
- [x] No IDFA / ATT trigger
- [x] `ITSAppUsesNonExemptEncryption = false` in `infoPlist`
- [x] Guest-first flow — no login wall
- [x] Haptics, audio, keep-awake all native
- [x] `AsyncStorage` for local persistence
- [x] Export compliance declaration set

### Amber (needs action before submission)
- [ ] "Panic Reset" mode label — consider renaming to "Stress Reset" to reduce 1.4.1 risk
- [ ] Wim Hof in-app warning screen — must be added before review
- [ ] Disclaimer text visible in-app (Info/About sheet or onboarding)
- [ ] Support page live at deepbreathingexercises.com/support
- [ ] Privacy page updated with mobile-app data collection section
- [ ] Demo account credentials ready for reviewer (required since login exists)

### Red (blockers)
- [ ] None currently — but if Apple flags 4.2, a native stats screen is the fastest mitigation
