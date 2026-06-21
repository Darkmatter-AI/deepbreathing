// Persisted settings shape + a PURE sanitizer (no RN imports, vitest-testable).
// Anything read back from storage is untrusted: a bad/old/corrupt value must
// degrade to a safe default rather than wedge the UI.

import {
  DEFAULT_SPEED_MULTIPLIER,
  MAX_SPEED_MULTIPLIER,
  MIN_SPEED_MULTIPLIER,
  V1_MODES,
} from './patterns';
import { ModeName } from './types';

export interface BreathingSettings {
  mode: ModeName;
  speedMultiplier: number;
  selectedDurationSec: number;
  muted: boolean;
}

/** Durations the UI offers (Off/1/3/5/10 min). Anything else falls back to Off. */
export const ALLOWED_DURATIONS_SEC = [0, 60, 180, 300, 600];

export const DEFAULT_SETTINGS: BreathingSettings = {
  mode: ModeName.Box,
  speedMultiplier: DEFAULT_SPEED_MULTIPLIER,
  selectedDurationSec: 0,
  muted: false,
};

const clampSpeed = (raw: unknown): number => {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_SPEED_MULTIPLIER;
  const clamped = Math.min(MAX_SPEED_MULTIPLIER, Math.max(MIN_SPEED_MULTIPLIER, n));
  return Math.round(clamped * 10) / 10;
};

/** Coerce an arbitrary parsed value into valid settings. Never throws. */
export const sanitizeSettings = (raw: unknown): BreathingSettings => {
  const r = (raw ?? {}) as Partial<Record<keyof BreathingSettings, unknown>>;

  const mode = V1_MODES.includes(r.mode as ModeName)
    ? (r.mode as ModeName)
    : DEFAULT_SETTINGS.mode;

  const selectedDurationSec = ALLOWED_DURATIONS_SEC.includes(
    r.selectedDurationSec as number
  )
    ? (r.selectedDurationSec as number)
    : DEFAULT_SETTINGS.selectedDurationSec;

  return {
    mode,
    speedMultiplier: clampSpeed(r.speedMultiplier),
    selectedDurationSec,
    muted: r.muted === true,
  };
};
