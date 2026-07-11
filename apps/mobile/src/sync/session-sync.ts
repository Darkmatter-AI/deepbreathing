import type {
  BreathingMode,
  SessionEndReason,
  SessionEvent,
} from '@resonance/domain';

export interface CreateSessionSegmentInput {
  eventId: string;
  practiceId: string;
  guestId: string;
  mode: BreathingMode;
  reason: SessionEndReason;
  elapsedSeconds: number;
  previouslyCommittedSeconds: number;
  endedAt: Date;
  localDate: string;
  clientVersion?: string;
}

/**
 * Turn a cumulative DOM session commit into an immutable ledger delta.
 * `completed` only marks an actual timer completion, matching the local stats
 * model. `practiceId` lets history group pause/resume segments later.
 */
export function createSessionSegment(
  input: CreateSessionSegmentInput,
): SessionEvent | null {
  const seconds = Math.floor(
    input.elapsedSeconds - input.previouslyCommittedSeconds,
  );
  if (seconds <= 0) return null;

  const startedAt = new Date(input.endedAt.getTime() - seconds * 1000);
  return {
    id: input.eventId,
    practiceId: input.practiceId,
    guestId: input.guestId,
    startedAt: startedAt.toISOString(),
    endedAt: input.endedAt.toISOString(),
    seconds,
    mode: input.mode,
    completed: input.reason === 'completed',
    endReason: input.reason,
    platform: 'ios',
    localDate: input.localDate,
    ...(input.clientVersion ? { clientVersion: input.clientVersion } : {}),
  };
}

export function retryDelayMs(attempt: number): number {
  return Math.min(60_000, 1_000 * 2 ** Math.max(0, attempt));
}

export function localCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
