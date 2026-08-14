// Pure helpers for seeding WKWebView localStorage from the native mirror.
// Unit-tested at the JS level (MOB-4a seed-path acceptance criterion).
//
// Snapshot values arrive encodeURIComponent-encoded: the @expo/dom-webview
// injectedObjectJson bridge embeds props in an unescaped JS template literal,
// which corrupts any value containing backslash escapes (see resonance-mirror.ts).
// These helpers decode back to the raw localStorage value.

export type PersistStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function decodeSnapshotValue(value: string): string | null {
  // A few early builds wrote the raw JSON value before the native bridge was
  // switched to encodeURIComponent transport. Accept that shape as-is; it is
  // especially important for a value containing a literal percent sign (for
  // example a color or a translated string), which is not valid URI encoding.
  if (/^[\[{\"]/.test(value)) {
    try {
      JSON.parse(value);
      return value;
    } catch {
      // Fall through to the URI decoder so a malformed raw value is rejected.
    }
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Parse an untrusted persisted JSON object without ever throwing.
 *
 * The native snapshot is URI encoded, while localStorage normally contains
 * raw JSON. Trying both forms lets us recover from the one release that wrote
 * the encoded value directly into localStorage instead of blanking the DOM
 * component on mount.
 */
export function parsePersistedJson<T extends Record<string, unknown> = Record<string, unknown>>(
  value: string | null | undefined,
): T | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  const candidates = [value];
  const decoded = decodeSnapshotValue(value);
  if (decoded != null && decoded !== value) candidates.push(decoded);

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      // Try the next representation, then return null below.
    }
  }
  return null;
}

/**
 * A persisted value is usable when it is non-empty and, for the two JSON
 * records, parses to an object. Other keys (theme/sound) are deliberately
 * opaque strings and only need the non-empty check.
 */
export function isPersistedValueUsable(key: string, value: string | null): boolean {
  if (value == null || value.trim() === '') return false;
  if (key === 'resonance_settings' || key === 'resonance_stats') {
    return parsePersistedJson(value) != null;
  }
  return true;
}

export function resolvePersistedItem(
  key: string,
  localStorageValue: string | null,
  snapshot?: Partial<Record<string, string | null>> | null,
): string | null {
  if (isPersistedValueUsable(key, localStorageValue)) {
    return localStorageValue;
  }
  const seeded = snapshot?.[key];
  if (seeded != null && seeded !== '') {
    const decoded = decodeSnapshotValue(seeded);
    return isPersistedValueUsable(key, decoded) ? decoded : null;
  }
  return null;
}

/** Gate native mirror writes until the mount seed pass has finished. */
export function shouldMirrorPersist(isNativeApp: boolean, storageHydrated: boolean): boolean {
  return isNativeApp && storageHydrated;
}

export function seedLocalStorageFromSnapshot(
  keys: readonly string[],
  snapshot: Partial<Record<string, string | null>> | null | undefined,
  storage: PersistStorage,
): void {
  if (!snapshot) return;
  for (const key of keys) {
    const existing = storage.getItem(key);
    // A non-empty but malformed JSON value is just as unusable as an empty
    // slot. In that case prefer the native mirror, which is the source of
    // truth for the WKWebView and prevents a blank/error DOM mount.
    if (isPersistedValueUsable(key, existing)) continue;
    const value = snapshot[key];
    if (value != null && value !== '') {
      const decoded = decodeSnapshotValue(value);
      if (decoded != null && isPersistedValueUsable(key, decoded)) {
        storage.setItem(key, decoded);
      }
    }
  }
}
