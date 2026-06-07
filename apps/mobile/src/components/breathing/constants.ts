// Presentation constants for the breathing screen — labels, option lists, and a
// small dark palette. Mode accent colors come from the pattern catalog itself.

import { ModeName } from '@/breathing';
import { ALLOWED_DURATIONS_SEC } from '@/breathing/settings';

/** Short, glanceable labels for the mode pills (ModeName values are long). */
export const MODE_LABELS: Record<ModeName, string> = {
  [ModeName.Box]: 'Box',
  [ModeName.Relax]: 'Relax',
  [ModeName.Coherent]: 'Coherent',
  [ModeName.Sigh]: 'Sigh',
  [ModeName.WimHof]: 'Wim Hof',
  [ModeName.PursedLip]: 'Pursed Lip',
  [ModeName.NadiShodhana]: 'Nadi Shodhana',
  [ModeName.Ujjayi]: 'Ujjayi',
  [ModeName.Belly]: 'Belly',
  [ModeName.Buteyko]: 'Buteyko',
  [ModeName.Tummo]: 'Tummo',
  [ModeName.BreathOfFire]: 'Breath of Fire',
};

export interface DurationOption {
  label: string;
  /** Seconds; 0 = open-ended (no auto-stop). */
  seconds: number;
  /** Spoken label for screen readers. */
  a11y: string;
}

// Derived from the single source of truth in settings.ts so a chip can never be
// offered that sanitizeSettings would reject on reload.
export const DURATION_OPTIONS: DurationOption[] = ALLOWED_DURATIONS_SEC.map(
  (seconds) => {
    if (seconds === 0) return { label: 'Off', seconds, a11y: 'No timer' };
    const min = seconds / 60;
    return { label: String(min), seconds, a11y: `${min} minute${min === 1 ? '' : 's'}` };
  }
);

/** Minimum hit target per platform a11y guidance. */
export const MIN_TOUCH = 44;

export const palette = {
  bg: '#0b0b0f',
  surface: '#17181d',
  surfaceActive: '#23252c',
  border: '#2a2c34',
  textPrimary: '#f5f6f8',
  textSecondary: '#9aa0a6',
  textMuted: '#6b7077',
} as const;
