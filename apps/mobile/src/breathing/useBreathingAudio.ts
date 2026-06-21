// Audio cues — one short clip per phase-entry (inhale / exhale / hold), played
// via expo-audio. v1 ships only the three cue WAVs (no per-mode ambient loops
// yet). Best-effort: a failed cue must never crash a breathing session.
//
// expo-audio (SDK 56) API verified against the installed package:
//   createAudioPlayer(source) -> AudioPlayer { play(), seekTo(s), muted, loop, remove() }
//   setAudioModeAsync({ playsInSilentMode, interruptionMode, ... })
// expo-audio does NOT auto-reset playback position, so we seekTo(0) before replay.

import { useEffect, useRef } from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

import { BreathingPhase } from '.';
import type { SessionStatus } from './useBreathingSession';

const cueSources = {
  inhale: require('../../assets/audio/inhale.wav'),
  exhale: require('../../assets/audio/exhale.wav'),
  hold: require('../../assets/audio/hold.wav'),
} as const;

type CueType = keyof typeof cueSources;

/** Which cue fires when ENTERING a phase (null = silent). */
const phaseCue = (phase: BreathingPhase): CueType | null => {
  switch (phase) {
    case BreathingPhase.Inhale:
    case BreathingPhase.Inhale2:
      return 'inhale';
    case BreathingPhase.Exhale:
      return 'exhale';
    case BreathingPhase.HoldIn:
    case BreathingPhase.HoldOut:
      return 'hold';
    default:
      return null;
  }
};

interface UseBreathingAudioInput {
  phase: BreathingPhase;
  status: SessionStatus;
  muted: boolean;
}

export function useBreathingAudio({ phase, status, muted }: UseBreathingAudioInput) {
  const playersRef = useRef<Partial<Record<CueType, AudioPlayer>>>({});
  const audioModeReadyRef = useRef(false);
  const mutedRef = useRef(muted);
  const lastPhaseRef = useRef<BreathingPhase | null>(null);
  mutedRef.current = muted;

  // Release players on unmount.
  useEffect(() => {
    const players = playersRef.current;
    return () => {
      Object.values(players).forEach((p) => {
        try {
          p?.remove();
        } catch {
          // already gone
        }
      });
    };
  }, []);

  useEffect(() => {
    if (status === 'idle') {
      lastPhaseRef.current = null;
      return;
    }
    // Paused: keep lastPhaseRef so resuming the same phase doesn't re-cue.
    if (status !== 'running') return;
    if (phase === lastPhaseRef.current) return;
    lastPhaseRef.current = phase;

    if (muted) return;
    const cue = phaseCue(phase);
    if (!cue) return;

    let cancelled = false;
    (async () => {
      try {
        if (!audioModeReadyRef.current) {
          await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: 'mixWithOthers',
            allowsRecording: false,
            shouldPlayInBackground: false,
            shouldRouteThroughEarpiece: false,
          });
          audioModeReadyRef.current = true;
        }
        if (cancelled) return;

        let player = playersRef.current[cue];
        if (!player) {
          player = createAudioPlayer(cueSources[cue]);
          player.loop = false;
          playersRef.current[cue] = player;
        }
        // No auto-reset in expo-audio — rewind before replay.
        try {
          await player.seekTo(0);
        } catch {
          // very short clip / not seekable — ignore
        }
        if (cancelled || mutedRef.current) return;
        player.play();
      } catch {
        // Cues are best-effort; swallow (e.g. web autoplay restrictions).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, status, muted]);
}
