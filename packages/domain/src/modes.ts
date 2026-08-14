import type { BreathingMode } from "./sessions";

/**
 * Canonical mode identifiers, shared by web, mobile and audio. The enum's
 * string values ARE the `BreathingMode` union in sessions.ts — the `satisfies`
 * check below fails to compile if the two ever drift apart. Re-exported by
 * @resonance/audio (packages/audio/src/modes.ts) for back-compat.
 */
export enum ModeName {
  Box = 'Box Breathing',
  Relax = '4-7-8 Relax',
  Coherent = 'Coherent Breathing',
  Sigh = 'Physiological Sigh',
  WimHof = 'Wim Hof Breathing',
  PursedLip = 'Pursed Lip Breathing',
  NadiShodhana = 'Nadi Shodhana',
  Ujjayi = 'Ujjayi Breathing',
  Belly = 'Belly Breathing',
  Buteyko = 'Buteyko Breathing',
  Tummo = 'Tummo Breathing',
  BreathOfFire = 'Breath of Fire',
}

// Compile-time drift guard against the domain union.
const _modeNamesAreBreathingModes = Object.values(ModeName) satisfies BreathingMode[];
void _modeNamesAreBreathingModes;
