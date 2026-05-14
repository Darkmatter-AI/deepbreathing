import type { Platform } from "./identity";

export type BreathingMode =
  | "Box Breathing"
  | "4-7-8 Relax"
  | "Coherent Breathing"
  | "Physiological Sigh"
  | "Wim Hof Breathing"
  | "Pursed Lip Breathing"
  | "Nadi Shodhana"
  | "Ujjayi Breathing"
  | "Belly Breathing"
  | "Buteyko Breathing"
  | "Tummo Breathing"
  | "Breath of Fire";

export interface SessionEvent {
  id: string;
  userId?: string;
  guestId?: string;
  startedAt: string;
  endedAt: string;
  seconds: number;
  mode: BreathingMode;
  completed: boolean;
  platform: Platform;
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
