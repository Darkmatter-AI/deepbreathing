"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SignInSheet } from "./sign-in-sheet";
import { SocialStatsSignInSheet } from "./social-stats-sign-in-sheet";
import { LossAversionSignInSheet } from "./loss-aversion-sign-in-sheet";
import type { ConversionVariant } from "@/lib/conversion/variant";
import { ModeName } from "@/components/resonance/types";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import {
  createRuntimePhraseResolver,
  detectRuntimeLocale,
} from "@/components/resonance/runtime-phrases";

interface SessionCompletePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
  onSuccess: () => void;
  totalMinutes: number;
  sessionSeconds: number;
  dayStreak?: number;
  variant: ConversionVariant;
  activeMode: ModeName;
}

export function SessionCompletePrompt({
  open,
  onOpenChange,
  onDismiss,
  onSuccess,
  totalMinutes,
  sessionSeconds,
  dayStreak = 0,
  variant,
  activeMode,
}: SessionCompletePromptProps) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    setLocale(detectRuntimeLocale());
  }, [open]);

  const phrases = useMemo(() => createRuntimePhraseResolver(locale), [locale]);

  // Closing the sheet counts as a dismissal (fires conversion_prompt_dismissed).
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onDismiss();
    onOpenChange(isOpen);
  };

  if (variant === "loss_aversion") {
    const pattern = BREATHING_PATTERNS[activeMode];
    return (
      <LossAversionSignInSheet
        open={open}
        onOpenChange={handleOpenChange}
        onSuccess={onSuccess}
        sessionMode={pattern.name}
        accentColor={pattern.color}
        sessionSeconds={sessionSeconds}
      />
    );
  }

  if (variant === "social_stats") {
    // Conversion Prompt B. Show stats block only when both minutes and streak
    // are real (> 0 / >= 1) — a "0" must never unblur.
    return (
      <SocialStatsSignInSheet
        open={open}
        onOpenChange={handleOpenChange}
        onSuccess={onSuccess}
        yourMinutes={totalMinutes}
        dayStreak={dayStreak}
        showStats={totalMinutes > 0 && dayStreak >= 1}
      />
    );
  }

  const sessionMinutes = Math.floor(sessionSeconds / 60);
  const headline =
    sessionMinutes >= 5
      ? phrases.resolve("auth.minutes_of_calm", { n: sessionMinutes }).text
      : phrases.resolve("auth.nice_session").text;

  return (
    <SignInSheet
      open={open}
      onOpenChange={handleOpenChange}
      onSuccess={onSuccess}
      headline={headline}
      subtitle={phrases.resolve("auth.save_and_sync").text}
      totalMinutes={totalMinutes}
    />
  );
}
