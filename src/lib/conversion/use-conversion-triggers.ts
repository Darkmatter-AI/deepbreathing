"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

  // Authoritative copy of the accounting state. We read from this (not the
  // setState updater arg) so every callback can compute the next state and fire
  // its side effects exactly once. React re-invokes setState updaters (Strict
  // Mode double-invokes in dev; concurrent rendering can re-run them in prod),
  // and any trackEvent / setTimeout living inside an updater fires once per
  // invocation — that double-counted conversion_prompt_shown. Keeping the
  // updaters pure and routing writes through commit() fixes that.
  const stateRef = useRef<ConversionState>(DEFAULT_STATE);
  useEffect(() => {
    // Backstop for writers that bypass commit() — e.g. the mount-load setState below.
    stateRef.current = state;
  }, [state]);

  const commit = useCallback((next: ConversionState) => {
    stateRef.current = next; // synchronous — survives same-tick multi-writer batching
    saveState(next); // persistence for every writer (out of the updater)
    setState(next); // pure value, not an updater fn
  }, []);

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

      const prev = stateRef.current;
      const next = {
        ...prev,
        sessionsOver60s: prev.sessionsOver60s + 1,
      };

      // Show on every qualifying (>=60s) session until the visitor dismisses or
      // converts. Once dismissed, this never re-shows (both branches below require
      // !dismissed.session). The `% 3` branch only applies to a converted-but-not-
      // dismissed visitor, which is rare since converting normally signs them in and
      // the isAuthenticated guard above already returned early.
      const shouldShow = prev.convertedAt === null && !prev.dismissed.session
        ? next.sessionsOver60s >= 1
        : !prev.dismissed.session && next.sessionsOver60s % 3 === 0;

      if (shouldShow) {
        trackEvent("conversion_prompt_shown", { trigger: "session_complete", session_seconds: sessionSeconds, session_count: next.sessionsOver60s, variant: getConversionVariant() });
        setTimeout(() => setShowSessionPrompt(true), 1500);
      }

      commit(next);
    },
    [isAuthenticated, commit]
  );

  const onSettingsChange = useCallback(() => {
    if (isAuthenticated) return;

    const prev = stateRef.current;
    const next = {
      ...prev,
      settingsChanges: prev.settingsChanges + 1,
    };

    if (
      next.settingsChanges >= 1 &&
      !prev.dismissed.settings &&
      prev.convertedAt === null &&
      !showSessionPrompt // don't show both at once
    ) {
      trackEvent("conversion_prompt_shown", { trigger: "settings_change", change_count: next.settingsChanges, variant: getConversionVariant() });
      setShowSettingsNudge(true);
    }

    commit(next);
  }, [isAuthenticated, showSessionPrompt, commit]);

  const dismissSession = useCallback(() => {
    trackEvent("conversion_prompt_dismissed", { trigger: "session_complete", variant: getConversionVariant() });
    setShowSessionPrompt(false);
    const prev = stateRef.current;
    commit({ ...prev, dismissed: { ...prev.dismissed, session: true } });
  }, [commit]);

  const dismissSettings = useCallback(() => {
    trackEvent("conversion_prompt_dismissed", { trigger: "settings_change", variant: getConversionVariant() });
    setShowSettingsNudge(false);
    const prev = stateRef.current;
    commit({ ...prev, dismissed: { ...prev.dismissed, settings: true } });
  }, [commit]);

  const markConverted = useCallback(() => {
    trackEvent("conversion_signup_completed", { variant: getConversionVariant() });
    setShowSessionPrompt(false);
    setShowSettingsNudge(false);
    commit({ ...stateRef.current, convertedAt: new Date().toISOString() });
  }, [commit]);

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
