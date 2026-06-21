import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeLiveStreak, buildStreakDays } from "./helpers/streak-calendar.mjs";

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

describe("buildStreakDays", () => {
  it("marks the correct days active for a live streak of 3", () => {
    // today=2026-06-21, lastSessionDate=2026-06-21, streak=3
    // active window: 2026-06-19, 2026-06-20, 2026-06-21
    const days = buildStreakDays(3, "2026-06-21", "2026-06-21", 7);
    // 7-day window: [0]=2026-06-15, [1]=6-16, [2]=6-17, [3]=6-18, [4]=6-19, [5]=6-20, [6]=6-21
    assert.equal(days.length, 7);
    assert.equal(days[3].date, "2026-06-18");
    assert.equal(days[3].active, false);  // just outside streak window
    assert.equal(days[4].date, "2026-06-19");
    assert.equal(days[4].active, true);   // first day of streak
    assert.equal(days[5].date, "2026-06-20");
    assert.equal(days[5].active, true);
    assert.equal(days[6].date, "2026-06-21");
    assert.equal(days[6].active, true);
  });

  it("returns all inactive when no lastSessionDate", () => {
    const days = buildStreakDays(0, null, "2026-06-21", 7);
    assert.ok(days.every((d) => !d.active), "all should be inactive");
  });

  it("marks correct days when lastSessionDate is in the past (expired streak)", () => {
    // Streak was 3 days ending 2026-06-15 (6 days ago). Calendar shows history honestly.
    const days = buildStreakDays(3, "2026-06-15", "2026-06-21", 14);
    const activeDay = days.find((d) => d.date === "2026-06-15");
    const inactiveDay = days.find((d) => d.date === "2026-06-21");
    const firstActiveDay = days.find((d) => d.date === "2026-06-13");
    assert.equal(activeDay?.active, true);
    assert.equal(inactiveDay?.active, false);
    assert.equal(firstActiveDay?.active, true);
  });

  it("returns numDays entries", () => {
    const days = buildStreakDays(5, "2026-06-21", "2026-06-21", 14);
    assert.equal(days.length, 14);
  });

  it("days are in ascending date order", () => {
    const days = buildStreakDays(5, "2026-06-21", "2026-06-21", 7);
    for (let i = 1; i < days.length; i++) {
      assert.ok(days[i].date > days[i - 1].date, "dates should ascend");
    }
  });
});
