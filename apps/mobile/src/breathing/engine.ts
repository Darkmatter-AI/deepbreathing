// Pure breathing-phase engine. No React Native imports — fully unit-testable in Node.
// Ported from the `expo-attempt-1` tag (packages/engine/src/engine.ts).
//
// All functions are pure: given a phase + elapsed time + pattern, they return the
// next phase / duration / visual scale. The drift-resistant scheduling that *drives*
// these functions lives in ./session.ts so that this file stays trivially testable.

import {
  BreathingPhase,
  PhaseUpdateInput,
  PhaseUpdateResult,
  PhaseVisualState,
} from "./types";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const getPhaseDurationMs = (
  phase: BreathingPhase,
  {
    inhale,
    inhale2 = 0,
    holdIn,
    exhale,
    holdOut,
  }: {
    inhale: number;
    inhale2?: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
  },
  speedMultiplier: number
): number => {
  switch (phase) {
    case BreathingPhase.Inhale:
      return inhale * speedMultiplier * 1000;
    case BreathingPhase.Inhale2:
      return inhale2 * speedMultiplier * 1000;
    case BreathingPhase.HoldIn:
      return holdIn * speedMultiplier * 1000;
    case BreathingPhase.Exhale:
      return exhale * speedMultiplier * 1000;
    case BreathingPhase.HoldOut:
      return holdOut * speedMultiplier * 1000;
    case BreathingPhase.Idle:
    default:
      return 0;
  }
};

export const getNextPhase = (
  phase: BreathingPhase,
  hasInhale2: boolean,
  holdIn: number,
  holdOut: number
): BreathingPhase => {
  switch (phase) {
    case BreathingPhase.Inhale:
      return hasInhale2
        ? BreathingPhase.Inhale2
        : holdIn > 0
          ? BreathingPhase.HoldIn
          : BreathingPhase.Exhale;
    case BreathingPhase.Inhale2:
      return holdIn > 0 ? BreathingPhase.HoldIn : BreathingPhase.Exhale;
    case BreathingPhase.HoldIn:
      return BreathingPhase.Exhale;
    case BreathingPhase.Exhale:
      return holdOut > 0 ? BreathingPhase.HoldOut : BreathingPhase.Inhale;
    case BreathingPhase.HoldOut:
      return BreathingPhase.Inhale;
    case BreathingPhase.Idle:
    default:
      return BreathingPhase.Inhale;
  }
};

export const updatePhase = ({
  phase,
  elapsedMs,
  pattern,
  speedMultiplier,
}: PhaseUpdateInput): PhaseUpdateResult => {
  const phaseDurationMs = getPhaseDurationMs(phase, pattern, speedMultiplier);
  const phaseComplete = phaseDurationMs > 0 && elapsedMs >= phaseDurationMs;
  if (!phaseComplete) {
    return { phase, phaseDurationMs, phaseComplete };
  }

  const nextPhase = getNextPhase(
    phase,
    (pattern.inhale2 ?? 0) > 0,
    pattern.holdIn,
    pattern.holdOut
  );

  return { phase: nextPhase, phaseDurationMs, phaseComplete };
};

export const getPhaseVisualState = (
  phase: BreathingPhase,
  elapsedMs: number,
  pattern: {
    inhale: number;
    inhale2?: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
  },
  speedMultiplier: number
): PhaseVisualState => {
  const phaseDurationMs = getPhaseDurationMs(phase, pattern, speedMultiplier);
  const progress = phaseDurationMs > 0 ? clamp01(elapsedMs / phaseDurationMs) : 0;

  if (phase === BreathingPhase.Inhale) {
    const maxScale = (pattern.inhale2 ?? 0) > 0 ? 0.75 : 1;
    return { phase, progress, scale: progress * maxScale };
  }

  if (phase === BreathingPhase.Inhale2) {
    return { phase, progress, scale: 0.75 + progress * 0.25 };
  }

  if (phase === BreathingPhase.HoldIn) {
    return { phase, progress, scale: 1 };
  }

  if (phase === BreathingPhase.Exhale) {
    return { phase, progress, scale: 1 - progress };
  }

  if (phase === BreathingPhase.HoldOut) {
    return { phase, progress, scale: 0 };
  }

  return { phase: BreathingPhase.Idle, progress: 0, scale: 0 };
};

/**
 * The first active phase for a pattern, starting from Idle.
 * Every v1 pattern begins on Inhale.
 */
export const getInitialPhase = (): BreathingPhase => BreathingPhase.Inhale;
