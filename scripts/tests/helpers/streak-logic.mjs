/**
 * Pure streak computation — mirrors the SQL CASE logic in /api/v1/sync/stats.
 * Kept as a separate .mjs module so tests can import it without a TS transpiler.
 */

/**
 * @param {number} currentStreak
 * @param {string | null} lastSessionDate  ISO YYYY-MM-DD or null
 * @param {string} sessionDate             ISO YYYY-MM-DD
 * @returns {number}
 */
export function computeStreak(currentStreak, lastSessionDate, sessionDate) {
  if (!lastSessionDate) return 1;
  if (lastSessionDate === sessionDate) return currentStreak;
  const last = new Date(lastSessionDate);
  const curr = new Date(sessionDate);
  const diffDays = Math.round((curr.getTime() - last.getTime()) / 86_400_000);
  if (diffDays === 1) return currentStreak + 1;
  return 1;
}
