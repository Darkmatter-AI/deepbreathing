import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeLiveStreak,
  streakWindowDays,
  buildMonthGrid,
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
