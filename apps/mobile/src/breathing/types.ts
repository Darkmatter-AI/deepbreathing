// Pure breathing-engine types. No React Native imports — safe to unit-test in Node.
// Ported from the `expo-attempt-1` tag (packages/engine/src/types.ts), which in turn
// mirrors the live web app at src/components/resonance/types.ts.

export enum BreathingPhase {
  Inhale = "Inhale",
  Inhale2 = "Inhale (Top up)",
  HoldIn = "Hold In",
  Exhale = "Exhale",
  HoldOut = "Hold Out",
  Idle = "Ready",
}

export enum ModeName {
  Box = "Box Breathing",
  Relax = "4-7-8 Relax",
  Coherent = "Coherent Breathing",
  Sigh = "Physiological Sigh",
  WimHof = "Wim Hof Breathing",
  PursedLip = "Pursed Lip Breathing",
  NadiShodhana = "Nadi Shodhana",
  Ujjayi = "Ujjayi Breathing",
  Belly = "Belly Breathing",
  Buteyko = "Buteyko Breathing",
  Tummo = "Tummo Breathing",
  BreathOfFire = "Breath of Fire",
}

export interface BreathingPattern {
  name: ModeName;
  description: string;
  inhale: number;
  inhale2?: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  color: string;
}

export enum ProtocolPhase {
  Idle = "Get Ready",
  PowerBreathe = "Power Breathe",
  RetentionHold = "Hold",
  RecoveryInhale = "Recovery Inhale",
  RecoveryHold = "Recovery Hold",
  RoundComplete = "Round Complete",
  ProtocolComplete = "Complete",
}

export interface ProtocolPattern {
  name: string;
  rounds: number;
  powerBreathCount: number;
  powerBreathTiming: { inhale: number; exhale: number };
  retentionHoldMin: number;
  retentionHoldMax: number;
  recoveryTiming: { inhale: number; hold: number };
  roundRestDuration: number;
  color: string;
}

export interface ProtocolState {
  currentRound: number;
  currentBreathIndex: number;
  phase: ProtocolPhase;
  retentionTime: number;
  isUserControlledHold: boolean;
}

export interface PhaseUpdateInput {
  phase: BreathingPhase;
  elapsedMs: number;
  pattern: BreathingPattern;
  speedMultiplier: number;
}

export interface PhaseUpdateResult {
  phase: BreathingPhase;
  phaseDurationMs: number;
  phaseComplete: boolean;
}

export interface PhaseVisualState {
  phase: BreathingPhase;
  progress: number;
  scale: number;
}
