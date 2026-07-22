"use client";

import React from "react";
import { X } from "lucide-react";

interface ConversionNudgeProps {
  onSignIn: () => void;
  onDismiss: () => void;
  dismissLabel?: string;
  signInLabel?: string;
  title?: string;
}

export function ConversionNudge({
  onSignIn,
  onDismiss,
  dismissLabel = "Dismiss",
  signInLabel = "Sign in to save",
  title = "Save settings across devices",
}: ConversionNudgeProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 dark:border-primary/15 dark:bg-primary/10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-card-foreground">
            {title}
          </p>
          <button
            onClick={onSignIn}
            className="mt-1 text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-2 transition hover:decoration-primary"
          >
            {signInLabel}
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-card hover:text-card-foreground"
          aria-label={dismissLabel}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
