// Phase-change haptics (native only — no-op on web). Mapping per the plan:
//   inhale -> light, hold -> double medium tap, exhale -> heavy.
// Best-effort: failures (e.g. unsupported device) are swallowed.

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { BreathingPhase } from '.';
import type { SessionStatus } from './useBreathingSession';

const HOLD_TAP_GAP_MS = 130;

const impact = (style: Haptics.ImpactFeedbackStyle) =>
  Haptics.impactAsync(style).catch(() => {
    // haptics unavailable on this device — ignore
  });

interface UseBreathingHapticsInput {
  phase: BreathingPhase;
  status: SessionStatus;
  /** Disable haptics entirely (e.g. a future settings toggle). */
  enabled?: boolean;
}

export function useBreathingHaptics({
  phase,
  status,
  enabled = true,
}: UseBreathingHapticsInput) {
  const lastPhaseRef = useRef<BreathingPhase | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (status === 'idle') {
      lastPhaseRef.current = null;
      return;
    }
    if (status !== 'running') return; // hold ref across pause
    if (phase === lastPhaseRef.current) return;
    // Mark this phase observed BEFORE the `enabled` gate, so toggling haptics
    // back on mid-phase doesn't read a stale ref and fire a spurious tap.
    lastPhaseRef.current = phase;
    if (!enabled) return;

    switch (phase) {
      case BreathingPhase.Inhale:
      case BreathingPhase.Inhale2:
        impact(Haptics.ImpactFeedbackStyle.Light);
        break;
      case BreathingPhase.HoldIn:
      case BreathingPhase.HoldOut: {
        impact(Haptics.ImpactFeedbackStyle.Medium);
        const t = setTimeout(
          () => impact(Haptics.ImpactFeedbackStyle.Medium),
          HOLD_TAP_GAP_MS
        );
        return () => clearTimeout(t);
      }
      case BreathingPhase.Exhale:
        impact(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        break;
    }
  }, [phase, status, enabled]);
}
