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
import { BreathingPattern, BreathingPhase, PhaseVisualState } from "./types";

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
