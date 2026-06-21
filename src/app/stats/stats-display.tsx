"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Timer, Activity, Wind } from "lucide-react";
import {
  computeLiveStreak,
  buildMonthGrid,
} from "@/lib/stats/streak-calendar";
import { SignInSheet } from "@/components/auth/sign-in-sheet";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface StatsDisplayProps {
  totalMinutes: number;
  sessionsCompleted: number;
  currentStreak: number;
  lastSessionDate: string | null;
  currentMode: string | null;
  activeDays: string[];
  userName: string;
  userImage: string | null;
}

export function StatsDisplay({
  totalMinutes,
  sessionsCompleted,
  currentStreak,
  lastSessionDate,
  currentMode,
  activeDays,
  userName,
  userImage,
}: StatsDisplayProps) {
  // Start with UTC for hydration consistency, update to local time after mount.
  // sv-SE locale produces YYYY-MM-DD which matches the DB date format.
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => {
    setToday(new Date().toLocaleDateString("sv-SE"));
  }, []);

  const liveStreak = computeLiveStreak(currentStreak, lastSessionDate, today);

  const [yearStr, monthStr] = today.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-12
  const weeks = buildMonthGrid(year, month, activeDays, today);
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel =
    hours > 0
      ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim()
      : `${totalMinutes}m`;

  const firstName = userName.split(" ")[0];
  const initials = (firstName[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header with clickable avatar */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          aria-label="Back to breathing"
          className="block shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-primary/40 focus-visible:ring-primary/60"
        >
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={firstName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
              {initials}
            </div>
          )}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Your practice</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Welcome back, {firstName}
          </p>
        </div>
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

      {/* Full-month practice calendar */}
      <div className="glow-card mb-6 rounded-[24px] border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium text-card-foreground">{monthLabel}</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={`wd-${i}`}
              className="pb-1 text-center text-[10px] font-medium uppercase text-muted-foreground/60"
            >
              {label}
            </div>
          ))}
          {weeks.flat().map((cell, i) =>
            cell === null ? (
              <div key={`pad-${i}`} className="aspect-square" />
            ) : (
              <div
                key={cell.date}
                title={cell.date}
                className={[
                  "flex aspect-square items-center justify-center rounded-lg text-[11px] tabular-nums",
                  cell.active
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground/70",
                  cell.isToday && !cell.active
                    ? "ring-1 ring-inset ring-primary/50"
                    : "",
                ].join(" ")}
              >
                {Number(cell.date.slice(8))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Favorite pattern */}
      {currentMode && (
        <div className="glow-card rounded-[24px] border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <Wind className="text-primary" size={18} />
            <div>
              <p className="text-xs text-muted-foreground">Favorite pattern</p>
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
