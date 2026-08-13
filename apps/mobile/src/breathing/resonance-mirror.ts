// Native AsyncStorage mirror for WKWebView localStorage keys. The webview
// copy can be evicted under storage pressure; this mirror is source of truth.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const RESONANCE_STORAGE_KEYS = {
  STATS: 'resonance_stats',
  SETTINGS: 'resonance_settings',
  THEME: 'resonance_theme',
  SOUND_OK: 'resonance_sound_ok',
} as const;

export type ResonanceStorageKey =
  (typeof RESONANCE_STORAGE_KEYS)[keyof typeof RESONANCE_STORAGE_KEYS];

/**
 * Values are encodeURIComponent-encoded for transport. The snapshot crosses
 * into the WKWebView via @expo/dom-webview's injectedObjectJson, whose native
 * side embeds the serialized props inside a JS template literal WITHOUT
 * escaping — any `\"` produced by JSON-stringified string values is eaten by
 * the template literal, corrupting the whole payload and blanking the webview
 * (`$$EXPO_DOM_HOST_OS is not defined`). encodeURIComponent output contains no
 * backslashes, quotes, backticks, or `${`, so it survives that path verbatim.
 * Decode happens in persist-seed.ts at the localStorage seed site.
 */
export type ResonancePersistedSnapshot = Partial<
  Record<ResonanceStorageKey, string | null>
>;

const ALL_KEYS = Object.values(RESONANCE_STORAGE_KEYS);

// Persist callbacks can outlive the DOM instance that emitted them. Writes are
// serialized and tagged with the owner-generation that was current when the
// callback was created, so an old WebView cannot overwrite a newly selected
// account's mirror after an owner transition.
let mirrorOwnerGeneration = 0;
let mirrorWriteTail: Promise<void> = Promise.resolve();

export const beginMirrorOwnerTransition = (): number => {
  mirrorOwnerGeneration += 1;
  return mirrorOwnerGeneration;
};

export const getMirrorOwnerGeneration = (): number => mirrorOwnerGeneration;

export const drainMirrorWrites = async (): Promise<void> => {
  await mirrorWriteTail;
};

export const loadPersistedSnapshot = async (): Promise<ResonancePersistedSnapshot> => {
  try {
    const entries = await AsyncStorage.multiGet(ALL_KEYS);
    const snapshot: ResonancePersistedSnapshot = {};
    for (const [key, value] of entries) {
      if (value != null) {
        snapshot[key as ResonanceStorageKey] = encodeURIComponent(value);
      }
    }
    return snapshot;
  } catch {
    return {};
  }
};

export const mirrorPersist = async (
  key: string,
  value: string | null,
  generation = mirrorOwnerGeneration,
): Promise<void> => {
  const write = mirrorWriteTail.catch(() => {}).then(async () => {
    if (generation !== mirrorOwnerGeneration) return;
    try {
      if (value == null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // Best-effort — a write failure shouldn't surface to the user.
    }
  });
  mirrorWriteTail = write.catch(() => {});
  await write;
};
