"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SignInSheet } from "./sign-in-sheet";
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
}

export function SessionCompletePrompt({
  open,
  onOpenChange,
  onDismiss,
  onSuccess,
  totalMinutes,
  sessionSeconds,
}: SessionCompletePromptProps) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    setLocale(detectRuntimeLocale());
  }, [open]);

  const phrases = useMemo(() => createRuntimePhraseResolver(locale), [locale]);
  const sessionMinutes = Math.floor(sessionSeconds / 60);
  const headline =
    sessionMinutes >= 5
      ? phrases.resolve("auth.minutes_of_calm", { n: sessionMinutes }).text
      : phrases.resolve("auth.nice_session").text;

  return (
    <SignInSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onDismiss();
        onOpenChange(isOpen);
      }}
      onSuccess={onSuccess}
      headline={headline}
      subtitle={phrases.resolve("auth.save_and_sync").text}
      totalMinutes={totalMinutes}
    />
  );
}
