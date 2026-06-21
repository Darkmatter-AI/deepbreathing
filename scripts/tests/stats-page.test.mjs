import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeLiveStreak,
  streakWindowDays,
  buildMonthGrid,
  buildGardenWeeks,
  computeLongestRun,
  last7Days,
} from "./helpers/streak-calendar.mjs";

describe("computeLiveStreak", () => {
  it("returns currentStreak when lastSessionDate is today", () => {
    assert.equal(computeLiveStreak(5, "2026-06-21", "2026-06-21"), 5);
  });

  it("returns currentStreak when lastSessionDate is yesterday", () => {
    assert.equal(computeLiveStreak(5, "2026-06-20", "2026-06-21"), 5);
  });

  it("returns 0 when lastSessionDate is 2 days ago (broken streak)", () => {
    assert.equal(computeLiveStreak(5, "2026-06-19", "2026-06-21"), 0);
  });

  it("returns 0 when lastSessionDate is null", () => {
    assert.equal(computeLiveStreak(3, null, "2026-06-21"), 0);
  });

  it("returns 0 when currentStreak is 0", () => {
    assert.equal(computeLiveStreak(0, "2026-06-21", "2026-06-21"), 0);
  });
});

describe("streakWindowDays", () => {
  it("returns the consecutive window ending at lastSessionDate", () => {
    assert.deepEqual(streakWindowDays(3, "2026-06-21"), [
      "2026-06-21",
      "2026-06-20",
      "2026-06-19",
    ]);
  });

  it("returns [] when no lastSessionDate", () => {
    assert.deepEqual(streakWindowDays(5, null), []);
  });

  it("returns [] when streak is 0", () => {
    assert.deepEqual(streakWindowDays(0, "2026-06-21"), []);
  });

  it("crosses a month boundary correctly", () => {
    assert.deepEqual(streakWindowDays(3, "2026-07-01"), [
      "2026-07-01",
      "2026-06-30",
      "2026-06-29",
    ]);
  });
});

describe("buildMonthGrid", () => {
  const flat = (weeks) => weeks.flat().filter(Boolean);

  it("June 2026 has 30 real day cells", () => {
    const weeks = buildMonthGrid(2026, 6, [], "2026-06-21");
    assert.equal(flat(weeks).length, 30);
  });

  it("February 2026 (non-leap) has 28 day cells", () => {
    const weeks = buildMonthGrid(2026, 2, [], "2026-06-21");
    assert.equal(flat(weeks).length, 28);
  });

  it("February 2024 (leap year) has 29 day cells", () => {
    const weeks = buildMonthGrid(2024, 2, [], "2026-06-21");
    assert.equal(flat(weeks).length, 29);
  });

  it("each week row has exactly 7 cells", () => {
    const weeks = buildMonthGrid(2026, 6, [], "2026-06-21");
    for (const week of weeks) assert.equal(week.length, 7);
  });

  it("places June 1 2026 in the Monday column (index 1)", () => {
    // 2026-06-01 is a Monday → one leading null in the first week.
    const weeks = buildMonthGrid(2026, 6, [], "2026-06-21");
    assert.equal(weeks[0][0], null);
    assert.equal(weeks[0][1].date, "2026-06-01");
  });

  it("marks NON-CONSECUTIVE active days (proves real history, not just streak window)", () => {
    const active = ["2026-06-03", "2026-06-09", "2026-06-20"];
    const weeks = buildMonthGrid(2026, 6, active, "2026-06-21");
    const cells = flat(weeks);
    const byDate = Object.fromEntries(cells.map((c) => [c.date, c]));
    assert.equal(byDate["2026-06-03"].active, true);
    assert.equal(byDate["2026-06-09"].active, true);
    assert.equal(byDate["2026-06-20"].active, true);
    // gaps between them stay inactive
    assert.equal(byDate["2026-06-04"].active, false);
    assert.equal(byDate["2026-06-10"].active, false);
    assert.equal(byDate["2026-06-21"].active, false);
  });

  it("flags isToday on the matching cell only", () => {
    const weeks = buildMonthGrid(2026, 6, [], "2026-06-21");
    const cells = flat(weeks);
    const todayCells = cells.filter((c) => c.isToday);
    assert.equal(todayCells.length, 1);
    assert.equal(todayCells[0].date, "2026-06-21");
  });

  it("leading/trailing pad cells are null", () => {
    const weeks = buildMonthGrid(2026, 6, [], "2026-06-21");
    const lastWeek = weeks[weeks.length - 1];
    // June 30 2026 is a Tuesday → trailing cells after it are null
    assert.ok(lastWeek.some((c) => c === null));
  });
});

// Weekday of a YYYY-MM-DD in UTC (0=Sun). Local helper for assertions.
const utcDow = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();

describe("buildGardenWeeks", () => {
  it("returns exactly weeksCount columns of 7 days", () => {
    const weeks = buildGardenWeeks([], "2026-06-21", 18);
    assert.equal(weeks.length, 18);
    for (const w of weeks) assert.equal(w.days.length, 7);
  });

  it("columns are Sunday-first (row 0 is always a Sunday)", () => {
    const weeks = buildGardenWeeks([], "2026-06-24", 6);
    for (const w of weeks) assert.equal(utcDow(w.days[0].date), 0);
  });

  it("ends on the Saturday of today's week", () => {
    // 2026-06-21 is a Sunday → that week's Saturday is 2026-06-27.
    const weeks = buildGardenWeeks([], "2026-06-21", 18);
    const last = weeks[weeks.length - 1].days;
    assert.equal(last[6].date, "2026-06-27");
  });

  it("places a Sunday today in row 0 of the last column; rest of week is future", () => {
    const weeks = buildGardenWeeks([], "2026-06-21", 4);
    const last = weeks[3].days;
    assert.equal(last[0].date, "2026-06-21");
    assert.equal(last[0].isToday, true);
    assert.equal(last[0].future, false);
    for (let d = 1; d <= 6; d++) assert.equal(last[d].future, true);
  });

  it("places a Wednesday today in row 3; earlier rows are past, later rows future", () => {
    const weeks = buildGardenWeeks([], "2026-06-24", 4); // Wed
    const last = weeks[3].days;
    assert.equal(last[3].date, "2026-06-24");
    assert.equal(last[3].isToday, true);
    assert.equal(last[0].date, "2026-06-21"); // Sun, past
    assert.equal(last[0].future, false);
    assert.equal(last[2].future, false); // Tue, past
    assert.equal(last[4].future, true); // Thu, future
    assert.equal(last[6].future, true);
  });

  it("places a Saturday today in the final cell with no future cells", () => {
    const weeks = buildGardenWeeks([], "2026-06-20", 4); // Sat
    const last = weeks[3].days;
    assert.equal(last[6].date, "2026-06-20");
    assert.equal(last[6].isToday, true);
    assert.ok(last.every((c) => !c.future));
  });

  it("marks active days and never marks future days active", () => {
    // 2026-06-24 sits in today's column but after today (Sun 06-21) → in-window future.
    const weeks = buildGardenWeeks(["2026-06-18", "2026-06-24"], "2026-06-21", 4);
    const byDate = Object.fromEntries(weeks.flatMap((w) => w.days).map((c) => [c.date, c]));
    assert.equal(byDate["2026-06-18"].active, true);
    assert.equal(byDate["2026-06-24"].future, true);
    assert.equal(byDate["2026-06-24"].active, false); // future, despite being in the set
  });

  it("labels a month only on its first appearance", () => {
    const weeks = buildGardenWeeks([], "2026-06-21", 18);
    const labels = weeks.map((w) => w.monthLabel).filter(Boolean);
    // no immediate repeats, all valid short month names
    const valid = new Set(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]);
    for (const l of labels) assert.ok(valid.has(l));
    for (let i = 1; i < labels.length; i++) assert.notEqual(labels[i], labels[i - 1]);
  });

  it("does not label the leading partial column (avoids crowding)", () => {
    const weeks = buildGardenWeeks([], "2026-06-21", 18);
    assert.equal(weeks[0].monthLabel, "");
  });
});

describe("computeLongestRun", () => {
  it("returns 0 for no active days", () => {
    assert.equal(computeLongestRun([]), 0);
  });

  it("returns 1 for a single day", () => {
    assert.equal(computeLongestRun(["2026-06-21"]), 1);
  });

  it("counts a consecutive run", () => {
    assert.equal(computeLongestRun(["2026-06-19", "2026-06-20", "2026-06-21"]), 3);
  });

  it("returns the longest run when gaps split the history", () => {
    assert.equal(
      computeLongestRun(["2026-06-01", "2026-06-02", "2026-06-10", "2026-06-11", "2026-06-12"]),
      3
    );
  });

  it("is order- and duplicate-insensitive", () => {
    assert.equal(computeLongestRun(["2026-06-21", "2026-06-19", "2026-06-20", "2026-06-20"]), 3);
  });

  it("counts a run that crosses a month boundary", () => {
    assert.equal(computeLongestRun(["2026-06-29", "2026-06-30", "2026-07-01"]), 3);
  });
});

describe("last7Days", () => {
  it("returns 7 days, oldest first, ending today", () => {
    const days = last7Days([], "2026-06-21");
    assert.equal(days.length, 7);
    assert.equal(days[0].date, "2026-06-15");
    assert.equal(days[6].date, "2026-06-21");
    assert.equal(days[6].isToday, true);
  });

  it("flags active days from the set", () => {
    const days = last7Days(["2026-06-18", "2026-06-21", "2026-05-30"], "2026-06-21");
    const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
    assert.equal(byDate["2026-06-18"].active, true);
    assert.equal(byDate["2026-06-21"].active, true);
    assert.equal(byDate["2026-06-19"].active, false);
    assert.equal(byDate["2026-05-30"], undefined); // outside the 7-day window
  });

  it("uses single-letter weekday labels", () => {
    const days = last7Days([], "2026-06-21");
    // 2026-06-15 is Monday → 'M'; 2026-06-21 is Sunday → 'S'
    assert.equal(days[0].label, "M");
    assert.equal(days[6].label, "S");
  });
});
