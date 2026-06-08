# Expo Breathing App — progress / handoff

**Status: PIVOTED to web-parity. v1 render parity achieved (Expo web + iOS sim, light + dark).
Audio audibility + on-device tap interaction await human confirmation.**

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
  `setAudioModeAsync({playsInSilentMode:true})`, and a **native haptics bridge**
  (`onEvent('haptic',{phase})` → `expo-haptics`, because `navigator.vibrate` is a no-op in WKWebView).
- `app.json` — `userInterfaceStyle: "automatic"` (device-driven light/dark); bundle `com.deepbreathing.app`.

## Verified ✅ (with screenshots)

| Item | Expo web | iOS sim (WebView) | Screenshot |
|---|---|---|---|
| Morphing blob orb + glow + ring + hue | ✅ | ✅ | `docs/screenshots/dom-ios-dark.png` |
| Canvas particle field | ✅ | ✅ | same |
| In-orb phase + instruction text (i18n, auto-locale) | ✅ ("INSPIRE DEVAGAR…") | ✅ render | — |
| Tap-to-start → running state | ✅ (web) | ⏳ needs tap | — |
| Duration chips | ✅ | ✅ | dark/light shots |
| Settings gear → sheet (speed, mute, mode, theme toggle) | ✅ | ✅ render | — |
| **Light theme** (cream bg) | ✅ `--background rgb(253,248,242)` (DOM-inspected) | ✅ | `docs/screenshots/dom-ios-light.png` |
| **Dark theme** (warm-dark) | ✅ | ✅ | `docs/screenshots/dom-ios-dark.png` |
| Generative AudioContext starts (no errors) | ✅ | ⏳ needs tap | — |
| Background → audio suspend | ✅ wired (AppState→prop) | wired | — |
| tsc clean / 47 vitest green | ✅ | — | — |

(The 47 vitest tests cover the **retired** native engine's pure modules; still green. The web
`BreathingExperience` reuses the website's own — already production-tested — engine.)

## Pending ⏳ / known gaps

1. **Audio audibility on iOS (human-only).** The generative engine is wired and the AudioContext
   starts on Expo web with no errors, but actual sound on the iOS WebView needs an ear. The
   audioService's tiny base64 **unlock WAV `DecodeError`'d** in WKWebView (logged) — the primary
   `AudioContext.resume()` on the in-WebView orb tap should still unlock it; **verify on the sim/device**.
   Silent-switch: `setAudioModeAsync({playsInSilentMode:true})` is applied natively; confirm it covers
   the WebView's audio session (spec risk — unverified).
2. **iOS tap-to-start interaction** — render is proven; the running state (orb breathing, phase
   transitions, pause/resume/stop) is verified on Expo web but not yet on the sim, because there is
   **no headless sim-tap tool** installed (idb/cliclick absent; AppleScript blocked by Accessibility).
   Tap manually, or `brew tap facebook/fb && brew install idb-companion && pipx install fb-idb` to script it.
3. **Haptics felt** — wired (native bridge) + tsc-clean, but cannot be felt on the simulator;
   confirm on a real device.
4. **Safe-area / status bar polish** (mobile-adaptation phase) — light mode shows a black native
   strip behind the top safe area; make the host edge-to-edge / theme-matched.
5. Dev-only "Open debugger to view warnings" banner — non-fatal; triage the warning.
6. Remove the retired native re-implementation (`src/breathing/*`, `src/components/breathing/*`,
   `src/app/breathe-web.tsx`) once the DOM path is signed off.

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
