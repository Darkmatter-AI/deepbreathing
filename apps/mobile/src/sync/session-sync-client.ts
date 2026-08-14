import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { getNetworkStateAsync } from 'expo-network';
import type { SessionEvent } from '@resonance/domain';

import { AUTH_API_ORIGIN, authClient } from '../auth/auth-client';
import {
  drainMirrorWrites,
  RESONANCE_STORAGE_KEYS,
} from '../breathing/resonance-mirror';
import { localCalendarDate, retryDelayMs } from './session-sync';

/**
 * Build 17 stored every sync artifact under one installation-global key. Those
 * keys remain readable as the guest migration source, but new writes are always
 * scoped to one stable owner (the guest UUID or Better Auth user ID).
 */
const STORAGE_VERSION = 'v2';
const STORAGE_PREFIX = `deepbreathing.sync.${STORAGE_VERSION}`;
const ACTIVE_OWNER_KEY = `${STORAGE_PREFIX}.active-owner`;
const GUEST_MIGRATION_KEY = `${STORAGE_PREFIX}.guest-migration`;

// Build 17 keys. They are intentionally guest-owned during the one-time
// migration so a later account can never ingest another account's state.
const GUEST_ID_KEY = 'deepbreathing.guest-id.v1';
const OUTBOX_KEY = 'deepbreathing.session-outbox.v1';
const HISTORY_KEY = 'deepbreathing.session-history.v1';
const MAX_BATCH_SIZE = 100;

interface OutboxItem {
  event: SessionEvent;
  attempt: number;
  nextAttemptAt: number;
}

interface SettingsSyncItem {
  id: string;
  settings: Record<string, unknown>;
  attempt: number;
  nextAttemptAt: number;
}

interface BootstrapResponse {
  settings?: {
    mode?: string;
    speedMultiplier?: number;
    selectedDuration?: number | null;
    muted?: boolean;
    theme?: string;
  } | null;
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

export type SyncOwner =
  | { kind: 'guest'; id: string }
  | { kind: 'account'; id: string };

export interface OwnerStorageKeys {
  outbox: string;
  settingsOutbox: string;
  history: string;
  stats: string;
  settings: string;
}

interface OwnerState {
  stats: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  history: SessionEvent[];
}

interface GuestMigration {
  accountId: string;
  migratedAt: string;
}

let flushPromise: Promise<boolean> | null = null;
// Hydration must wait for an in-flight guest-session write. A user can sign in
// from the completion receipt before AsyncStorage has saved that session.
let pendingOutboxWrite: Promise<void> = Promise.resolve();
let guestIdPromise: Promise<string> | null = null;
let authenticatedUserId: string | null = null;
let activeOwner: SyncOwner | null = null;
let guestMigrationTarget: string | null = null;
// Owner preparation is called by independent launch/auth effects. Serialize
// the storage swaps and let the newest intent supersede queued stale work.
let ownerTransitionTail: Promise<void> = Promise.resolve();
let ownerTransitionRequest = 0;

/**
 * AsyncStorage is not transactional. All outbox mutations are serialized per
 * owner, and every acknowledgement re-reads the current value before removing
 * ids. This is the important half of the in-flight flush race fix: an event
 * appended while fetch() is pending cannot be deleted by an old snapshot.
 */
const outboxMutationTails = new Map<string, Promise<void>>();
const settingsMutationTails = new Map<string, Promise<void>>();

function ownerStorageId(owner: SyncOwner): string {
  return `${owner.kind}:${owner.id}`;
}

function ownerKey(owner: SyncOwner, artifact: string): string {
  return `${STORAGE_PREFIX}.${owner.kind}.${encodeURIComponent(owner.id)}.${artifact}`;
}

/** Exposed for deterministic tests and for the host's owner-switch bridge. */
export function getOwnerStorageKeys(owner: SyncOwner): OwnerStorageKeys {
  return {
    outbox: ownerKey(owner, 'outbox'),
    settingsOutbox: ownerKey(owner, 'settings-outbox'),
    history: ownerKey(owner, 'history'),
    stats: ownerKey(owner, RESONANCE_STORAGE_KEYS.STATS),
    settings: ownerKey(owner, RESONANCE_STORAGE_KEYS.SETTINGS),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRecord(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseOutbox(raw: string | null): OutboxItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function parseHistory(raw: string | null): SessionEvent[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionEvent[]) : [];
  } catch {
    return [];
  }
}

function dedupeOutbox(items: OutboxItem[]): OutboxItem[] {
  const byId = new Map<string, OutboxItem>();
  for (const item of items) {
    if (!item || !item.event || typeof item.event.id !== 'string') continue;
    byId.set(item.event.id, item);
  }
  return [...byId.values()];
}

function dedupeHistory(items: SessionEvent[]): SessionEvent[] {
  const byId = new Map<string, SessionEvent>();
  for (const event of items) {
    if (!event || typeof event.id !== 'string') continue;
    byId.set(event.id, event);
  }
  return [...byId.values()];
}

async function readActiveOwner(): Promise<SyncOwner | null> {
  const parsed = parseRecord(await AsyncStorage.getItem(ACTIVE_OWNER_KEY));
  if (
    (parsed?.kind === 'guest' || parsed?.kind === 'account') &&
    typeof parsed.id === 'string' &&
    parsed.id.length > 0
  ) {
    return { kind: parsed.kind, id: parsed.id };
  }
  return null;
}

async function readGuestMigration(): Promise<GuestMigration | null> {
  const parsed = parseRecord(await AsyncStorage.getItem(GUEST_MIGRATION_KEY));
  if (typeof parsed?.accountId !== 'string' || parsed.accountId.length === 0) {
    return null;
  }
  return {
    accountId: parsed.accountId,
    migratedAt:
      typeof parsed.migratedAt === 'string' ? parsed.migratedAt : '',
  };
}

async function markGuestMigrated(accountId: string): Promise<void> {
  await AsyncStorage.setItem(
    GUEST_MIGRATION_KEY,
    JSON.stringify({ accountId, migratedAt: new Date().toISOString() }),
  );
}

async function getGuestId(): Promise<string> {
  if (!guestIdPromise) {
    guestIdPromise = (async () => {
      const existing = await AsyncStorage.getItem(GUEST_ID_KEY);
      if (existing) return existing;
      const guestId = randomUUID();
      await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
      return guestId;
    })();
  }
  return guestIdPromise;
}

export function getOrCreateGuestId(): Promise<string> {
  return getGuestId();
}

type AuthClientWithSession = typeof authClient & {
  getSession?: () => Promise<unknown>;
};

/**
 * Better Auth's Expo SecureStore adapter uses a synchronous read that is not
 * implemented by Expo Web. Cookie access is only a sync hint, so fail closed
 * to guest mode when the adapter is unavailable or throws.
 */
export function getAuthCookieSafe(): string | null {
  try {
    const client = authClient as unknown as { getCookie?: () => unknown };
    const cookie = client.getCookie?.call(authClient);
    return typeof cookie === 'string' && cookie.length > 0 ? cookie : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the stable Better Auth user ID. A session cookie is a credential and
 * rotates, so it is deliberately never persisted or used as a storage key.
 */
async function resolveAuthenticatedUserId(): Promise<string | null> {
  const client = authClient as AuthClientWithSession;
  if (typeof client.getSession !== 'function') return null;
  try {
    const result = await client.getSession();
    const data = isRecord(result) && isRecord(result.data) ? result.data : null;
    const user = data && isRecord(data.user) ? data.user : null;
    const id = user?.id;
    if (typeof id === 'string' && id.length > 0) {
      authenticatedUserId = id;
      return id;
    }
  } catch {
    // Offline sessions leave the outbox in the guest namespace until a stable
    // user identity can be read. Falling back to a cookie would mix accounts.
  }
  return null;
}

async function guestOwner(): Promise<SyncOwner> {
  return { kind: 'guest', id: await getGuestId() };
}

async function resolveAuthenticatedOwner(): Promise<SyncOwner | null> {
  if (!getAuthCookieSafe()) return null;
  const id = await resolveAuthenticatedUserId();
  if (!id) return null;
  return { kind: 'account', id };
}

async function resolveCurrentOwner(): Promise<SyncOwner | null> {
  if (!getAuthCookieSafe()) {
    const owner = await guestOwner();
    // Keep the in-memory owner aligned with unauthenticated writes. This makes
    // a later explicit switch preserve guest mirror data rather than attributing
    // it to the account that was active before sign-out.
    activeOwner = owner;
    return owner;
  }
  const owner = await resolveAuthenticatedOwner();
  if (owner) {
    activeOwner = owner;
    return owner;
  }

  // A host-level owner switch may have supplied the verified user id before the
  // network is unavailable. This fallback is memory-only and never trusts a
  // persisted account id in place of the current session.
  if (activeOwner?.kind === 'account' && authenticatedUserId === activeOwner.id) {
    return activeOwner;
  }
  return null;
}

async function loadOutbox(owner: SyncOwner): Promise<OutboxItem[]> {
  const keys = getOwnerStorageKeys(owner);
  const scoped = parseOutbox(await AsyncStorage.getItem(keys.outbox));
  if (owner.kind !== 'guest') return scoped;

  // Build 17's global outbox is guest-owned by contract. Merge it into the new
  // guest namespace in memory; the next serialized save removes the legacy key.
  const legacy = parseOutbox(await AsyncStorage.getItem(OUTBOX_KEY));
  return dedupeOutbox([...scoped, ...legacy]);
}

async function saveOutbox(owner: SyncOwner, items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(
    getOwnerStorageKeys(owner).outbox,
    JSON.stringify(dedupeOutbox(items)),
  );
  if (owner.kind === 'guest') {
    // Once copied into the scoped guest key, the old key must not be re-read on
    // every account switch. Removing it is safe because the scoped write above
    // completed first; a write failure leaves the legacy source intact.
    await AsyncStorage.removeItem(OUTBOX_KEY);
  }
}

function mutateOutbox(
  owner: SyncOwner,
  updater: (items: OutboxItem[]) => OutboxItem[] | Promise<OutboxItem[]>,
): Promise<void> {
  const storageId = ownerStorageId(owner);
  const previous = outboxMutationTails.get(storageId) ?? Promise.resolve();
  const mutation = previous.catch(() => {}).then(async () => {
    const current = await loadOutbox(owner);
    const next = await updater(current);
    await saveOutbox(owner, next);
  });
  outboxMutationTails.set(storageId, mutation.catch(() => {}));
  return mutation;
}

function parseSettingsSync(raw: string | null): SettingsSyncItem | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.settings)) return null;
    if (typeof parsed.id !== 'string' || parsed.id.length === 0) return null;
    return {
      id: parsed.id,
      settings: parsed.settings,
      attempt: finiteNonNegative(parsed.attempt),
      nextAttemptAt: finiteNonNegative(parsed.nextAttemptAt),
    };
  } catch {
    return null;
  }
}

async function loadSettingsSync(owner: SyncOwner): Promise<SettingsSyncItem | null> {
  return parseSettingsSync(
    await AsyncStorage.getItem(getOwnerStorageKeys(owner).settingsOutbox),
  );
}

async function saveSettingsSync(
  owner: SyncOwner,
  item: SettingsSyncItem | null,
): Promise<void> {
  const key = getOwnerStorageKeys(owner).settingsOutbox;
  if (item) {
    await AsyncStorage.setItem(key, JSON.stringify(item));
  } else {
    await AsyncStorage.removeItem(key);
  }
}

function mutateSettingsSync(
  owner: SyncOwner,
  updater: (
    item: SettingsSyncItem | null,
  ) => SettingsSyncItem | null | Promise<SettingsSyncItem | null>,
): Promise<void> {
  const storageId = ownerStorageId(owner);
  const previous = settingsMutationTails.get(storageId) ?? Promise.resolve();
  const mutation = previous.catch(() => {}).then(async () => {
    const current = await loadSettingsSync(owner);
    await saveSettingsSync(owner, await updater(current));
  });
  settingsMutationTails.set(storageId, mutation.catch(() => {}));
  return mutation;
}

function settingsPayloadFromValue(
  value: string | Record<string, unknown>,
): Record<string, unknown> | null {
  let parsed: Record<string, unknown> | null;
  if (typeof value === 'string') {
    parsed = parseRecord(value);
  } else {
    parsed = value;
  }
  if (!parsed) return null;

  const payload: Record<string, unknown> = {};
  if (typeof parsed.mode === 'string') payload.mode = parsed.mode;
  if (typeof parsed.speedMultiplier === 'number') {
    payload.speedMultiplier = parsed.speedMultiplier;
  } else if (typeof parsed.speed === 'number') {
    payload.speedMultiplier = parsed.speed;
  }
  if (parsed.selectedDuration === null || typeof parsed.selectedDuration === 'number') {
    payload.selectedDuration = parsed.selectedDuration;
  } else if (parsed.duration === null || typeof parsed.duration === 'number') {
    payload.selectedDuration = parsed.duration;
  }
  if (typeof parsed.muted === 'boolean') payload.muted = parsed.muted;
  if (typeof parsed.theme === 'string') payload.theme = parsed.theme;
  return Object.keys(payload).length > 0 ? payload : null;
}

/** Queue the latest persisted settings for the signed-in account. */
export async function enqueueSettingsSync(
  value: string | Record<string, unknown>,
): Promise<boolean> {
  const payload = settingsPayloadFromValue(value);
  if (!payload) return false;
  const owner = await resolveAuthenticatedOwner();
  if (!owner) return false;
  await mutateSettingsSync(owner, () => ({
      id: randomUUID(),
      settings: payload,
      attempt: 0,
      nextAttemptAt: 0,
    }));
  return true;
}

async function flushSettingsForOwner(
  owner: SyncOwner,
  cookie: string,
): Promise<boolean> {
  const item = await loadSettingsSync(owner);
  if (!item) return true;
  const now = Date.now();
  if (item.nextAttemptAt > now) return false;

  let response: Response;
  try {
    response = await fetch(`${AUTH_API_ORIGIN}/api/v1/sync/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify(item.settings),
    });
  } catch {
    await mutateSettingsSync(owner, (current) =>
      current && current.id === item.id
        ? {
            ...current,
            attempt: current.attempt + 1,
            nextAttemptAt: now + retryDelayMs(current.attempt),
          }
        : current,
    );
    return false;
  }

  if (response.ok) {
    // Re-read after the request. A newer persist may have replaced this item;
    // only acknowledge the id that was actually sent.
    await mutateSettingsSync(owner, (current) =>
      current?.id === item.id ? null : current,
    );
    return true;
  }
  if (response.status !== 401) {
    await mutateSettingsSync(owner, (current) =>
      current && current.id === item.id
        ? {
            ...current,
            attempt: current.attempt + 1,
            nextAttemptAt: now + retryDelayMs(current.attempt),
          }
        : current,
    );
  }
  return false;
}

export function enqueueSessionEvent(
  event: SessionEvent,
  ownerOverride?: SyncOwner,
): Promise<void> {
  const write = pendingOutboxWrite.then(async () => {
    // Session callbacks can outlive an auth transition. Callers that still
    // belong to the mounted DOM instance pass its owner explicitly so a
    // newly signed-in account cannot claim an in-flight guest/account session.
    const owner = ownerOverride ?? (await resolveCurrentOwner()) ?? (await guestOwner());
    await mutateOutbox(owner, (outbox) => {
      if (outbox.some((item) => item.event.id === event.id)) return outbox;
      return [...outbox, { event, attempt: 0, nextAttemptAt: 0 }];
    });
  });
  // Keep later writes and account hydration alive if AsyncStorage fails once.
  pendingOutboxWrite = write.catch(() => {});
  return write;
}

async function performFlushForOwner(
  owner: SyncOwner,
  cookie: string,
): Promise<boolean> {
  const network = await getNetworkStateAsync();
  if (network.isInternetReachable === false || network.isConnected === false) {
    return false;
  }

  // A bounded loop handles batches and events appended while a request is in
  // flight. It also avoids an unbounded loop if a producer continuously queues.
  let sessionsFlushed = true;
  for (let batch = 0; batch < 50; batch += 1) {
    const now = Date.now();
    const outbox = await loadOutbox(owner);
    const eligible = outbox
      .filter((item) => item.nextAttemptAt <= now)
      .slice(0, MAX_BATCH_SIZE);
    if (eligible.length === 0) {
      sessionsFlushed = outbox.length === 0;
      break;
    }

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
      await mutateOutbox(owner, (current) =>
        current.map((item) =>
          eligibleIds.has(item.event.id)
            ? {
                ...item,
                attempt: item.attempt + 1,
                nextAttemptAt: now + retryDelayMs(item.attempt),
              }
            : item,
        ),
      );
      sessionsFlushed = false;
      break;
    }

    const eligibleIds = new Set(eligible.map((item) => item.event.id));
    if (response.ok) {
      // Never filter the stale `outbox` snapshot here. `mutateOutbox` reads the
      // latest value after fetch() resolves, preserving concurrent enqueues.
      await mutateOutbox(owner, (current) =>
        current.filter((item) => !eligibleIds.has(item.event.id)),
      );
      continue;
    }

    if (response.status !== 401) {
      await mutateOutbox(owner, (current) =>
        current.map((item) =>
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
    sessionsFlushed = false;
    break;
  }

  // Settings use their own latest-value outbox. Flush it even when a session
  // batch is waiting on backoff; a setting change should not be stranded behind
  // an unrelated session retry.
  const settingsFlushed = await flushSettingsForOwner(owner, cookie);
  return sessionsFlushed && settingsFlushed;
}

async function performFlush(): Promise<boolean> {
  await pendingOutboxWrite;
  const cookie = getAuthCookieSafe();
  if (!cookie) return false;
  const owner = await resolveAuthenticatedOwner();
  if (!owner) return false;
  activeOwner = owner;
  return performFlushForOwner(owner, cookie);
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

async function loadOwnerState(
  owner: SyncOwner,
  options: { includeLegacyGuest: boolean },
): Promise<OwnerState> {
  const keys = getOwnerStorageKeys(owner);
  const [scopedStatsRaw, scopedSettingsRaw, scopedHistoryRaw] = await Promise.all([
    AsyncStorage.getItem(keys.stats),
    AsyncStorage.getItem(keys.settings),
    AsyncStorage.getItem(keys.history),
  ]);

  let stats = parseRecord(scopedStatsRaw);
  let settings = parseRecord(scopedSettingsRaw);
  let history = parseHistory(scopedHistoryRaw);

  if (owner.kind === 'guest' && options.includeLegacyGuest) {
    if (!stats) stats = parseRecord(await AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.STATS));
    if (!settings) settings = parseRecord(await AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.SETTINGS));
    if (history.length === 0) history = parseHistory(await AsyncStorage.getItem(HISTORY_KEY));
  }

  return { stats, settings, history: dedupeHistory(history) };
}

async function saveOwnerState(
  owner: SyncOwner,
  state: OwnerState,
  options: { mirror: boolean },
): Promise<void> {
  const keys = getOwnerStorageKeys(owner);
  const writes: Promise<void>[] = [];
  if (state.stats) writes.push(AsyncStorage.setItem(keys.stats, JSON.stringify(state.stats)));
  else writes.push(AsyncStorage.removeItem(keys.stats));
  if (state.settings) writes.push(AsyncStorage.setItem(keys.settings, JSON.stringify(state.settings)));
  else writes.push(AsyncStorage.removeItem(keys.settings));
  writes.push(AsyncStorage.setItem(keys.history, JSON.stringify(dedupeHistory(state.history))));
  if (options.mirror) {
    if (state.stats) writes.push(AsyncStorage.setItem(RESONANCE_STORAGE_KEYS.STATS, JSON.stringify(state.stats)));
    else writes.push(AsyncStorage.removeItem(RESONANCE_STORAGE_KEYS.STATS));
    if (state.settings) writes.push(AsyncStorage.setItem(RESONANCE_STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings)));
    else writes.push(AsyncStorage.removeItem(RESONANCE_STORAGE_KEYS.SETTINGS));
  }
  await Promise.all(writes);
}

async function captureMirrorIntoOwner(owner: SyncOwner): Promise<void> {
  const [statsRaw, settingsRaw] = await Promise.all([
    AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.STATS),
    AsyncStorage.getItem(RESONANCE_STORAGE_KEYS.SETTINGS),
  ]);
  const keys = getOwnerStorageKeys(owner);
  const writes: Promise<void>[] = [];
  if (statsRaw != null) writes.push(AsyncStorage.setItem(keys.stats, statsRaw));
  if (settingsRaw != null) writes.push(AsyncStorage.setItem(keys.settings, settingsRaw));
  await Promise.all(writes);
}

async function clearMirror(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(RESONANCE_STORAGE_KEYS.STATS),
    AsyncStorage.removeItem(RESONANCE_STORAGE_KEYS.SETTINGS),
  ]);
}

function ownerMatches(a: SyncOwner | null, b: SyncOwner): boolean {
  return a?.kind === b.kind && a.id === b.id;
}

/**
 * Prepare the native mirror for a known owner. The host can call this on auth
 * transitions (including sign-out) before remounting the DOM experience. It
 * snapshots the previous owner's mirror, then loads only the next owner's
 * scoped state, so account A's settings cannot appear in account B.
 */
async function applyStorageOwner(
  owner: SyncOwner,
  request: number,
): Promise<void> {
  // A newer request may have arrived while the previous transition was in
  // flight. Do not let this stale operation touch the mirror or active-owner
  // marker after that point.
  if (request !== ownerTransitionRequest) return;

  // Finish any persist callback that was already queued before this owner
  // transition. New callbacks are generation-gated by the native host.
  await drainMirrorWrites();

  const persistedOwner = await readActiveOwner();
  const previousOwner = activeOwner ?? persistedOwner;
  if (activeOwner && !ownerMatches(activeOwner, owner)) {
    await captureMirrorIntoOwner(activeOwner);
  }

  if (owner.kind === 'guest') {
    const migration = await readGuestMigration();
    const state = await loadOwnerState(owner, {
      // Global mirror keys are legacy guest state only on a cold install. When
      // switching away from an authenticated owner, those globals belong to
      // that account and must not seed the guest namespace.
      includeLegacyGuest:
        !migration && !(activeOwner?.kind === 'account' && !ownerMatches(activeOwner, owner)),
    });
    await saveOwnerState(owner, state, { mirror: true });
  } else {
    const shouldCaptureCurrentMirror = ownerMatches(previousOwner, owner);
    if (shouldCaptureCurrentMirror) await captureMirrorIntoOwner(owner);
    const state = await loadOwnerState(owner, { includeLegacyGuest: false });
    await saveOwnerState(owner, state, { mirror: true });
    authenticatedUserId = owner.id;
  }

  activeOwner = owner;
  await AsyncStorage.setItem(ACTIVE_OWNER_KEY, JSON.stringify(owner));
}

export function prepareStorageOwner(owner: SyncOwner): Promise<void> {
  // A guest launch effect can resolve after auth is already available. It must
  // not replace an authenticated namespace merely because its promise settled
  // later; sign-out clears the cookie before requesting the guest transition.
  if (owner.kind === 'guest' && getAuthCookieSafe()) {
    return ownerTransitionTail;
  }

  const request = ++ownerTransitionRequest;
  const previous = ownerTransitionTail;
  const transition = previous
    .catch(() => {})
    .then(() => applyStorageOwner(owner, request));
  ownerTransitionTail = transition.catch(() => {});
  return transition;
}

async function fetchBootstrap(cookie: string): Promise<BootstrapResponse | null> {
  let response: Response;
  try {
    response = await fetch(`${AUTH_API_ORIGIN}/api/v1/sync/bootstrap`, {
      headers: { Cookie: cookie },
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  const bootstrap = (await response.json()) as BootstrapResponse;
  const serverEvents = [...(bootstrap.sessionEvents ?? [])];
  let cursor = bootstrap.nextCursor;
  let pageSize = bootstrap.sessionEvents?.length ?? 0;
  for (let page = 0; cursor && pageSize === MAX_BATCH_SIZE && page < 49; page += 1) {
    let pageResponse: Response;
    try {
      pageResponse = await fetch(
        `${AUTH_API_ORIGIN}/api/v1/sync/session-events?cursor=${encodeURIComponent(cursor)}&limit=${MAX_BATCH_SIZE}`,
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
  return { ...bootstrap, sessionEvents: serverEvents };
}

function mergeBootstrapSettings(
  existing: Record<string, unknown> | null,
  settings: BootstrapResponse['settings'],
): Record<string, unknown> | null {
  if (!settings) return existing;
  return {
    ...(existing ?? {}),
    ...(typeof settings.mode === 'string' ? { mode: settings.mode } : {}),
    ...(typeof settings.speedMultiplier === 'number'
      ? { speed: settings.speedMultiplier }
      : {}),
    ...(settings.selectedDuration === null || typeof settings.selectedDuration === 'number'
      ? { duration: settings.selectedDuration }
      : {}),
    ...(typeof settings.muted === 'boolean' ? { muted: settings.muted } : {}),
    ...(typeof settings.theme === 'string' ? { theme: settings.theme } : {}),
  };
}

/** Uploads guest events first, then hydrates canonical account history/stats. */
export async function hydrateAccountState(): Promise<boolean> {
  await pendingOutboxWrite;
  const cookie = getAuthCookieSafe();
  if (!cookie) return false;
  const account = await resolveAuthenticatedOwner();
  if (!account) return false;

  const migration = await readGuestMigration();
  const previousOwner = await readActiveOwner();
  const firstAccountMigration = migration === null;
  let guestState: OwnerState | null = null;

  if (firstAccountMigration) {
    // Snapshot legacy global stats/settings only for the first account. Once
    // consumed, the migration marker makes those keys permanently guest-only.
    guestState = await loadOwnerState(await guestOwner(), { includeLegacyGuest: true });
    guestMigrationTarget = account.id;
    const guest = await guestOwner();
    const flushed = await performFlushForOwner(guest, cookie);
    const remainingGuestOutbox = await loadOutbox(guest);
    if (!flushed && remainingGuestOutbox.length > 0) {
      guestMigrationTarget = null;
      return false;
    }
  }

  // Do this before any network wait. If a different account has just signed
  // in, the DOM host must not continue rendering the previous owner's global
  // mirror while bootstrap is offline or in flight.
  if (previousOwner && !ownerMatches(previousOwner, account)) {
    await clearMirror();
  }
  activeOwner = account;

  // Only an active mirror belonging to this exact account may be merged. A
  // persisted active owner from account A is ignored while account B signs in.
  if (ownerMatches(previousOwner, account)) {
    await captureMirrorIntoOwner(account);
  }

  const accountState = await loadOwnerState(account, { includeLegacyGuest: false });
  const accountFlushed = await performFlushForOwner(account, cookie);
  const remainingAccountOutbox = await loadOutbox(account);
  if (!accountFlushed && remainingAccountOutbox.length > 0) {
    guestMigrationTarget = null;
    return false;
  }

  const mergeState = firstAccountMigration ? guestState : accountState;
  try {
    const mergeResponse = await fetch(`${AUTH_API_ORIGIN}/api/v1/sync/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        stats: mergeState?.stats ?? null,
        settings: mergeState?.settings ?? null,
      }),
    });
    if (!mergeResponse.ok) {
      guestMigrationTarget = null;
      return false;
    }
  } catch {
    guestMigrationTarget = null;
    return false;
  }

  const bootstrap = await fetchBootstrap(cookie);
  if (!bootstrap) {
    guestMigrationTarget = null;
    return false;
  }

  // If auth changed while the network was in flight, do not write account A's
  // response into account B's namespace or mirror.
  const currentAccount = await resolveAuthenticatedOwner();
  if (!currentAccount || currentAccount.id !== account.id) {
    guestMigrationTarget = null;
    return false;
  }

  const existingStats = accountState.stats ?? {};
  let nextStats: Record<string, unknown> | null = accountState.stats;
  if (bootstrap.stats) {
    const totalMinutes = Math.max(
      finiteNonNegative(existingStats.totalMinutes),
      finiteNonNegative(bootstrap.stats.totalMinutes),
    );
    const sessionsCompleted = Math.max(
      finiteNonNegative(existingStats.sessionsCompleted),
      finiteNonNegative(bootstrap.stats.sessionsCompleted),
    );
    nextStats = {
      ...existingStats,
      totalMinutes,
      totalSeconds: Math.max(
        finiteNonNegative(existingStats.totalSeconds),
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
    };
  }

  const nextState: OwnerState = {
    stats: nextStats,
    settings: mergeBootstrapSettings(accountState.settings, bootstrap.settings),
    history: dedupeHistory([
      ...accountState.history,
      ...(bootstrap.sessionEvents ?? []),
    ]),
  };
  await saveOwnerState(account, nextState, { mirror: true });
  activeOwner = account;
  await AsyncStorage.setItem(ACTIVE_OWNER_KEY, JSON.stringify(account));

  if (firstAccountMigration && guestMigrationTarget === account.id) {
    // The guest outbox was drained (including any event appended during fetch)
    // before this marker is written. Future accounts cannot ingest guest data.
    const guest = await guestOwner();
    if ((await loadOutbox(guest)).length === 0) {
      await markGuestMigrated(account.id);
    } else {
      guestMigrationTarget = null;
      return false;
    }
  }
  guestMigrationTarget = null;
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

function summaryFromState(state: OwnerState): AccountPracticeSummary {
  const stats = state.stats ?? {};
  const settings = state.settings ?? {};
  const storedDays = Array.isArray(stats.activeDays)
    ? stats.activeDays.filter((day): day is string => typeof day === 'string')
    : [];
  const eventDays = state.history
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

export async function loadAccountPracticeSummary(): Promise<AccountPracticeSummary> {
  const owner = await resolveCurrentOwner();
  if (!owner) {
    return summaryFromState({ stats: null, settings: null, history: [] });
  }
  const migration = await readGuestMigration();
  const state = await loadOwnerState(owner, {
    includeLegacyGuest: owner.kind === 'guest' && migration === null,
  });
  return summaryFromState(state);
}

export function getClientVersion(): string | undefined {
  return Constants.expoConfig?.version ?? undefined;
}
