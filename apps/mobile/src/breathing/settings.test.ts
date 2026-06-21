import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';
import { ModeName } from './types';

describe('sanitizeSettings', () => {
  it('returns defaults for null/garbage', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a valid round-trip', () => {
    const s = { mode: ModeName.Relax, speedMultiplier: 1.5, selectedDurationSec: 300, muted: true };
    expect(sanitizeSettings(s)).toEqual(s);
  });

  it('rejects a non-v1 mode (e.g. a protocol mode) back to default', () => {
    expect(sanitizeSettings({ mode: ModeName.WimHof }).mode).toBe(DEFAULT_SETTINGS.mode);
    expect(sanitizeSettings({ mode: 'totally-fake' }).mode).toBe(DEFAULT_SETTINGS.mode);
  });

  it('clamps speed to [0.5, 2.0] and rounds to 1 decimal', () => {
    expect(sanitizeSettings({ speedMultiplier: 5 }).speedMultiplier).toBe(2.0);
    expect(sanitizeSettings({ speedMultiplier: 0.1 }).speedMultiplier).toBe(0.5);
    expect(sanitizeSettings({ speedMultiplier: 1.23 }).speedMultiplier).toBe(1.2);
    expect(sanitizeSettings({ speedMultiplier: NaN }).speedMultiplier).toBe(1.0);
    expect(sanitizeSettings({ speedMultiplier: '1.4' }).speedMultiplier).toBe(1.4);
  });

  it('only accepts allowed durations, else Off', () => {
    expect(sanitizeSettings({ selectedDurationSec: 180 }).selectedDurationSec).toBe(180);
    expect(sanitizeSettings({ selectedDurationSec: 999 }).selectedDurationSec).toBe(0);
    expect(sanitizeSettings({ selectedDurationSec: -60 }).selectedDurationSec).toBe(0);
  });

  it('coerces muted strictly to boolean true', () => {
    expect(sanitizeSettings({ muted: true }).muted).toBe(true);
    expect(sanitizeSettings({ muted: 'yes' }).muted).toBe(false);
    expect(sanitizeSettings({ muted: 1 }).muted).toBe(false);
  });
});
