function dateToUtcDays(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

function toDateStr(utcDays: number): string {
  return new Date(utcDays * 86400000).toISOString().slice(0, 10);
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
 * Returns the consecutive day strings (YYYY-MM-DD) covered by a stored streak window:
 * [lastSessionDate - (streak - 1) .. lastSessionDate].
 * Used as a fallback / floor for the calendar when per-day rows are unavailable
 * (e.g. before the user_active_days migration is applied or backfilled).
 */
export function streakWindowDays(
  currentStreak: number,
  lastSessionDate: string | null
): string[] {
  if (!lastSessionDate || currentStreak <= 0) return [];
  const last = dateToUtcDays(lastSessionDate);
  const out: string[] = [];
  for (let i = 0; i < currentStreak; i++) {
    out.push(toDateStr(last - i));
  }
  return out;
}

export interface DayCell {
  date: string; // YYYY-MM-DD
  active: boolean;
  isToday: boolean;
}

/**
 * Builds a full calendar-month grid (Sunday-first columns), respectful of the month's
 * real day count and weekday alignment. Leading/trailing pad cells are null.
 * A day is `active` if its date string is present in `activeDays`.
 */
export function buildMonthGrid(
  year: number,
  month: number, // 1-12
  activeDays: string[],
  today: string
): (DayCell | null)[][] {
  const activeSet = new Set(activeDays);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const date = `${year}-${mm}-${dd}`;
    cells.push({ date, active: activeSet.has(date), isToday: date === today });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
