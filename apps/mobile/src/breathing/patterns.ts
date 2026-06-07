// Breathing pattern catalog. Pure data, no React Native imports.
// Ported from the `expo-attempt-1` tag (packages/engine/src/patterns.ts).

import { BreathingPattern, ModeName, ProtocolPattern } from "./types";

export const BREATHING_PATTERNS: Record<ModeName, BreathingPattern> = {
  [ModeName.Box]: {
    name: ModeName.Box,
    description: "Focus & Stress Reduction (4-4-4-4)",
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    color: "#e11d48",
  },
  [ModeName.Relax]: {
    name: ModeName.Relax,
    description: "Sleep & Deep Relaxation (4-7-8)",
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    color: "#4f46e5",
  },
  [ModeName.Coherent]: {
    name: ModeName.Coherent,
    description: "Heart Rate Variability (5.5-5.5)",
    inhale: 5.5,
    holdIn: 0,
    exhale: 5.5,
    holdOut: 0,
    color: "#059669",
  },
  [ModeName.Sigh]: {
    name: ModeName.Sigh,
    description: "Panic Reset (Double Inhale)",
    inhale: 2.5,
    inhale2: 1.5,
    holdIn: 0,
    exhale: 6,
    holdOut: 1,
    color: "#0ea5e9",
  },
  [ModeName.WimHof]: {
    name: ModeName.WimHof,
    description: "Energy & Resilience (30 breaths × 3 rounds)",
    inhale: 1.5,
    holdIn: 0,
    exhale: 1.5,
    holdOut: 0,
    color: "#f97316",
  },
  [ModeName.PursedLip]: {
    name: ModeName.PursedLip,
    description: "Respiratory Health (2-4 exhale ratio)",
    inhale: 2,
    holdIn: 0,
    exhale: 4,
    holdOut: 0,
    color: "#10b981",
  },
  [ModeName.NadiShodhana]: {
    name: ModeName.NadiShodhana,
    description: "Balance & Focus (alternate nostril)",
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 0,
    color: "#8b5cf6",
  },
  [ModeName.Ujjayi]: {
    name: ModeName.Ujjayi,
    description: "Ocean Breath for Yoga & Focus (4-0-6-0)",
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    color: "#0891b2",
  },
  [ModeName.Belly]: {
    name: ModeName.Belly,
    description: "Diaphragmatic Breathing Foundation (4-0-6-0)",
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    color: "#f59e0b",
  },
  [ModeName.Buteyko]: {
    name: ModeName.Buteyko,
    description: "Light Nasal Breathing (3-0-3-3)",
    inhale: 3,
    holdIn: 0,
    exhale: 3,
    holdOut: 3,
    color: "#38bdf8",
  },
  [ModeName.Tummo]: {
    name: ModeName.Tummo,
    description: "Tibetan Inner Heat Breathing (2-0-1-0)",
    inhale: 2,
    holdIn: 0,
    exhale: 1,
    holdOut: 0,
    color: "#dc2626",
  },
  [ModeName.BreathOfFire]: {
    name: ModeName.BreathOfFire,
    description: "Rapid Rhythmic Breathing (0.75-0-0.75-0)",
    inhale: 0.75,
    holdIn: 0,
    exhale: 0.75,
    holdOut: 0,
    color: "#ea580c",
  },
};

export const WIM_HOF_PROTOCOL: ProtocolPattern = {
  name: "Wim Hof",
  rounds: 3,
  powerBreathCount: 30,
  powerBreathTiming: { inhale: 1.5, exhale: 1.5 },
  retentionHoldMin: 3,
  retentionHoldMax: 180,
  recoveryTiming: { inhale: 2, hold: 15 },
  roundRestDuration: 5,
  color: "#f97316",
};

export const DEFAULT_SPEED_MULTIPLIER = 1.0;
export const MIN_SPEED_MULTIPLIER = 0.5;
export const MAX_SPEED_MULTIPLIER = 2.0;

// v1 ships the three core, non-protocol modes from the original plan.
// The remaining patterns stay in the catalog for later phases.
export const V1_MODES: ModeName[] = [
  ModeName.Box,
  ModeName.Relax,
  ModeName.Coherent,
];
