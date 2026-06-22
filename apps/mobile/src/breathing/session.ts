// Drift-resistant session scheduling — pure functions, no React Native imports.
//
// The plan's #1 timing risk: "setTimeout-driven phase transitions can drift; use
// wall-clock timing or reschedule based on expected end times."
//
// We model the running session as a cursor whose phase boundaries are anchored to
// ABSOLUTE wall-clock times. `phaseStartMs` is the exact instant a phase began;
// the next boundary is `phaseStartMs + duration`. Because each new boundary is the
// previous boundary plus the exact phase duration (never "now"), scheduling jitter
// cannot accumulate. If a timer fires late and several boundaries have already
// passed, `advanceCursor` rolls forward across all of them in one step.
//
// Note: getNextPhase already skips zero-length holds, so every phase produced for a
// sane pattern (inhale > 0, exhale > 0) has a strictly positive duration. That keeps
// the advance loop finite without special-casing 0ms phases. The guard counter is a
// belt-and-braces backstop only.

import { getNextPhase, getPhaseDurationMs, getPhaseVisualState } from "./engine";
import {
  BreathingPattern,
  BreathingPhase,
  PhaseVisualState,
} from "./types";

export interface PhaseCursor {
  /** Current phase. */
  phase: BreathingPhase;
  /** Absolute wall-clock ms at which the current phase began. */
  phaseStartMs: number;
  /** Number of fully completed breath cycles since the session started. */
  cycles: number;
}

/** Create the cursor for a freshly started session at time `now`. */
export const createCursor = (now: number): PhaseCursor => ({
  phase: BreathingPhase.Inhale,
  phaseStartMs: now,
  cycles: 0,
});

const ADVANCE_GUARD = 10_000;

/**
 * Roll the cursor forward across every phase boundary that has fully elapsed by
 * `now`. Pure: returns a new cursor, never mutates the input.
 */
export const advanceCursor = (
  cursor: PhaseCursor,
  pattern: BreathingPattern,
  speedMultiplier: number,
  now: number
): PhaseCursor => {
  let { phase, phaseStartMs, cycles } = cursor;
  const hasInhale2 = (pattern.inhale2 ?? 0) > 0;

  let guard = 0;
  while (guard++ < ADVANCE_GUARD) {
    const durationMs = getPhaseDurationMs(phase, pattern, speedMultiplier);
    // Defensive: a non-positive duration would otherwise spin the loop.
    if (durationMs <= 0) break;
    if (now < phaseStartMs + durationMs) break;

    phaseStartMs += durationMs;
    const next = getNextPhase(phase, hasInhale2, pattern.holdIn, pattern.holdOut);
    // A return to Inhale marks the completion of one full breath cycle.
    if (next === BreathingPhase.Inhale) cycles += 1;
    phase = next;
  }

  return { phase, phaseStartMs, cycles };
};

/** Elapsed ms within the current phase (clamped at >= 0). */
export const elapsedInPhaseMs = (cursor: PhaseCursor, now: number): number =>
  Math.max(0, now - cursor.phaseStartMs);

/** Visual orb state (phase, progress 0..1, scale 0..1) for the cursor at `now`. */
export const cursorVisualState = (
  cursor: PhaseCursor,
  pattern: BreathingPattern,
  speedMultiplier: number,
  now: number
): PhaseVisualState =>
  getPhaseVisualState(
    cursor.phase,
    elapsedInPhaseMs(cursor, now),
    pattern,
    speedMultiplier
  );

/** Whole seconds elapsed since the session started. */
export const sessionElapsedSeconds = (sessionStartMs: number, now: number): number =>
  Math.max(0, Math.floor((now - sessionStartMs) / 1000));

/**
 * Has a timed session reached its target? `selectedDurationSec <= 0` means
 * "no auto-stop" (run until the user stops).
 */
export const isSessionComplete = (
  sessionStartMs: number,
  selectedDurationSec: number,
  now: number
): boolean => {
  if (selectedDurationSec <= 0) return false;
  return now - sessionStartMs >= selectedDurationSec * 1000;
};

// ---------------------------------------------------------------------------
// Pause model — the "effective clock".
//
// The cursor and all session-progress functions above are pure wall-clock: they
// know nothing about "paused". So instead of re-anchoring everything on pause
// (error-prone), we run the whole session on an EFFECTIVE clock that simply
// excludes paused spans:
//
//     effectiveNow = realNow - pausedTotalMs   (frozen while paused)
//
// Feed `effectiveNow(...)` as `now` to createCursor / advanceCursor /
// sessionElapsedSeconds / isSessionComplete and paused time stops counting
// toward phase advancement AND auto-stop, with the cursor anchors untouched.
// ---------------------------------------------------------------------------

export interface PauseState {
  /** Total milliseconds spent paused across the whole session. */
  pausedTotalMs: number;
  /** Real-clock instant the current pause began, or null while running. */
  pauseStartedAtMs: number | null;
}

export const createPauseState = (): PauseState => ({
  pausedTotalMs: 0,
  pauseStartedAtMs: null,
});

/** Begin a pause at real-clock `now`. No-op if already paused. */
export const beginPause = (pause: PauseState, now: number): PauseState =>
  pause.pauseStartedAtMs !== null
    ? pause
    : { ...pause, pauseStartedAtMs: now };

/** End a pause at real-clock `now`, banking the elapsed span. No-op if running. */
export const endPause = (pause: PauseState, now: number): PauseState =>
  pause.pauseStartedAtMs === null
    ? pause
    : {
        pausedTotalMs:
          pause.pausedTotalMs + Math.max(0, now - pause.pauseStartedAtMs),
        pauseStartedAtMs: null,
      };

/**
 * The effective (active) clock at real-clock `now`: real time minus all paused
 * spans. While paused, it is frozen at the instant the pause began so the cursor
 * and session timers hold still.
 */
export const effectiveNow = (pause: PauseState, now: number): number => {
  const realNow = pause.pauseStartedAtMs ?? now;
  return realNow - pause.pausedTotalMs;
};

// ---------------------------------------------------------------------------
// Orb animation targets.
//
// The hook drives the orb with Reanimated `withTiming` — a fire-and-forget
// animation per phase. The cursor self-corrects every tick, but a withTiming
// started for the OLD phase/speed does not. So on every phase-change AND every
// speed-change the hook recomputes this target and re-fires the animation:
//
//     scale.value = fromScale;                              // current point
//     scale.value = withTiming(toScale, { duration: durationMs });
//
// All pure — fully unit-testable without Reanimated.
// ---------------------------------------------------------------------------

/** The orb scale (0..1) a phase animates TOWARD by its end. */
export const phaseTargetScale = (
  phase: BreathingPhase,
  hasInhale2: boolean
): number => {
  switch (phase) {
    case BreathingPhase.Inhale:
      return hasInhale2 ? 0.75 : 1;
    case BreathingPhase.Inhale2:
      return 1;
    case BreathingPhase.HoldIn:
      return 1;
    case BreathingPhase.Exhale:
      return 0;
    case BreathingPhase.HoldOut:
      return 0;
    case BreathingPhase.Idle:
    default:
      return 0;
  }
};

export interface OrbAnimationTarget {
  /** Scale (0..1) to set immediately, i.e. the orb's current point in the phase. */
  fromScale: number;
  /** Scale (0..1) to animate toward over `durationMs`. */
  toScale: number;
  /** Remaining milliseconds in the current phase (>= 0). */
  durationMs: number;
}

/**
 * What the hook needs to (re-)fire the orb animation for the cursor's current
 * phase at `now`: snap to `fromScale`, then `withTiming(toScale, durationMs)`.
 * `now` is the EFFECTIVE clock (same one used to advance the cursor).
 */
export const orbAnimationTarget = (
  cursor: PhaseCursor,
  pattern: BreathingPattern,
  speedMultiplier: number,
  now: number
): OrbAnimationTarget => {
  const hasInhale2 = (pattern.inhale2 ?? 0) > 0;
  const elapsed = elapsedInPhaseMs(cursor, now);
  const total = getPhaseDurationMs(cursor.phase, pattern, speedMultiplier);
  const fromScale = getPhaseVisualState(
    cursor.phase,
    elapsed,
    pattern,
    speedMultiplier
  ).scale;
  return {
    fromScale,
    toScale: phaseTargetScale(cursor.phase, hasInhale2),
    durationMs: Math.max(0, total - elapsed),
  };
};
