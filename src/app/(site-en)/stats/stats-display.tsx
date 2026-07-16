"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Flame, Sprout, Timer } from "lucide-react";

import { SignInSheet } from "@/components/auth/sign-in-sheet";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import type { BreathingPattern, ModeName } from "@/components/resonance/types";
import type {
  StatsContent,
  StatsMessageId,
} from "@/i18n/content/bespoke/stats/types";
import {
  buildGardenWeeks,
  computeLiveStreak,
  computeLongestRun,
  last7Days,
} from "@/lib/stats/streak-calendar";

import styles from "./stats.module.css";

const GARDEN_WEEKS = 18;

export interface StatsRenderContext {
  appHref: string;
  authLocale: string;
  locale: string;
}

const PATTERN_MESSAGE_IDS: Record<
  ModeName,
  { description: StatsMessageId; name: StatsMessageId }
> = {
  "4-7-8 Relax": {
    description: "pattern.relax478.description",
    name: "pattern.relax478.name",
  },
  "Belly Breathing": {
    description: "pattern.belly.description",
    name: "pattern.belly.name",
  },
  "Box Breathing": {
    description: "pattern.box.description",
    name: "pattern.box.name",
  },
  "Breath of Fire": {
    description: "pattern.breathOfFire.description",
    name: "pattern.breathOfFire.name",
  },
  "Buteyko Breathing": {
    description: "pattern.buteyko.description",
    name: "pattern.buteyko.name",
  },
  "Coherent Breathing": {
    description: "pattern.coherent.description",
    name: "pattern.coherent.name",
  },
  "Nadi Shodhana": {
    description: "pattern.nadi.description",
    name: "pattern.nadi.name",
  },
  "Physiological Sigh": {
    description: "pattern.physiologicalSigh.description",
    name: "pattern.physiologicalSigh.name",
  },
  "Pursed Lip Breathing": {
    description: "pattern.pursedLip.description",
    name: "pattern.pursedLip.name",
  },
  "Tummo Breathing": {
    description: "pattern.tummo.description",
    name: "pattern.tummo.name",
  },
  "Ujjayi Breathing": {
    description: "pattern.ujjayi.description",
    name: "pattern.ujjayi.name",
  },
  "Wim Hof Breathing": {
    description: "pattern.wimHof.description",
    name: "pattern.wimHof.name",
  },
};

function formatMessage(
  template: string,
  variables: Record<string, string | number>,
): string {
  return template.replace(/\{([a-z]+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(variables, key)
      ? String(variables[key])
      : `{${key}}`,
  );
}

function dateFromIso(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function formatDayLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  }).format(dateFromIso(date));
}

function formatMonthLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  }).format(dateFromIso(date));
}

function formatWeekdayLabel(
  date: string,
  locale: string,
  width: "narrow" | "short",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: width,
  }).format(dateFromIso(date));
}

function patternCadence(
  pattern: BreathingPattern,
  content: StatsContent,
): string {
  const part = (
    messageId: "cadence.in" | "cadence.hold" | "cadence.out",
    seconds: number,
  ) => formatMessage(content[messageId], { seconds });
  const parts: string[] = [part("cadence.in", pattern.inhale)];
  if (pattern.inhale2) parts.push(part("cadence.in", pattern.inhale2));
  if (pattern.holdIn) parts.push(part("cadence.hold", pattern.holdIn));
  parts.push(part("cadence.out", pattern.exhale));
  if (pattern.holdOut) parts.push(part("cadence.hold", pattern.holdOut));
  return parts.join(" · ");
}

function patternBenefit(description: string): string {
  return description.replace(/\s*[（(].*[)）]\s*$/, "").trim();
}

interface StatsDisplayProps {
  activeDays: string[];
  content: StatsContent;
  currentMode: string | null;
  currentStreak: number;
  lastSessionDate: string | null;
  renderContext: StatsRenderContext;
  sessionsCompleted: number;
  totalMinutes: number;
}

export function StatsDisplay({
  activeDays,
  content,
  currentMode,
  currentStreak,
  lastSessionDate,
  renderContext,
  sessionsCompleted,
  totalMinutes,
}: StatsDisplayProps) {
  const [today, setToday] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  useEffect(() => {
    setToday(new Date().toLocaleDateString("sv-SE"));
  }, []);

  const [hover, setHover] = useState<{ active: boolean; label: string } | null>(
    null,
  );

  const liveStreak = computeLiveStreak(currentStreak, lastSessionDate, today);
  const longestRun = useMemo(() => computeLongestRun(activeDays), [activeDays]);
  const weeks = useMemo(
    () => buildGardenWeeks(activeDays, today, GARDEN_WEEKS),
    [activeDays, today],
  );
  const week = useMemo(() => last7Days(activeDays, today), [activeDays, today]);
  const weekActiveCount = week.filter((day) => day.active).length;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel =
    hours > 0
      ? `${hours}${content["stats.hoursUnit"]}${mins > 0 ? ` ${mins}${content["stats.minutesUnit"]}` : ""}`
      : `${totalMinutes}${content["stats.minutesUnit"]}`;

  const streakActive = liveStreak > 0;
  const streakBig = streakActive ? String(liveStreak) : content["stats.today"];
  const streakUnit = streakActive
    ? content[liveStreak === 1 ? "stats.daySingular" : "stats.dayPlural"]
    : "";
  const streakLabel =
    content[streakActive ? "stats.dayStreak" : "stats.freshStart"];
  const longestUnit =
    content[longestRun === 1 ? "stats.daySingular" : "stats.dayPlural"];
  const streakSub = streakActive
    ? formatMessage(content["stats.longest"], {
        count: longestRun,
        unit: longestUnit,
      })
    : content["stats.freshStartSub"];

  const pattern: BreathingPattern | null =
    currentMode &&
    Object.prototype.hasOwnProperty.call(BREATHING_PATTERNS, currentMode)
      ? BREATHING_PATTERNS[currentMode as ModeName]
      : null;
  const patternMessages = pattern ? PATTERN_MESSAGE_IDS[pattern.name] : null;

  const readout = hover
    ? `${hover.label} · ${
        content[hover.active ? "garden.practiced" : "garden.rest"]
      }`
    : content["garden.hoverPrompt"];

  const weekdayDates = ["2024-01-08", "2024-01-10", "2024-01-12"];

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.orbA} aria-hidden />
      <div className={styles.orbB} aria-hidden />

      <div className={styles.inner}>
        <header className={styles.header}>
          <Link
            href={renderContext.appHref}
            aria-label={content["header.backAria"]}
            className={styles.orbWrap}
          >
            <span className={styles.orbGlow} aria-hidden />
            <span className={styles.orb} aria-hidden />
          </Link>
          <div className={styles.headText}>
            <div className={styles.eyebrow}>{content["header.eyebrow"]}</div>
            <h1 className={styles.h1}>{content["header.title"]}</h1>
          </div>
          <Link href={renderContext.appHref} className={styles.cta}>
            {content["header.beginSession"]}
            <span className={styles.ctaArrow} aria-hidden>
              &rarr;
            </span>
          </Link>
        </header>

        <section className={styles.tiles}>
          <div className={`${styles.card} ${styles.tile}`}>
            <div className={styles.tileHead}>
              <Timer size={20} />
              <span className={styles.tileLabel}>
                {content["stats.totalActiveTime"]}
              </span>
            </div>
            <div className={styles.tileValue}>{timeLabel}</div>
          </div>

          <div className={`${styles.card} ${styles.tile}`}>
            <div className={styles.tileHead}>
              <Activity size={20} />
              <span className={styles.tileLabel}>
                {content["stats.sessions"]}
              </span>
            </div>
            <div className={styles.tileValue}>{sessionsCompleted}</div>
            <div className={styles.tileSub}>
              {
                content[
                  sessionsCompleted > 0
                    ? "stats.sessionsActiveSub"
                    : "stats.sessionsEmptySub"
                ]
              }
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
              {streakUnit && (
                <div className={styles.streakUnit}>{streakUnit}</div>
              )}
            </div>
            <div className={styles.tileSub}>{streakSub}</div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.garden}`}>
          <div className={styles.gardenHead}>
            <div>
              <div className={styles.eyebrow}>{content["garden.subtitle"]}</div>
              <h2 className={styles.gardenTitle}>{content["garden.title"]}</h2>
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
                {weeks.map((gardenWeek, index) => (
                  <div key={`m-${index}`} className={styles.monthLabel}>
                    {gardenWeek.monthLabel
                      ? formatMonthLabel(
                          gardenWeek.days[0].date,
                          renderContext.locale,
                        )
                      : ""}
                  </div>
                ))}
              </div>
              <div className={styles.weeksRow}>
                <div className={styles.weekdayCol}>
                  <div className={styles.weekdaySpacer} />
                  <div className={styles.weekdayLabel}>
                    {formatWeekdayLabel(
                      weekdayDates[0],
                      renderContext.locale,
                      "short",
                    )}
                  </div>
                  <div className={styles.weekdaySpacer} />
                  <div className={styles.weekdayLabel}>
                    {formatWeekdayLabel(
                      weekdayDates[1],
                      renderContext.locale,
                      "short",
                    )}
                  </div>
                  <div className={styles.weekdaySpacer} />
                  <div className={styles.weekdayLabel}>
                    {formatWeekdayLabel(
                      weekdayDates[2],
                      renderContext.locale,
                      "short",
                    )}
                  </div>
                  <div className={styles.weekdaySpacer} />
                </div>
                {weeks.map((gardenWeek, weekIndex) => (
                  <div key={`w-${weekIndex}`} className={styles.week}>
                    {gardenWeek.days.map((day) => {
                      const dayLabel = formatDayLabel(
                        day.date,
                        renderContext.locale,
                      );
                      const className = [
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
                          className={className}
                          title={day.future ? undefined : dayLabel}
                          onMouseEnter={
                            day.future
                              ? undefined
                              : () =>
                                  setHover({
                                    active: day.active,
                                    label: dayLabel,
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
            <span>{content["garden.restLegend"]}</span>
            <span
              className={styles.legendSwatch}
              style={{ background: "var(--yp-rest)" }}
            />
            <span className={`${styles.legendSwatch} ${styles.dayActive}`} />
            <span>{content["garden.practicedLegend"]}</span>
          </div>
        </section>

        <section className={styles.bottom}>
          {pattern && patternMessages && (
            <div className={`${styles.card} ${styles.panel}`}>
              <div className={styles.panelEyebrow}>
                {content["pattern.favorite"]}
              </div>
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
                  <div className={styles.favName}>
                    {content[patternMessages.name]}
                  </div>
                  <div className={styles.favCadence}>
                    {patternCadence(pattern, content)}
                  </div>
                </div>
              </div>
              <div className={styles.favFoot}>
                <span className={styles.favCount}>
                  {patternBenefit(content[patternMessages.description])}
                </span>
                <Link href={renderContext.appHref} className={styles.favCta}>
                  {content["pattern.practiceAgain"]} &rarr;
                </Link>
              </div>
            </div>
          )}

          <div className={`${styles.card} ${styles.panel}`}>
            <div className={styles.weekHead}>
              <div className={styles.panelEyebrow} style={{ marginBottom: 0 }}>
                {content["week.lastSevenDays"]}
              </div>
              <div className={styles.weekSub}>
                {formatMessage(content["week.summary"], {
                  count: weekActiveCount,
                })}
              </div>
            </div>
            <div className={styles.strip}>
              {week.map((day) => (
                <div
                  key={day.date}
                  className={styles.stripDay}
                  title={formatDayLabel(day.date, renderContext.locale)}
                >
                  <div
                    className={[
                      styles.stripPill,
                      day.active ? styles.stripPillActive : "",
                      day.isToday ? styles.stripPillToday : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <span
                    className={`${styles.stripLabel} ${day.isToday ? styles.stripLabelToday : ""}`}
                  >
                    {formatWeekdayLabel(
                      day.date,
                      renderContext.locale,
                      "narrow",
                    )}
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
  content: StatsContent;
  renderContext: StatsRenderContext;
  totalMinutes?: number;
}

export function StatsSignedOut({
  content,
  renderContext,
  totalMinutes,
}: StatsSignedOutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="glow-card rounded-[32px] border border-border bg-card p-8 text-center">
        <Flame className="mx-auto mb-4 text-primary" size={32} />
        <h1 className="mb-2 text-xl font-semibold text-card-foreground">
          {content["signedOut.title"]}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {content["signedOut.body"]}
        </p>
        <button
          onClick={() => setSheetOpen(true)}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {content["signedOut.button"]}
        </button>
      </div>

      <SignInSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        headline={content["signedOut.sheetHeadline"]}
        subtitle={content["signedOut.sheetSubtitle"]}
        totalMinutes={totalMinutes}
        locale={renderContext.authLocale}
      />
    </div>
  );
}
