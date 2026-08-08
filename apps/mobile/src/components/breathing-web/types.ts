export enum BreathingPhase {
  Inhale = 'Inhale',
  Inhale2 = 'Inhale (Top up)',
  HoldIn = 'Hold In',
  Exhale = 'Exhale',
  HoldOut = 'Hold Out',
  Idle = 'Ready'
}

export enum ModeName {
  Box = 'Box Breathing',
  Relax = '4-7-8 Relax',
  Coherent = 'Coherent Breathing',
  Sigh = 'Physiological Sigh',
  WimHof = 'Wim Hof Breathing',
  PursedLip = 'Pursed Lip Breathing',
  NadiShodhana = 'Nadi Shodhana',
  Ujjayi = 'Ujjayi Breathing',
  Belly = 'Belly Breathing',
  Buteyko = 'Buteyko Breathing',
  Tummo = 'Tummo Breathing',
  BreathOfFire = 'Breath of Fire'
}

// Protocol-based breathing (for multi-round techniques like Wim Hof)
export enum ProtocolPhase {
  Idle = 'Get Ready',
  PowerBreathe = 'Power Breathe',
  RetentionHold = 'Hold',
  RecoveryInhale = 'Recovery Inhale',
  RecoveryHold = 'Recovery Hold',
  RoundComplete = 'Round Complete',
  ProtocolComplete = 'Complete'
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
  retentionTime: number; // seconds held so far
  isUserControlledHold: boolean;
}

export interface BreathingPattern {
  name: ModeName;
  description: string;
  // Duration in seconds for each phase
  inhale: number;
  inhale2?: number; // Optional second inhale for physiological sigh
  holdIn: number;
  exhale: number;
  holdOut: number;
  color: string; // Hex code for the theme
}


export interface SessionStats {
  totalMinutes: number;
  sessionsCompleted: number;
}
