import { describe, expect, it } from 'vitest';

import { commitPracticeStats, hydrateTotalSeconds } from './practice-stats';

describe('hydrateTotalSeconds', () => {
  it('prefers exact persisted seconds when available', () => {
    expect(hydrateTotalSeconds(12, 755)).toBe(755);
  });

  it('migrates legacy minute-only totals', () => {
    expect(hydrateTotalSeconds(12, undefined)).toBe(720);
  });
});

describe('commitPracticeStats', () => {
  it('preserves sub-minute time across pause and resume commits', () => {
    const paused = commitPracticeStats(
      { totalSeconds: 0, sessionsCompleted: 0 },
      { sessionSeconds: 30, sessionCommittedSeconds: 0, reason: 'paused' },
    );
    const completed = commitPracticeStats(
      paused,
      { sessionSeconds: 60, sessionCommittedSeconds: 30, reason: 'completed' },
    );

    expect(paused).toEqual({ totalSeconds: 30, totalMinutes: 0, sessionsCompleted: 0 });
    expect(completed).toEqual({ totalSeconds: 60, totalMinutes: 1, sessionsCompleted: 1 });
  });

  it('does not label pauses or mode switches as completed sessions', () => {
    const paused = commitPracticeStats(
      { totalSeconds: 120, sessionsCompleted: 4 },
      { sessionSeconds: 20, sessionCommittedSeconds: 0, reason: 'paused' },
    );
    const switched = commitPracticeStats(
      paused,
      { sessionSeconds: 35, sessionCommittedSeconds: 20, reason: 'mode_switched' },
    );

    expect(switched).toEqual({ totalSeconds: 155, totalMinutes: 2, sessionsCompleted: 4 });
  });

  it('counts a short timed completion even before it reaches one minute', () => {
    expect(
      commitPracticeStats(
        { totalSeconds: 0, sessionsCompleted: 0 },
        { sessionSeconds: 30, sessionCommittedSeconds: 0, reason: 'completed' },
      ),
    ).toEqual({ totalSeconds: 30, totalMinutes: 0, sessionsCompleted: 1 });
  });

  it('ignores duplicate commits with no new elapsed time', () => {
    expect(
      commitPracticeStats(
        { totalSeconds: 90, sessionsCompleted: 2 },
        { sessionSeconds: 30, sessionCommittedSeconds: 30, reason: 'completed' },
      ),
    ).toEqual({ totalSeconds: 90, totalMinutes: 1, sessionsCompleted: 2 });
  });
});
