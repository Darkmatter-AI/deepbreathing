// The session hook — the one stateful, RN-coupled piece of the engine.
//
// Design (see GOAL.md "two drift-critical decisions"):
//   * The wall-clock cursor (session.ts) is advanced off a short interval, on an
//     EFFECTIVE clock (real time minus paused spans) so pausing/backgrounding
//     never drifts the schedule or counts toward auto-stop.
//   * The orb is animated with Reanimated `withTiming` per phase; we re-fire that
//     animation on every phase-change AND speed-change via the pure
//     `orbAnimationTarget` helper, so the fire-and-forget animation can't desync.
//
// Stale-closure discipline: the interval callback and every action read ONLY refs
// and stable setters/shared values — never props or state directly. That keeps the
// once-captured interval correct forever (and survives React Compiler being on).

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  Easing,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  advanceCursor,
  beginPause,
  BREATHING_PATTERNS,
  BreathingPattern,
  BreathingPhase,
  createCursor,
  createPauseState,
  effectiveNow,
  endPause,
  isSessionComplete,
  ModeName,
  orbAnimationTarget,
  PauseState,
  PhaseCursor,
  sessionElapsedSeconds,
} from ".";

/** How often the cursor is checked for a phase boundary. 100ms keeps the orb
 *  retarget latency imperceptible while staying battery-cheap. */
const TICK_MS = 100;
/** Orb deflate animation when a session ends. */
const DEFLATE_MS = 400;

export type SessionStatus = "idle" | "running" | "paused";

export interface BreathingSessionInput {
  mode: ModeName;
  speedMultiplier: number;
  /** Auto-stop after this many seconds. 0 = open-ended. */
  selectedDurationSec: number;
  /** Fired once when a timed session reaches its target. */
  onComplete?: () => void;
}

export interface BreathingSession {
  status: SessionStatus;
  phase: BreathingPhase;
  isRunning: boolean;
  isPaused: boolean;
  sessionSeconds: number;
  themeColor: string;
  /** Orb scale 0..1 (empty..full). Map to a visible size floor in the view. */
  scale: SharedValue<number>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useBreathingSession({
  mode,
  speedMultiplier,
  selectedDurationSec,
  onComplete,
}: BreathingSessionInput): BreathingSession {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [phase, setPhase] = useState<BreathingPhase>(BreathingPhase.Idle);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const scale = useSharedValue(0);

  // --- refs read by the interval + actions (never props/state directly) ---
  const statusRef = useRef<SessionStatus>("idle");
  const cursorRef = useRef<PhaseCursor>(createCursor(0));
  const pauseRef = useRef<PauseState>(createPauseState());
  const sessionStartRef = useRef(0); // effective anchor (== real start, paused=0)
  const patternRef = useRef<BreathingPattern>(BREATHING_PATTERNS[mode]);
  const speedRef = useRef(speedMultiplier);
  const durationRef = useRef(selectedDurationSec);
  const lastSecondRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  onCompleteRef.current = onComplete;

  // Animate the orb toward the current phase's target over its remaining time,
  // starting from wherever the orb visually is right now (we do NOT reassign
  // scale.value first). Reanimated retargets a withTiming from its live value,
  // so phase-change AND mid-phase speed-change transitions stay continuous with
  // no snap. Linear easing keeps the rate constant within a phase.
  const fireOrbAnimation = useCallback(
    (eff: number) => {
      const t = orbAnimationTarget(
        cursorRef.current,
        patternRef.current,
        speedRef.current,
        eff
      );
      scale.value = withTiming(t.toScale, {
        duration: t.durationMs,
        easing: Easing.linear,
      });
    },
    [scale]
  );

  const stopTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    stopTimers();
    statusRef.current = "idle";
    setStatus("idle");
    setPhase(BreathingPhase.Idle);
    setSessionSeconds(0);
    lastSecondRef.current = 0;
    scale.value = withTiming(0, { duration: DEFLATE_MS, easing: Easing.linear });
  }, [scale, stopTimers]);

  // One interval drives everything: seconds, auto-stop, phase advance + orb.
  const tick = useCallback(() => {
    if (statusRef.current !== "running") return;
    const eff = effectiveNow(pauseRef.current, Date.now());

    const secs = sessionElapsedSeconds(sessionStartRef.current, eff);
    if (secs !== lastSecondRef.current) {
      lastSecondRef.current = secs;
      setSessionSeconds(secs);
    }

    if (isSessionComplete(sessionStartRef.current, durationRef.current, eff)) {
      stop();
      onCompleteRef.current?.();
      return;
    }

    const prevPhase = cursorRef.current.phase;
    cursorRef.current = advanceCursor(
      cursorRef.current,
      patternRef.current,
      speedRef.current,
      eff
    );
    if (cursorRef.current.phase !== prevPhase) {
      setPhase(cursorRef.current.phase);
      fireOrbAnimation(eff);
    }
  }, [fireOrbAnimation, stop]);

  const startTimers = useCallback(() => {
    stopTimers();
    intervalRef.current = setInterval(() => tick(), TICK_MS);
  }, [stopTimers, tick]);

  const start = useCallback(() => {
    const now = Date.now();
    pauseRef.current = createPauseState();
    sessionStartRef.current = now;
    cursorRef.current = createCursor(now);
    lastSecondRef.current = 0;
    setSessionSeconds(0);
    setPhase(BreathingPhase.Inhale);
    statusRef.current = "running";
    setStatus("running");
    scale.value = 0;
    fireOrbAnimation(now);
    startTimers();
  }, [fireOrbAnimation, scale, startTimers]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    const now = Date.now();
    pauseRef.current = beginPause(pauseRef.current, now);
    statusRef.current = "paused";
    setStatus("paused");
    stopTimers();
    // Freeze the orb exactly where it is (assigning a raw value cancels withTiming).
    const eff = effectiveNow(pauseRef.current, now);
    scale.value = orbAnimationTarget(
      cursorRef.current,
      patternRef.current,
      speedRef.current,
      eff
    ).fromScale;
  }, [scale, stopTimers]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    const now = Date.now();
    pauseRef.current = endPause(pauseRef.current, now);
    statusRef.current = "running";
    setStatus("running");
    const eff = effectiveNow(pauseRef.current, now);
    cursorRef.current = advanceCursor(
      cursorRef.current,
      patternRef.current,
      speedRef.current,
      eff
    );
    setPhase(cursorRef.current.phase);
    fireOrbAnimation(eff);
    startTimers();
  }, [fireOrbAnimation, startTimers]);

  // Keep duration in sync for the interval (no behavioural change needed live).
  useEffect(() => {
    durationRef.current = selectedDurationSec;
  }, [selectedDurationSec]);

  // Speed change: update the ref, then (if running) advance + retarget the orb so
  // the in-flight withTiming doesn't keep running at the old duration. Per the v1
  // rule the new speed applies to the current phase's remaining time onward.
  //
  // A speed change can recompute the current phase as already-elapsed and roll the
  // cursor across a boundary. We must propagate that with setPhase here — otherwise
  // this effect pre-advances cursorRef, the next tick sees no further change, and
  // the phase label / audio cue / haptic for the crossed phase are silently dropped
  // until the next natural boundary.
  useEffect(() => {
    speedRef.current = speedMultiplier;
    if (statusRef.current === "running") {
      const eff = effectiveNow(pauseRef.current, Date.now());
      const prevPhase = cursorRef.current.phase;
      cursorRef.current = advanceCursor(
        cursorRef.current,
        patternRef.current,
        speedRef.current,
        eff
      );
      if (cursorRef.current.phase !== prevPhase) {
        setPhase(cursorRef.current.phase);
      }
      fireOrbAnimation(eff);
    }
  }, [speedMultiplier, fireOrbAnimation]);

  // Mode change: keep the pattern ref current. Changing mode while a session is
  // live stops it (v1 rule) — the parent re-starts in the new mode.
  useEffect(() => {
    patternRef.current = BREATHING_PATTERNS[mode];
    if (statusRef.current !== "idle") {
      stop();
    }
  }, [mode, stop]);

  // Pause when the app is backgrounded (no background session in v1).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active" && statusRef.current === "running") {
        pause();
      }
    });
    return () => sub.remove();
  }, [pause]);

  // Clear the interval on unmount.
  useEffect(() => stopTimers, [stopTimers]);

  return {
    status,
    phase,
    isRunning: status === "running",
    isPaused: status === "paused",
    sessionSeconds,
    themeColor: BREATHING_PATTERNS[mode].color,
    scale,
    start,
    pause,
    resume,
    stop,
  };
}
