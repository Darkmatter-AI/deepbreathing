"use client";

import type {
  BreathingMode,
  SessionEndReason,
  SessionEvent,
} from "@resonance/domain";

const OUTBOX_KEY = "resonance_session_event_outbox_v1";
const GUEST_ID_KEY = "resonance_guest_id_v1";
const MAX_BATCH_SIZE = 100;

interface OutboxItem {
  event: SessionEvent;
  attempt: number;
  nextAttemptAt: number;
}

interface CreateWebSessionEventInput {
  eventId: string;
  practiceId: string;
  mode: BreathingMode;
  reason: SessionEndReason;
  elapsedSeconds: number;
  previouslyCommittedSeconds: number;
  endedAt: Date;
}

function createUuid(): string {
  return crypto.randomUUID();
}

function readOutbox(): OutboxItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

function localDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getWebGuestId(): string {
  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;
  const guestId = createUuid();
  localStorage.setItem(GUEST_ID_KEY, guestId);
  return guestId;
}

export function createWebSessionEvent(
  input: CreateWebSessionEventInput
): SessionEvent | null {
  const seconds = Math.floor(
    input.elapsedSeconds - input.previouslyCommittedSeconds
  );
  if (seconds <= 0) return null;
  const startedAt = new Date(input.endedAt.getTime() - seconds * 1000);
  return {
    id: input.eventId,
    practiceId: input.practiceId,
    guestId: getWebGuestId(),
    startedAt: startedAt.toISOString(),
    endedAt: input.endedAt.toISOString(),
    seconds,
    mode: input.mode,
    completed: input.reason === "completed",
    endReason: input.reason,
    platform: "web",
    localDate: localDate(input.endedAt),
  };
}

export function enqueueWebSessionEvent(event: SessionEvent) {
  const outbox = readOutbox();
  if (outbox.some((item) => item.event.id === event.id)) return;
  outbox.push({ event, attempt: 0, nextAttemptAt: 0 });
  writeOutbox(outbox);
}

let activeFlush: Promise<boolean> | null = null;

async function performFlush(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  const now = Date.now();
  const outbox = readOutbox();
  const eligible = outbox
    .filter((item) => item.nextAttemptAt <= now)
    .slice(0, MAX_BATCH_SIZE);
  if (eligible.length === 0) return true;

  let response: Response;
  try {
    response = await fetch("/api/v1/sync/session-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: createUuid(),
        clientTimestamp: new Date().toISOString(),
        payload: { events: eligible.map((item) => item.event) },
      }),
    });
  } catch {
    const ids = new Set(eligible.map((item) => item.event.id));
    writeOutbox(
      outbox.map((item) =>
        ids.has(item.event.id)
          ? {
              ...item,
              attempt: item.attempt + 1,
              nextAttemptAt:
                now + Math.min(60_000, 1_000 * 2 ** item.attempt),
            }
          : item
      )
    );
    return false;
  }

  const ids = new Set(eligible.map((item) => item.event.id));
  if (response.ok) {
    const remaining = outbox.filter((item) => !ids.has(item.event.id));
    writeOutbox(remaining);
    return remaining.length > 0 ? performFlush() : true;
  }
  if (response.status !== 401) {
    writeOutbox(
      outbox.map((item) =>
        ids.has(item.event.id)
          ? {
              ...item,
              attempt: item.attempt + 1,
              nextAttemptAt:
                now + Math.min(60_000, 1_000 * 2 ** item.attempt),
            }
          : item
      )
    );
  }
  return false;
}

export function flushWebSessionOutbox(): Promise<boolean> {
  if (!activeFlush) {
    activeFlush = performFlush().finally(() => {
      activeFlush = null;
    });
  }
  return activeFlush;
}
