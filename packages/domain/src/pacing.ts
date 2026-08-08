/**
 * Pure pacing math for the breathing experience — single speed measure.
 *
 * Extracted from the component so the regression suite can pin the two
 * invariants that matter:
 *   1. speedMultiplier scales EVERY phase duration (animation + cues);
 *   2. the session clock stays wall-clock (duration is real seconds, never
 *      scaled by pace) — see BreathingExperience's auto-stop.
 */

// ---------------------------------------------------------------------------
// Breathing phase enum — shared between mobile and desktop.
// ---------------------------------------------------------------------------
export enum BreathingPhase {
  Inhale = 'Inhale',
  Inhale2 = 'Inhale (Top up)',
  HoldIn = 'Hold In',
  Exhale = 'Exhale',
  HoldOut = 'Hold Out',
  Idle = 'Ready'
}

/** Duration in seconds for each phase of a breathing pattern. */
export interface BreathingPattern {
  name: string;
  description: string;
  inhale: number;
  inhale2?: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Speed constants
// ---------------------------------------------------------------------------
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.0;
export const DEFAULT_SPEED = 1.0;

export const clampSpeed = (raw: unknown): number => {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_SPEED;
  return Math.round(Math.min(MAX_SPEED, Math.max(MIN_SPEED, n)) * 10) / 10;
};

/** Phase duration in ms at the given speed (single source of truth). */
export const phaseDurationMs = (
  phase: BreathingPhase,
  pattern: BreathingPattern,
  speed: number,
): number => {
  switch (phase) {
    case BreathingPhase.Inhale: return (pattern.inhale * speed) * 1000;
    case BreathingPhase.Inhale2: return ((pattern.inhale2 || 0) * speed) * 1000;
    case BreathingPhase.HoldIn: return (pattern.holdIn * speed) * 1000;
    case BreathingPhase.Exhale: return (pattern.exhale * speed) * 1000;
    case BreathingPhase.HoldOut: return (pattern.holdOut * speed) * 1000;
    default: return 0;
  }
};

/**
 * Re-anchor phaseStart after a live speed change so the current phase keeps
 * its progress fraction (the orb never jumps). Returns the new phaseStartMs.
 */
export const remapPhaseStartMs = (
  nowMs: number,
  phaseStartMs: number,
  prevPhaseDurationMs: number,
  speed: number,
  phase: BreathingPhase,
  pattern: BreathingPattern,
): number => {
  if (prevPhaseDurationMs <= 0) return nowMs;
  const elapsed = nowMs - phaseStartMs;
  const progressFraction = Math.min(elapsed / prevPhaseDurationMs, 1);
  const newDuration = phaseDurationMs(phase, pattern, speed);
  return nowMs - progressFraction * newDuration;
};

// ---------------------------------------------------------------------------
// Slider mapping — LEFT = SLOWER, RIGHT = FASTER, DEFAULT CENTERED.
//
// The multiplier range [0.5, 2.0] is not numerically symmetric around 1.0, so
// a linear input would put the default knob at 33%. Instead the slider uses a
// piecewise-linear map in "position" space:
//   position 0.5 (far left)  -> multiplier 2.0 (slowest, phases 2x longer)
//   position 1.25 (middle)   -> multiplier 1.0 (default)
//   position 2.0 (far right) -> multiplier 0.5 (fastest, phases 2x shorter)
// ---------------------------------------------------------------------------
export const SLIDER_MIN = 0.5;
export const SLIDER_MAX = 2.0;
export const SLIDER_STEP = 0.05; // keeps the centered default (1.25) on-grid
export const SLIDER_MID = 1.25;

export const multiplierToSlider = (multiplier: number): number => {
  const m = clampSpeed(multiplier);
  return m >= 1 ? 2 - 0.75 * m : 2.75 - 1.5 * m;
};

export const sliderToMultiplier = (sliderValue: number): number => {
  const v = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Number(sliderValue) || 1));
  return v <= SLIDER_MID ? 2 - (4 / 3) * (v - SLIDER_MIN) : 1 - (2 / 3) * (v - SLIDER_MID);
};

/** 0..100 fill for the track, matching the native thumb position. */
export const sliderFillPercent = (sliderValue: number): number =>
  ((Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, sliderValue)) - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

/** Speed semantics for the label: 1/multiplier — 0.5× = slow, 2× = fast. */
export const speedOf = (multiplier: number): number => 1 / multiplier;
