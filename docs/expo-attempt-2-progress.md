# Expo Breathing App — progress / handoff

**Status: PIVOTED to web-parity. v1 achieved — render AND interactive flow verified on Expo web +
iOS sim, light + dark, with screenshots. Only physical audio audibility remains human-only.**

_Last updated: 2026-06-08._

## The pivot (important)

The original plan was a **native Reanimated re-implementation** of the breathing visualizer
(milestones M1–M6, committed `a7aa51d`..`f75f711`). On review it was **not 1:1 with the branded
website** — the site's morphing-blob orb (CSS `border-radius` morph + `filter: blur` glow +
`hue-rotate`), canvas particle field, and **generative Web-Audio engine** cannot be reproduced in
React-Native StyleSheet. Per the directive *"parity with the website is non-negotiable; light + dark;
then adapt to mobile,"* the native re-implementation is **retired** (files kept for reference) and the
app now **reuses the real web code** via an **Expo DOM component** (`'use dom'`) — WebView on native,
plain DOM on Expo web → 1:1 by construction.

## Architecture

- `apps/mobile/src/components/breathing-web/` — the real web `Resonance` tree, vendored:
  - `Visualizer.tsx`, `ParticleBackground.tsx`, `SnowBackground.tsx`, `services/audioService.ts`,
    `runtime-phrases.ts`, `types.ts`, `constants.ts`, `ui/sheet.tsx`, `lib/cn.ts` — **verbatim**.
  - `BreathingExperience.tsx` — extracted from `src/components/resonance/Resonance.tsx`; all
    Next.js / auth / conversion / i18n-bridge / analytics couplings stripped to props
    (`locale`, `forcedTheme`, `initialDuration`, `appState`, `onSessionComplete`, `onEvent`); the
    interactive core (rAF loop, phase machine, audio wiring, settings Sheet) kept byte-identical.
    Restored an in-app light/dark toggle (`themeOverride ?? forcedTheme`).
  - `BreathingExperience.dom.tsx` — the `'use dom'` wrapper (imports the compiled CSS).
  - `breathing-web.css` — Tailwind **pre-compiled** to a static artifact (no NativeWind).
    Rebuild with `npm run breathing:css` after any class change (source: `styles/source.css`,
    `tailwind.config.cjs`).
- `apps/mobile/src/app/index.tsx` — native host screen: device locale (`expo-localization`),
  theme (`useColorScheme` → `forcedTheme`), `AppState` → audio-suspend bridge,
  `setAudioModeAsync({playsInSilentMode:true})`, a **native haptics bridge**
  (`onEvent('haptic',{phase})` → `expo-haptics`, because `navigator.vibrate` is a no-op in WKWebView),
  and a **keep-awake bridge** (`onEvent('keep_awake',{active})` → `expo-keep-awake`).
  Host callbacks are `useCallback`-stable so the DOM component's effects don't re-fire.
- **Keep-awake** keeps the screen on during a running session and lets it sleep when paused/
  stopped. Keyed off the experience's `isRunning` (emitted from `BreathingExperience.tsx`), **not**
  the `session_start`/`session_end` analytics events — a resume from pause does not re-fire
  `breathing_session_start`, so keying off those would let the screen sleep after a pause→resume.
- **Haptics mapping** (cleaned up this session, conservative): inhale `Light`, hold `Medium`
  (single tap — dropped the old `setTimeout` double-buzz), exhale `Medium` (was `Heavy`, which read
  as an alert). Gentle breath markers, not alarms. ⚠️ The *feel* is unverified on hardware (the
  simulator has no haptics) — see DAR-395.
- `app.json` — `userInterfaceStyle: "automatic"` (device-driven light/dark); bundle `com.deepbreathing.app`.

## Verified ✅ (with screenshots)

| Item | Expo web | iOS sim (WebView) | Screenshot |
|---|---|---|---|
| Morphing blob orb + glow + ring + hue | ✅ | ✅ | `docs/screenshots/dom-ios-dark.png` |
| Canvas particle field | ✅ | ✅ | same |
| In-orb phase + instruction text (i18n, auto-locale) | ✅ ("INSPIRE DEVAGAR…") | ✅ ("INHALE SLOWLY…") | `dom-ios-running.png` |
| Tap-to-start → running state | ✅ | ✅ orb grows, "INHALE SLOWLY…" | `dom-ios-running.png` |
| Phase cycling (inhale→hold→exhale) | ✅ | ✅ → "EXHALE…" | `dom-ios-exhale.png` |
| Pause / resume (tap orb) | ✅ | ✅ Play icon ↔ running | `dom-ios-*` |
| Session clock ticks | ✅ | ✅ 0:58 in sheet | `dom-ios-settings.png` |
| Duration chips | ✅ | ✅ | `dom-ios-settings.png` |
| Settings gear → sheet (speed, mute, mode, theme) | ✅ | ✅ opens, all controls | `dom-ios-settings.png` |
| **Mode selection** (6 modes) | ✅ | ✅ Box→Coherent, pattern updates | `dom-ios-mode-switch.png` |
| In-app light/dark toggle | ✅ | ✅ light↔dark | `dom-ios-theme-toggle.png` |
| **Light theme** (cream bg) | ✅ `--background rgb(253,248,242)` | ✅ | `dom-ios-light.png` |
| **Dark theme** (warm-dark) | ✅ | ✅ | `dom-ios-dark.png` |
| Audio unlock/resume on tap | ✅ AudioContext created | ✅ **unlocked+running** (session passed the resume-gate) | — |
| Background → audio suspend | ✅ wired (AppState→prop) | wired | — |
| tsc clean / 47 vitest green | ✅ | — | — |

(The 47 vitest tests cover the **retired** native engine's pure modules; still green. The web
`BreathingExperience` reuses the website's own — already production-tested — engine.)

### iOS interaction — NOW VERIFIED via `idb` (resolved)

The headless sim-tap blocker is solved: `idb_companion` 1.1.8 (`brew install facebook/fb/idb-companion`)
+ `fb-idb` on **Python 3.10** (`brew install python@3.10`; the system 3.14 crashes fb-idb on the
removed `asyncio.get_event_loop()`). Repro:
```bash
brew install python@3.10 && /opt/homebrew/bin/python3.10 -m venv /tmp/idb310 && /tmp/idb310/bin/pip install fb-idb
UDID=910F5A6F-0A5A-47B6-84DB-8A079449BAF3   # iPhone 17 Pro
PATH="/opt/homebrew/bin:$PATH" /tmp/idb310/bin/idb ui tap 197 340 --udid $UDID   # orb (start/pause), pts
# gear ≈ (363,105); Coherent mode ≈ (273,688); theme toggle ≈ (289,300)
```
Driven on the sim with screenshots: tap-to-start → "INHALE SLOWLY" (orb grows), phase cycle →
"EXHALE", pause↔resume, clock 0:58, settings sheet, mode Box→Coherent, light↔dark toggle. The
session passing `handleTogglePlay`'s `if (!resumed) return` gate proves **`AudioContext.resume()`
returned `'running'` — audio is unlocked and the generative engine is live on iOS.**

## Pending ⏳ / known gaps

Most of these are now tracked in Linear (project **Deep Breathing**, team **DAR**) — see the backlog
table below. The device-only checks are bundled into the release/QA ticket **DAR-395**.

1. **Physical audio audibility (human-only)** → **DAR-395**. Engine is unlocked + running on iOS
   (above), and the in-app "make sure your phone is not on silent" hint shows — but whether sound
   actually comes out of the speakers / survives the hardware mute switch can only be confirmed by
   ear. The base64 **unlock WAV `DecodeError`'d** in WKWebView (logged, non-fatal since
   `ctx.resume()` is the real unlock); if a device test is ever silent, drop that element and rely
   on `resume()` alone.
2. **Haptics feel (unverified on hardware)** → **DAR-395**. The discrete mapping is implemented +
   tsc-clean, but the simulator produces no haptics, so the *feel* is unconfirmed — "cleanup" did
   not finalize the intensities. Confirm on a device; only re-tune to `Soft`/`selectionAsync` after
   feeling them (both can be near-imperceptible on Android). Rich continuous haptics → **DAR-398**.
3. **Keep-awake on device** → **DAR-395**. Wired + web-smoke-verified (start/pause paths run clean,
   no console errors), but confirm on a device that the screen stays on while running and sleeps on
   pause/stop — including after a pause→resume and a background→foreground round-trip.
4. **Safe-area / status bar polish** → **DAR-400** (considerate polish). Light mode shows a black
   native strip behind the top safe area; make the host edge-to-edge / theme-matched.
5. Dev-only "Open debugger to view warnings" banner — non-fatal; triage the warning.
6. **Remove the retired native re-implementation** (`src/breathing/*`, `src/components/breathing/*`,
   `src/app/breathe-web.tsx`) once the DOM path is signed off → **DAR-397**.

### Backlog (Linear · project Deep Breathing · team DAR)

| Issue | Title | Priority |
|---|---|---|
| **DAR-395** | Validate Expo DOM component in a release/TestFlight build + OTA path (+ device QA) | High |
| **DAR-396** | Tech-debt: shrink the vendored fork of the breathing experience to one file | Medium |
| **DAR-397** | Cleanup: remove the retired native re-implementation | Medium |
| **DAR-398** | Continuous "breathing" haptics via a custom Expo module (Core Haptics / waveform) | Medium |
| **DAR-399** | Background / lock-screen audio for sleep modes (native audio engine) | Medium |
| **DAR-400** | Considerate, non-invasive session polish (true-black night mode, Reduce Motion, silent/DND) | Low |
| **DAR-401** | Exploration: HRV-adaptive pacing + Apple Watch breathing | Low |

(Discrete haptics baseline: **DAR-387**, now implemented — see its comment.)

## Release/OTA gate (DAR-395) — config authored ✅, build pending (device-only)

EAS build + OTA wiring is authored (commit `73a233f`, branch `chore/nix-expo-attempt-1`):

- `apps/mobile/app.json` — `runtimeVersion: { policy: "fingerprint" }` + `updates: { fallbackToCacheTimeout: 0 }`.
- `apps/mobile/eas.json` (new) — `development` (dev-client/internal), `preview` (internal ad-hoc
  device install, channel `preview`, `ios.simulator: false`), `production` (channel `production`);
  `cli.appVersionSource: "remote"`. `projectId`/`updates.url` are left for `eas init` +
  `eas update:configure` to inject (no malformed placeholder).

**Gate is now a device task** (user runs `eas`): `expo install expo-updates` → `eas init` →
`eas update:configure` (then re-confirm `runtimeVersion` stayed `fingerprint`) → `eas device:create`
→ `eas build -p ios --profile preview` → install + run the QA checklist (render-in-release,
haptics feel, keep-awake, audio audibility+mute, OTA round-trip). Full runbook in the DAR-395
comment. **Feature tickets 396–399 stay blocked until this gate passes.**

## Exact next commands

```bash
cd /Users/abi/Sites/deepbreathing/apps/mobile
fnm exec --using=22 -- npm test            # 47 vitest (retired native engine)
fnm exec --using=22 -- npx tsc --noEmit    # clean
fnm exec --using=22 -- npm run breathing:css  # rebuild CSS after class changes

# Run it
fnm exec --using=22 -- npx expo start --port 8081 --clear   # web: open localhost:8081 ; native: see below
export PATH="/opt/homebrew/bin:$PATH"
fnm exec --using=22 -- npx expo run:ios     # native sim build (DOM webview)
xcrun simctl ui booted appearance light|dark  # flip theme
xcrun simctl io booted screenshot /tmp/x.png
# IMPORTANT: after JS edits, a stale dev-client bundle can mislead — restart Metro with --clear
# and cold-launch (xcrun simctl terminate/launch booted com.deepbreathing.app) before judging.
```

## Suggestions

1. **Do the human audio/tap check** on the running sim (tap the orb → hear the soundscape, test the
   iOS mute switch). If silent, wire an explicit `AudioContext.resume()` on the orb's `pointerdown`
   inside the WebView (and consider dropping the base64-unlock element that DecodeErrors).
2. **Adapt-to-mobile pass** (after parity sign-off): edge-to-edge safe areas + theme-matched native
   container, then remove the retired native re-implementation to shrink the tree.
3. **Validate a release build**, not just dev — Expo DOM components have open reports of working in
   dev but not in release/TestFlight (expo/expo#35443); confirm before shipping.
