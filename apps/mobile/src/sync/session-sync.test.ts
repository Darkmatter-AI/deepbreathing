import { describe, expect, it } from 'vitest';

import { createSessionSegment, retryDelayMs } from './session-sync';

const base = {
  eventId: '018f3e02-ff1d-7c55-9bd1-2f32672a95d8',
  practiceId: '018f3e02-ff1d-7c55-9bd1-2f32672a95d9',
  guestId: 'guest-local-id',
  mode: 'Box Breathing' as const,
  reason: 'paused' as const,
  elapsedSeconds: 90,
  previouslyCommittedSeconds: 0,
  endedAt: new Date('2026-07-11T09:01:30.000Z'),
  localDate: '2026-07-11',
  clientVersion: '1.0.0',
};

describe('createSessionSegment', () => {
  it('creates the first immutable paused segment without counting completion', () => {
    expect(createSessionSegment(base)).toEqual({
      id: base.eventId,
      practiceId: base.practiceId,
      guestId: base.guestId,
      startedAt: '2026-07-11T09:00:00.000Z',
      endedAt: '2026-07-11T09:01:30.000Z',
      seconds: 90,
      mode: 'Box Breathing',
      completed: false,
      endReason: 'paused',
      platform: 'ios',
      localDate: '2026-07-11',
      clientVersion: '1.0.0',
    });
  });

  it('records only the new delta after pause and resume', () => {
    const segment = createSessionSegment({
      ...base,
      eventId: '018f3e02-ff1d-7c55-9bd1-2f32672a95da',
      elapsedSeconds: 150,
      previouslyCommittedSeconds: 90,
      endedAt: new Date('2026-07-11T09:03:00.000Z'),
      reason: 'completed',
    });
    expect(segment?.seconds).toBe(60);
    expect(segment?.completed).toBe(true);
    expect(segment?.startedAt).toBe('2026-07-11T09:02:00.000Z');
  });

  it('does not enqueue a zero-delta end event', () => {
    expect(
      createSessionSegment({
        ...base,
        elapsedSeconds: 90,
        previouslyCommittedSeconds: 90,
      }),
    ).toBeNull();
  });
});

describe('retryDelayMs', () => {
  it('uses capped exponential backoff', () => {
    expect(retryDelayMs(0)).toBe(1_000);
    expect(retryDelayMs(3)).toBe(8_000);
    expect(retryDelayMs(99)).toBe(60_000);
  });
});
