// Loads persisted settings once on mount and autosaves on change. `hydrated`
// gates the save effect so the initial defaults can't clobber stored values
// before the async load resolves.

import { useEffect, useState } from 'react';

import { ModeName } from '.';
import { DEFAULT_SETTINGS } from './settings';
import { loadSettings, saveSettings } from './storage';

export interface BreathingSettingsController {
  mode: ModeName;
  speed: number;
  durationSec: number;
  muted: boolean;
  hydrated: boolean;
  setMode: (mode: ModeName) => void;
  setSpeed: (speed: number) => void;
  setDurationSec: (seconds: number) => void;
  setMuted: (updater: boolean | ((prev: boolean) => boolean)) => void;
}

export function useBreathingSettings(): BreathingSettingsController {
  const [mode, setMode] = useState<ModeName>(DEFAULT_SETTINGS.mode);
  const [speed, setSpeed] = useState(DEFAULT_SETTINGS.speedMultiplier);
  const [durationSec, setDurationSec] = useState(DEFAULT_SETTINGS.selectedDurationSec);
  const [muted, setMuted] = useState(DEFAULT_SETTINGS.muted);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    loadSettings().then((s) => {
      if (!active) return;
      setMode(s.mode);
      setSpeed(s.speedMultiplier);
      setDurationSec(s.selectedDurationSec);
      setMuted(s.muted);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSettings({
      mode,
      speedMultiplier: speed,
      selectedDurationSec: durationSec,
      muted,
    });
  }, [hydrated, mode, speed, durationSec, muted]);

  return {
    mode,
    speed,
    durationSec,
    muted,
    hydrated,
    setMode,
    setSpeed,
    setDurationSec,
    setMuted,
  };
}
