/**
 * Pure JS mirror of src/lib/stats/streak-calendar.ts — used by tests.
 * Keep in sync with the TypeScript source.
 */

function dateToUtcDays(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

/**
 * Returns the live streak count for display.
 * The stored current_streak is only valid if last_session_date was today or yesterday.
 * If the session was older, the streak is broken and should display as 0.
 */
export function computeLiveStreak(currentStreak, lastSessionDate, today) {
  if (!lastSessionDate || currentStreak === 0) return 0;
  const lastDays = dateToUtcDays(lastSessionDate);
  const todayDays = dateToUtcDays(today);
  const diffDays = todayDays - lastDays;
  return diffDays <= 1 ? currentStreak : 0;
}

/**
 * Returns an array of { date: string (YYYY-MM-DD), active: boolean } for the last numDays days.
 * Active means the day falls within the stored streak window ending at lastSessionDate.
 * This reflects historical practice honestly, even for expired streaks.
 */
export function buildStreakDays(currentStreak, lastSessionDate, today, numDays = 14) {
  const todayDays = dateToUtcDays(today);
  const result = [];

  const lastDays = lastSessionDate ? dateToUtcDays(lastSessionDate) : null;
  const firstActiveDays = lastDays !== null && currentStreak > 0
    ? lastDays - (currentStreak - 1)
    : null;

  for (let i = numDays - 1; i >= 0; i--) {
    const dayDays = todayDays - i;
    const active =
      firstActiveDays !== null &&
      lastDays !== null &&
      dayDays >= firstActiveDays &&
      dayDays <= lastDays;
    const d = new Date(dayDays * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, active });
  }

  return result;
}
