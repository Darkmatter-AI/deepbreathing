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
  `setAudioModeAsync({playsInSilentMode:true})`, and a **native haptics bridge**
  (`onEvent('haptic',{phase})` → `expo-haptics`, because `navigator.vibrate` is a no-op in WKWebView).
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

1. **Physical audio audibility (human-only).** Engine is unlocked + running on iOS (above), and the
   in-app "make sure your phone is not on silent" hint shows — but whether sound actually comes out
   of the speakers / survives the hardware mute switch can only be confirmed by ear. The base64
   **unlock WAV `DecodeError`'d** in WKWebView (logged, non-fatal since `ctx.resume()` is the real
   unlock); if a device test is ever silent, drop that element and rely on `resume()` alone.
2. **Haptics felt** — wired (native bridge) + tsc-clean, but cannot be felt on the simulator;
   confirm on a real device.
3. **Safe-area / status bar polish** (mobile-adaptation phase) — light mode shows a black native
   strip behind the top safe area; make the host edge-to-edge / theme-matched.
4. Dev-only "Open debugger to view warnings" banner — non-fatal; triage the warning.
5. Remove the retired native re-implementation (`src/breathing/*`, `src/components/breathing/*`,
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
