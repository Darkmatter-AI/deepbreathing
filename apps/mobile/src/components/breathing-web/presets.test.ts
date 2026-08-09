import { describe, expect, it } from 'vitest';

import {
  MAX_PRESET_DURATION_SEC,
  resolveModePreset,
  sanitizeModePresets,
  type ModePreset,
} from './presets';

const VALID = ['Box', 'Relax', 'Coherent'] as const;

describe('sanitizeModePresets', () => {
  it('returns {} for garbage input', () => {
    expect(sanitizeModePresets(null, VALID)).toEqual({});
    expect(sanitizeModePresets(undefined, VALID)).toEqual({});
    expect(sanitizeModePresets('nope', VALID)).toEqual({});
    expect(sanitizeModePresets(42, VALID)).toEqual({});
  });

  it('drops unknown modes', () => {
    const out = sanitizeModePresets({ Nope: { speed: 1, duration: 60 }, Box: { speed: 1, duration: 60 } }, VALID);
    expect(Object.keys(out)).toEqual(['Box']);
  });

  it('clamps speed into the valid range', () => {
    const out = sanitizeModePresets({ Box: { speed: 9.9, duration: 60 } }, VALID);
    expect(out.Box.speed).toBe(2.0);
    const low = sanitizeModePresets({ Box: { speed: -3, duration: 60 } }, VALID);
    expect(low.Box.speed).toBe(0.5);
    const junk = sanitizeModePresets({ Box: { speed: 'fast', duration: 60 } }, VALID);
    expect(junk.Box.speed).toBe(1.0);
  });

  it('clamps duration into the valid range and preserves null (Off)', () => {
    const out = sanitizeModePresets({ Box: { speed: 1, duration: 99999 } }, VALID);
    expect(out.Box.duration).toBe(MAX_PRESET_DURATION_SEC);
    const off = sanitizeModePresets({ Box: { speed: 1, duration: null } }, VALID);
    expect(off.Box.duration).toBeNull();
    const zero = sanitizeModePresets({ Box: { speed: 1, duration: 0 } }, VALID);
    expect(zero.Box.duration).toBeNull();
    const junk = sanitizeModePresets({ Box: { speed: 1, duration: 'long' } }, VALID);
    expect(junk.Box.duration).toBeNull();
  });

  it('keeps valid entries intact', () => {
    const out = sanitizeModePresets(
      { Relax: { speed: 0.7, duration: 300 }, Coherent: { speed: 1.5, duration: 600 } },
      VALID,
    );
    expect(out.Relax).toEqual({ speed: 0.7, duration: 300 });
    expect(out.Coherent).toEqual({ speed: 1.5, duration: 600 });
  });

  it('handles malformed per-mode entries without throwing', () => {
    const out = sanitizeModePresets(
      { Box: null, Relax: 'x', Coherent: { speed: 1.2, duration: 180 } },
      VALID,
    );
    expect(out.Box).toEqual({ speed: 1, duration: null });
    expect(out.Relax).toEqual({ speed: 1, duration: null });
    expect(out.Coherent).toEqual({ speed: 1.2, duration: 180 });
  });
});

describe('resolveModePreset', () => {
  const fallback: ModePreset = { speed: 1, duration: 60 };

  it('returns the stored preset when the mode has one', () => {
    const presets = { Box: { speed: 1.3, duration: 300 } };
    expect(resolveModePreset(presets, 'Box', fallback)).toEqual({ speed: 1.3, duration: 300 });
  });

  it('returns the fallback when the mode has no preset yet', () => {
    expect(resolveModePreset({}, 'Relax', fallback)).toEqual(fallback);
  });
});
