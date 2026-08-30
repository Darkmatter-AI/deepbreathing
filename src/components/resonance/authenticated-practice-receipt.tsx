"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";

import { PRODUCTION_HOSTNAMES } from "@/lib/analytics/google-analytics";

export type StatsEntrySource = "session_receipt" | "account_menu";
export type StatsEntryEventName = "stats_entry_shown" | "stats_entry_click";

export interface StatsEntryContext {
  mode: string;
  sessionSeconds: number;
}

export interface AuthenticatedPracticeReceiptLabels {
  sessionComplete: string;
  yourPractice: string;
  close: string;
}

export interface AuthenticatedPracticeReceiptProps {
  open: boolean;
  labels: AuthenticatedPracticeReceiptLabels;
  summary: string;
  statsHref: string;
  onDismiss: () => void;
  sessionMode: string;
  sessionSeconds: number;
}

type StatsEntryEventParams = {
  source: StatsEntrySource;
  mode: string;
  session_seconds: number;
};

type StatsEntryGtag = (
  command: "event",
  eventName: StatsEntryEventName,
  params: StatsEntryEventParams,
) => void;

function isStatsEntryGtag(value: unknown): value is StatsEntryGtag {
  return typeof value === "function";
}

function getStatsEntryGtag(): StatsEntryGtag | undefined {
  if (typeof window === "undefined") return undefined;
  if (!PRODUCTION_HOSTNAMES.has(window.location.hostname)) return undefined;

  const candidate = (window as unknown as { gtag?: unknown }).gtag;
  return isStatsEntryGtag(candidate) ? candidate : undefined;
}

function normalizeSessionSeconds(seconds: number): number {
  return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
}

function trackStatsEntryEvent(
  eventName: StatsEntryEventName,
  source: StatsEntrySource,
  { mode, sessionSeconds }: StatsEntryContext,
): void {
  const gtag = getStatsEntryGtag();
  if (!gtag) return;

  gtag("event", eventName, {
    source: source,
    mode: mode,
    session_seconds: normalizeSessionSeconds(sessionSeconds),
  });
}

/** Track a stats link click from either an in-session receipt or account menu. */
export function trackStatsEntryClick({
  source,
  mode,
  sessionSeconds,
}: StatsEntryContext & { source: StatsEntrySource }): void {
  trackStatsEntryEvent("stats_entry_click", source, { mode, sessionSeconds });
}

/** Parent-facing helper for the authenticated account-menu stats link. */
export function trackAccountMenuStatsEntryClick(
  context: StatsEntryContext,
): void {
  trackStatsEntryClick({
    source: "account_menu",
    mode: context.mode,
    sessionSeconds: context.sessionSeconds,
  });
}

function formatSessionDuration(seconds: number): string {
  const normalizedSeconds = normalizeSessionSeconds(seconds);
  const minutes = Math.floor(normalizedSeconds / 60);
  const remainder = normalizedSeconds % 60;
  return minutes > 0
    ? `${minutes}:${String(remainder).padStart(2, "0")}`
    : `${remainder}s`;
}

function resolveSummary(
  template: string,
  { mode, duration, seconds }: { mode: string; duration: string; seconds: number },
): string {
  const values: Record<string, string> = {
    mode,
    duration,
    seconds: String(seconds),
    session_seconds: String(seconds),
  };

  return template.replace(
    /\{(mode|duration|seconds|session_seconds)\}/g,
    (match: string, key: string) => values[key] ?? match,
  );
}

export function AuthenticatedPracticeReceipt({
  open,
  labels,
  summary,
  statsHref,
  onDismiss,
  sessionMode,
  sessionSeconds,
}: AuthenticatedPracticeReceiptProps) {
  const titleId = useId();
  const hasReportedOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hasReportedOpenRef.current = false;
      return;
    }
    if (hasReportedOpenRef.current) return;

    hasReportedOpenRef.current = true;
    trackStatsEntryEvent("stats_entry_shown", "session_receipt", {
      mode: sessionMode,
      sessionSeconds,
    });
  }, [open, sessionMode, sessionSeconds]);

  if (!open) return null;

  const normalizedSeconds = normalizeSessionSeconds(sessionSeconds);
  const duration = formatSessionDuration(normalizedSeconds);
  const renderedSummary = resolveSummary(summary, {
    mode: sessionMode,
    duration,
    seconds: normalizedSeconds,
  });
  const summaryIncludesPracticeValues = /\{(mode|duration|seconds|session_seconds)\}/.test(summary);

  const handleStatsClick = () => {
    trackStatsEntryClick({
      source: "session_receipt",
      mode: sessionMode,
      sessionSeconds: normalizedSeconds,
    });
  };

  return (
    <aside
      aria-labelledby={titleId}
      aria-live="polite"
      className="pointer-events-none mt-5 flex w-full justify-center px-4"
      data-testid="authenticated-practice-receipt"
      role="status"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-border/70 bg-card p-5 text-card-foreground shadow-xl sm:p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              {labels.sessionComplete}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {renderedSummary}
            </p>
            {!summaryIncludesPracticeValues && (
              <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground/80">
                <span>{sessionMode}</span>
                <span aria-hidden="true"> · </span>
                <span>{duration}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={labels.close}
            className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/70 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            onClick={onDismiss}
          >
            <X size={17} aria-hidden="true" />
            <span className="sr-only">{labels.close}</span>
          </button>
        </div>

        <Link
          href={statsHref}
          onClick={handleStatsClick}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-between rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-sm font-semibold text-card-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <span>{labels.yourPractice}</span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
