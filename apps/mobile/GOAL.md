# GOAL — Expo Breathing App (historical attempt 2)

This file records the overnight build plan for historical context. It is not the Build 18
release checklist; use `docs/appstore/submission-checklist.md` for the current release gate.

## What we're building

A native iOS/Android app (Expo SDK 56, RN 0.85, React 19.2, expo-router) focused on the
breathing **visualizer**. v1 started with the 3 non-protocol modes (Box, Relax, Coherent).
The app lives at `apps/mobile` as a member of the repository pnpm workspace; dependencies are
resolved by the root `pnpm-lock.yaml`. Do not use standalone npm/package-lock instructions.

The web app `deepbreathingexercises.com` (`src/components/resonance/*`) is the design reference.
A first port was removed in commit `5239540` and preserved at tag **`expo-attempt-1`** for
cherry-picking (`apps/resonance-mobile-app/*`, `lib/audio.ts`, `assets/audio/*`).

## Environment (load-bearing)

- **Node version:** use the version pinned by the current CI workflow for reproducible checks.
  Do not infer a release result from an unpinned global Node installation.
- iPhone 17 Pro simulator booted; Xcode 26.5. Native verify: `expo run:ios` then
  `xcrun simctl io booted screenshot /tmp/ios-<state>.png`.
- Web verify: `expo start --web` on `:8081`, drive via claude-in-chrome MCP.

## Locked technical decisions

- **Orb = Reanimated** (not Skia) — renders identically web + native, keeps both loops green.
- **Glow = layered Views** (react-native-svg is NOT installed) — concentric translucent circles.
- **Styling = StyleSheet** (not NativeWind) — zero config, identical web/native.
- **Engine tests = vitest** on the pure modules (`engine.ts`, `session.ts`, `patterns.ts`).
- **Audio v1 = the 3 cue WAVs** from the tag (inhale/exhale/hold). NOTE: all three are
  identical 17684-byte **placeholders** — verify "wired + plays without error", never "audible".

## Architecture — the two drift-critical decisions (from advisor review)

The pure modules can't protect the hook, so these two live as **pure, vitest-tested helpers** in
`session.ts`, and the hook just calls them:

1. **Pause / background-pause uses an effective clock.** Keep a `pausedTotalMs` offset and feed
   `effectiveNow = Date.now() - pausedTotalMs` as `now` to EVERY cursor/session call. Cursor
   anchors (`phaseStartMs`) live in this effective timeline, so they never need re-anchoring;
   paused time simply doesn't count toward `advanceCursor`, `sessionElapsedSeconds`, or
   `isSessionComplete`. Helpers: `createPauseState`, `beginPause`, `endPause`, `effectiveNow`.

2. **Speed change mid-phase re-fires the orb animation.** `withTiming` is fire-and-forget per
   phase; the cursor self-corrects every tick but the animation does not. On BOTH phase-change
   AND speed-change, recompute via pure `orbAnimationTarget(cursor, pattern, speed, now)` →
   `{ fromScale, toScale, durationMs }`, set `scale.value = fromScale`, then
   `scale.value = withTiming(toScale, { duration: durationMs })`.

Other hook rules:
- Drive the interval from **refs** (running/pattern/speed/duration/muted), not closure captures
  — stale-`setInterval` bug, and `experiments.reactCompiler: true` can mask it.
- Orb maps scale 0..1 → transform scale **0.12..1.0** (floor keeps it visible at HoldOut).
- `AppState` background → `pause()`. Changing mode while running → `stop()` then switch.

## Milestones (each ends green + a commit)

- **M1** Engine + tests green: add `"test": "vitest run"`, run vitest, run `tsc --noEmit`. Commit.
- **M2** `useBreathingSession.ts` (cursor interval + withTiming + 1s tick + auto-stop + AppState).
  Add pure pause + orb-target helpers to `session.ts` with vitest coverage. Commit.
- **M3** Single screen (`src/app/index.tsx`, one Stack in `_layout.tsx`, drop tabs/explore).
  Components in `src/components/breathing/`: Orb, PhaseLabel, ModeSelector, Controls,
  DurationChips (Off/1/3/5/10), SpeedSlider (0.5–2.0), MuteToggle. a11y labels + min touch.
  Verify on web (Chrome screenshots, click through). Commit.
- **M4** Audio (`useBreathingAudio.ts`, expo-audio: `createAudioPlayer`/`setAudioModeAsync`/
  `seekTo(0)` before replay/respect muted) + haptics (`useBreathingHaptics.ts`, native-only).
  Copy 3 WAVs into `assets/audio/`. Commit.
- **M5** Persistence (`storage.ts`, AsyncStorage: mode/speed/duration/muted) + native config in
  `app.json` (name "Deep Breathing", bundle `com.deepbreathing.app`, icons/splash, status bar). Commit.
- **M6** Full verification pass (web + iOS sim) + `docs/expo-attempt-2-progress.md` handoff.

Sequencing: bank M1–M5 (Vitest + typecheck + lint + web smoke + commits) FIRST; run the slow
`pnpm --filter mobile ios`
native build ONCE at M6 so a pod/build failure can't strand web-verifiable progress.

## Verification protocol (every milestone)

1. `pnpm --filter mobile test` (Vitest) green.
2. `pnpm --filter mobile exec tsc --noEmit` clean.
3. `pnpm --filter mobile lint` clean.
4. `pnpm --dir apps/mobile dlx expo-doctor@1.20.1` clean or explicitly dispositioned.
5. Web smoke: drive Chrome, screenshot, click each mode, start/pause/stop, watch orb + label,
   toggle mute, pick a duration.
6. (M6 only) Native smoke: `pnpm --filter mobile ios` → screenshot → Read it; confirm render, no redbox,
   orb animates, controls respond.

## Stop conditions (unsupervised run)

- Commit after each green milestone (durable progress).
- A step that fails 3 focused attempts: STOP it, write the blocker + exact repro into
  `docs/expo-attempt-2-progress.md`, move to the next INDEPENDENT milestone. Don't loop till morning.
- Browser/sim tool stuck after 2–3 tries → stop, note it.

## Definition of done (v1)

3 modes selectable · orb animates per phase with phase label · start/pause/resume/stop · duration
chips with auto-stop · speed slider · mute · audio cues (web plays / native wired) · haptics wired
· settings persist · background→pause · all unit tests green, tsc clean, web + iOS-sim
smoke-verified with screenshots.
