import { describe, expect, it } from "vitest";
import {
  advanceCursor,
  createCursor,
  cursorVisualState,
  elapsedInPhaseMs,
  isSessionComplete,
  sessionElapsedSeconds,
} from "./session";
import { BREATHING_PATTERNS } from "./patterns";
import { BreathingPhase, ModeName } from "./types";

const BOX = BREATHING_PATTERNS[ModeName.Box]; // 4/4/4/4 -> 16s cycle
const COHERENT = BREATHING_PATTERNS[ModeName.Coherent]; // 5.5/0/5.5/0 -> 11s cycle

describe("createCursor", () => {
  it("starts on Inhale at the given instant, zero cycles", () => {
    const c = createCursor(1000);
    expect(c).toEqual({ phase: BreathingPhase.Inhale, phaseStartMs: 1000, cycles: 0 });
  });
});

describe("advanceCursor", () => {
  it("does not advance mid-phase", () => {
    const c = advanceCursor(createCursor(0), BOX, 1, 3999);
    expect(c.phase).toBe(BreathingPhase.Inhale);
    expect(c.phaseStartMs).toBe(0);
  });

  it("advances exactly one phase at the boundary", () => {
    const c = advanceCursor(createCursor(0), BOX, 1, 4000);
    expect(c.phase).toBe(BreathingPhase.HoldIn);
    expect(c.phaseStartMs).toBe(4000);
  });

  it("rolls across multiple boundaries when a tick fires late", () => {
    // 9s in: inhale(0-4) -> holdIn(4-8) -> exhale started at 8s.
    const c = advanceCursor(createCursor(0), BOX, 1, 9000);
    expect(c.phase).toBe(BreathingPhase.Exhale);
    expect(c.phaseStartMs).toBe(8000);
    expect(elapsedInPhaseMs(c, 9000)).toBe(1000);
  });

  it("counts a full cycle when it returns to Inhale", () => {
    // Box cycle is 16s. At 16s we are back on Inhale, one cycle done.
    const c = advanceCursor(createCursor(0), BOX, 1, 16000);
    expect(c.phase).toBe(BreathingPhase.Inhale);
    expect(c.cycles).toBe(1);
    expect(c.phaseStartMs).toBe(16000);
  });

  it("skips zero-length holds (Coherent: inhale <-> exhale only)", () => {
    let c = advanceCursor(createCursor(0), COHERENT, 1, 5500);
    expect(c.phase).toBe(BreathingPhase.Exhale);
    c = advanceCursor(c, COHERENT, 1, 11000);
    expect(c.phase).toBe(BreathingPhase.Inhale);
    expect(c.cycles).toBe(1);
  });

  it("applies a speed change to the NEXT phase, not retroactively (v1 rule)", () => {
    // First phase ran at 1x (4s inhale, boundary at 4000). From there at 2x,
    // HoldIn now lasts 8s, so at 4000 we are still in HoldIn.
    const afterInhale = advanceCursor(createCursor(0), BOX, 1, 4000);
    expect(afterInhale.phase).toBe(BreathingPhase.HoldIn);
    const slowed = advanceCursor(afterInhale, BOX, 2, 11999);
    expect(slowed.phase).toBe(BreathingPhase.HoldIn); // 8s hold ends at 12000
    const past = advanceCursor(afterInhale, BOX, 2, 12000);
    expect(past.phase).toBe(BreathingPhase.Exhale);
  });

  it("is drift-free across a long jittery run (boundaries stay wall-clock anchored)", () => {
    // Simulate ~5 minutes of ticks with random-ish jitter and assert the cursor's
    // phase boundaries never drift from the ideal deterministic schedule.
    let cursor = createCursor(0);
    const cycleMs = 16000; // Box
    // pseudo-jitter without Math.random (banned in this env): vary by index
    for (let i = 1; i <= 1875; i++) {
      const jitter = ((i * 37) % 19) - 9; // -9..+9 ms wobble
      const now = i * 16 + jitter; // ~16ms/frame, ~30s? -> see below
      cursor = advanceCursor(cursor, BOX, 1, now);
    }
    const finalNow = 1875 * 16; // 30000ms
    // Ideal: at t, phaseStart for the active phase is floor-aligned to the schedule.
    // After 30000ms of a 16000ms cycle we are 14000ms into the 2nd cycle:
    // inhale(0-4)holdIn(4-8)exhale(8-12)holdOut(12-16) -> 14000 is in HoldOut.
    const phaseInCycle = finalNow % cycleMs; // 14000
    expect(phaseInCycle).toBe(14000);
    cursor = advanceCursor(cursor, BOX, 1, finalNow);
    expect(cursor.phase).toBe(BreathingPhase.HoldOut);
    expect(cursor.phaseStartMs).toBe(28000); // exactly cycle*1 + 12000, no drift
    expect(cursor.cycles).toBe(1);
  });
});

describe("cursorVisualState", () => {
  it("derives orb scale from the cursor's in-phase elapsed time", () => {
    const c = advanceCursor(createCursor(0), BOX, 1, 2000); // 2s into inhale
    const v = cursorVisualState(c, BOX, 1, 2000);
    expect(v.phase).toBe(BreathingPhase.Inhale);
    expect(v.scale).toBeCloseTo(0.5);
  });
});

describe("sessionElapsedSeconds", () => {
  it("floors elapsed wall-clock to whole seconds", () => {
    expect(sessionElapsedSeconds(0, 4999)).toBe(4);
    expect(sessionElapsedSeconds(1000, 6000)).toBe(5);
  });
});

describe("isSessionComplete", () => {
  it("never completes when duration is 0 (open-ended)", () => {
    expect(isSessionComplete(0, 0, 9_999_999)).toBe(false);
  });

  it("completes at or after the selected duration", () => {
    expect(isSessionComplete(0, 60, 59_999)).toBe(false);
    expect(isSessionComplete(0, 60, 60_000)).toBe(true);
  });
});
