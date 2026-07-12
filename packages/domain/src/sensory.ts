/**
 * Portable sensory-scene settings shared by the studio, web, and native app.
 *
 * The contract deliberately contains only JSON values. Runtime handles such as
 * audio players, colors, and animation objects belong in platform adapters.
 */
export const SENSORY_SCHEMA_VERSION = 1 as const;

export const SENSORY_MODE_IDS = [
  "box",
  "relax",
  "coherent",
  "sigh",
  "ujjayi",
  "belly",
  "pursed-lip",
] as const;

export type SensoryModeId = (typeof SENSORY_MODE_IDS)[number];

export const SENSORY_MODE_LABELS: Record<SensoryModeId, string> = {
  box: "Box Breathing",
  relax: "4-7-8 Relax",
  coherent: "Coherent Breathing",
  sigh: "Physiological Sigh",
  ujjayi: "Ujjayi Breathing",
  belly: "Belly Breathing",
  "pursed-lip": "Pursed Lip Breathing",
};

export const SENSORY_PHASE_IDS = [
  "inhale",
  "inhale2",
  "holdIn",
  "exhale",
  "holdOut",
] as const;

export type SensoryPhaseId = (typeof SENSORY_PHASE_IDS)[number];

export const SENSORY_SOUNDSCAPES = [
  "silence",
  "air",
  "rain",
  "ocean",
  "deep-ocean",
  "warm-drone",
  "soft-noise",
] as const;

export type SensorySoundscape = (typeof SENSORY_SOUNDSCAPES)[number];

export const SENSORY_MOTION_CURVES = [
  "linear",
  "sine",
  "ease-in",
  "ease-out",
  "ease-in-out",
] as const;

export type SensoryMotionCurve = (typeof SENSORY_MOTION_CURVES)[number];

export const SENSORY_AUDIO_CUES = [
  "none",
  "soft-rise",
  "top-up",
  "crisp-tick",
  "soft-bell",
  "long-release",
  "ocean-turn",
  "warm-pulse",
] as const;

export type SensoryAudioCue = (typeof SENSORY_AUDIO_CUES)[number];

export const SENSORY_HAPTIC_PATTERNS = [
  "none",
  "soft",
  "crisp",
  "release",
  "top-up",
] as const;

export type SensoryHapticPattern = (typeof SENSORY_HAPTIC_PATTERNS)[number];

export interface SensoryPalette {
  /** Six-digit RGB hex values. */
  background: string;
  backgroundAccent: string;
  orb: string;
  orbAccent: string;
  particle: string;
  text: string;
}

export interface SensoryMotionSettings {
  /** Resting orb scale. Range: 0.2...1. */
  orbMinScale: number;
  /** Fully expanded orb scale. Range: 0.5...2, never below orbMinScale. */
  orbMaxScale: number;
  /** Strength of organic shape deformation. Range: 0...1. */
  morphAmount: number;
  /** Relative particle count. Range: 0...1. */
  particleDensity: number;
  /** Ambient particle drift speed. Range: 0...2. */
  particleDrift: number;
  /** Vertical scene focus in viewport units. Range: -0.5...0.5. */
  gravityOffsetY: number;
  /** Smoothing applied at phase boundaries. Range: 0...1. */
  cycleSmoothing: number;
}

export interface SensoryDynamicsSettings {
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
}

export interface SensoryAudioEngineSettings {
  droneEnabled: boolean;
  pinkNoiseEnabled: boolean;
  subBassEnabled: boolean;
  binauralEnabled: boolean;
  phaseEnvelopeEnabled: boolean;
  sessionArcEnabled: boolean;
  binauralBeatHz: number;
  compressor: SensoryDynamicsSettings;
  limiter: SensoryDynamicsSettings;
  masterTrim: number;
  droneScale: number;
  subBassScale: number;
  subBassFreqMultiplier: number;
  pinkNoiseScale: number;
  pinkNoiseFilter: { baseHz: number; peakHz: number; q: number };
  binauralScale: number;
  phaseEnvelopeScale: number;
  phaseEnvelopeFreqMultiplier: number;
  cueToneScale: number;
  cueNoiseScale: number;
  cueReverbMix: number;
  arcWindowSeconds: number;
  arcRootDriftFactor: number;
  arcLfoSlowdownFactor: number;
  arcOrbitSlowdownFactor: number;
}

export interface SensoryAudioSettings {
  soundscape: SensorySoundscape;
  /** Ambient-bed volume. Range: 0...1. */
  ambientVolume: number;
  /** Master multiplier for phase cues. Range: 0...1. */
  cueVolume: number;
  /** How strongly the ambient bed follows breath volume. Range: 0...1. */
  breathModulation: number;
  /** Full production AudioService graph, including layer gates and live tuning. */
  engine: SensoryAudioEngineSettings;
}

export interface SensoryGuidanceSettings {
  showLabels: boolean;
  audioCues: boolean;
  haptics: boolean;
  /** Number of completed cycles before instructional labels fade. Range: 0...20. */
  instructionFadeCycles: number;
}

export interface SensoryPhaseVisual {
  /** Position inside the global orb envelope. 0 = resting, 1 = fully expanded. */
  orbScale: number;
  lightIntensity: number;
  edgeGlow: number;
  /** -1 pulls particles inward, +1 sends them outward. */
  particleFlow: number;
  particleVelocity: number;
  shapeTension: number;
  hueShiftDegrees: number;
  curve: SensoryMotionCurve;
}

export interface SensoryPhaseAudio {
  cue: SensoryAudioCue;
  volume: number;
  pitchSemitones: number;
}

export interface SensoryPhaseHaptic {
  pattern: SensoryHapticPattern;
  intensity: number;
  sharpness: number;
  durationMs: number;
}

export interface SensoryPhaseProfile {
  visual: SensoryPhaseVisual;
  audio: SensoryPhaseAudio;
  haptic: SensoryPhaseHaptic;
}

export interface SensoryProfileV1 {
  schemaVersion: typeof SENSORY_SCHEMA_VERSION;
  modeId: SensoryModeId;
  palette: SensoryPalette;
  motion: SensoryMotionSettings;
  audio: SensoryAudioSettings;
  guidance: SensoryGuidanceSettings;
  phases: Record<SensoryPhaseId, SensoryPhaseProfile>;
}

export type SensoryProfile = SensoryProfileV1;

/** Shared slider metadata so editors and import validation cannot drift. */
export const SENSORY_CONTROL_RANGES = {
  motion: {
    orbMinScale: { min: 0.2, max: 1, step: 0.01 },
    orbMaxScale: { min: 0.5, max: 2, step: 0.01 },
    morphAmount: { min: 0, max: 1, step: 0.01 },
    particleDensity: { min: 0, max: 1, step: 0.01 },
    particleDrift: { min: 0, max: 2, step: 0.01 },
    gravityOffsetY: { min: -0.5, max: 0.5, step: 0.01 },
    cycleSmoothing: { min: 0, max: 1, step: 0.01 },
  },
  audio: {
    ambientVolume: { min: 0, max: 1, step: 0.01 },
    cueVolume: { min: 0, max: 1, step: 0.01 },
    breathModulation: { min: 0, max: 1, step: 0.01 },
    engine: {
      binauralBeatHz: { min: 0.5, max: 30, step: 0.5 },
      masterTrim: { min: 0, max: 1, step: 0.01 },
      scale: { min: 0, max: 2, step: 0.01 },
      frequencyMultiplier: { min: 0.5, max: 2, step: 0.05 },
      pinkNoiseFilter: {
        baseHz: { min: 100, max: 1_200, step: 10 },
        peakHz: { min: 500, max: 6_000, step: 50 },
        q: { min: 0.1, max: 4, step: 0.05 },
      },
      compressor: {
        threshold: { min: -60, max: 0, step: 0.5 },
        knee: { min: 0, max: 40, step: 1 },
        ratio: { min: 1, max: 20, step: 0.5 },
        attack: { min: 0.001, max: 1, step: 0.001 },
        release: { min: 0.01, max: 2, step: 0.01 },
      },
      limiter: {
        threshold: { min: -30, max: 0, step: 0.5 },
        knee: { min: 0, max: 40, step: 1 },
        ratio: { min: 1, max: 20, step: 1 },
        attack: { min: 0.0001, max: 0.05, step: 0.0001 },
        release: { min: 0.01, max: 0.5, step: 0.005 },
      },
      arcWindowSeconds: { min: 30, max: 600, step: 10 },
      arcRootDriftFactor: { min: 0.5, max: 1, step: 0.005 },
      arcSlowdown: { min: 0, max: 1, step: 0.01 },
    },
  },
  guidance: {
    instructionFadeCycles: { min: 0, max: 20, step: 1 },
  },
  phase: {
    visual: {
      orbScale: { min: 0, max: 1, step: 0.01 },
      lightIntensity: { min: 0, max: 1, step: 0.01 },
      edgeGlow: { min: 0, max: 1, step: 0.01 },
      particleFlow: { min: -1, max: 1, step: 0.01 },
      particleVelocity: { min: 0, max: 2, step: 0.01 },
      shapeTension: { min: 0, max: 1, step: 0.01 },
      hueShiftDegrees: { min: -180, max: 180, step: 1 },
    },
    audio: {
      volume: { min: 0, max: 1, step: 0.01 },
      pitchSemitones: { min: -6, max: 6, step: 0.1 },
    },
    haptic: {
      intensity: { min: 0, max: 1, step: 0.01 },
      sharpness: { min: 0, max: 1, step: 0.01 },
      durationMs: { min: 0, max: 1_000, step: 1 },
    },
  },
} as const;

type PhaseOverrides = {
  visual?: Partial<SensoryPhaseVisual>;
  audio?: Partial<SensoryPhaseAudio>;
  haptic?: Partial<SensoryPhaseHaptic>;
};

const BASE_PALETTE: SensoryPalette = {
  background: "#07110f",
  backgroundAccent: "#0f2a24",
  orb: "#0d9488",
  orbAccent: "#5eead4",
  particle: "#5eead4",
  text: "#f0fdfa",
};

const BASE_MOTION: SensoryMotionSettings = {
  orbMinScale: 0.45,
  orbMaxScale: 1,
  morphAmount: 0.4,
  particleDensity: 0.35,
  particleDrift: 0.45,
  gravityOffsetY: -0.1,
  cycleSmoothing: 0.75,
};

const BASE_AUDIO_ENGINE: SensoryAudioEngineSettings = {
  droneEnabled: true,
  pinkNoiseEnabled: false,
  subBassEnabled: true,
  binauralEnabled: true,
  phaseEnvelopeEnabled: false,
  sessionArcEnabled: true,
  binauralBeatHz: 10,
  compressor: { threshold: -14, knee: 24, ratio: 3, attack: 0.02, release: 0.3 },
  limiter: { threshold: -3, knee: 0, ratio: 20, attack: 0.001, release: 0.05 },
  masterTrim: 0.71,
  droneScale: 1,
  subBassScale: 1,
  subBassFreqMultiplier: 1,
  pinkNoiseScale: 1,
  pinkNoiseFilter: { baseHz: 480, peakHz: 2_400, q: 0.7 },
  binauralScale: 1,
  phaseEnvelopeScale: 1,
  phaseEnvelopeFreqMultiplier: 1,
  cueToneScale: 1,
  cueNoiseScale: 1,
  cueReverbMix: 1,
  arcWindowSeconds: 240,
  arcRootDriftFactor: 8 / 9,
  arcLfoSlowdownFactor: 0.5,
  arcOrbitSlowdownFactor: 0.4,
};

const BASE_AUDIO: SensoryAudioSettings = {
  soundscape: "warm-drone",
  ambientVolume: 0.3,
  cueVolume: 0.32,
  breathModulation: 1,
  engine: BASE_AUDIO_ENGINE,
};

const BASE_GUIDANCE: SensoryGuidanceSettings = {
  showLabels: true,
  audioCues: true,
  haptics: true,
  instructionFadeCycles: 4,
};

const BASE_PHASE_VISUAL: SensoryPhaseVisual = {
  orbScale: 0,
  lightIntensity: 0.35,
  edgeGlow: 0.25,
  particleFlow: 0,
  particleVelocity: 0.5,
  shapeTension: 0.35,
  hueShiftDegrees: 0,
  curve: "ease-in-out",
};

const BASE_PHASE_AUDIO: SensoryPhaseAudio = {
  cue: "none",
  volume: 1,
  pitchSemitones: 0,
};

const BASE_PHASE_HAPTIC: SensoryPhaseHaptic = {
  pattern: "none",
  intensity: 0,
  sharpness: 0,
  durationMs: 0,
};

const makePhase = (overrides: PhaseOverrides = {}): SensoryPhaseProfile => ({
  visual: { ...BASE_PHASE_VISUAL, ...overrides.visual },
  audio: { ...BASE_PHASE_AUDIO, ...overrides.audio },
  haptic: { ...BASE_PHASE_HAPTIC, ...overrides.haptic },
});

const mergePhaseOverrides = (
  base: PhaseOverrides,
  overrides: PhaseOverrides | undefined,
): PhaseOverrides => ({
  visual: { ...base.visual, ...overrides?.visual },
  audio: { ...base.audio, ...overrides?.audio },
  haptic: { ...base.haptic, ...overrides?.haptic },
});

const makePhases = (
  overrides: Partial<Record<SensoryPhaseId, PhaseOverrides>>,
): Record<SensoryPhaseId, SensoryPhaseProfile> => ({
  inhale: makePhase(
    mergePhaseOverrides(
      {
        visual: { orbScale: 1, lightIntensity: 0.75, edgeGlow: 0.65, particleFlow: -0.65 },
        audio: { cue: "soft-rise" },
        haptic: { pattern: "soft", intensity: 0.28, sharpness: 0.22, durationMs: 24 },
      },
      overrides.inhale,
    ),
  ),
  inhale2: makePhase(overrides.inhale2),
  holdIn: makePhase(
    mergePhaseOverrides(
      { visual: { orbScale: 1, lightIntensity: 0.6, edgeGlow: 0.4, particleVelocity: 0.1 } },
      overrides.holdIn,
    ),
  ),
  exhale: makePhase(
    mergePhaseOverrides(
      {
        visual: { orbScale: 0, lightIntensity: 0.25, edgeGlow: 0.15, particleFlow: 0.55 },
        audio: { cue: "long-release", pitchSemitones: 0 },
        haptic: { pattern: "release", intensity: 0.2, sharpness: 0.12, durationMs: 34 },
      },
      overrides.exhale,
    ),
  ),
  holdOut: makePhase(
    mergePhaseOverrides(
      { visual: { orbScale: 0, lightIntensity: 0.18, edgeGlow: 0.08, particleVelocity: 0.1 } },
      overrides.holdOut,
    ),
  ),
});

interface ProfileOverrides {
  palette: Partial<SensoryPalette>;
  motion?: Partial<SensoryMotionSettings>;
  audio?: Partial<Omit<SensoryAudioSettings, "engine">> & {
    engine?: Partial<
      Omit<SensoryAudioEngineSettings, "compressor" | "limiter" | "pinkNoiseFilter">
    > & {
      compressor?: Partial<SensoryDynamicsSettings>;
      limiter?: Partial<SensoryDynamicsSettings>;
      pinkNoiseFilter?: Partial<SensoryAudioEngineSettings["pinkNoiseFilter"]>;
    };
  };
  guidance?: Partial<SensoryGuidanceSettings>;
  phases?: Partial<Record<SensoryPhaseId, PhaseOverrides>>;
}

const makeProfile = (modeId: SensoryModeId, overrides: ProfileOverrides): SensoryProfileV1 => ({
  schemaVersion: SENSORY_SCHEMA_VERSION,
  modeId,
  palette: { ...BASE_PALETTE, ...overrides.palette },
  motion: { ...BASE_MOTION, ...overrides.motion },
  audio: {
    ...BASE_AUDIO,
    ...overrides.audio,
    engine: {
      ...BASE_AUDIO_ENGINE,
      ...overrides.audio?.engine,
      compressor: {
        ...BASE_AUDIO_ENGINE.compressor,
        ...overrides.audio?.engine?.compressor,
      },
      limiter: {
        ...BASE_AUDIO_ENGINE.limiter,
        ...overrides.audio?.engine?.limiter,
      },
      pinkNoiseFilter: {
        ...BASE_AUDIO_ENGINE.pinkNoiseFilter,
        ...overrides.audio?.engine?.pinkNoiseFilter,
      },
    },
  },
  guidance: { ...BASE_GUIDANCE, ...overrides.guidance },
  phases: makePhases(overrides.phases ?? {}),
});

export const DEFAULT_SENSORY_PROFILES: Record<SensoryModeId, SensoryProfileV1> = {
  box: makeProfile("box", {
    palette: {
      background: "#14070b",
      backgroundAccent: "#3b0b18",
      orb: "#e11d48",
      orbAccent: "#fb7185",
      particle: "#fda4af",
      text: "#fff1f2",
    },
    motion: {
      morphAmount: 0.16,
      particleDensity: 0.32,
      particleDrift: 0.28,
      cycleSmoothing: 0.22,
    },
    audio: {
      soundscape: "warm-drone",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
    },
    phases: {
      inhale: {
        visual: { curve: "linear", shapeTension: 0.82 },
        audio: { cue: "soft-rise", pitchSemitones: 0 },
        haptic: { pattern: "crisp", intensity: 0.32, sharpness: 0.78, durationMs: 16 },
      },
      holdIn: {
        visual: { curve: "linear", shapeTension: 0.9 },
        audio: { cue: "crisp-tick", pitchSemitones: 0 },
        haptic: { pattern: "crisp", intensity: 0.32, sharpness: 0.78, durationMs: 16 },
      },
      exhale: {
        visual: { curve: "linear", shapeTension: 0.82 },
        audio: { cue: "long-release", pitchSemitones: 0 },
        haptic: { pattern: "crisp", intensity: 0.3, sharpness: 0.72, durationMs: 16 },
      },
      holdOut: {
        visual: { curve: "linear", shapeTension: 0.9 },
        audio: { cue: "crisp-tick", pitchSemitones: 0 },
        haptic: { pattern: "crisp", intensity: 0.3, sharpness: 0.72, durationMs: 16 },
      },
    },
  }),
  relax: makeProfile("relax", {
    palette: {
      background: "#070716",
      backgroundAccent: "#1e1b4b",
      orb: "#4f46e5",
      orbAccent: "#818cf8",
      particle: "#a5b4fc",
      text: "#eef2ff",
    },
    motion: {
      orbMinScale: 0.4,
      orbMaxScale: 1.04,
      morphAmount: 0.52,
      particleDensity: 0.22,
      particleDrift: 0.18,
      gravityOffsetY: -0.12,
      cycleSmoothing: 0.94,
    },
    audio: {
      soundscape: "rain",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
      engine: { droneEnabled: false, pinkNoiseEnabled: true, binauralBeatHz: 2 },
    },
    guidance: { instructionFadeCycles: 2 },
    phases: {
      inhale: {
        visual: { curve: "ease-in-out", lightIntensity: 0.62, particleVelocity: 0.3 },
        haptic: { pattern: "soft", intensity: 0.2, sharpness: 0.12, durationMs: 30 },
      },
      holdIn: {
        visual: { curve: "sine", lightIntensity: 0.28, edgeGlow: 0.16, particleFlow: 0 },
        audio: { cue: "crisp-tick", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "none", intensity: 0, sharpness: 0, durationMs: 0 },
      },
      exhale: {
        visual: { curve: "ease-out", lightIntensity: 0.12, particleVelocity: 0.18 },
        audio: { cue: "long-release", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "release", intensity: 0.16, sharpness: 0.08, durationMs: 42 },
      },
    },
  }),
  coherent: makeProfile("coherent", {
    palette: {
      background: "#031410",
      backgroundAccent: "#064e3b",
      orb: "#059669",
      orbAccent: "#34d399",
      particle: "#6ee7b7",
      text: "#ecfdf5",
    },
    motion: {
      orbMinScale: 0.46,
      orbMaxScale: 1.02,
      morphAmount: 0.22,
      particleDensity: 0.3,
      particleDrift: 0.52,
      cycleSmoothing: 1,
    },
    audio: {
      soundscape: "ocean",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
      engine: { droneEnabled: false, pinkNoiseEnabled: true },
    },
    guidance: { instructionFadeCycles: 3 },
    phases: {
      inhale: {
        visual: { curve: "sine", particleFlow: -0.32, shapeTension: 0.18 },
        audio: { cue: "soft-rise", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "soft", intensity: 0.16, sharpness: 0.1, durationMs: 36 },
      },
      exhale: {
        visual: { curve: "sine", particleFlow: 0.32, shapeTension: 0.18 },
        audio: { cue: "long-release", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "release", intensity: 0.14, sharpness: 0.08, durationMs: 38 },
      },
    },
  }),
  sigh: makeProfile("sigh", {
    palette: {
      background: "#03151d",
      backgroundAccent: "#075985",
      orb: "#0ea5e9",
      orbAccent: "#7dd3fc",
      particle: "#bae6fd",
      text: "#f0f9ff",
    },
    motion: {
      orbMinScale: 0.38,
      orbMaxScale: 1.1,
      morphAmount: 0.62,
      particleDensity: 0.5,
      particleDrift: 0.7,
      cycleSmoothing: 0.62,
    },
    audio: {
      soundscape: "warm-drone",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
    },
    guidance: { instructionFadeCycles: 3 },
    phases: {
      inhale: {
        visual: { orbScale: 0.72, curve: "ease-out", particleFlow: -0.72, particleVelocity: 0.86 },
        audio: { cue: "soft-rise", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "soft", intensity: 0.26, sharpness: 0.28, durationMs: 24 },
      },
      inhale2: {
        visual: {
          orbScale: 1,
          lightIntensity: 1,
          edgeGlow: 0.94,
          particleFlow: -1,
          particleVelocity: 1.45,
          shapeTension: 0.72,
          hueShiftDegrees: 8,
          curve: "ease-out",
        },
        audio: { cue: "soft-rise", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "top-up", intensity: 0.38, sharpness: 0.7, durationMs: 18 },
      },
      exhale: {
        visual: { orbScale: 0, curve: "ease-out", particleFlow: 1, particleVelocity: 1.2 },
        audio: { cue: "long-release", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "release", intensity: 0.2, sharpness: 0.08, durationMs: 48 },
      },
      holdOut: {
        visual: { orbScale: 0, lightIntensity: 0.1, edgeGlow: 0.04, particleVelocity: 0.05 },
        audio: { cue: "crisp-tick", volume: 1, pitchSemitones: 0 },
      },
    },
  }),
  ujjayi: makeProfile("ujjayi", {
    palette: {
      background: "#021318",
      backgroundAccent: "#164e63",
      orb: "#0891b2",
      orbAccent: "#67e8f9",
      particle: "#a5f3fc",
      text: "#ecfeff",
    },
    motion: {
      morphAmount: 0.34,
      particleDensity: 0.42,
      particleDrift: 0.62,
      cycleSmoothing: 0.92,
    },
    audio: {
      soundscape: "warm-drone",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
    },
    guidance: { instructionFadeCycles: 3 },
    phases: {
      inhale: {
        visual: { curve: "sine", particleFlow: -0.48, particleVelocity: 0.72 },
        audio: { cue: "soft-rise", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "soft", intensity: 0.14, sharpness: 0.08, durationMs: 38 },
      },
      exhale: {
        visual: { curve: "sine", particleFlow: 0.58, particleVelocity: 0.8 },
        audio: { cue: "long-release", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "release", intensity: 0.13, sharpness: 0.06, durationMs: 42 },
      },
    },
  }),
  belly: makeProfile("belly", {
    palette: {
      background: "#1a0e02",
      backgroundAccent: "#78350f",
      orb: "#f59e0b",
      orbAccent: "#fcd34d",
      particle: "#fde68a",
      text: "#fffbeb",
    },
    motion: {
      orbMinScale: 0.48,
      morphAmount: 0.58,
      particleDensity: 0.28,
      particleDrift: 0.24,
      gravityOffsetY: 0.08,
      cycleSmoothing: 0.9,
    },
    audio: {
      soundscape: "warm-drone",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
    },
    guidance: { instructionFadeCycles: 4 },
    phases: {
      inhale: {
        visual: { curve: "ease-in-out", hueShiftDegrees: 6, particleVelocity: 0.32 },
        audio: { cue: "soft-rise", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "soft", intensity: 0.2, sharpness: 0.08, durationMs: 40 },
      },
      exhale: {
        visual: { curve: "ease-out", hueShiftDegrees: -5, particleVelocity: 0.28 },
        audio: { cue: "long-release", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "release", intensity: 0.16, sharpness: 0.05, durationMs: 46 },
      },
    },
  }),
  "pursed-lip": makeProfile("pursed-lip", {
    palette: {
      background: "#031610",
      backgroundAccent: "#065f46",
      orb: "#10b981",
      orbAccent: "#6ee7b7",
      particle: "#a7f3d0",
      text: "#ecfdf5",
    },
    motion: {
      orbMinScale: 0.44,
      morphAmount: 0.3,
      particleDensity: 0.2,
      particleDrift: 0.2,
      cycleSmoothing: 0.84,
    },
    audio: {
      soundscape: "warm-drone",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
    },
    guidance: { instructionFadeCycles: 4 },
    phases: {
      inhale: {
        visual: { curve: "ease-in", particleFlow: -0.3, particleVelocity: 0.35 },
        audio: { cue: "soft-rise", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "soft", intensity: 0.18, sharpness: 0.12, durationMs: 28 },
      },
      exhale: {
        visual: { curve: "ease-out", particleFlow: 0.74, particleVelocity: 0.42, shapeTension: 0.58 },
        audio: { cue: "long-release", volume: 1, pitchSemitones: 0 },
        haptic: { pattern: "release", intensity: 0.16, sharpness: 0.08, durationMs: 44 },
      },
    },
  }),
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value);

type ControlRange = { readonly min: number; readonly max: number };

const finiteNumber = (value: unknown, fallback: number, range: ControlRange): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, value))
    : fallback;

const integer = (value: unknown, fallback: number, range: ControlRange): number =>
  Math.round(finiteNumber(value, fallback, range));

const boolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const RGB_HEX = /^#[0-9a-f]{6}$/i;

const color = (value: unknown, fallback: string): string =>
  typeof value === "string" && RGB_HEX.test(value) ? value.toLowerCase() : fallback;

export const isSensoryModeId = (value: unknown): value is SensoryModeId =>
  isOneOf(value, SENSORY_MODE_IDS);

export const cloneSensoryProfile = (profile: SensoryProfileV1): SensoryProfileV1 => ({
  schemaVersion: SENSORY_SCHEMA_VERSION,
  modeId: profile.modeId,
  palette: { ...profile.palette },
  motion: { ...profile.motion },
  audio: {
    ...profile.audio,
    engine: {
      ...profile.audio.engine,
      compressor: { ...profile.audio.engine.compressor },
      limiter: { ...profile.audio.engine.limiter },
      pinkNoiseFilter: { ...profile.audio.engine.pinkNoiseFilter },
    },
  },
  guidance: { ...profile.guidance },
  phases: {
    inhale: {
      visual: { ...profile.phases.inhale.visual },
      audio: { ...profile.phases.inhale.audio },
      haptic: { ...profile.phases.inhale.haptic },
    },
    inhale2: {
      visual: { ...profile.phases.inhale2.visual },
      audio: { ...profile.phases.inhale2.audio },
      haptic: { ...profile.phases.inhale2.haptic },
    },
    holdIn: {
      visual: { ...profile.phases.holdIn.visual },
      audio: { ...profile.phases.holdIn.audio },
      haptic: { ...profile.phases.holdIn.haptic },
    },
    exhale: {
      visual: { ...profile.phases.exhale.visual },
      audio: { ...profile.phases.exhale.audio },
      haptic: { ...profile.phases.exhale.haptic },
    },
    holdOut: {
      visual: { ...profile.phases.holdOut.visual },
      audio: { ...profile.phases.holdOut.audio },
      haptic: { ...profile.phases.holdOut.haptic },
    },
  },
});

export const getDefaultSensoryProfile = (modeId: SensoryModeId): SensoryProfileV1 =>
  cloneSensoryProfile(DEFAULT_SENSORY_PROFILES[modeId]);

const normalizePalette = (value: unknown, fallback: SensoryPalette): SensoryPalette => {
  const input = asRecord(value);
  return {
    background: color(input?.background, fallback.background),
    backgroundAccent: color(input?.backgroundAccent, fallback.backgroundAccent),
    orb: color(input?.orb, fallback.orb),
    orbAccent: color(input?.orbAccent, fallback.orbAccent),
    particle: color(input?.particle, fallback.particle),
    text: color(input?.text, fallback.text),
  };
};

const normalizeMotion = (value: unknown, fallback: SensoryMotionSettings): SensoryMotionSettings => {
  const input = asRecord(value);
  const ranges = SENSORY_CONTROL_RANGES.motion;
  const orbMinScale = finiteNumber(input?.orbMinScale, fallback.orbMinScale, ranges.orbMinScale);
  const importedMaxScale = finiteNumber(input?.orbMaxScale, fallback.orbMaxScale, ranges.orbMaxScale);

  return {
    orbMinScale,
    orbMaxScale: Math.max(orbMinScale, importedMaxScale),
    morphAmount: finiteNumber(input?.morphAmount, fallback.morphAmount, ranges.morphAmount),
    particleDensity: finiteNumber(
      input?.particleDensity,
      fallback.particleDensity,
      ranges.particleDensity,
    ),
    particleDrift: finiteNumber(input?.particleDrift, fallback.particleDrift, ranges.particleDrift),
    gravityOffsetY: finiteNumber(
      input?.gravityOffsetY,
      fallback.gravityOffsetY,
      ranges.gravityOffsetY,
    ),
    cycleSmoothing: finiteNumber(
      input?.cycleSmoothing,
      fallback.cycleSmoothing,
      ranges.cycleSmoothing,
    ),
  };
};

const normalizeDynamics = (
  value: unknown,
  fallback: SensoryDynamicsSettings,
  ranges: Record<keyof SensoryDynamicsSettings, ControlRange>,
): SensoryDynamicsSettings => {
  const input = asRecord(value);
  return {
    threshold: finiteNumber(input?.threshold, fallback.threshold, ranges.threshold),
    knee: finiteNumber(input?.knee, fallback.knee, ranges.knee),
    ratio: finiteNumber(input?.ratio, fallback.ratio, ranges.ratio),
    attack: finiteNumber(input?.attack, fallback.attack, ranges.attack),
    release: finiteNumber(input?.release, fallback.release, ranges.release),
  };
};

const normalizeAudioEngine = (
  value: unknown,
  fallback: SensoryAudioEngineSettings,
): SensoryAudioEngineSettings => {
  const input = asRecord(value);
  const filter = asRecord(input?.pinkNoiseFilter);
  const ranges = SENSORY_CONTROL_RANGES.audio.engine;
  const baseHz = finiteNumber(
    filter?.baseHz,
    fallback.pinkNoiseFilter.baseHz,
    ranges.pinkNoiseFilter.baseHz,
  );
  const importedPeakHz = finiteNumber(
    filter?.peakHz,
    fallback.pinkNoiseFilter.peakHz,
    ranges.pinkNoiseFilter.peakHz,
  );

  return {
    droneEnabled: boolean(input?.droneEnabled, fallback.droneEnabled),
    pinkNoiseEnabled: boolean(input?.pinkNoiseEnabled, fallback.pinkNoiseEnabled),
    subBassEnabled: boolean(input?.subBassEnabled, fallback.subBassEnabled),
    binauralEnabled: boolean(input?.binauralEnabled, fallback.binauralEnabled),
    phaseEnvelopeEnabled: boolean(
      input?.phaseEnvelopeEnabled,
      fallback.phaseEnvelopeEnabled,
    ),
    sessionArcEnabled: boolean(input?.sessionArcEnabled, fallback.sessionArcEnabled),
    binauralBeatHz: finiteNumber(
      input?.binauralBeatHz,
      fallback.binauralBeatHz,
      ranges.binauralBeatHz,
    ),
    compressor: normalizeDynamics(
      input?.compressor,
      fallback.compressor,
      ranges.compressor,
    ),
    limiter: normalizeDynamics(input?.limiter, fallback.limiter, ranges.limiter),
    masterTrim: finiteNumber(input?.masterTrim, fallback.masterTrim, ranges.masterTrim),
    droneScale: finiteNumber(input?.droneScale, fallback.droneScale, ranges.scale),
    subBassScale: finiteNumber(input?.subBassScale, fallback.subBassScale, ranges.scale),
    subBassFreqMultiplier: finiteNumber(
      input?.subBassFreqMultiplier,
      fallback.subBassFreqMultiplier,
      ranges.frequencyMultiplier,
    ),
    pinkNoiseScale: finiteNumber(
      input?.pinkNoiseScale,
      fallback.pinkNoiseScale,
      ranges.scale,
    ),
    pinkNoiseFilter: {
      baseHz,
      peakHz: Math.max(baseHz, importedPeakHz),
      q: finiteNumber(filter?.q, fallback.pinkNoiseFilter.q, ranges.pinkNoiseFilter.q),
    },
    binauralScale: finiteNumber(input?.binauralScale, fallback.binauralScale, ranges.scale),
    phaseEnvelopeScale: finiteNumber(
      input?.phaseEnvelopeScale,
      fallback.phaseEnvelopeScale,
      ranges.scale,
    ),
    phaseEnvelopeFreqMultiplier: finiteNumber(
      input?.phaseEnvelopeFreqMultiplier,
      fallback.phaseEnvelopeFreqMultiplier,
      ranges.frequencyMultiplier,
    ),
    cueToneScale: finiteNumber(input?.cueToneScale, fallback.cueToneScale, ranges.scale),
    cueNoiseScale: finiteNumber(input?.cueNoiseScale, fallback.cueNoiseScale, ranges.scale),
    cueReverbMix: finiteNumber(input?.cueReverbMix, fallback.cueReverbMix, ranges.scale),
    arcWindowSeconds: finiteNumber(
      input?.arcWindowSeconds,
      fallback.arcWindowSeconds,
      ranges.arcWindowSeconds,
    ),
    arcRootDriftFactor: finiteNumber(
      input?.arcRootDriftFactor,
      fallback.arcRootDriftFactor,
      ranges.arcRootDriftFactor,
    ),
    arcLfoSlowdownFactor: finiteNumber(
      input?.arcLfoSlowdownFactor,
      fallback.arcLfoSlowdownFactor,
      ranges.arcSlowdown,
    ),
    arcOrbitSlowdownFactor: finiteNumber(
      input?.arcOrbitSlowdownFactor,
      fallback.arcOrbitSlowdownFactor,
      ranges.arcSlowdown,
    ),
  };
};

const normalizeAudio = (value: unknown, fallback: SensoryAudioSettings): SensoryAudioSettings => {
  const input = asRecord(value);
  const ranges = SENSORY_CONTROL_RANGES.audio;
  return {
    soundscape: isOneOf(input?.soundscape, SENSORY_SOUNDSCAPES)
      ? input.soundscape
      : fallback.soundscape,
    ambientVolume: finiteNumber(input?.ambientVolume, fallback.ambientVolume, ranges.ambientVolume),
    cueVolume: finiteNumber(input?.cueVolume, fallback.cueVolume, ranges.cueVolume),
    breathModulation: finiteNumber(
      input?.breathModulation,
      fallback.breathModulation,
      ranges.breathModulation,
    ),
    engine: normalizeAudioEngine(input?.engine, fallback.engine),
  };
};

const normalizeGuidance = (
  value: unknown,
  fallback: SensoryGuidanceSettings,
): SensoryGuidanceSettings => {
  const input = asRecord(value);
  return {
    showLabels: boolean(input?.showLabels, fallback.showLabels),
    audioCues: boolean(input?.audioCues, fallback.audioCues),
    haptics: boolean(input?.haptics, fallback.haptics),
    instructionFadeCycles: integer(
      input?.instructionFadeCycles,
      fallback.instructionFadeCycles,
      SENSORY_CONTROL_RANGES.guidance.instructionFadeCycles,
    ),
  };
};

const normalizePhase = (value: unknown, fallback: SensoryPhaseProfile): SensoryPhaseProfile => {
  const input = asRecord(value);
  const visual = asRecord(input?.visual);
  const audio = asRecord(input?.audio);
  const haptic = asRecord(input?.haptic);
  const ranges = SENSORY_CONTROL_RANGES.phase;

  return {
    visual: {
      orbScale: finiteNumber(visual?.orbScale, fallback.visual.orbScale, ranges.visual.orbScale),
      lightIntensity: finiteNumber(
        visual?.lightIntensity,
        fallback.visual.lightIntensity,
        ranges.visual.lightIntensity,
      ),
      edgeGlow: finiteNumber(visual?.edgeGlow, fallback.visual.edgeGlow, ranges.visual.edgeGlow),
      particleFlow: finiteNumber(
        visual?.particleFlow,
        fallback.visual.particleFlow,
        ranges.visual.particleFlow,
      ),
      particleVelocity: finiteNumber(
        visual?.particleVelocity,
        fallback.visual.particleVelocity,
        ranges.visual.particleVelocity,
      ),
      shapeTension: finiteNumber(
        visual?.shapeTension,
        fallback.visual.shapeTension,
        ranges.visual.shapeTension,
      ),
      hueShiftDegrees: finiteNumber(
        visual?.hueShiftDegrees,
        fallback.visual.hueShiftDegrees,
        ranges.visual.hueShiftDegrees,
      ),
      curve: isOneOf(visual?.curve, SENSORY_MOTION_CURVES)
        ? visual.curve
        : fallback.visual.curve,
    },
    audio: {
      cue: isOneOf(audio?.cue, SENSORY_AUDIO_CUES) ? audio.cue : fallback.audio.cue,
      volume: finiteNumber(audio?.volume, fallback.audio.volume, ranges.audio.volume),
      pitchSemitones: finiteNumber(
        audio?.pitchSemitones,
        fallback.audio.pitchSemitones,
        ranges.audio.pitchSemitones,
      ),
    },
    haptic: {
      pattern: isOneOf(haptic?.pattern, SENSORY_HAPTIC_PATTERNS)
        ? haptic.pattern
        : fallback.haptic.pattern,
      intensity: finiteNumber(haptic?.intensity, fallback.haptic.intensity, ranges.haptic.intensity),
      sharpness: finiteNumber(haptic?.sharpness, fallback.haptic.sharpness, ranges.haptic.sharpness),
      durationMs: integer(haptic?.durationMs, fallback.haptic.durationMs, ranges.haptic.durationMs),
    },
  };
};

/**
 * Converts an imported object into the exact v1 contract.
 *
 * Missing or invalid fields fall back to that mode's authored default. Numeric
 * fields are clamped to their documented range, unknown keys are discarded,
 * and unsupported schema versions or mode ids are rejected with `null`.
 */
export const normalizeSensoryProfile = (value: unknown): SensoryProfileV1 | null => {
  const input = asRecord(value);
  if (
    input?.schemaVersion !== SENSORY_SCHEMA_VERSION ||
    !isSensoryModeId(input.modeId)
  ) {
    return null;
  }

  const fallback = DEFAULT_SENSORY_PROFILES[input.modeId];
  const phases = asRecord(input.phases);

  return {
    schemaVersion: SENSORY_SCHEMA_VERSION,
    modeId: input.modeId,
    palette: normalizePalette(input.palette, fallback.palette),
    motion: normalizeMotion(input.motion, fallback.motion),
    audio: normalizeAudio(input.audio, fallback.audio),
    guidance: normalizeGuidance(input.guidance, fallback.guidance),
    phases: {
      inhale: normalizePhase(phases?.inhale, fallback.phases.inhale),
      inhale2: normalizePhase(phases?.inhale2, fallback.phases.inhale2),
      holdIn: normalizePhase(phases?.holdIn, fallback.phases.holdIn),
      exhale: normalizePhase(phases?.exhale, fallback.phases.exhale),
      holdOut: normalizePhase(phases?.holdOut, fallback.phases.holdOut),
    },
  };
};
