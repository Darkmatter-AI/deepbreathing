import { describe, expect, it } from 'vitest';
import {
  parsePersistedJson,
  resolvePersistedItem,
  seedLocalStorageFromSnapshot,
  shouldMirrorPersist,
  type PersistStorage,
} from './persist-seed';

// Snapshot values are transported encodeURIComponent-encoded (see
// resonance-mirror.ts) — tests mirror that contract.
const enc = encodeURIComponent;

describe('resolvePersistedItem', () => {
  it('prefers localStorage when present', () => {
    expect(resolvePersistedItem('resonance_stats', '{"totalMinutes":5}', { resonance_stats: enc('{"totalMinutes":99}') }))
      .toBe('{"totalMinutes":5}');
  });

  it('falls back to the decoded snapshot when localStorage is empty', () => {
    expect(resolvePersistedItem('resonance_stats', null, { resonance_stats: enc('{"totalMinutes":12,"sessionsCompleted":3}') }))
      .toBe('{"totalMinutes":12,"sessionsCompleted":3}');
  });

  it('returns null when both are empty', () => {
    expect(resolvePersistedItem('resonance_stats', null, {})).toBeNull();
  });

  it('rejects malformed local JSON and recovers from the native snapshot', () => {
    expect(resolvePersistedItem('resonance_settings', '{not-json', {
      resonance_settings: enc('{"mode":"Box Breathing"}'),
    })).toBe('{"mode":"Box Breathing"}');
  });
});

describe('parsePersistedJson', () => {
  it('never throws for malformed or primitive values', () => {
    expect(parsePersistedJson('{not-json')).toBeNull();
    expect(parsePersistedJson('null')).toBeNull();
    expect(parsePersistedJson('"text"')).toBeNull();
  });

  it('accepts an encoded legacy JSON value', () => {
    expect(parsePersistedJson(enc('{"speedMultiplier":1.4}'))).toEqual({ speedMultiplier: 1.4 });
  });
});

describe('shouldMirrorPersist', () => {
  it('allows mirror writes only after hydration in native app', () => {
    expect(shouldMirrorPersist(true, false)).toBe(false);
    expect(shouldMirrorPersist(true, true)).toBe(true);
    expect(shouldMirrorPersist(false, true)).toBe(false);
  });
});

describe('seedLocalStorageFromSnapshot', () => {
  const makeStorage = (store: Record<string, string>): PersistStorage => ({
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
  });

  it('writes decoded snapshot values only for empty localStorage keys', () => {
    const store: Record<string, string> = { resonance_settings: '{"mode":"Box"}' };

    seedLocalStorageFromSnapshot(
      ['resonance_stats', 'resonance_settings'],
      {
        resonance_stats: enc('{"totalMinutes":7,"sessionsCompleted":2}'),
        resonance_settings: enc('{"mode":"Relax"}'),
      },
      makeStorage(store),
    );

    expect(store.resonance_stats).toBe('{"totalMinutes":7,"sessionsCompleted":2}');
    expect(store.resonance_settings).toBe('{"mode":"Box"}');
  });

  it('replaces malformed JSON with the native mirror', () => {
    const store: Record<string, string> = { resonance_settings: '{not-json' };

    seedLocalStorageFromSnapshot(
      ['resonance_settings'],
      { resonance_settings: enc('{"mode":"Relax"}') },
      makeStorage(store),
    );

    expect(store.resonance_settings).toBe('{"mode":"Relax"}');
  });

  it('round-trips values whose JSON encoding contains backslash escapes', () => {
    // This shape (nested JSON strings full of \") is what corrupted the
    // unescaped @expo/dom-webview template literal and blanked the webview.
    const raw = '{"mode":"Box Breathing","speed":1,"color":"#e11d48","duration":30}';
    const store: Record<string, string> = {};

    seedLocalStorageFromSnapshot(['resonance_settings'], { resonance_settings: enc(raw) }, makeStorage(store));

    expect(store.resonance_settings).toBe(raw);
    // The transport form must be free of every character the template literal mangles.
    expect(enc(raw)).not.toMatch(/[\\"`]|\$\{/);
  });

  it('skips undecodable snapshot values', () => {
    const store: Record<string, string> = {};

    seedLocalStorageFromSnapshot(['resonance_settings'], { resonance_settings: '%E0%A4%A' }, makeStorage(store));

    expect(store).toEqual({});
  });

  it('no-ops when snapshot is missing', () => {
    const store: Record<string, string> = {};

    seedLocalStorageFromSnapshot(['resonance_stats'], undefined, makeStorage(store));
    expect(store).toEqual({});
  });
});
