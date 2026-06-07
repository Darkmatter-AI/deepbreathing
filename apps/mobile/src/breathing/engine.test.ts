import { describe, expect, it } from "vitest";
import {
  getInitialPhase,
  getNextPhase,
  getPhaseDurationMs,
  getPhaseVisualState,
  updatePhase,
} from "./engine";
import { BREATHING_PATTERNS } from "./patterns";
import { BreathingPhase, ModeName } from "./types";

const BOX = BREATHING_PATTERNS[ModeName.Box]; // 4/4/4/4
const RELAX = BREATHING_PATTERNS[ModeName.Relax]; // 4/7/8/0
const COHERENT = BREATHING_PATTERNS[ModeName.Coherent]; // 5.5/0/5.5/0
const SIGH = BREATHING_PATTERNS[ModeName.Sigh]; // 2.5 + 1.5 / 0 / 6 / 1

describe("getPhaseDurationMs", () => {
  it("converts seconds to ms per phase at 1x speed", () => {
    expect(getPhaseDurationMs(BreathingPhase.Inhale, BOX, 1)).toBe(4000);
    expect(getPhaseDurationMs(BreathingPhase.HoldIn, BOX, 1)).toBe(4000);
    expect(getPhaseDurationMs(BreathingPhase.Exhale, RELAX, 1)).toBe(8000);
    expect(getPhaseDurationMs(BreathingPhase.HoldOut, RELAX, 1)).toBe(0);
  });

  it("scales linearly with the speed multiplier", () => {
    expect(getPhaseDurationMs(BreathingPhase.Inhale, BOX, 2)).toBe(8000);
    expect(getPhaseDurationMs(BreathingPhase.Inhale, BOX, 0.5)).toBe(2000);
  });

  it("supports fractional-second patterns (coherent 5.5s)", () => {
    expect(getPhaseDurationMs(BreathingPhase.Inhale, COHERENT, 1)).toBe(5500);
  });

  it("returns 0 for Idle", () => {
    expect(getPhaseDurationMs(BreathingPhase.Idle, BOX, 1)).toBe(0);
  });
});

describe("getNextPhase", () => {
  it("walks a full Box cycle through all four phases", () => {
    expect(getNextPhase(BreathingPhase.Inhale, false, 4, 4)).toBe(BreathingPhase.HoldIn);
    expect(getNextPhase(BreathingPhase.HoldIn, false, 4, 4)).toBe(BreathingPhase.Exhale);
    expect(getNextPhase(BreathingPhase.Exhale, false, 4, 4)).toBe(BreathingPhase.HoldOut);
    expect(getNextPhase(BreathingPhase.HoldOut, false, 4, 4)).toBe(BreathingPhase.Inhale);
  });

  it("skips HoldOut when holdOut is 0 (Relax: exhale -> inhale)", () => {
    expect(getNextPhase(BreathingPhase.Exhale, false, 7, 0)).toBe(BreathingPhase.Inhale);
  });

  it("skips both holds for Coherent (inhale -> exhale -> inhale)", () => {
    expect(getNextPhase(BreathingPhase.Inhale, false, 0, 0)).toBe(BreathingPhase.Exhale);
    expect(getNextPhase(BreathingPhase.Exhale, false, 0, 0)).toBe(BreathingPhase.Inhale);
  });

  it("routes through Inhale2 for the physiological sigh", () => {
    expect(getNextPhase(BreathingPhase.Inhale, true, 0, 1)).toBe(BreathingPhase.Inhale2);
    expect(getNextPhase(BreathingPhase.Inhale2, true, 0, 1)).toBe(BreathingPhase.Exhale);
  });

  it("starts from Inhale when Idle", () => {
    expect(getInitialPhase()).toBe(BreathingPhase.Inhale);
    expect(getNextPhase(BreathingPhase.Idle, false, 4, 4)).toBe(BreathingPhase.Inhale);
  });
});

describe("updatePhase", () => {
  it("does not advance before the phase duration elapses", () => {
    const r = updatePhase({
      phase: BreathingPhase.Inhale,
      elapsedMs: 3999,
      pattern: BOX,
      speedMultiplier: 1,
    });
    expect(r.phaseComplete).toBe(false);
    expect(r.phase).toBe(BreathingPhase.Inhale);
    expect(r.phaseDurationMs).toBe(4000);
  });

  it("advances exactly at the boundary", () => {
    const r = updatePhase({
      phase: BreathingPhase.Inhale,
      elapsedMs: 4000,
      pattern: BOX,
      speedMultiplier: 1,
    });
    expect(r.phaseComplete).toBe(true);
    expect(r.phase).toBe(BreathingPhase.HoldIn);
  });
});

describe("getPhaseVisualState", () => {
  it("ramps the orb from 0 to 1 during a plain inhale", () => {
    expect(getPhaseVisualState(BreathingPhase.Inhale, 0, BOX, 1).scale).toBe(0);
    expect(getPhaseVisualState(BreathingPhase.Inhale, 2000, BOX, 1).scale).toBeCloseTo(0.5);
    expect(getPhaseVisualState(BreathingPhase.Inhale, 4000, BOX, 1).scale).toBe(1);
  });

  it("holds the orb fully expanded during HoldIn", () => {
    expect(getPhaseVisualState(BreathingPhase.HoldIn, 1000, BOX, 1).scale).toBe(1);
  });

  it("shrinks the orb from 1 to 0 during exhale", () => {
    expect(getPhaseVisualState(BreathingPhase.Exhale, 0, BOX, 1).scale).toBe(1);
    expect(getPhaseVisualState(BreathingPhase.Exhale, 4000, BOX, 1).scale).toBe(0);
  });

  it("caps the first sigh inhale at 0.75, then tops up to 1.0", () => {
    expect(getPhaseVisualState(BreathingPhase.Inhale, 2500, SIGH, 1).scale).toBeCloseTo(0.75);
    expect(getPhaseVisualState(BreathingPhase.Inhale2, 0, SIGH, 1).scale).toBeCloseTo(0.75);
    expect(getPhaseVisualState(BreathingPhase.Inhale2, 1500, SIGH, 1).scale).toBeCloseTo(1);
  });

  it("clamps progress so a late tick never overshoots", () => {
    expect(getPhaseVisualState(BreathingPhase.Inhale, 9999, BOX, 1).scale).toBe(1);
  });
});
