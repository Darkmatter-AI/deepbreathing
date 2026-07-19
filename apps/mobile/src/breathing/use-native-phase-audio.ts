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
    const cue = cueForPhase(phase);
    if (__DEV__) {
      console.log(`[cue-audio] phase=${String(phase)} cue=${cue ?? 'none'} muted=${muted}`);
    }
    if (muted || !cue) return;

    let player = playersRef.current[cue];
    if (!player) {
      try {
        player = createAudioPlayer(cueSources[cue]);
        player.loop = false;
        player.volume = 1;
        playersRef.current[cue] = player;
      } catch (error) {
        if (__DEV__) console.warn('[cue-audio] player create failed', error);
        return;
      }
    }
    // seekTo can reject while the source is still loading; a failed rewind
    // must not block the play attempt (a cue that starts at 0 anyway).
    try {
      await player.seekTo(0);
    } catch (error) {
      if (__DEV__) console.warn('[cue-audio] seekTo failed', error);
    }
    try {
      player.play();
      if (__DEV__) console.log(`[cue-audio] play() ok — ${cue}`);
    } catch (error) {
      if (__DEV__) console.warn('[cue-audio] play failed', error);
    }
  }, []);
}
