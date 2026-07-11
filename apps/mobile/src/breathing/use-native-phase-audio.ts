import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

const cueSources = {
  inhale: require('../../assets/audio/inhale.wav'),
  exhale: require('../../assets/audio/exhale.wav'),
  hold: require('../../assets/audio/hold.wav'),
} as const;

type CueName = keyof typeof cueSources;

function cueForPhase(phase: unknown): CueName | null {
  if (phase === 'Inhale' || phase === 'Inhale (Top up)') return 'inhale';
  if (phase === 'Exhale') return 'exhale';
  if (phase === 'Hold In' || phase === 'Hold Out') return 'hold';
  return null;
}

/** Plays WebView-timed phase cues through the native iOS audio session. */
export function useNativePhaseAudio() {
  const playersRef = useRef<Partial<Record<CueName, AudioPlayer>>>({});

  useEffect(() => {
    (Object.keys(cueSources) as CueName[]).forEach((cue) => {
      const player = createAudioPlayer(cueSources[cue]);
      player.loop = false;
      player.volume = 1;
      playersRef.current[cue] = player;
    });
    const players = playersRef.current;
    return () => {
      Object.values(players).forEach((player) => {
        try {
          player?.remove();
        } catch {
          // The player may already have been released by the native module.
        }
      });
    };
  }, []);

  return useCallback(async (phase: unknown, muted: boolean) => {
    if (muted) return;
    const cue = cueForPhase(phase);
    if (!cue) return;

    try {
      let player = playersRef.current[cue];
      if (!player) {
        player = createAudioPlayer(cueSources[cue]);
        player.loop = false;
        player.volume = 1;
        playersRef.current[cue] = player;
      }
      await player.seekTo(0);
      player.play();
    } catch {
      // Audio feedback must never interrupt the breathing clock.
    }
  }, []);
}
