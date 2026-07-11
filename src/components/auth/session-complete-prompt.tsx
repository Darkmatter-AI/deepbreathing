"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SignInSheet } from "./sign-in-sheet";
import { SocialStatsSignInSheet } from "./social-stats-sign-in-sheet";
import { LossAversionSignInSheet } from "./loss-aversion-sign-in-sheet";
import { KeepPracticeSheet } from "./keep-practice-sheet";
import { NonBlockingSignInBanner, type BannerLayout } from "./non-blocking-sign-in-banner";
import { type ConversionVariant, setConversionVariant } from "@/lib/conversion/variant";
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
  sessionsCompleted: number;
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
  sessionsCompleted,
  dayStreak = 0,
  variant,
  activeMode,
}: SessionCompletePromptProps) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    setLocale(detectRuntimeLocale());
  }, [open]);

  const phrases = useMemo(() => createRuntimePhraseResolver(locale), [locale]);

  // ── Non-blocking banner ───────────────────────────────────────────────────
  // The banner renders when the visitor is in the `loss_aversion_banner` bucket
  // (the ship path — flip ACTIVE_CHALLENGER to enable for real traffic) OR when
  // `?promptui=card|pill` forces it for preview. `?promptdemo=1` opens it on
  // mount so you can see it without breathing a full 60s session first.
  //
  // When the banner is active we persist the `loss_aversion_banner` bucket, so
  // the existing funnel events (conversion_prompt_shown / _signup_completed /
  // signup_user_identified) and the conversion_variant GA4 user property all
  // tag this cohort — segmenting "saw + registered via the banner" from the
  // modal, with no new tracking code. No param → unchanged Prompt C.
  const [bannerUi, setBannerUi] = useState<BannerLayout | null>(
    variant === "loss_aversion_banner" ? "card" : null
  );
  const [forceKeep, setForceKeep] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const ui = p.get("promptui");
    const keep = ui === "keep";
    const active = ui === "card" || ui === "pill";
    if (keep) {
      setForceKeep(true);
      setConversionVariant("keep_practice");
    }
    if (active) setBannerUi(ui as BannerLayout);
    if (!keep && (active || variant === "loss_aversion_banner")) {
      setConversionVariant("loss_aversion_banner");
    }
    if (p.get("promptdemo") === "1") {
      const t = setTimeout(() => setDemoOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [variant]);
  // ──────────────────────────────────────────────────────────────────────────

  // Closing the sheet counts as a dismissal (fires conversion_prompt_dismissed).
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onDismiss();
      setDemoOpen(false);
    }
    onOpenChange(isOpen);
  };

  if (forceKeep || variant === "keep_practice") {
    const pattern = BREATHING_PATTERNS[activeMode];
    return (
      <KeepPracticeSheet
        open={open || demoOpen}
        onOpenChange={handleOpenChange}
        onSuccess={onSuccess}
        sessionMode={pattern.name}
        accentColor={pattern.color}
        sessionSeconds={sessionSeconds}
        totalMinutes={totalMinutes}
        sessionsCompleted={sessionsCompleted}
        dayStreak={dayStreak}
      />
    );
  }

  if (bannerUi) {
    const pattern = BREATHING_PATTERNS[activeMode];
    return (
      <NonBlockingSignInBanner
        open={open || demoOpen}
        onOpenChange={handleOpenChange}
        onSuccess={onSuccess}
        sessionMode={pattern.name}
        accentColor={pattern.color}
        sessionSeconds={sessionSeconds || 90}
        layout={bannerUi}
      />
    );
  }

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
