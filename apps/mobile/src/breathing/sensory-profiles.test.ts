import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SENSORY_PROFILES,
  SENSORY_CONTROL_RANGES,
  SENSORY_MODE_IDS,
  SENSORY_PHASE_IDS,
  SENSORY_SCHEMA_VERSION,
  cloneSensoryProfile,
  getDefaultSensoryProfile,
  normalizeSensoryProfile,
} from '@resonance/domain';

describe('sensory profile contract', () => {
  it('ships schema v1 defaults for the seven editable modes and every phase', () => {
    expect(SENSORY_SCHEMA_VERSION).toBe(1);
    expect(SENSORY_MODE_IDS).toEqual([
      'box',
      'relax',
      'coherent',
      'sigh',
      'ujjayi',
      'belly',
      'pursed-lip',
    ]);
    expect(SENSORY_PHASE_IDS).toEqual(['inhale', 'inhale2', 'holdIn', 'exhale', 'holdOut']);
    expect(SENSORY_CONTROL_RANGES.motion.gravityOffsetY).toEqual({ min: -0.5, max: 0.5, step: 0.01 });
    expect(SENSORY_CONTROL_RANGES.phase.haptic.durationMs).toEqual({ min: 0, max: 1_000, step: 1 });

    for (const modeId of SENSORY_MODE_IDS) {
      const profile = DEFAULT_SENSORY_PROFILES[modeId];
      expect(profile.schemaVersion).toBe(1);
      expect(profile.modeId).toBe(modeId);
      expect(Object.keys(profile.phases)).toEqual(SENSORY_PHASE_IDS);
      expect(profile.phases.inhale.visual.orbScale).toBeGreaterThan(0);
      expect(profile.phases.exhale.visual.orbScale).toBe(0);
      expect(profile.phases.inhale.visual.particleFlow).toBeLessThanOrEqual(0);
      expect(profile.phases.exhale.visual.particleFlow).toBeGreaterThanOrEqual(0);
      expect(JSON.parse(JSON.stringify(profile))).toEqual(profile);
    }
  });

  it('gives the modes distinct visual, audio, and tactile character', () => {
    expect(DEFAULT_SENSORY_PROFILES.box.phases.inhale.visual.curve).toBe('linear');
    expect(DEFAULT_SENSORY_PROFILES.box.phases.holdIn.haptic.pattern).toBe('crisp');

    expect(DEFAULT_SENSORY_PROFILES.relax.audio.soundscape).toBe('rain');
    expect(DEFAULT_SENSORY_PROFILES.relax.guidance.instructionFadeCycles).toBe(2);

    expect(DEFAULT_SENSORY_PROFILES.coherent.phases.inhale.visual.curve).toBe('sine');
    expect(DEFAULT_SENSORY_PROFILES.coherent.audio.breathModulation).toBeGreaterThan(0.8);

    expect(DEFAULT_SENSORY_PROFILES.sigh.phases.inhale2.audio.cue).toBe('top-up');
    expect(DEFAULT_SENSORY_PROFILES.sigh.phases.inhale2.haptic.pattern).toBe('top-up');

    expect(DEFAULT_SENSORY_PROFILES.ujjayi.audio.soundscape).toBe('deep-ocean');
    expect(DEFAULT_SENSORY_PROFILES.belly.palette.orb).toBe('#f59e0b');
    expect(DEFAULT_SENSORY_PROFILES['pursed-lip'].phases.exhale.audio.cue).toBe('long-release');
  });

  it('returns deep clones so studio edits cannot mutate the defaults', () => {
    const clone = getDefaultSensoryProfile('sigh');
    clone.palette.orb = '#ffffff';
    clone.phases.inhale2.haptic.intensity = 0;

    expect(DEFAULT_SENSORY_PROFILES.sigh.palette.orb).toBe('#0ea5e9');
    expect(DEFAULT_SENSORY_PROFILES.sigh.phases.inhale2.haptic.intensity).toBeGreaterThan(0);
    expect(cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.sigh)).toEqual(DEFAULT_SENSORY_PROFILES.sigh);
  });
});

describe('normalizeSensoryProfile', () => {
  it('overlays partial imports on their mode default and clamps every numeric control', () => {
    const profile = normalizeSensoryProfile({
      schemaVersion: 1,
      modeId: 'coherent',
      palette: { orb: '#ABCDEF', background: 'not-a-color' },
      motion: {
        orbMinScale: 9,
        orbMaxScale: -2,
        particleDensity: 4,
        gravityOffsetY: -9,
      },
      audio: { ambientVolume: 3, cueVolume: -1, breathModulation: 0.42 },
      guidance: { showLabels: false, instructionFadeCycles: 4.8 },
      phases: {
        inhale: {
          visual: {
            orbScale: 9,
            edgeGlow: -2,
            particleFlow: 12,
            hueShiftDegrees: 999,
            curve: 'ease-in',
          },
          audio: { volume: -1, pitchSemitones: 99, cue: 'soft-bell' },
          haptic: { intensity: 3, sharpness: -1, durationMs: 48.9, pattern: 'crisp' },
        },
      },
      ignored: 'not part of the contract',
    });

    expect(profile).not.toBeNull();
    expect(profile?.palette.orb).toBe('#abcdef');
    expect(profile?.palette.background).toBe(DEFAULT_SENSORY_PROFILES.coherent.palette.background);
    expect(profile?.motion.orbMinScale).toBe(1);
    expect(profile?.motion.orbMaxScale).toBe(1);
    expect(profile?.motion.particleDensity).toBe(1);
    expect(profile?.motion.gravityOffsetY).toBe(-0.5);
    expect(profile?.audio).toMatchObject({ ambientVolume: 1, cueVolume: 0, breathModulation: 0.42 });
    expect(profile?.guidance).toMatchObject({ showLabels: false, instructionFadeCycles: 5 });
    expect(profile?.phases.inhale.visual).toMatchObject({
      orbScale: 1,
      edgeGlow: 0,
      particleFlow: 1,
      hueShiftDegrees: 180,
      curve: 'ease-in',
    });
    expect(profile?.phases.inhale.audio).toMatchObject({ volume: 0, pitchSemitones: 24, cue: 'soft-bell' });
    expect(profile?.phases.inhale.haptic).toEqual({
      pattern: 'crisp',
      intensity: 1,
      sharpness: 0,
      durationMs: 49,
    });
    expect(profile).not.toHaveProperty('ignored');
  });

  it('falls back field-by-field for invalid non-numeric controls', () => {
    const profile = normalizeSensoryProfile({
      schemaVersion: 1,
      modeId: 'belly',
      audio: { soundscape: 'laser-beams', ambientVolume: Number.NaN },
      guidance: { haptics: 'yes' },
      phases: {
        exhale: {
          visual: { curve: 'bounce' },
          audio: { cue: 'gong' },
          haptic: { pattern: 'buzz' },
        },
      },
    });

    expect(profile?.audio).toEqual(DEFAULT_SENSORY_PROFILES.belly.audio);
    expect(profile?.guidance.haptics).toBe(DEFAULT_SENSORY_PROFILES.belly.guidance.haptics);
    expect(profile?.phases.exhale.visual.curve).toBe(DEFAULT_SENSORY_PROFILES.belly.phases.exhale.visual.curve);
    expect(profile?.phases.exhale.audio.cue).toBe(DEFAULT_SENSORY_PROFILES.belly.phases.exhale.audio.cue);
    expect(profile?.phases.exhale.haptic.pattern).toBe(DEFAULT_SENSORY_PROFILES.belly.phases.exhale.haptic.pattern);
  });

  it('rejects unknown schema versions, modes, and non-object payloads', () => {
    expect(normalizeSensoryProfile({ schemaVersion: 2, modeId: 'box' })).toBeNull();
    expect(normalizeSensoryProfile({ schemaVersion: 1, modeId: 'wim-hof' })).toBeNull();
    expect(normalizeSensoryProfile(null)).toBeNull();
    expect(normalizeSensoryProfile('json string')).toBeNull();
  });

  it('round-trips a complete default without changing it', () => {
    expect(normalizeSensoryProfile(DEFAULT_SENSORY_PROFILES.relax)).toEqual(DEFAULT_SENSORY_PROFILES.relax);
  });
});
