import type { Platform } from "./identity";

export const BREATHING_MODES = [
  "Box Breathing",
  "4-7-8 Relax",
  "Coherent Breathing",
  "Physiological Sigh",
  "Wim Hof Breathing",
  "Pursed Lip Breathing",
  "Nadi Shodhana",
  "Ujjayi Breathing",
  "Belly Breathing",
  "Buteyko Breathing",
  "Tummo Breathing",
  "Breath of Fire",
] as const;

export type BreathingMode = (typeof BREATHING_MODES)[number];

export const SESSION_END_REASONS = [
  "completed",
  "paused",
  "mode_switched",
] as const;

export type SessionEndReason = (typeof SESSION_END_REASONS)[number];

export interface SessionEvent {
  /** Immutable ledger row id, generated on the client for retry safety. */
  id: string;
  /** Stable physical-practice id shared by pause/resume segments. */
  practiceId: string;
  userId?: string;
  guestId?: string;
  startedAt: string;
  endedAt: string;
  seconds: number;
  mode: BreathingMode;
  completed: boolean;
  endReason: SessionEndReason;
  platform: Platform;
  /** The calendar day where the user practiced, in their local timezone. */
  localDate: string;
  clientVersion?: string;
}

export interface UserStats {
  totalMinutes: number;
  sessionsCompleted: number;
  updatedAt: string;
}

export interface UserSettings {
  mode: BreathingMode;
  speedMultiplier: number;
  selectedDuration: number | null;
  muted: boolean;
  hapticsEnabled: boolean;
  keepAwakeEnabled: boolean;
  theme: "system" | "light" | "dark";
  updatedAt: string;
}
