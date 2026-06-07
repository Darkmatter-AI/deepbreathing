// AsyncStorage glue for persisted settings. Thin: validation lives in the pure
// settings.ts; this file just reads/writes JSON and never throws.

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BreathingSettings,
  DEFAULT_SETTINGS,
  sanitizeSettings,
} from './settings';

const STORAGE_KEY = 'deepbreathing.settings.v1';

export const loadSettings = async (): Promise<BreathingSettings> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: BreathingSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Persistence is best-effort; a write failure shouldn't surface to the user.
  }
};
