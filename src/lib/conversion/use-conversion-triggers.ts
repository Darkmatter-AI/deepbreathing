"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getConversionVariant,
  type ConversionVariant,
} from "./variant";

function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", name, params);
  }
}

const STORAGE_KEY = "resonance_conversion";

interface ConversionState {
  sessionsOver60s: number;
  settingsChanges: number;
  dismissed: {
    session: boolean;
    settings: boolean;
  };
  convertedAt: string | null;
}

const DEFAULT_STATE: ConversionState = {
  sessionsOver60s: 0,
  settingsChanges: 0,
  dismissed: { session: false, settings: false },
  convertedAt: null,
};

function loadState(): ConversionState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: ConversionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useConversionTriggers(isAuthenticated: boolean) {
  const [state, setState] = useState<ConversionState>(DEFAULT_STATE);
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [showSettingsNudge, setShowSettingsNudge] = useState(false);
  const [variant, setVariant] = useState<ConversionVariant>("control");

  // Load on mount, and assign/restore the A/B bucket (persisted in localStorage).
  useEffect(() => {
    setState(loadState());
    setVariant(getConversionVariant());
  }, []);

  // Hide everything if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setShowSessionPrompt(false);
      setShowSettingsNudge(false);
    }
  }, [isAuthenticated]);

  const onSessionComplete = useCallback(
    (sessionSeconds: number) => {
      if (isAuthenticated) return;
      if (sessionSeconds < 60) return;

      setState((prev) => {
        const next = {
          ...prev,
          sessionsOver60s: prev.sessionsOver60s + 1,
        };
        saveState(next);

        // Show on first qualifying session, or every 3rd session if previously dismissed
        const shouldShow = prev.convertedAt === null && !prev.dismissed.session
          ? next.sessionsOver60s >= 1
          : !prev.dismissed.session && next.sessionsOver60s % 3 === 0;

        if (shouldShow) {
          trackEvent("conversion_prompt_shown", { trigger: "session_complete", session_seconds: sessionSeconds, session_count: next.sessionsOver60s, variant: getConversionVariant() });
          setTimeout(() => setShowSessionPrompt(true), 1500);
        }

        return next;
      });
    },
    [isAuthenticated]
  );

  const onSettingsChange = useCallback(() => {
    if (isAuthenticated) return;

    setState((prev) => {
      const next = {
        ...prev,
        settingsChanges: prev.settingsChanges + 1,
      };
      saveState(next);

      if (
        next.settingsChanges >= 1 &&
        !prev.dismissed.settings &&
        prev.convertedAt === null &&
        !showSessionPrompt // don't show both at once
      ) {
        trackEvent("conversion_prompt_shown", { trigger: "settings_change", change_count: next.settingsChanges, variant: getConversionVariant() });
        setShowSettingsNudge(true);
      }

      return next;
    });
  }, [isAuthenticated, showSessionPrompt]);

  const dismissSession = useCallback(() => {
    trackEvent("conversion_prompt_dismissed", { trigger: "session_complete", variant: getConversionVariant() });
    setShowSessionPrompt(false);
    setState((prev) => {
      const next = { ...prev, dismissed: { ...prev.dismissed, session: true } };
      saveState(next);
      return next;
    });
  }, []);

  const dismissSettings = useCallback(() => {
    trackEvent("conversion_prompt_dismissed", { trigger: "settings_change", variant: getConversionVariant() });
    setShowSettingsNudge(false);
    setState((prev) => {
      const next = { ...prev, dismissed: { ...prev.dismissed, settings: true } };
      saveState(next);
      return next;
    });
  }, []);

  const markConverted = useCallback(() => {
    trackEvent("conversion_signup_completed", { variant: getConversionVariant() });
    setShowSessionPrompt(false);
    setShowSettingsNudge(false);
    setState((prev) => {
      const next = { ...prev, convertedAt: new Date().toISOString() };
      saveState(next);
      return next;
    });
  }, []);

  return {
    variant,
    showSessionPrompt,
    showSettingsNudge,
    onSessionComplete,
    onSettingsChange,
    dismissSession,
    dismissSettings,
    markConverted,
    setShowSessionPrompt,
  };
}
