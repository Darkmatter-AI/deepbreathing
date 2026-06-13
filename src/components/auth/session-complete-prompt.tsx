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
    // Conversion Prompt B. Social proof (live count + avatars) is simulated for
    // now. Only `yourMinutes` is real, so gate the stats block on it.
    return (
      <SocialStatsSignInSheet
        open={open}
        onOpenChange={handleOpenChange}
        onSuccess={onSuccess}
        yourMinutes={totalMinutes}
        showStats={totalMinutes > 0}
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
