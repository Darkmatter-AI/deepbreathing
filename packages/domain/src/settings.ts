/**
 * Per-mode preset persistence — pure functions shared by the web and mobile
 * breathing experiences (single source of truth in @resonance/domain).
 *
 * A "preset" remembers the speed + duration a user last used for a given
 * mode, so switching modes restores that mode's own setup instead of
 * carrying the previous mode's values over.
 */

import { clampSpeed } from "./pacing";

/** A mode's remembered settings. `duration: null` = Off (no timer). */
export interface ModePreset {
  speed: number;
  duration: number | null;
}

export const MAX_PRESET_DURATION_SEC = 600;

const clampPresetDuration = (raw: unknown): number | null => {
  if (raw === null) return null;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return null;
  return Math.min(raw, MAX_PRESET_DURATION_SEC);
};

/**
 * Coerce an arbitrary parsed value (untrusted: storage or an old build) into
 * a safe per-mode preset map. Unknown modes and malformed entries are
 * dropped; out-of-range values clamp. Never throws.
 */
export const sanitizeModePresets = (
  raw: unknown,
  validModes: readonly string[],
): Record<string, ModePreset> => {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, ModePreset> = {};
  for (const [mode, value] of Object.entries(raw)) {
    if (!validModes.includes(mode)) continue;
    const v = (value ?? {}) as Record<string, unknown>;
    out[mode] = {
      speed: clampSpeed(v.speed),
      duration: clampPresetDuration(v.duration),
    };
  }
  return out;
};

/** Preset for `mode`, or the caller's fallback when the mode has none yet. */
export const resolveModePreset = (
  presets: Record<string, ModePreset>,
  mode: string,
  fallback: ModePreset,
): ModePreset => presets[mode] ?? fallback;
