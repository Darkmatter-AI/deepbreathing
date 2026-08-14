// Unit tests for the consent-gated native analytics bridge.

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const storageMock = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: storageMock,
  };
});

(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ = false;

import {
  GA4_ANALYTICS_ENDPOINT,
  GA4_FORWARDED_EVENTS,
  getAnalyticsConsent,
  getOrCreateClientId,
  sendGA4Event,
  setAnalyticsConsent,
} from './ga4-mp';

const VALID_CLIENT_ID = '123e4567-e89b-42d3-a456-426614174000';

beforeEach(async () => {
  await setAnalyticsConsent('granted');
});

afterEach(async () => {
  await setAnalyticsConsent('denied');
  vi.restoreAllMocks();
});

describe('GA4_FORWARDED_EVENTS', () => {
  it('includes only the four expected event names', () => {
    expect([...GA4_FORWARDED_EVENTS]).toEqual([
      'breathing_session_start',
      'breathing_session_end',
      'mode_switch',
      'page_viewed_breathing',
    ]);
  });
});

describe('consent and client ID', () => {
  it('keeps a newer choice when the initial storage read rejects', async () => {
    // Import a fresh module instance so consent starts unresolved, matching a
    // first launch where AsyncStorage has not answered yet.
    vi.resetModules();
    let rejectRead: (reason?: unknown) => void = () => {};
    storageMock.getItem.mockImplementationOnce(
      () =>
        new Promise<string | null>((_resolve, reject) => {
          rejectRead = reject;
        }),
    );

    const freshAnalytics = await import('./ga4-mp');
    const pendingRead = freshAnalytics.getAnalyticsConsent();
    await freshAnalytics.setAnalyticsConsent('granted');
    rejectRead(new Error('SecureStore temporarily unavailable'));

    await expect(pendingRead).resolves.toBe('granted');
    await expect(freshAnalytics.getAnalyticsConsent()).resolves.toBe('granted');
  });

  it('fails closed before consent and does not create an analytics ID', async () => {
    await setAnalyticsConsent('denied');
    expect(await getAnalyticsConsent()).toBe('denied');
    expect(await getOrCreateClientId()).toBeNull();
  });

  it('creates a stable UUID only after consent', async () => {
    await setAnalyticsConsent('granted');
    const id1 = await getOrCreateClientId();
    const id2 = await getOrCreateClientId();
    expect(id1).toMatch(/^[0-9a-f-]{36}$/);
    expect(id2).toBe(id1);
  });

  it('removes the local analytics ID when consent is withdrawn', async () => {
    await setAnalyticsConsent('granted');
    expect(await getOrCreateClientId()).not.toBeNull();
    await setAnalyticsConsent('denied');
    expect(await getOrCreateClientId()).toBeNull();
  });
});

describe('sendGA4Event — server proxy', () => {
  it('sends a POST to the fixed first-party route and returns the HTTP status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 204 });

    const status = await sendGA4Event(
      'breathing_session_start',
      { duration: 30, mode: 'Box Breathing' },
      VALID_CLIENT_ID,
      { fetcher: mockFetch, timeoutMs: 1000 },
    );

    expect(status).toBe(204);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(GA4_ANALYTICS_ENDPOINT);
    expect(url).not.toContain('api_secret');
    expect(url).not.toContain('measurement_id');

    const parsed = JSON.parse(init.body as string);
    expect(parsed.clientId).toBe(VALID_CLIENT_ID);
    expect(parsed.eventName).toBe('breathing_session_start');
    expect(parsed.platform).toBe('ios');
    expect(parsed.params).toEqual({ duration: 30, mode: 'Box Breathing' });
  });

  it('drops events when consent is withdrawn, without touching the network', async () => {
    await setAnalyticsConsent('denied');
    const mockFetch = vi.fn();

    const status = await sendGA4Event(
      'breathing_session_start',
      { duration: 30, mode: 'Box Breathing' },
      VALID_CLIENT_ID,
      { fetcher: mockFetch, timeoutMs: 1000 },
    );

    expect(status).toBe(-1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('drops unknown event names before making a request', async () => {
    const mockFetch = vi.fn();
    const status = await sendGA4Event(
      'arbitrary_event',
      {},
      VALID_CLIENT_ID,
      { fetcher: mockFetch, timeoutMs: 1000 },
    );
    expect(status).toBe(-1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns -1 and never throws on network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network request failed'));
    const result = await sendGA4Event(
      'breathing_session_end',
      { mode: 'Box Breathing', reason: 'paused', seconds_elapsed: 2 },
      VALID_CLIENT_ID,
      { fetcher: mockFetch, timeoutMs: 1000 },
    );
    expect(result).toBe(-1);
  });

  it('returns -1 and never throws on timeout', async () => {
    const mockFetch = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal as AbortSignal | undefined;
          signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            (err as Error & { name: string }).name = 'AbortError';
            reject(err);
          });
        }),
    );

    const result = await sendGA4Event(
      'breathing_session_start',
      { duration: 30, mode: 'Box Breathing' },
      VALID_CLIENT_ID,
      { fetcher: mockFetch, timeoutMs: 10 },
    );
    expect(result).toBe(-1);
  });
});
