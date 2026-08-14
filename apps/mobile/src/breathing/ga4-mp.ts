// Consent-gated GA4 Measurement Protocol bridge for the native app.
//
// The app never sends a Measurement Protocol secret (or a measurement ID) to
// the client. It POSTs a small, allowlisted event envelope to our same-origin
// server route, which owns the GA4 credentials and forwards the event. The
// server route is deliberately the trust boundary: it validates event names,
// parameters, and payload size before talking to Google.
//
// Analytics is optional. Until the user explicitly allows it, this module does
// not create/read the per-install analytics UUID and drops every event. A
// denial also removes any previously-created UUID from local storage.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalyticsConsent = 'granted' | 'denied';

/** Fixed first-party endpoint; no client-controlled host or credentials. */
export const GA4_ANALYTICS_ENDPOINT =
  'https://origin.deepbreathingexercises.com/api/v1/analytics';

/** Events the host forwards to GA4 MP. Matches BreathingExperience.tsx. */
export const GA4_FORWARDED_EVENTS = new Set([
  'breathing_session_start',
  'breathing_session_end',
  'mode_switch',
  'page_viewed_breathing',
]);

const GA4_MP_TIMEOUT_MS = 5_000;
const CLIENT_ID_KEY = 'ga4_mp_client_id';
const ANALYTICS_CONSENT_KEY = 'deepbreathing.analytics-consent.v1';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// `undefined` means the persisted preference has not been read yet; `null`
// means it was read and the user has not chosen. Keeping this distinction
// prevents an initial render from accidentally opting a user in.
let consentCache: AnalyticsConsent | null | undefined;
let consentPromise: Promise<AnalyticsConsent | null> | null = null;
let consentGeneration = 0;

/** Read the explicit analytics choice without throwing on storage failures. */
export async function getAnalyticsConsent(): Promise<AnalyticsConsent | null> {
  if (consentCache !== undefined) return consentCache;
  if (!consentPromise) {
    const readGeneration = consentGeneration;
    consentPromise = AsyncStorage.getItem(ANALYTICS_CONSENT_KEY)
      .then((value) => {
        // A user may make a choice while the initial storage read is in
        // flight. Never let that late read overwrite the newer in-memory
        // choice (or send an event that was queued before consent).
        if (consentCache === undefined && consentGeneration === readGeneration) {
          consentCache = value === 'granted' || value === 'denied' ? value : null;
        }
        return consentCache ?? null;
      })
      .catch(() => {
        // A storage failure must fail closed: no analytics and no ID.
        // Keep a newer synchronous choice if the initial read rejects after
        // the user has already made a choice.
        if (consentCache === undefined && consentGeneration === readGeneration) {
          consentCache = null;
        }
        return consentCache ?? null;
      })
      .finally(() => {
        consentPromise = null;
      });
  }
  return consentPromise;
}

/** Persist a choice. Revoking consent also deletes the analytics UUID. */
export async function setAnalyticsConsent(consent: AnalyticsConsent): Promise<void> {
  // Update synchronously so an event fired in the same tick cannot race the
  // persistence write and sneak through after the user withdraws consent.
  consentCache = consent;
  consentGeneration += 1;
  if (consent === 'denied') {
    _clientIdCache = null;
    _clientIdPromise = null;
    await Promise.all([
      AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, consent),
      AsyncStorage.removeItem(CLIENT_ID_KEY),
    ]).catch(() => {});
    return;
  }
  await AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, consent).catch(() => {});
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple UUID v4 (crypto.randomUUID is not available on every RN target). */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Return (or lazily create) a stable client_id for this install, but only
 * after explicit analytics consent. A null result means analytics is off or
 * consent/storage is unavailable.
 */
export async function getOrCreateClientId(): Promise<string | null> {
  if (consentCache !== 'granted') return null;
  if ((await getAnalyticsConsent()) !== 'granted') return null;
  const generation = consentGeneration;
  try {
    const stored = await AsyncStorage.getItem(CLIENT_ID_KEY);
    if (consentGeneration !== generation || consentCache !== 'granted') return null;
    if (stored && UUID_PATTERN.test(stored)) return stored;
    const fresh = uuidv4();
    await AsyncStorage.setItem(CLIENT_ID_KEY, fresh);
    if (consentGeneration !== generation || consentCache !== 'granted') {
      await AsyncStorage.removeItem(CLIENT_ID_KEY).catch(() => {});
      return null;
    }
    return fresh;
  } catch {
    // Do not create a persistent ID if storage failed. A transient ID would
    // still be safe, but persistence failure should not surprise the user.
    return null;
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
 * Forward a single consented event to the server analytics route.
 *
 * Returns the HTTP status code on success, -1 on any error (network timeout,
 * no consent, invalid event, etc.). Never rejects.
 */
export async function sendGA4Event(
  eventName: string,
  params: Record<string, unknown>,
  clientId: string,
  options: SendGA4EventOptions = {},
): Promise<number> {
  if (!GA4_FORWARDED_EVENTS.has(eventName)) return -1;
  if (consentCache !== 'granted') return -1;
  if ((await getAnalyticsConsent()) !== 'granted' || !UUID_PATTERN.test(clientId)) {
    return -1;
  }

  const platform =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
        ? 'android'
        : 'unknown';
  const body = JSON.stringify({
    eventName,
    clientId,
    params,
    platform,
  });

  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? GA4_MP_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(GA4_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[GA4 MP] ${eventName} → HTTP ${response.status}`);
    }
    return response.status;
  } catch (err: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
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
let _clientIdPromise: Promise<string | null> | null = null;

/** Eagerly warm the client_id cache, but only after consent is granted. */
export function warmClientId(): void {
  if (_clientIdCache || _clientIdPromise) return;
  _clientIdPromise = getOrCreateClientId().then((id) => {
    _clientIdCache = id;
    return id;
  });
}

/**
 * Fire-and-forget GA4 event. Called from handleEvent in index.tsx.
 * Silently drops events if consent is absent, config is unavailable server-side,
 * or the network fails.
 */
export function fireGA4Event(
  eventName: string,
  params: Record<string, unknown>,
  options?: SendGA4EventOptions,
): void {
  if (!GA4_FORWARDED_EVENTS.has(eventName)) return;
  const send = async () => {
    // The consent state must already be granted when the event is emitted;
    // events observed during first-launch loading are dropped, not replayed if
    // the user later opts in.
    if (consentCache !== 'granted') return;
    if ((await getAnalyticsConsent()) !== 'granted') return;
    // Resolve client_id from cache, the in-flight warm-up, or AsyncStorage —
    // never race a second getOrCreateClientId against warmClientId.
    let clientId: string | null;
    if (_clientIdCache) {
      clientId = _clientIdCache;
    } else if (_clientIdPromise) {
      clientId = await _clientIdPromise;
    } else {
      clientId = await getOrCreateClientId();
      _clientIdCache = clientId;
    }
    if (!clientId) return;
    await sendGA4Event(eventName, params, clientId, options);
  };

  // Fire-and-forget: do not await, do not propagate errors.
  send().catch(() => {});
}
