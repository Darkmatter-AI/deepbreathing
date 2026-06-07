// Presentation constants for the breathing screen — labels, option lists, and a
// small dark palette. Mode accent colors come from the pattern catalog itself.

import { ModeName } from '@/breathing';

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

export const DURATION_OPTIONS: DurationOption[] = [
  { label: 'Off', seconds: 0, a11y: 'No timer' },
  { label: '1', seconds: 60, a11y: '1 minute' },
  { label: '3', seconds: 180, a11y: '3 minutes' },
  { label: '5', seconds: 300, a11y: '5 minutes' },
  { label: '10', seconds: 600, a11y: '10 minutes' },
];

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
