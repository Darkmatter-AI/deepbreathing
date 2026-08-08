/**
 * Pacing math — re-exported from the single shared source in @resonance/domain.
 *
 * @see packages/domain/src/pacing.ts
 */
export {
  BreathingPhase,
  type BreathingPattern,
  MIN_SPEED,
  MAX_SPEED,
  DEFAULT_SPEED,
  clampSpeed,
  phaseDurationMs,
  remapPhaseStartMs,
  SLIDER_MIN,
  SLIDER_MAX,
  SLIDER_STEP,
  SLIDER_MID,
  multiplierToSlider,
  sliderToMultiplier,
  sliderFillPercent,
  speedOf,
} from '@resonance/domain';
