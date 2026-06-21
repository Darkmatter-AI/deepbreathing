// GA4 Measurement Protocol client for the native app.
//
// Events from the DOM component (breathing_session_start, breathing_session_end,
// mode_switch, page_viewed_breathing) are forwarded here so the app shows up in
// the same GA4 property as the website. Event names and params are unchanged;
// app_platform is appended so the dashboard can segment web vs. app.
//
// Design rules:
// - Fire-and-forget with a short timeout (GA4_MP_TIMEOUT_MS).
// - Never throws or rejects to the caller — analytics must never block the UI.
// - client_id is a UUID persisted in AsyncStorage so sessions from the same
//   install unify in GA4 (stable pseudonymous identity, no PII).

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Config — read at module initialisation from Expo's inlined env vars.
// EXPO_PUBLIC_* vars are substituted by Metro at bundle time (like CRA's
// REACT_APP_*). The .env file is gitignored; values never reach a tracked file.
// ---------------------------------------------------------------------------

const MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

/** Events the host forwards to GA4 MP. Matches BreathingExperience.tsx onEvent names. */
export const GA4_FORWARDED_EVENTS = new Set([
  'breathing_session_start',
  'breathing_session_end',
  'mode_switch',
  'page_viewed_breathing',
]);

const GA4_MP_TIMEOUT_MS = 5_000;
const CLIENT_ID_KEY = 'ga4_mp_client_id';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple UUID v4 (crypto.randomUUID not available on all RN targets). */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Return (or lazily create) a stable client_id for this install.
 * Best-effort — returns a fresh UUID if AsyncStorage fails; it won't persist
 * across launches in that case but will not throw.
 */
export async function getOrCreateClientId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(CLIENT_ID_KEY);
    if (stored) return stored;
    const fresh = uuidv4();
    await AsyncStorage.setItem(CLIENT_ID_KEY, fresh);
    return fresh;
  } catch {
    return uuidv4();
  }
}

// ---------------------------------------------------------------------------
// Main send function
// ---------------------------------------------------------------------------

export interface SendGA4EventOptions {
  /** Injected for unit tests; defaults to global fetch. */
  fetcher?: typeof fetch;
  /** Injected for unit tests; defaults to GA4_MP_TIMEOUT_MS. */
  timeoutMs?: number;
}

/**
 * Forward a single event to GA4 Measurement Protocol.
 *
 * Returns the HTTP status code on success, -1 on any error (network timeout,
 * missing config, etc.). The caller should treat any non-2xx as a no-op.
 * Never rejects.
 */
export async function sendGA4Event(
  eventName: string,
  params: Record<string, unknown>,
  clientId: string,
  options: SendGA4EventOptions = {},
): Promise<number> {
  const apiSecret = process.env.EXPO_PUBLIC_GA4_MP_API_SECRET;
  const measurementId = process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID;

  if (!apiSecret || !measurementId) {
    if (__DEV__) {
      console.warn('[GA4 MP] Missing EXPO_PUBLIC_GA4_MP_API_SECRET or EXPO_PUBLIC_GA4_MEASUREMENT_ID — skipping');
    }
    return -1;
  }

  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown';

  const body = JSON.stringify({
    client_id: clientId,
    events: [
      {
        name: eventName,
        params: {
          ...params,
          app_platform: platform,
        },
      },
    ],
  });

  const url = `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? GA4_MP_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    if (__DEV__) {
      console.log(`[GA4 MP] ${eventName} → HTTP ${response.status}`);
    }
    return response.status;
  } catch (err: unknown) {
    if (__DEV__) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[GA4 MP] ${eventName} failed: ${msg}`);
    }
    return -1;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// High-level helper used by index.tsx
// ---------------------------------------------------------------------------

let _clientIdCache: string | null = null;
let _clientIdPromise: Promise<string> | null = null;

/** Eagerly warm the client_id cache. Call once on app start. */
export function warmClientId(): void {
  if (_clientIdCache) return;
  if (_clientIdPromise) return;
  _clientIdPromise = getOrCreateClientId().then((id) => {
    _clientIdCache = id;
    return id;
  });
}

/**
 * Fire-and-forget GA4 event. Called from handleEvent in index.tsx.
 * Silently drops events if config is absent or network fails.
 */
export function fireGA4Event(
  eventName: string,
  params: Record<string, unknown>,
  options?: SendGA4EventOptions,
): void {
  const send = async () => {
    // Resolve client_id from cache, the in-flight warm-up, or AsyncStorage —
    // never race a second getOrCreateClientId against warmClientId, or one
    // install can mint two UUIDs and split into two GA4 users.
    let clientId: string;
    if (_clientIdCache) {
      clientId = _clientIdCache;
    } else if (_clientIdPromise) {
      clientId = await _clientIdPromise;
    } else {
      clientId = await getOrCreateClientId();
      _clientIdCache = clientId;
    }
    await sendGA4Event(eventName, params, clientId, options);
  };

  // Fire-and-forget: do not await, do not propagate errors.
  send().catch(() => {});
}
