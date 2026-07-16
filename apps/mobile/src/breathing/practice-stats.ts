export type SessionEndReason = 'paused' | 'completed' | 'mode_switched';

export interface PracticeStats {
  totalSeconds: number;
  sessionsCompleted: number;
}

export interface DisplayPracticeStats extends PracticeStats {
  totalMinutes: number;
}

interface CommitInput {
  sessionSeconds: number;
  sessionCommittedSeconds: number;
  reason: SessionEndReason;
}

export function hydrateTotalSeconds(totalMinutes: number, totalSeconds?: number): number {
  if (Number.isFinite(totalSeconds) && totalSeconds != null && totalSeconds >= 0) {
    return Math.floor(totalSeconds);
  }
  return Math.max(0, Math.floor(totalMinutes)) * 60;
}

export function commitPracticeStats(
  stats: PracticeStats,
  input: CommitInput,
): DisplayPracticeStats {
  const deltaSeconds = Math.max(0, input.sessionSeconds - input.sessionCommittedSeconds);
  const totalSeconds = stats.totalSeconds + deltaSeconds;
  const completedNow = input.reason === 'completed' && deltaSeconds > 0;

  return {
    totalSeconds,
    totalMinutes: Math.floor(totalSeconds / 60),
    sessionsCompleted: stats.sessionsCompleted + (completedNow ? 1 : 0),
  };
}
