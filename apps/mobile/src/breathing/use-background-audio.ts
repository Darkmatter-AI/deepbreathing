import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';

import { backgroundAudioRemainingMs } from './background-audio';

const backgroundBed = require('../../assets/audio/background/calm-bed.m4a');

export interface NativeAudioState {
  active: boolean;
  muted: boolean;
  elapsedSeconds: number;
  duration: number | null;
  reportedAtMs: number;
}

interface UseBackgroundAudioInput {
  appState: 'active' | 'background';
  audioState: NativeAudioState;
}

export function useBackgroundAudio({ appState, audioState }: UseBackgroundAudioInput) {
  const player = useAudioPlayer(backgroundBed, { downloadFirst: true });
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.8;
  }, [player]);

  useEffect(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const stop = () => {
      if (!playingRef.current) return;
      playingRef.current = false;
      player.pause();
      void player.seekTo(0).catch(() => {});
    };

    const shouldPlay =
      appState === 'background' && audioState.active && !audioState.muted;

    if (!shouldPlay) {
      stop();
      return;
    }

    const remainingMs = backgroundAudioRemainingMs(
      audioState.duration,
      audioState.elapsedSeconds,
      audioState.reportedAtMs,
    );
    if (remainingMs === 0) {
      stop();
      return;
    }

    const start = async () => {
      try {
        if (!playingRef.current) {
          await player.seekTo(0);
          player.play();
          playingRef.current = true;
        }
      } catch {
        playingRef.current = false;
      }
    };
    void start();

    if (remainingMs != null) {
      stopTimerRef.current = setTimeout(stop, remainingMs);
    }

    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    };
  }, [appState, audioState, player]);
}
