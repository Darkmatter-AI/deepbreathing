import { BreathingPattern, ModeName, ProtocolPattern } from './types';

export { ModeName };

export const BREATHING_PATTERNS: Record<ModeName, BreathingPattern> = {
  [ModeName.Box]: {
    name: ModeName.Box,
    description: "Focus & Stress Reduction (4-4-4-4)",
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    color: "#e11d48" // Rose
  },
  [ModeName.Relax]: {
    name: ModeName.Relax,
    description: "Sleep & Deep Relaxation (4-7-8)",
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    color: "#4f46e5" // Indigo
  },
  [ModeName.Coherent]: {
    name: ModeName.Coherent,
    description: "Heart Rate Variability (5.5-5.5)",
    inhale: 5.5,
    holdIn: 0,
    exhale: 5.5,
    holdOut: 0,
    color: "#059669" // Emerald
  },
  [ModeName.Sigh]: {
    name: ModeName.Sigh,
    description: "Stress Reset (Double Inhale)",
    inhale: 2.5,
    inhale2: 1.5,
    holdIn: 0,
    exhale: 6,
    holdOut: 1,
    color: "#0ea5e9" // Sky Blue
  },
  [ModeName.WimHof]: {
    name: ModeName.WimHof,
    description: "Energy & Resilience (30 breaths × 3 rounds)",
    inhale: 1.5,
    holdIn: 0,
    exhale: 1.5,
    holdOut: 0,
    color: "#f97316" // Orange (energy)
  },
  [ModeName.PursedLip]: {
    name: ModeName.PursedLip,
    description: "Gentle Longer Exhale (2-4 ratio)",
    inhale: 2,
    holdIn: 0,
    exhale: 4,
    holdOut: 0,
    color: "#10b981" // Emerald
  },
  [ModeName.NadiShodhana]: {
    name: ModeName.NadiShodhana,
    description: "Balance & Focus (alternate nostril)",
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 0,
    color: "#8b5cf6" // Violet
  },
  [ModeName.Ujjayi]: {
    name: ModeName.Ujjayi,
    description: "Ocean Breath for Yoga & Focus (4-0-6-0)",
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    color: "#0891b2" // Ocean blue (cyan-600)
  },
  [ModeName.Belly]: {
    name: ModeName.Belly,
    description: "Diaphragmatic Breathing Foundation (4-0-6-0)",
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    color: "#f59e0b" // Warm amber
  },
  [ModeName.Buteyko]: {
    name: ModeName.Buteyko,
    description: "Light Nasal Breathing (3-0-3-3)",
    inhale: 3,
    holdIn: 0,
    exhale: 3,
    holdOut: 3,
    color: "#38bdf8" // Sky blue
  },
  [ModeName.Tummo]: {
    name: ModeName.Tummo,
    description: "Tibetan Inner Heat Breathing (2-0-1-0)",
    inhale: 2,
    holdIn: 0,
    exhale: 1,
    holdOut: 0,
    color: "#dc2626" // Deep red
  },
  [ModeName.BreathOfFire]: {
    name: ModeName.BreathOfFire,
    description: "Rapid Rhythmic Breathing (0.75-0-0.75-0)",
    inhale: 0.75,
    holdIn: 0,
    exhale: 0.75,
    holdOut: 0,
    color: "#ea580c" // Hot orange
  }
};

// Wim Hof protocol configuration
export const WIM_HOF_PROTOCOL: ProtocolPattern = {
  name: 'Wim Hof',
  rounds: 3,
  powerBreathCount: 30,
  powerBreathTiming: { inhale: 1.5, exhale: 1.5 }, // 3s per breath cycle
  retentionHoldMin: 3, // minimum hold before "end hold" appears
  retentionHoldMax: 180, // 3 minutes max
  recoveryTiming: { inhale: 2, hold: 15 }, // deep recovery breath
  roundRestDuration: 5, // brief rest between rounds
  color: '#f97316'
};

export const MIN_SPEED_MULTIPLIER = 0.5;
export const MAX_SPEED_MULTIPLIER = 2.0;
export const DEFAULT_SPEED_MULTIPLIER = 1.0;
