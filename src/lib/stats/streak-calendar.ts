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

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function utcWeekday(utcDays: number): number {
  return new Date(utcDays * 86400000).getUTCDay(); // 0=Sun
}

export interface GardenDay {
  date: string; // YYYY-MM-DD
  active: boolean;
  isToday: boolean;
  future: boolean; // after `today` — render as an empty cell
}

export interface GardenWeek {
  monthLabel: string; // short month name on the column where the month changes, else ""
  days: GardenDay[]; // 7 entries, Sunday-first
}

/**
 * Builds a GitHub-contributions-style rolling grid: `weeksCount` columns of 7
 * weekday rows (Sunday-first), with `today` placed in the LAST column at its real
 * weekday. The remainder of today's week renders as `future` (empty) cells, so the
 * grid never assumes today is a Sunday. A day is `active` only if it is present in
 * `activeDays` and not in the future.
 */
export function buildGardenWeeks(
  activeDays: string[],
  today: string,
  weeksCount: number
): GardenWeek[] {
  const activeSet = new Set(activeDays);
  const todayDays = dateToUtcDays(today);
  const lastSunday = todayDays - utcWeekday(todayDays); // Sunday of today's week
  const firstSunday = lastSunday - (weeksCount - 1) * 7; // Sunday of the first column

  const weeks: GardenWeek[] = [];
  // Seed with the leading column's month so that partial first column isn't
  // labeled (it would crowd against the next month's label, e.g. "FebMar").
  let prevMonth = new Date(firstSunday * 86400000).getUTCMonth();
  for (let w = 0; w < weeksCount; w++) {
    const days: GardenDay[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = firstSunday + w * 7 + d;
      const date = toDateStr(cur);
      const future = cur > todayDays;
      days.push({
        date,
        active: !future && activeSet.has(date),
        isToday: cur === todayDays,
        future,
      });
    }
    const colMonth = new Date((firstSunday + w * 7) * 86400000).getUTCMonth();
    let monthLabel = "";
    if (colMonth !== prevMonth) {
      monthLabel = MONTH_SHORT[colMonth];
      prevMonth = colMonth;
    }
    weeks.push({ monthLabel, days });
  }
  return weeks;
}

/**
 * Longest run of consecutive calendar days within `activeDays`. Bounded by the
 * history that was loaded, so it reads as "longest recent run". Order- and
 * duplicate-insensitive.
 */
export function computeLongestRun(activeDays: string[]): number {
  if (activeDays.length === 0) return 0;
  const days = Array.from(new Set(activeDays))
    .map(dateToUtcDays)
    .sort((a, b) => a - b);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  return longest;
}

export interface WeekStripDay {
  date: string;
  active: boolean;
  isToday: boolean;
  label: string; // single-letter weekday
}

/** The 7 calendar days ending at `today` (oldest first), each flagged active/today. */
export function last7Days(activeDays: string[], today: string): WeekStripDay[] {
  const activeSet = new Set(activeDays);
  const end = dateToUtcDays(today);
  const out: WeekStripDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const cur = end - i;
    const date = toDateStr(cur);
    out.push({
      date,
      active: activeSet.has(date),
      isToday: cur === end,
      label: WEEKDAY_INITIALS[utcWeekday(cur)],
    });
  }
  return out;
}
