import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    cookie: null as string | null,
    cookieThrows: false,
    userId: null as string | null,
    fetch: vi.fn(),
    getSession: vi.fn(),
    getNetworkStateAsync: vi.fn(),
    randomUUID: vi.fn(),
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: (key: string) => Promise.resolve(mocks.values.get(key) ?? null),
    setItem: (key: string, value: string) => {
      mocks.values.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      mocks.values.delete(key);
      return Promise.resolve();
    },
  },
}));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { version: '1.0.0' } },
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => mocks.randomUUID(),
}));

vi.mock('expo-network', () => ({
  getNetworkStateAsync: () => mocks.getNetworkStateAsync(),
}));

vi.mock('../auth/auth-client', () => ({
  AUTH_API_ORIGIN: 'https://sync.test',
  authClient: {
    getCookie: () => {
      if (mocks.cookieThrows) throw new Error('SecureStore sync API unavailable on web');
      return mocks.cookie;
    },
    getSession: () => mocks.getSession(),
  },
}));

vi.mock('../breathing/resonance-mirror', () => ({
  drainMirrorWrites: () => Promise.resolve(),
  RESONANCE_STORAGE_KEYS: {
    STATS: 'resonance_stats',
    SETTINGS: 'resonance_settings',
  },
}));

function event(id: string) {
  return {
    id,
    practiceId: `practice-${id}`,
    guestId: 'guest-id',
    startedAt: '2026-08-13T09:00:00.000Z',
    endedAt: '2026-08-13T09:01:00.000Z',
    seconds: 60,
    mode: 'Box Breathing' as const,
    completed: true,
    endReason: 'completed' as const,
    platform: 'ios' as const,
    localDate: '2026-08-13',
  };
}

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

async function loadClient() {
  return import('./session-sync-client');
}

beforeEach(() => {
  vi.resetModules();
  mocks.values.clear();
  mocks.cookie = 'cookie-a';
  mocks.cookieThrows = false;
  mocks.userId = 'user-a';
  mocks.fetch.mockReset();
  mocks.getSession.mockReset();
  mocks.getSession.mockImplementation(async () => ({
    data: { user: { id: mocks.userId } },
  }));
  mocks.getNetworkStateAsync.mockReset();
  mocks.getNetworkStateAsync.mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  });
  let sequence = 0;
  mocks.randomUUID.mockReset();
  mocks.randomUUID.mockImplementation(() => `generated-${++sequence}`);
  vi.stubGlobal('fetch', mocks.fetch);
});

describe('scoped session outbox', () => {
  it('queues signed-in settings and flushes them to the settings endpoint', async () => {
    const client = await loadClient();
    const queued = await client.enqueueSettingsSync(
      JSON.stringify({
        mode: 'Coherent Breathing',
        speed: 1.25,
        duration: 180,
        color: '#cc8866',
      }),
    );
    expect(queued).toBe(true);

    const key = client.getOwnerStorageKeys({ kind: 'account', id: 'user-a' }).settingsOutbox;
    expect(JSON.parse(mocks.values.get(key) ?? '{}')).toMatchObject({
      settings: {
        mode: 'Coherent Breathing',
        speedMultiplier: 1.25,
        selectedDuration: 180,
      },
      attempt: 0,
    });

    mocks.fetch.mockResolvedValueOnce(okJson({ ok: true }));
    await expect(client.flushSessionOutbox()).resolves.toBe(true);
    expect(mocks.fetch).toHaveBeenCalledWith(
      'https://sync.test/api/v1/sync/settings',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          mode: 'Coherent Breathing',
          speedMultiplier: 1.25,
          selectedDuration: 180,
        }),
      }),
    );
    expect(mocks.values.has(key)).toBe(false);
  });

  it('fails closed to guest mode when the auth cookie accessor throws on web', async () => {
    const client = await loadClient();
    mocks.cookieThrows = true;
    mocks.values.set('deepbreathing.guest-id.v1', 'guest-id');

    expect(client.getAuthCookieSafe()).toBeNull();
    await expect(
      client.prepareStorageOwner({ kind: 'guest', id: 'guest-id' }),
    ).resolves.toBeUndefined();
    await expect(client.enqueueSessionEvent(event('web-guest'))).resolves.toBeUndefined();

    const key = client.getOwnerStorageKeys({ kind: 'guest', id: 'guest-id' }).outbox;
    const stored = JSON.parse(mocks.values.get(key) ?? '[]') as Array<{
      event: { id: string };
    }>;
    expect(stored.map((item) => item.event.id)).toEqual(['web-guest']);
    await expect(client.loadAccountPracticeSummary()).resolves.toMatchObject({
      totalMinutes: 0,
      currentMode: null,
    });
  });

  it('lets a newer authenticated owner intent win a concurrent guest preparation', async () => {
    const client = await loadClient();
    mocks.cookie = null;

    const guestPreparation = client.prepareStorageOwner({
      kind: 'guest',
      id: 'guest-id',
    });
    // Auth resolves before the queued guest transition gets a chance to apply.
    // The account request is newer and must be the final active namespace.
    mocks.cookie = 'cookie-a';
    const accountPreparation = client.prepareStorageOwner({
      kind: 'account',
      id: 'user-a',
    });

    await Promise.all([guestPreparation, accountPreparation]);
    expect(mocks.values.get('deepbreathing.sync.v2.active-owner')).toBe(
      JSON.stringify({ kind: 'account', id: 'user-a' }),
    );
    const accountKeys = client.getOwnerStorageKeys({ kind: 'account', id: 'user-a' });
    expect(mocks.values.has(accountKeys.history)).toBe(true);
  });

  it('preserves an event enqueued while an earlier batch is in flight', async () => {
    const client = await loadClient();
    let resolveFirstResponse: (response: Response) => void = () => {};
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirstResponse = resolve;
    });
    let requestCount = 0;
    mocks.fetch.mockImplementation(async () => {
      requestCount += 1;
      if (requestCount === 1) return firstResponse;
      throw new Error('network dropped for the follow-up batch');
    });

    await client.enqueueSessionEvent(event('event-a'));
    const flushing = client.flushSessionOutbox();
    // The request is now waiting on the first server response. This write must
    // survive the acknowledgement's read-modify-write.
    const enqueuedDuringFlush = client.enqueueSessionEvent(event('event-b'));
    resolveFirstResponse(okJson({ ok: true }));

    await enqueuedDuringFlush;
    await expect(flushing).resolves.toBe(false);

    const key = client.getOwnerStorageKeys({ kind: 'account', id: 'user-a' }).outbox;
    const stored = JSON.parse(mocks.values.get(key) ?? '[]') as Array<{
      event: { id: string };
      attempt: number;
    }>;
    expect(stored.map((item) => item.event.id)).toEqual(['event-b']);
    expect(stored[0]?.attempt).toBe(1);
  });

  it('pins a session completion to the mounted owner during an auth switch', async () => {
    const client = await loadClient();
    mocks.cookie = 'cookie-b';
    mocks.userId = 'user-b';

    // The DOM instance was mounted under account A. Even though auth now
    // resolves to B, its completion must remain in A's offline outbox until
    // the old session is idle and the new DOM owner is committed.
    await client.enqueueSessionEvent(event('old-owner-session'), {
      kind: 'account',
      id: 'user-a',
    });

    const accountAKey = client.getOwnerStorageKeys({ kind: 'account', id: 'user-a' }).outbox;
    const accountBKey = client.getOwnerStorageKeys({ kind: 'account', id: 'user-b' }).outbox;
    expect(JSON.parse(mocks.values.get(accountAKey) ?? '[]')).toHaveLength(1);
    expect(mocks.values.has(accountBKey)).toBe(false);
  });

  it('never sends account A outbox or mirror data while account B is active', async () => {
    const client = await loadClient();
    const guestStats = {
      totalMinutes: 12,
      sessionsCompleted: 2,
      currentStreak: 2,
      lastSessionDate: '2026-08-13',
    };
    const guestSettings = { mode: 'Box Breathing', speed: 1, duration: 300 };
    mocks.values.set('deepbreathing.guest-id.v1', 'guest-id');
    mocks.values.set('resonance_stats', JSON.stringify(guestStats));
    mocks.values.set('resonance_settings', JSON.stringify(guestSettings));

    mocks.fetch
      .mockResolvedValueOnce(okJson({ ok: true }))
      .mockResolvedValueOnce(
        okJson({
          settings: {
            mode: 'Box Breathing',
            speedMultiplier: 1,
            selectedDuration: 300,
          },
          stats: {
            totalMinutes: 12,
            sessionsCompleted: 2,
            currentStreak: 2,
            lastSessionDate: '2026-08-13',
          },
          activeDays: ['2026-08-13'],
          sessionEvents: [],
          nextCursor: null,
        }),
      );

    // First account receives the explicit one-time guest migration.
    await expect(client.hydrateAccountState()).resolves.toBe(true);

    const accountAStats = client.getOwnerStorageKeys({ kind: 'account', id: 'user-a' }).stats;
    expect(JSON.parse(mocks.values.get(accountAStats) ?? '{}').totalMinutes).toBe(12);

    // Sign out and switch users. prepareStorageOwner clears the account A
    // mirror before B is hydrated; B must never consume A's scoped values.
    mocks.cookie = null;
    await client.prepareStorageOwner({ kind: 'guest', id: 'guest-id' });
    mocks.cookie = 'cookie-b';
    mocks.userId = 'user-b';
    const mergeBodies: unknown[] = [];
    mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && _url.endsWith('/api/v1/sync/merge')) {
        mergeBodies.push(JSON.parse(String(init.body)));
        return okJson({ ok: true });
      }
      return okJson({
        settings: null,
        stats: null,
        activeDays: [],
        sessionEvents: [],
        nextCursor: null,
      });
    });

    await expect(client.hydrateAccountState()).resolves.toBe(true);
    expect(mergeBodies).toEqual([{ stats: null, settings: null }]);
    const accountBStats = client.getOwnerStorageKeys({ kind: 'account', id: 'user-b' }).stats;
    expect(mocks.values.has(accountBStats)).toBe(false);
  });
});
