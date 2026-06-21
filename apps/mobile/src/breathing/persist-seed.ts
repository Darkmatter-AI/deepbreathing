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
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function resolvePersistedItem(
  key: string,
  localStorageValue: string | null,
  snapshot?: Partial<Record<string, string | null>> | null,
): string | null {
  if (localStorageValue != null && localStorageValue !== '') {
    return localStorageValue;
  }
  const seeded = snapshot?.[key];
  if (seeded != null && seeded !== '') {
    return decodeSnapshotValue(seeded);
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
    if (existing != null && existing !== '') continue;
    const value = snapshot[key];
    if (value != null && value !== '') {
      const decoded = decodeSnapshotValue(value);
      if (decoded != null && decoded !== '') {
        storage.setItem(key, decoded);
      }
    }
  }
}
