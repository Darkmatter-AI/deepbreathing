import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { getNetworkStateAsync } from 'expo-network';
import type { SessionEvent } from '@resonance/domain';

import { AUTH_API_ORIGIN, authClient } from '../auth/auth-client';
import { RESONANCE_STORAGE_KEYS } from '../breathing/resonance-mirror';
import { localCalendarDate, retryDelayMs } from './session-sync';

const GUEST_ID_KEY = 'deepbreathing.guest-id.v1';
const OUTBOX_KEY = 'deepbreathing.session-outbox.v1';
const HISTORY_KEY = 'deepbreathing.session-history.v1';

interface OutboxItem {
  event: SessionEvent;
  attempt: number;
  nextAttemptAt: number;
}

interface BootstrapResponse {
  stats: {
    totalMinutes: number;
    sessionsCompleted: number;
    currentStreak: number;
    lastSessionDate: string | null;
  } | null;
  activeDays?: string[];
  sessionEvents: SessionEvent[];
  nextCursor: string | null;
}

export interface AccountPracticeSummary {
  totalMinutes: number;
  sessionsCompleted: number;
  currentStreak: number;
  lastSessionDate: string | null;
  activeDays: string[];
  currentMode: string | null;
}

let flushPromise: Promise<boolean> | null = null;

async function loadOutbox(): Promise<OutboxItem[]> {
  try {
    const parsed: unknown = JSON.parse((await AsyncStorage.getItem(OUTBOX_KEY)) ?? '[]');
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

async function saveOutbox(items: OutboxItem[]) {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

export async function getOrCreateGuestId(): Promise<string> {
  const existing = await AsyncStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;
  const guestId = randomUUID();
  await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
  return guestId;
}

export async function enqueueSessionEvent(event: SessionEvent): Promise<void> {
  const outbox = await loadOutbox();
  if (outbox.some((item) => item.event.id === event.id)) return;
  outbox.push({ event, attempt: 0, nextAttemptAt: 0 });
  await saveOutbox(outbox);
}

async function performFlush(): Promise<boolean> {
  const cookie = authClient.getCookie();
  if (!cookie) return false;

  const network = await getNetworkStateAsync();
  if (network.isInternetReachable === false || network.isConnected === false) {
    return false;
  }

  const now = Date.now();
  const outbox = await loadOutbox();
  const eligible = outbox
    .filter((item) => item.nextAttemptAt <= now)
    .slice(0, 100);
  if (eligible.length === 0) return true;

  let response: Response;
  try {
    response = await fetch(`${AUTH_API_ORIGIN}/api/v1/sync/session-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        idempotencyKey: randomUUID(),
        clientTimestamp: new Date().toISOString(),
        payload: { events: eligible.map((item) => item.event) },
      }),
    });
  } catch {
    const eligibleIds = new Set(eligible.map((item) => item.event.id));
    await saveOutbox(
      outbox.map((item) =>
        eligibleIds.has(item.event.id)
          ? {
              ...item,
              attempt: item.attempt + 1,
              nextAttemptAt: now + retryDelayMs(item.attempt),
            }
          : item,
      ),
    );
    return false;
  }

  const eligibleIds = new Set(eligible.map((item) => item.event.id));
  if (response.ok) {
    const remaining = outbox.filter((item) => !eligibleIds.has(item.event.id));
    await saveOutbox(remaining);
    return remaining.length > 0 ? performFlush() : true;
  }

  if (response.status !== 401) {
    await saveOutbox(
      outbox.map((item) =>
        eligibleIds.has(item.event.id)
          ? {
              ...item,
              attempt: item.attempt + 1,
              nextAttemptAt: now + retryDelayMs(item.attempt),
            }
          : item,
      ),
    );
  }
  return false;
}

export function flushSessionOutbox(): Promise<boolean> {
  if (!flushPromise) {
    flushPromise = performFlush().finally(() => {
      flushPromise = null;
    });
  }
  return flushPromise;
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

/** Uploads guest events first, then hydrates canonical account history/stats. */
export async function hydrateAccountState(): Promise<boolean> {
  await flushSessionOutbox();
  const cookie = authClient.getCookie();
  if (!cookie) return false;

  // Reconcile pre-ledger aggregate history only after canonical guest events
  // have landed. The server subtracts ledger totals and stores the remainder as
  // a one-time legacy baseline, so the same minutes are never counted twice.
  const [localStatsRaw, localSettingsRaw] = await Promise.all([
    AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.STATS),
    AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.SETTINGS),
  ]);
  try {
    const mergeResponse = await fetch(`${AUTH_API_ORIGIN}/api/v1/sync/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        stats: localStatsRaw ? JSON.parse(localStatsRaw) : null,
        settings: localSettingsRaw ? JSON.parse(localSettingsRaw) : null,
      }),
    });
    if (!mergeResponse.ok) return false;
  } catch {
    return false;
  }

  let response: Response;
  try {
    response = await fetch(`${AUTH_API_ORIGIN}/api/v1/sync/bootstrap`, {
      headers: { Cookie: cookie },
    });
  } catch {
    return false;
  }
  if (!response.ok) return false;

  const bootstrap = (await response.json()) as BootstrapResponse;
  const serverEvents = [...(bootstrap.sessionEvents ?? [])];
  let cursor = bootstrap.nextCursor;
  let pageSize = bootstrap.sessionEvents?.length ?? 0;
  for (let page = 0; cursor && pageSize === 100 && page < 49; page += 1) {
    let pageResponse: Response;
    try {
      pageResponse = await fetch(
        `${AUTH_API_ORIGIN}/api/v1/sync/session-events?cursor=${encodeURIComponent(cursor)}&limit=100`,
        { headers: { Cookie: cookie } },
      );
    } catch {
      break;
    }
    if (!pageResponse.ok) break;
    const next = (await pageResponse.json()) as {
      events: SessionEvent[];
      nextCursor: string | null;
    };
    serverEvents.push(...next.events);
    pageSize = next.events.length;
    cursor = next.nextCursor;
  }
  const existingRaw = await AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.STATS);
  let existing: Record<string, unknown> = {};
  try {
    existing = existingRaw ? JSON.parse(existingRaw) : {};
  } catch {
    existing = {};
  }

  if (bootstrap.stats) {
    const totalMinutes = Math.max(
      finiteNonNegative(existing.totalMinutes),
      finiteNonNegative(bootstrap.stats.totalMinutes),
    );
    const sessionsCompleted = Math.max(
      finiteNonNegative(existing.sessionsCompleted),
      finiteNonNegative(bootstrap.stats.sessionsCompleted),
    );
    await AsyncStorage.setItem(
      RESONANCE_STORAGE_KEYS.STATS,
      JSON.stringify({
        ...existing,
        totalMinutes,
        totalSeconds: Math.max(
          finiteNonNegative(existing.totalSeconds),
          totalMinutes * 60,
        ),
        sessionsCompleted,
        currentStreak: finiteNonNegative(bootstrap.stats.currentStreak),
        lastSessionDate:
          typeof bootstrap.stats.lastSessionDate === 'string'
            ? bootstrap.stats.lastSessionDate.slice(0, 10)
            : null,
        activeDays: Array.isArray(bootstrap.activeDays)
          ? bootstrap.activeDays.filter((day): day is string => typeof day === 'string')
          : [],
      }),
    );
  }

  const localHistoryRaw = await AsyncStorage.getItem(HISTORY_KEY);
  let localHistory: SessionEvent[] = [];
  try {
    const parsed: unknown = JSON.parse(localHistoryRaw ?? '[]');
    if (Array.isArray(parsed)) localHistory = parsed as SessionEvent[];
  } catch {
    localHistory = [];
  }
  const byId = new Map(localHistory.map((event) => [event.id, event]));
  for (const event of serverEvents) byId.set(event.id, event);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([...byId.values()]));
  return true;
}

function liveStreak(streak: number, lastSessionDate: string | null): number {
  if (!lastSessionDate) return 0;
  const today = new Date();
  const todayKey = localCalendarDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return lastSessionDate === todayKey || lastSessionDate === localCalendarDate(yesterday)
    ? streak
    : 0;
}

export async function loadAccountPracticeSummary(): Promise<AccountPracticeSummary> {
  const [statsRaw, settingsRaw, historyRaw] = await Promise.all([
    AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.STATS),
    AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.SETTINGS),
    AsyncStorage.getItem(HISTORY_KEY),
  ]);
  let stats: Record<string, unknown> = {};
  let settings: Record<string, unknown> = {};
  let history: SessionEvent[] = [];
  try { stats = statsRaw ? JSON.parse(statsRaw) : {}; } catch { stats = {}; }
  try { settings = settingsRaw ? JSON.parse(settingsRaw) : {}; } catch { settings = {}; }
  try {
    const parsed: unknown = JSON.parse(historyRaw ?? '[]');
    if (Array.isArray(parsed)) history = parsed as SessionEvent[];
  } catch { history = []; }

  const storedDays = Array.isArray(stats.activeDays)
    ? stats.activeDays.filter((day): day is string => typeof day === 'string')
    : [];
  const eventDays = history
    .filter((event) => event.completed && typeof event.localDate === 'string')
    .map((event) => event.localDate);
  const lastSessionDate = typeof stats.lastSessionDate === 'string'
    ? stats.lastSessionDate.slice(0, 10)
    : null;
  const currentStreak = finiteNonNegative(stats.currentStreak);

  return {
    totalMinutes: finiteNonNegative(stats.totalMinutes),
    sessionsCompleted: finiteNonNegative(stats.sessionsCompleted),
    currentStreak: liveStreak(currentStreak, lastSessionDate),
    lastSessionDate,
    activeDays: [...new Set([...storedDays, ...eventDays])].sort(),
    currentMode: typeof settings.mode === 'string' ? settings.mode : null,
  };
}

export function getClientVersion(): string | undefined {
  return Constants.expoConfig?.version ?? undefined;
}
