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

export function isLegacyStudioDraft(input: unknown): boolean {
  return (
    typeof input === "object" &&
    input !== null &&
    "storageVersion" in input &&
    input.storageVersion === 1
  );
}

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null;

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
