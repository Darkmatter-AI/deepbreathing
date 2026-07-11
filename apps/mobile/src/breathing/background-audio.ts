export function backgroundAudioRemainingMs(
  durationSeconds: number | null,
  elapsedSeconds: number,
  reportedAtMs: number,
  nowMs: number = Date.now(),
): number | null {
  if (durationSeconds == null) return null;
  const activeSinceReportMs = Math.max(0, nowMs - reportedAtMs);
  const elapsedMs = (Math.max(0, elapsedSeconds) * 1000) + activeSinceReportMs;
  return Math.max(0, (durationSeconds * 1000) - elapsedMs);
}
