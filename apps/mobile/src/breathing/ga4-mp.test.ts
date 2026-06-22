// Unit tests for the GA4 Measurement Protocol client (MOB-2).
//
// Covers:
//   - happy path: event forwarded, status returned
//   - failure path: network error / timeout → returns -1, never throws (AC: airplane mode)
//   - missing config → returns -1, never throws
//   - app_platform is appended to every event
//   - client_id is included in the payload
//
// These tests run in vitest under Node (no RN runtime). Platform, AsyncStorage,
// and fetch are mocked/injected.

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// --- Module-level mocks (must be hoisted before imports) -------------------

// Mock react-native Platform so tests can control OS value.
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock AsyncStorage so getOrCreateClientId works in Node.
vi.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    default: {
      getItem: async (key: string) => store[key] ?? null,
      setItem: async (key: string, value: string) => { store[key] = value; },
      removeItem: async (key: string) => { delete store[key]; },
    },
  };
});

// Mock __DEV__ global (defined by Metro but not Node).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__DEV__ = false;

// Mock process.env for EXPO_PUBLIC_ vars.
const MOCK_API_SECRET = 'test-secret-xyz';
const MOCK_MEASUREMENT_ID = 'G-TESTTEST01';

// ---------------------------------------------------------------------------

import { sendGA4Event, getOrCreateClientId, GA4_FORWARDED_EVENTS } from './ga4-mp';

beforeEach(() => {
  process.env.EXPO_PUBLIC_GA4_MP_API_SECRET = MOCK_API_SECRET;
  process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID = MOCK_MEASUREMENT_ID;
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_GA4_MP_API_SECRET;
  delete process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------

describe('GA4_FORWARDED_EVENTS', () => {
  it('includes the four expected event names', () => {
    expect(GA4_FORWARDED_EVENTS.has('breathing_session_start')).toBe(true);
    expect(GA4_FORWARDED_EVENTS.has('breathing_session_end')).toBe(true);
    expect(GA4_FORWARDED_EVENTS.has('mode_switch')).toBe(true);
    expect(GA4_FORWARDED_EVENTS.has('page_viewed_breathing')).toBe(true);
  });
});

describe('sendGA4Event — happy path', () => {
  it('sends a POST with the correct URL and returns the HTTP status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 204 });

    const status = await sendGA4Event(
      'breathing_session_start',
      { duration: 30 },
      'test-client-id',
      { fetcher: mockFetch, timeoutMs: 1000 },
    );

    expect(status).toBe(204);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('measurement_id=G-TESTTEST01');
    expect(url).toContain('api_secret=test-secret-xyz');

    const parsed = JSON.parse(init.body as string);
    expect(parsed.client_id).toBe('test-client-id');
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0].name).toBe('breathing_session_start');
    expect(parsed.events[0].params.duration).toBe(30);
  });

  it('appends app_platform to every event', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 204 });

    await sendGA4Event(
      'mode_switch',
      { mode: 'Box' },
      'client-id',
      { fetcher: mockFetch, timeoutMs: 1000 },
    );

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const parsed = JSON.parse(init.body as string);
    // Platform.OS mocked to 'ios'
    expect(parsed.events[0].params.app_platform).toBe('ios');
    // Caller params preserved
    expect(parsed.events[0].params.mode).toBe('Box');
  });
});

describe('sendGA4Event — failure path (airplane mode AC)', () => {
  it('returns -1 and never throws on network error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network request failed'));

    const result = await sendGA4Event(
      'breathing_session_end',
      {},
      'client-id',
      { fetcher: mockFetch, timeoutMs: 1000 },
    );

    expect(result).toBe(-1);
    // Must not throw — the await above would have thrown if it did.
  });

  it('returns -1 and never throws on timeout (AbortError)', async () => {
    const mockFetch = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          // Listen for abort signal
          const signal = init?.signal as AbortSignal | undefined;
          if (signal) {
            signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              (err as any).name = 'AbortError';
              reject(err);
            });
          }
        }),
    );

    // Very short timeout so the abort fires quickly in tests.
    const result = await sendGA4Event(
      'breathing_session_start',
      {},
      'client-id',
      { fetcher: mockFetch, timeoutMs: 10 },
    );

    expect(result).toBe(-1);
  });

  it('returns -1 when EXPO_PUBLIC_GA4_MP_API_SECRET is absent', async () => {
    delete process.env.EXPO_PUBLIC_GA4_MP_API_SECRET;

    const mockFetch = vi.fn();

    const result = await sendGA4Event(
      'breathing_session_start',
      {},
      'client-id',
      { fetcher: mockFetch, timeoutMs: 1000 },
    );

    expect(result).toBe(-1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns -1 when EXPO_PUBLIC_GA4_MEASUREMENT_ID is absent', async () => {
    delete process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID;

    const mockFetch = vi.fn();

    const result = await sendGA4Event(
      'breathing_session_start',
      {},
      'client-id',
      { fetcher: mockFetch, timeoutMs: 1000 },
    );

    expect(result).toBe(-1);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('getOrCreateClientId', () => {
  it('returns the same UUID on repeated calls (cached in AsyncStorage)', async () => {
    const id1 = await getOrCreateClientId();
    const id2 = await getOrCreateClientId();
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f-]{36}$/);
  });
});
