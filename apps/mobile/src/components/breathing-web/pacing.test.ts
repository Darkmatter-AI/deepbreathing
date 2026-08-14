import { describe, expect, it } from 'vitest';
import { BreathingPhase, ModeName, BreathingPattern } from './types';
import {
  clampSpeed,
  phaseDurationMs,
  remapPhaseStartMs,
  sliderFillPercent,
  sliderToMultiplier,
  multiplierToSlider,
  speedOf,
  MIN_SPEED,
  MAX_SPEED,
} from './pacing';
import { BREATHING_PATTERNS } from './constants';

const box = (BREATHING_PATTERNS as Record<string, BreathingPattern>)[ModeName.Box]; // 4-4-4-4

describe('clampSpeed', () => {
  it('keeps valid values rounded to 0.1', () => {
    expect(clampSpeed(1)).toBe(1);
    expect(clampSpeed(1.23)).toBe(1.2);
    expect(clampSpeed(0.5)).toBe(0.5);
    expect(clampSpeed(2.0)).toBe(2.0);
  });
  it('clamps to [0.5, 2.0]', () => {
    expect(clampSpeed(5)).toBe(2.0);
    expect(clampSpeed(0.1)).toBe(0.5);
  });
  it('degrades garbage to 1.0', () => {
    expect(clampSpeed(NaN)).toBe(1);
    expect(clampSpeed('fast')).toBe(1);
    expect(clampSpeed(undefined)).toBe(1);
  });
});

describe('phaseDurationMs — the speed slider MUST change animation/timer phases', () => {
  it('scales every phase duration linearly', () => {
    expect(phaseDurationMs(BreathingPhase.Inhale, box, 1)).toBe(4000);
    expect(phaseDurationMs(BreathingPhase.HoldIn, box, 1)).toBe(4000);
    expect(phaseDurationMs(BreathingPhase.Exhale, box, 1)).toBe(4000);
    expect(phaseDurationMs(BreathingPhase.HoldOut, box, 1)).toBe(4000);
    // 1.6x → 6.4s inhale (the live test observed ~6.4s)
    expect(phaseDurationMs(BreathingPhase.Inhale, box, 1.6)).toBe(6400);
    expect(phaseDurationMs(BreathingPhase.Exhale, box, 1.6)).toBe(6400);
    expect(phaseDurationMs(BreathingPhase.Inhale, box, 0.5)).toBe(2000);
  });
  it('handles the double-inhale phase', () => {
    const sigh = (BREATHING_PATTERNS as Record<string, BreathingPattern>)[ModeName.Sigh]; // 2.5 + 1.5 inhale
    expect(phaseDurationMs(BreathingPhase.Inhale, sigh, 1)).toBe(2500);
    expect(phaseDurationMs(BreathingPhase.Inhale2, sigh, 1)).toBe(1500);
    expect(phaseDurationMs(BreathingPhase.Inhale2, sigh, 2)).toBe(3000);
  });
});

describe('remapPhaseStartMs — live speed change must NOT jump the orb', () => {
  it('keeps the progress fraction of the current phase', () => {
    // 1s into a 4s inhale at 1x (progress 0.25); change to 1.6x (6.4s)
    const newStart = remapPhaseStartMs(5000, 4000, 4000, 1.6, BreathingPhase.Inhale, box);
    // new elapsed = 0.25 * 6400 = 1600ms → start = 5000 - 1600
    expect(newStart).toBe(3400);
  });
  it('clamps progress at 1.0', () => {
    // 10s into a 4s phase (progress capped 1) → new elapsed = full new duration
    const newStart = remapPhaseStartMs(10000, 0, 4000, 1.6, BreathingPhase.Inhale, box);
    expect(newStart).toBe(10000 - 6400);
  });
});

describe('sliderFillPercent — fill matches the native thumb position', () => {
  it('maps the slider range to a 0..100 fill', () => {
    expect(sliderFillPercent(0.5)).toBe(0);
    expect(sliderFillPercent(2.0)).toBe(100);
    expect(sliderFillPercent(1.25)).toBe(50); // centered default
  });
});

describe('slider direction — LEFT = SLOWER, RIGHT = FASTER, DEFAULT CENTERED', () => {
  it('maps the multiplier to slider position (0.5 left .. 2.0 right)', () => {
    expect(multiplierToSlider(2.0)).toBe(0.5);  // slowest -> far left
    expect(multiplierToSlider(1.0)).toBe(1.25); // default -> exact middle
    expect(multiplierToSlider(0.5)).toBe(2.0);  // fastest -> far right
  });
  it('inverts back to the multiplier', () => {
    expect(sliderToMultiplier(0.5)).toBe(2.0);
    expect(sliderToMultiplier(1.25)).toBe(1.0);
    expect(sliderToMultiplier(2.0)).toBe(0.5);
    expect(sliderToMultiplier(1.7)).toBeCloseTo(0.7, 5);
  });
  it('round-trips across the range', () => {
    for (const m of [0.5, 0.7, 1, 1.3, 1.6, 2.0]) {
      expect(sliderToMultiplier(multiplierToSlider(m))).toBeCloseTo(m, 5);
    }
  });
  it('default (1.0) sits on the 0.05 grid so the knob centers exactly', () => {
    // 1.25 is the midpoint of [0.5, 2.0] and lands on the 0.05 step grid.
    expect(multiplierToSlider(1.0)).toBeCloseTo(1.25, 9);
    expect(Math.round(multiplierToSlider(1.0) / 0.05) * 0.05).toBeCloseTo(1.25, 9);
  });
});

describe('speedOf — label reads as speed (0.5x slow .. 2x fast)', () => {
  it('is the reciprocal of the multiplier', () => {
    expect(speedOf(1)).toBe(1);
    expect(speedOf(2)).toBe(0.5); // slow end
    expect(speedOf(0.5)).toBe(2); // fast end
  });
});
