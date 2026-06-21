/**
 * Pure JS mirror of src/lib/stats/streak-calendar.ts — used by tests.
 * Keep in sync with the TypeScript source.
 */

function dateToUtcDays(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

function toDateStr(utcDays) {
  return new Date(utcDays * 86400000).toISOString().slice(0, 10);
}

export function computeLiveStreak(currentStreak, lastSessionDate, today) {
  if (!lastSessionDate || currentStreak === 0) return 0;
  const diffDays = dateToUtcDays(today) - dateToUtcDays(lastSessionDate);
  return diffDays <= 1 ? currentStreak : 0;
}

export function streakWindowDays(currentStreak, lastSessionDate) {
  if (!lastSessionDate || currentStreak <= 0) return [];
  const last = dateToUtcDays(lastSessionDate);
  const out = [];
  for (let i = 0; i < currentStreak; i++) {
    out.push(toDateStr(last - i));
  }
  return out;
}

export function buildMonthGrid(year, month, activeDays, today) {
  const activeSet = new Set(activeDays);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const date = `${year}-${mm}-${dd}`;
    cells.push({ date, active: activeSet.has(date), isToday: date === today });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function utcWeekday(utcDays) {
  return new Date(utcDays * 86400000).getUTCDay(); // 0=Sun
}

export function buildGardenWeeks(activeDays, today, weeksCount) {
  const activeSet = new Set(activeDays);
  const todayDays = dateToUtcDays(today);
  const lastSunday = todayDays - utcWeekday(todayDays);
  const firstSunday = lastSunday - (weeksCount - 1) * 7;

  const weeks = [];
  // Seed with the leading column's month so the partial first column isn't labeled.
  let prevMonth = new Date(firstSunday * 86400000).getUTCMonth();
  for (let w = 0; w < weeksCount; w++) {
    const days = [];
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

export function computeLongestRun(activeDays) {
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

export function last7Days(activeDays, today) {
  const activeSet = new Set(activeDays);
  const end = dateToUtcDays(today);
  const out = [];
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
