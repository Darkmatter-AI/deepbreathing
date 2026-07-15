"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Timer, Activity, Sprout } from "lucide-react";
import {
  computeLiveStreak,
  computeLongestRun,
  buildGardenWeeks,
  last7Days,
} from "@/lib/stats/streak-calendar";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import type { BreathingPattern, ModeName } from "@/components/resonance/types";
import { SignInSheet } from "@/components/auth/sign-in-sheet";
import styles from "./stats.module.css";

// The breath garden renders this many week-columns (GitHub-contributions style).
const GARDEN_WEEKS = 18;
// Where "Begin session" / "Practice again" lead. The home app restores the
// user's last pattern from their synced settings, so no deep-link param is needed.
const APP_HREF = "/";

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Mon, Jun 15" from a YYYY-MM-DD string (UTC, matching the DB date semantics). */
function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return `${SHORT_DAYS[d.getUTCDay()]}, ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Concise cadence line, e.g. "5.5s in · 5.5s out" or "4s in · 4s hold · 4s out · 4s hold". */
function patternCadence(p: BreathingPattern): string {
  const parts: string[] = [`${p.inhale}s in`];
  if (p.inhale2) parts.push(`${p.inhale2}s in`);
  if (p.holdIn) parts.push(`${p.holdIn}s hold`);
  parts.push(`${p.exhale}s out`);
  if (p.holdOut) parts.push(`${p.holdOut}s hold`);
  return parts.join(" · ");
}

/** The benefit phrase from a pattern description, dropping the "(4-4-4-4)" tail. */
function patternBenefit(p: BreathingPattern): string {
  return p.description.replace(/\s*\(.*\)\s*$/, "").trim();
}

interface StatsDisplayProps {
  totalMinutes: number;
  sessionsCompleted: number;
  currentStreak: number;
  lastSessionDate: string | null;
  currentMode: string | null;
  activeDays: string[];
}

export function StatsDisplay({
  totalMinutes,
  sessionsCompleted,
  currentStreak,
  lastSessionDate,
  currentMode,
  activeDays,
}: StatsDisplayProps) {
  // UTC on the server for hydration parity, local after mount so the garden and
  // streak align with the user's real "today" (sv-SE yields YYYY-MM-DD).
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => {
    setToday(new Date().toLocaleDateString("sv-SE"));
  }, []);

  const [hover, setHover] = useState<{ label: string; active: boolean } | null>(null);

  const liveStreak = computeLiveStreak(currentStreak, lastSessionDate, today);
  const longestRun = useMemo(() => computeLongestRun(activeDays), [activeDays]);
  const weeks = useMemo(
    () => buildGardenWeeks(activeDays, today, GARDEN_WEEKS),
    [activeDays, today]
  );
  const week = useMemo(() => last7Days(activeDays, today), [activeDays, today]);
  const weekActiveCount = week.filter((d) => d.active).length;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel =
    hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${totalMinutes}m`;

  // Streak reframe — a stale or zero streak reads as a fresh start, never a sad "0".
  const streakActive = liveStreak > 0;
  const streakBig = streakActive ? String(liveStreak) : "Today";
  const streakUnit = streakActive ? (liveStreak === 1 ? "day" : "days") : "";
  const streakLabel = streakActive ? "Day streak" : "Fresh start";
  const streakSub = streakActive
    ? `Longest: ${longestRun} ${longestRun === 1 ? "day" : "days"}`
    : "One breath plants a new streak";

  // Favorite pattern from the user's synced mode (no per-pattern counts are stored).
  const pattern: BreathingPattern | null =
    currentMode &&
    Object.prototype.hasOwnProperty.call(BREATHING_PATTERNS, currentMode)
      ? BREATHING_PATTERNS[currentMode as ModeName]
      : null;

  const readout = hover
    ? `${hover.label} · ${hover.active ? "practiced" : "a day of rest"}`
    : "Hover a day to view history";

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.orbA} aria-hidden />
      <div className={styles.orbB} aria-hidden />

      <div className={styles.inner}>
        {/* Header */}
        <header className={styles.header}>
          <Link href={APP_HREF} aria-label="Back to breathing" className={styles.orbWrap}>
            <span className={styles.orbGlow} aria-hidden />
            <span className={styles.orb} aria-hidden />
          </Link>
          <div className={styles.headText}>
            <div className={styles.eyebrow}>Activity log</div>
            <h1 className={styles.h1}>Your practice</h1>
          </div>
          <Link href={APP_HREF} className={styles.cta}>
            Begin session
            <span className={styles.ctaArrow} aria-hidden>
              &rarr;
            </span>
          </Link>
        </header>

        {/* Stat tiles */}
        <section className={styles.tiles}>
          <div className={`${styles.card} ${styles.tile}`}>
            <div className={styles.tileHead}>
              <Timer size={20} />
              <span className={styles.tileLabel}>Total active time</span>
            </div>
            <div className={styles.tileValue}>{timeLabel}</div>
          </div>

          <div className={`${styles.card} ${styles.tile}`}>
            <div className={styles.tileHead}>
              <Activity size={20} />
              <span className={styles.tileLabel}>Sessions</span>
            </div>
            <div className={styles.tileValue}>{sessionsCompleted}</div>
            <div className={styles.tileSub}>
              {sessionsCompleted > 0 ? "keep the rhythm going" : "Ready for your first"}
            </div>
          </div>

          <div className={`${styles.card} ${styles.tile} ${styles.tileWarm}`}>
            <div className={`${styles.tileHead} ${styles.tileHeadWarm}`}>
              <Sprout size={20} />
              <span className={`${styles.tileLabel} ${styles.tileLabelWarm}`}>
                {streakLabel}
              </span>
            </div>
            <div className={styles.streakRow}>
              <div className={styles.tileValue}>{streakBig}</div>
              {streakUnit && <div className={styles.streakUnit}>{streakUnit}</div>}
            </div>
            <div className={styles.tileSub}>{streakSub}</div>
          </div>
        </section>

        {/* Breath garden */}
        <section className={`${styles.card} ${styles.garden}`}>
          <div className={styles.gardenHead}>
            <div>
              <div className={styles.eyebrow}>Practice history</div>
              <h2 className={styles.gardenTitle}>Breath Garden</h2>
            </div>
            <div className={styles.readout}>
              <span
                className={`${styles.readoutDot} ${hover?.active ? styles.readoutDotActive : ""}`}
                aria-hidden
              />
              <span className={styles.readoutText}>{readout}</span>
            </div>
          </div>

          <div className={styles.gardenScroll}>
            <div className={styles.gardenGrid}>
              <div className={styles.monthRow}>
                {weeks.map((w, i) => (
                  <div key={`m-${i}`} className={styles.monthLabel}>
                    {w.monthLabel}
                  </div>
                ))}
              </div>
              <div className={styles.weeksRow}>
                <div className={styles.weekdayCol}>
                  <div className={styles.weekdaySpacer} />
                  <div className={styles.weekdayLabel}>Mon</div>
                  <div className={styles.weekdaySpacer} />
                  <div className={styles.weekdayLabel}>Wed</div>
                  <div className={styles.weekdaySpacer} />
                  <div className={styles.weekdayLabel}>Fri</div>
                  <div className={styles.weekdaySpacer} />
                </div>
                {weeks.map((w, wi) => (
                  <div key={`w-${wi}`} className={styles.week}>
                    {w.days.map((day) => {
                      const cls = [
                        styles.day,
                        day.future ? styles.dayFuture : "",
                        day.active ? styles.dayActive : "",
                        day.isToday ? styles.dayToday : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <div
                          key={day.date}
                          className={cls}
                          title={day.future ? undefined : formatDayLabel(day.date)}
                          onMouseEnter={
                            day.future
                              ? undefined
                              : () =>
                                  setHover({
                                    label: formatDayLabel(day.date),
                                    active: day.active,
                                  })
                          }
                          onMouseLeave={() => setHover(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.legend}>
            <span>Rest</span>
            <span className={styles.legendSwatch} style={{ background: "var(--yp-rest)" }} />
            <span className={`${styles.legendSwatch} ${styles.dayActive}`} />
            <span>Practiced</span>
          </div>
        </section>

        {/* Bottom row */}
        <section className={styles.bottom}>
          {pattern && (
            <div className={`${styles.card} ${styles.panel}`}>
              <div className={styles.panelEyebrow}>Favorite pattern</div>
              <div className={styles.favRow}>
                <div className={styles.favOrbWrap}>
                  <span
                    className={styles.favOrbGlow}
                    style={{ background: pattern.color }}
                    aria-hidden
                  />
                  <span
                    className={styles.favOrb}
                    style={{ background: pattern.color }}
                    aria-hidden
                  />
                </div>
                <div>
                  <div className={styles.favName}>{pattern.name}</div>
                  <div className={styles.favCadence}>{patternCadence(pattern)}</div>
                </div>
              </div>
              <div className={styles.favFoot}>
                <span className={styles.favCount}>{patternBenefit(pattern)}</span>
                <Link href={APP_HREF} className={styles.favCta}>
                  Practice again &rarr;
                </Link>
              </div>
            </div>
          )}

          <div className={`${styles.card} ${styles.panel}`}>
            <div className={styles.weekHead}>
              <div className={styles.panelEyebrow} style={{ marginBottom: 0 }}>
                Last 7 days
              </div>
              <div className={styles.weekSub}>{weekActiveCount} of 7 days</div>
            </div>
            <div className={styles.strip}>
              {week.map((d) => (
                <div key={d.date} className={styles.stripDay} title={formatDayLabel(d.date)}>
                  <div
                    className={[
                      styles.stripPill,
                      d.active ? styles.stripPillActive : "",
                      d.isToday ? styles.stripPillToday : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <span
                    className={`${styles.stripLabel} ${d.isToday ? styles.stripLabelToday : ""}`}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface StatsSignedOutProps {
  totalMinutes?: number;
}

export function StatsSignedOut({ totalMinutes }: StatsSignedOutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="glow-card rounded-[32px] border border-border bg-card p-8 text-center">
        <Flame className="mx-auto mb-4 text-primary" size={32} />
        <h1 className="mb-2 text-xl font-semibold text-card-foreground">
          Track your practice
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in to see your total minutes, session count, streak, and a
          practice calendar. Your data syncs across devices.
        </p>
        <button
          onClick={() => setSheetOpen(true)}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Sign in to view your stats
        </button>
      </div>

      <SignInSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        headline="Sign in to track your practice"
        subtitle="See your streak, total time, and session history."
        totalMinutes={totalMinutes}
      />
    </div>
  );
}
