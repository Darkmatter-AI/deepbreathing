function dateToUtcDays(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

/**
 * Returns the live streak count for display.
 * The stored current_streak is only valid if last_session_date was today or yesterday.
 * A session older than that means the streak is broken and should display as 0.
 */
export function computeLiveStreak(
  currentStreak: number,
  lastSessionDate: string | null,
  today: string
): number {
  if (!lastSessionDate || currentStreak === 0) return 0;
  const diffDays = dateToUtcDays(today) - dateToUtcDays(lastSessionDate);
  return diffDays <= 1 ? currentStreak : 0;
}

/**
 * Returns an array of { date: YYYY-MM-DD, active: boolean } for the last numDays days ending today.
 * A day is active if it falls within the stored streak window [lastSessionDate - streak + 1, lastSessionDate].
 * This reflects historical practice honestly, even after a streak expires.
 */
export function buildStreakDays(
  currentStreak: number,
  lastSessionDate: string | null,
  today: string,
  numDays: number = 14
): { date: string; active: boolean }[] {
  const todayDays = dateToUtcDays(today);
  const lastDays = lastSessionDate ? dateToUtcDays(lastSessionDate) : null;
  const firstActiveDays =
    lastDays !== null && currentStreak > 0
      ? lastDays - (currentStreak - 1)
      : null;

  return Array.from({ length: numDays }, (_, idx) => {
    const dayDays = todayDays - (numDays - 1 - idx);
    const active =
      firstActiveDays !== null &&
      lastDays !== null &&
      dayDays >= firstActiveDays &&
      dayDays <= lastDays;
    const date = new Date(dayDays * 86400000).toISOString().slice(0, 10);
    return { date, active };
  });
}
