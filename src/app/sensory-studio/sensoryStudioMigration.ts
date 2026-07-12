import {
  SENSORY_MODE_IDS,
  SENSORY_PHASE_IDS,
  type SensoryModeId,
  type SensoryPhaseId,
} from "@resonance/domain";

const LEGACY_DEFAULT_PITCHES: Record<
  SensoryModeId,
  Partial<Record<SensoryPhaseId, number>>
> = {
  box: { inhale: 4, holdIn: 2, exhale: -2, holdOut: -4 },
  relax: { holdIn: -2, exhale: -7 },
  coherent: { inhale: 1, exhale: -1 },
  sigh: { inhale: 3, inhale2: 8, exhale: -8, holdOut: -9 },
  ujjayi: { inhale: -1, exhale: -4 },
  belly: { inhale: -2, exhale: -5 },
  "pursed-lip": { exhale: -5 },
};

const PRE_PRODUCTION_AUDIO_DEFAULTS: Record<
  SensoryModeId,
  { soundscape: string; ambientVolume: number; cueVolume: number; breathModulation: number }
> = {
  box: { soundscape: "soft-noise", ambientVolume: 0.14, cueVolume: 0.52, breathModulation: 0.12 },
  relax: { soundscape: "rain", ambientVolume: 0.34, cueVolume: 0.24, breathModulation: 0.66 },
  coherent: { soundscape: "ocean", ambientVolume: 0.4, cueVolume: 0.18, breathModulation: 0.92 },
  sigh: { soundscape: "air", ambientVolume: 0.3, cueVolume: 0.58, breathModulation: 0.78 },
  ujjayi: { soundscape: "deep-ocean", ambientVolume: 0.48, cueVolume: 0.16, breathModulation: 0.88 },
  belly: { soundscape: "warm-drone", ambientVolume: 0.36, cueVolume: 0.25, breathModulation: 0.72 },
  "pursed-lip": { soundscape: "soft-noise", ambientVolume: 0.22, cueVolume: 0.38, breathModulation: 0.7 },
};

const PRODUCTION_AUDIO_DEFAULTS = {
  ambientVolume: 0.3,
  cueVolume: 0.32,
  breathModulation: 1,
};

const LEGACY_SOUNDSCAPE_ENGINE_PRESETS: Record<
  string,
  {
    droneEnabled: boolean;
    pinkNoiseEnabled: boolean;
    pinkNoiseScale: number;
    pinkNoiseFilter: { baseHz: number; peakHz: number; q: number };
  }
> = {
  silence: { droneEnabled: false, pinkNoiseEnabled: false, pinkNoiseScale: 1, pinkNoiseFilter: { baseHz: 480, peakHz: 2_400, q: 0.7 } },
  air: { droneEnabled: false, pinkNoiseEnabled: true, pinkNoiseScale: 0.82, pinkNoiseFilter: { baseHz: 1_100, peakHz: 4_200, q: 0.35 } },
  rain: { droneEnabled: false, pinkNoiseEnabled: true, pinkNoiseScale: 1, pinkNoiseFilter: { baseHz: 480, peakHz: 2_400, q: 0.7 } },
  ocean: { droneEnabled: false, pinkNoiseEnabled: true, pinkNoiseScale: 1.15, pinkNoiseFilter: { baseHz: 300, peakHz: 1_800, q: 0.7 } },
  "deep-ocean": { droneEnabled: false, pinkNoiseEnabled: true, pinkNoiseScale: 1.12, pinkNoiseFilter: { baseHz: 180, peakHz: 950, q: 0.6 } },
  "warm-drone": { droneEnabled: true, pinkNoiseEnabled: false, pinkNoiseScale: 1, pinkNoiseFilter: { baseHz: 480, peakHz: 2_400, q: 0.7 } },
  "soft-noise": { droneEnabled: false, pinkNoiseEnabled: true, pinkNoiseScale: 0.9, pinkNoiseFilter: { baseHz: 350, peakHz: 1_100, q: 0.4 } },
};

const PRE_PRODUCTION_PHASE_VOLUMES: Record<
  SensoryModeId,
  Record<SensoryPhaseId, number>
> = {
  box: { inhale: 0.35, inhale2: 0.35, holdIn: 0.35, exhale: 0.35, holdOut: 0.35 },
  relax: { inhale: 0.35, inhale2: 0.35, holdIn: 0.14, exhale: 0.22, holdOut: 0.35 },
  coherent: { inhale: 0.18, inhale2: 0.35, holdIn: 0.35, exhale: 0.16, holdOut: 0.35 },
  sigh: { inhale: 0.52, inhale2: 0.62, holdIn: 0.35, exhale: 0.62, holdOut: 0.12 },
  ujjayi: { inhale: 0.16, inhale2: 0.35, holdIn: 0.35, exhale: 0.16, holdOut: 0.35 },
  belly: { inhale: 0.3, inhale2: 0.35, holdIn: 0.35, exhale: 0.22, holdOut: 0.35 },
  "pursed-lip": { inhale: 0.32, inhale2: 0.35, holdIn: 0.35, exhale: 0.46, holdOut: 0.35 },
};

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null;

export function getStudioDraftVersion(input: unknown): number | null {
  if (
    typeof input !== "object" ||
    input === null ||
    !("storageVersion" in input) ||
    typeof input.storageVersion !== "number"
  ) {
    return null;
  }
  return input.storageVersion;
}

export function hasProductionAudioEngine(input: unknown): boolean {
  return isRecord(input) && isRecord(input.audio) && isRecord(input.audio.engine);
}

export function isLegacyStudioDraft(input: unknown): boolean {
  return getStudioDraftVersion(input) === 1;
}

const migrateLegacyCue = (cue: unknown, phaseId: SensoryPhaseId): unknown => {
  if (cue === "top-up") return "soft-rise";
  if (cue === "soft-bell") return "crisp-tick";
  if (cue !== "ocean-turn" && cue !== "warm-pulse") return cue;
  if (phaseId === "inhale" || phaseId === "inhale2") return "soft-rise";
  if (phaseId === "exhale") return "long-release";
  return "crisp-tick";
};

export function migrateLegacyAudioInput(input: unknown): unknown {
  if (
    !isRecord(input) ||
    !SENSORY_MODE_IDS.includes(input.modeId as SensoryModeId) ||
    !isRecord(input.phases)
  ) {
    return input;
  }

  const modeId = input.modeId as SensoryModeId;
  const legacyPitches = LEGACY_DEFAULT_PITCHES[modeId];
  const phases = { ...input.phases };

  for (const phaseId of SENSORY_PHASE_IDS) {
    const legacyPitch = legacyPitches[phaseId];
    const phase = phases[phaseId];
    if (!isRecord(phase) || !isRecord(phase.audio)) continue;
    let audio = phase.audio;
    if (
      legacyPitch !== undefined &&
      audio.pitchSemitones === legacyPitch
    ) {
      audio = { ...audio, pitchSemitones: 0 };
    }

    const cue = migrateLegacyCue(audio.cue, phaseId);
    if (cue !== audio.cue) audio = { ...audio, cue };
    if (audio !== phase.audio) {
      phases[phaseId] = { ...phase, audio };
    }
  }

  return { ...input, phases };
}

export function migrateProductionAudioInput(input: unknown): unknown {
  if (
    !isRecord(input) ||
    !SENSORY_MODE_IDS.includes(input.modeId as SensoryModeId) ||
    !isRecord(input.audio)
  ) {
    return input;
  }

  const modeId = input.modeId as SensoryModeId;
  const previous = PRE_PRODUCTION_AUDIO_DEFAULTS[modeId];
  const audio = { ...input.audio };
  if (audio.soundscape === previous.soundscape) {
    audio.soundscape = modeId === "relax" ? "rain" : modeId === "coherent" ? "ocean" : "warm-drone";
  }
  if (audio.ambientVolume === previous.ambientVolume) {
    audio.ambientVolume = PRODUCTION_AUDIO_DEFAULTS.ambientVolume;
  }
  if (audio.cueVolume === previous.cueVolume) {
    audio.cueVolume = PRODUCTION_AUDIO_DEFAULTS.cueVolume;
  }
  if (audio.breathModulation === previous.breathModulation) {
    audio.breathModulation = PRODUCTION_AUDIO_DEFAULTS.breathModulation;
  }
  if (!isRecord(audio.engine) && typeof audio.soundscape === "string") {
    const enginePreset = LEGACY_SOUNDSCAPE_ENGINE_PRESETS[audio.soundscape];
    if (enginePreset) {
      audio.engine = {
        ...enginePreset,
        pinkNoiseFilter: { ...enginePreset.pinkNoiseFilter },
      };
    }
  }

  let migratedPhases = input.phases;
  if (isRecord(input.phases)) {
    const phases = { ...input.phases };
    for (const phaseId of SENSORY_PHASE_IDS) {
      const phase = phases[phaseId];
      if (!isRecord(phase) || !isRecord(phase.audio)) continue;
      let phaseAudio = phase.audio;
      if (phaseAudio.volume === PRE_PRODUCTION_PHASE_VOLUMES[modeId][phaseId]) {
        phaseAudio = { ...phaseAudio, volume: 1 };
      }
      if (modeId === "box" && phaseId === "inhale" && phaseAudio.cue === "crisp-tick") {
        phaseAudio = { ...phaseAudio, cue: "soft-rise" };
      }
      if (modeId === "box" && phaseId === "exhale" && phaseAudio.cue === "crisp-tick") {
        phaseAudio = { ...phaseAudio, cue: "long-release" };
      }
      if (phaseAudio !== phase.audio) phases[phaseId] = { ...phase, audio: phaseAudio };
    }
    migratedPhases = phases;
  }

  return { ...input, audio, phases: migratedPhases };
}
