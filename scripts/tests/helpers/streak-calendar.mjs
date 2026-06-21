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
