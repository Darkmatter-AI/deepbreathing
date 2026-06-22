import { describe, expect, it } from "vitest";
import {
  advanceCursor,
  beginPause,
  createCursor,
  createPauseState,
  cursorVisualState,
  effectiveNow,
  elapsedInPhaseMs,
  endPause,
  isSessionComplete,
  orbAnimationTarget,
  phaseTargetScale,
  sessionElapsedSeconds,
} from "./session";
import { BREATHING_PATTERNS } from "./patterns";
import { BreathingPhase, ModeName } from "./types";

const BOX = BREATHING_PATTERNS[ModeName.Box]; // 4/4/4/4 -> 16s cycle
const RELAX = BREATHING_PATTERNS[ModeName.Relax]; // 4/7/8/0
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

describe("pause model (effective clock)", () => {
  it("is a no-op clock while running (effectiveNow === realNow)", () => {
    const p = createPauseState();
    expect(effectiveNow(p, 5000)).toBe(5000);
  });

  it("freezes the effective clock while paused", () => {
    let p = createPauseState();
    p = beginPause(p, 3000); // pause at real t=3000
    // Real time marches on, but the effective clock holds at 3000.
    expect(effectiveNow(p, 3000)).toBe(3000);
    expect(effectiveNow(p, 9000)).toBe(3000);
  });

  it("banks the paused span on resume so later time is shifted back", () => {
    let p = createPauseState();
    p = beginPause(p, 3000);
    p = endPause(p, 9000); // paused for 6000ms
    expect(p.pausedTotalMs).toBe(6000);
    // Real t=10000 is effective t=4000 (10000 - 6000 paused).
    expect(effectiveNow(p, 10000)).toBe(4000);
  });

  it("accumulates multiple pauses", () => {
    let p = createPauseState();
    p = endPause(beginPause(p, 1000), 2000); // +1000
    p = endPause(beginPause(p, 5000), 9000); // +4000
    expect(p.pausedTotalMs).toBe(5000);
    expect(effectiveNow(p, 20000)).toBe(15000);
  });

  it("beginPause/endPause are no-ops when already paused / already running", () => {
    let p = createPauseState();
    p = beginPause(p, 1000);
    const reBegun = beginPause(p, 5000); // ignored — pause already open at 1000
    expect(reBegun.pauseStartedAtMs).toBe(1000);
    let running = endPause(p, 3000); // banks 2000
    const reEnded = endPause(running, 9000); // ignored — not paused
    expect(reEnded).toBe(running);
  });

  it("keeps paused time out of auto-stop (effective clock drives completion)", () => {
    // 60s session started at real t=0; paused 0..30s. At real t=80s only 50s of
    // ACTIVE time has elapsed, so the session is NOT complete yet.
    let p = createPauseState();
    p = beginPause(p, 10_000);
    p = endPause(p, 40_000); // paused for 30s
    const eff = effectiveNow(p, 80_000); // 50_000
    expect(eff).toBe(50_000);
    expect(isSessionComplete(0, 60, eff)).toBe(false);
    expect(isSessionComplete(0, 60, effectiveNow(p, 90_000))).toBe(true); // 60s active
  });

  it("keeps the cursor from rolling across boundaries during a pause", () => {
    // Inhale starts at effective 0. Pause at real 2s (2s of active time banked,
    // mid-inhale). Long real wait, then resume; active time picks up where it
    // left off — no jump, no drift across the 98s of idle.
    let p = createPauseState();
    let cursor = createCursor(0);
    p = beginPause(p, 2000);
    // Frozen at effective 2000 no matter how much real time passes.
    cursor = advanceCursor(cursor, BOX, 1, effectiveNow(p, 100_000));
    expect(cursor.phase).toBe(BreathingPhase.Inhale);
    expect(effectiveNow(p, 100_000)).toBe(2000);

    p = endPause(p, 100_000); // banked 98s of pause
    // real 101_500 -> effective 3_500 (2s pre-pause + 1.5s post-resume) < 4s.
    cursor = advanceCursor(cursor, BOX, 1, effectiveNow(p, 101_500));
    expect(cursor.phase).toBe(BreathingPhase.Inhale);
    // real 103_000 -> effective 5_000 active -> into HoldIn (inhale 0-4).
    cursor = advanceCursor(cursor, BOX, 1, effectiveNow(p, 103_000));
    expect(cursor.phase).toBe(BreathingPhase.HoldIn);
  });
});

describe("phaseTargetScale", () => {
  it("inhale grows to full, exhale shrinks to empty, holds park", () => {
    expect(phaseTargetScale(BreathingPhase.Inhale, false)).toBe(1);
    expect(phaseTargetScale(BreathingPhase.HoldIn, false)).toBe(1);
    expect(phaseTargetScale(BreathingPhase.Exhale, false)).toBe(0);
    expect(phaseTargetScale(BreathingPhase.HoldOut, false)).toBe(0);
    expect(phaseTargetScale(BreathingPhase.Idle, false)).toBe(0);
  });

  it("caps the first sigh inhale at 0.75, tops up via Inhale2", () => {
    expect(phaseTargetScale(BreathingPhase.Inhale, true)).toBe(0.75);
    expect(phaseTargetScale(BreathingPhase.Inhale2, true)).toBe(1);
  });
});

describe("orbAnimationTarget", () => {
  it("targets full scale over the remaining inhale from the current point", () => {
    // 1s into a 4s Box inhale.
    const cursor = advanceCursor(createCursor(0), BOX, 1, 1000);
    const t = orbAnimationTarget(cursor, BOX, 1, 1000);
    expect(t.fromScale).toBeCloseTo(0.25); // 1s / 4s
    expect(t.toScale).toBe(1);
    expect(t.durationMs).toBe(3000); // 4000 - 1000
  });

  it("targets empty over the remaining exhale", () => {
    // Box: inhale(0-4) holdIn(4-8) exhale(8-12). 1s into exhale at t=9000.
    const cursor = advanceCursor(createCursor(0), BOX, 1, 9000);
    expect(cursor.phase).toBe(BreathingPhase.Exhale);
    const t = orbAnimationTarget(cursor, BOX, 1, 9000);
    expect(t.fromScale).toBeCloseTo(0.75); // 1 - 1s/4s
    expect(t.toScale).toBe(0);
    expect(t.durationMs).toBe(3000);
  });

  it("parks the orb (from==to) during a hold", () => {
    const cursor = advanceCursor(createCursor(0), RELAX, 1, 5000); // RELAX holdIn 4..11
    expect(cursor.phase).toBe(BreathingPhase.HoldIn);
    const t = orbAnimationTarget(cursor, RELAX, 1, 5000);
    expect(t.fromScale).toBe(1);
    expect(t.toScale).toBe(1);
  });

  it("recomputes remaining duration after a speed change mid-phase", () => {
    // Mid-inhale at 1x (1s in), then speed drops to 0.5x: inhale is now 2s long,
    // so 1s remains and the orb should retarget over that 1s.
    const cursor = advanceCursor(createCursor(0), BOX, 1, 1000);
    const slow = orbAnimationTarget(cursor, BOX, 0.5, 1000);
    expect(slow.toScale).toBe(1);
    expect(slow.durationMs).toBe(1000); // 2000ms inhale - 1000ms elapsed
    expect(slow.fromScale).toBeCloseTo(0.5); // 1000 / 2000 progress at new speed
  });
});
