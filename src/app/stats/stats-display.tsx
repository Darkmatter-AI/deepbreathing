"use client";

import { useEffect, useState } from "react";
import { Flame, Timer, Activity, Wind } from "lucide-react";
import { computeLiveStreak, buildStreakDays } from "@/lib/stats/streak-calendar";
import { SignInSheet } from "@/components/auth/sign-in-sheet";

interface StatsDisplayProps {
  totalMinutes: number;
  sessionsCompleted: number;
  currentStreak: number;
  lastSessionDate: string | null;
  currentMode: string | null;
  userName: string;
}

export function StatsDisplay({
  totalMinutes,
  sessionsCompleted,
  currentStreak,
  lastSessionDate,
  currentMode,
  userName,
}: StatsDisplayProps) {
  // Start with UTC for hydration consistency, update to local time after mount.
  // sv-SE locale produces YYYY-MM-DD which matches the DB date format.
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => {
    setToday(new Date().toLocaleDateString("sv-SE"));
  }, []);

  const liveStreak = computeLiveStreak(currentStreak, lastSessionDate, today);
  const streakDays = buildStreakDays(currentStreak, lastSessionDate, today, 14);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel =
    hours > 0
      ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim()
      : `${totalMinutes}m`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Your practice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {userName.split(" ")[0]}
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="glow-card rounded-[24px] border border-border bg-card p-4 text-center">
          <Timer className="mx-auto mb-2 text-primary" size={20} />
          <p className="text-2xl font-semibold tabular-nums text-card-foreground">
            {timeLabel}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">total time</p>
        </div>

        <div className="glow-card rounded-[24px] border border-border bg-card p-4 text-center">
          <Activity className="mx-auto mb-2 text-primary" size={20} />
          <p className="text-2xl font-semibold tabular-nums text-card-foreground">
            {sessionsCompleted}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">sessions</p>
        </div>

        <div className="glow-card rounded-[24px] border border-border bg-card p-4 text-center">
          <Flame
            className={
              liveStreak > 0
                ? "mx-auto mb-2 text-orange-400"
                : "mx-auto mb-2 text-muted-foreground"
            }
            size={20}
          />
          <p className="text-2xl font-semibold tabular-nums text-card-foreground">
            {liveStreak}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">day streak</p>
        </div>
      </div>

      {/* 14-day calendar */}
      <div className="glow-card mb-6 rounded-[24px] border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium text-card-foreground">
          Last 14 days
        </h2>
        <div className="flex items-center gap-1.5">
          {streakDays.map(({ date, active }) => (
            <div key={date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={
                  active
                    ? "h-7 w-full rounded-md bg-primary"
                    : "h-7 w-full rounded-md bg-muted/60"
                }
                title={date}
              />
              <span className="text-[9px] text-muted-foreground/60">
                {date.slice(8)} {/* DD */}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current pattern */}
      {currentMode && (
        <div className="glow-card rounded-[24px] border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <Wind className="text-primary" size={18} />
            <div>
              <p className="text-xs text-muted-foreground">Current pattern</p>
              <p className="text-sm font-medium text-card-foreground">
                {currentMode}
              </p>
            </div>
          </div>
        </div>
      )}
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
          14-day practice calendar. Your data syncs across devices.
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
