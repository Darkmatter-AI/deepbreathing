import type { BreathingMode } from "@resonance/domain";

/**
 * Canonical mode identifiers for the audio engine. The enum's string values
 * ARE the `BreathingMode` union from `@resonance/domain` — the `satisfies`
 * check below fails to compile if the two ever drift apart, so this stays the
 * single place the enum is defined (web and mobile both re-export from here).
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
