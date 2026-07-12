import type {
  SensoryModeId,
  SensoryAudioCue,
  SensoryPhaseId,
  SensoryProfileV1,
  SensorySoundscape,
} from "@resonance/domain";

import { ModeName } from "../types";
import {
  AudioService,
  type CuePlaybackOptions,
  type CueType,
} from "./audioService";

type BreathAudioPhase = "inhale" | "exhale" | "hold";
type NoisePreset = { baseHz: number; peakHz: number; q: number; gainScale: number };

export interface StudioAudioService {
  resume(): Promise<boolean>;
  setThemeColor(color: string): void;
  setBreathingMode(mode: ModeName): void;
  setVolume(cueVolume: number, ambientVolume: number): void;
  setPinkNoiseFilterRange(range: Partial<{ baseHz: number; peakHz: number; q: number }>): void;
  setPinkNoiseGain(scale: number): void;
  setDroneGain(scale: number): void;
  setSubBassGain(scale: number): void;
  setPhaseEnvelopeGain(scale: number): void;
  startPinkNoise(): Promise<void>;
  startDrone(color: string): Promise<void>;
  startSubBass(color?: string): Promise<void>;
  startPhaseEnvelope(color?: string): Promise<void>;
  stopPinkNoise(): void;
  stopDrone(): void;
  stopSubBass(): void;
  stopPhaseEnvelope(): void;
  stopBinaural(): void;
  stopCues(): void;
  updatePinkNoisePhase(phase: BreathAudioPhase, progress: number): void;
  updatePhaseEnvelope(phase: BreathAudioPhase, progress: number): void;
  updateSpatial(time: number): void;
  playCue(type: CueType, color?: string, options?: CuePlaybackOptions): void;
  dispose(): Promise<void>;
}

const MODE_NAMES: Record<SensoryModeId, ModeName> = {
  box: ModeName.Box,
  relax: ModeName.Relax,
  coherent: ModeName.Coherent,
  sigh: ModeName.Sigh,
  ujjayi: ModeName.Ujjayi,
  belly: ModeName.Belly,
  "pursed-lip": ModeName.PursedLip,
};

const NOISE_PRESETS: Partial<Record<SensorySoundscape, NoisePreset>> = {
  air: { baseHz: 1_100, peakHz: 4_200, q: 0.35, gainScale: 0.82 },
  rain: { baseHz: 480, peakHz: 2_400, q: 0.7, gainScale: 1.08 },
  ocean: { baseHz: 300, peakHz: 1_800, q: 0.7, gainScale: 1.15 },
  "deep-ocean": { baseHz: 180, peakHz: 950, q: 0.6, gainScale: 1.12 },
  "soft-noise": { baseHz: 350, peakHz: 1_100, q: 0.4, gainScale: 0.9 },
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const AUDIO_UNLOCK_TIMEOUT_MS = 3_000;

const toBreathAudioPhase = (phase: SensoryPhaseId): BreathAudioPhase => {
  if (phase === "inhale" || phase === "inhale2") return "inhale";
  if (phase === "exhale") return "exhale";
  return "hold";
};

export const resolveStudioCueType = (
  cue: SensoryAudioCue,
  phase: SensoryPhaseId,
): CueType | null => {
  switch (cue) {
    case "none":
      return null;
    case "soft-rise":
    case "top-up":
      return "inhale";
    case "crisp-tick":
    case "soft-bell":
      return "hold";
    case "long-release":
      return "exhale";
    case "ocean-turn":
    case "warm-pulse":
      return toBreathAudioPhase(phase);
  }
};

export class StudioAudioPreview {
  private ambientQueue: Promise<void> = Promise.resolve();
  private ambientSignature: string | null = null;
  private auditionGeneration = 0;
  private generation = 0;
  private latestProfile: SensoryProfileV1 | null = null;
  private playing = false;
  private starting = false;

  constructor(private readonly audio: StudioAudioService = new AudioService()) {}

  async start(profile: SensoryProfileV1, phase: SensoryPhaseId): Promise<boolean> {
    this.playing = true;
    this.starting = true;
    this.latestProfile = profile;
    this.auditionGeneration += 1;
    const generation = ++this.generation;
    this.applyStaticProfile(profile);

    const ready = await this.resumeWithTimeout();
    if (!ready || !this.isCurrent(generation)) {
      this.failStart(generation);
      return false;
    }

    while (this.isCurrent(generation)) {
      const currentProfile = this.latestProfile ?? profile;
      const ambientSignature = this.getAmbientSignature(currentProfile);
      this.ambientSignature = ambientSignature;
      const ambientReady = await this.queueAmbientStart(currentProfile, generation);
      if (!ambientReady || !this.isCurrent(generation)) {
        this.failStart(generation);
        return false;
      }

      const latestProfile = this.latestProfile ?? currentProfile;
      if (this.getAmbientSignature(latestProfile) !== ambientSignature) continue;

      this.starting = false;
      this.playPhaseCue(latestProfile, phase);
      return true;
    }

    return false;
  }

  async auditionCue(profile: SensoryProfileV1, phase: SensoryPhaseId): Promise<boolean> {
    const generation = ++this.auditionGeneration;
    this.applyStaticProfile(profile);
    const ready = await this.resumeWithTimeout();
    if (!ready || generation !== this.auditionGeneration) return false;
    this.playPhaseCue(profile, phase);
    return true;
  }

  async syncProfile(profile: SensoryProfileV1): Promise<void> {
    this.latestProfile = profile;
    this.applyStaticProfile(profile);
    const nextSignature = this.getAmbientSignature(profile);
    if (!this.playing || this.starting || nextSignature === this.ambientSignature) return;

    this.ambientSignature = nextSignature;
    const generation = ++this.generation;
    const ambientReady = await this.queueAmbientStart(profile, generation);
    if (!ambientReady && this.isCurrent(generation)) this.ambientSignature = null;
  }

  updateFrame(phase: SensoryPhaseId, progress: number, time: number) {
    if (!this.playing) return;
    const audioPhase = toBreathAudioPhase(phase);
    this.audio.updateSpatial(time);
    this.audio.updatePinkNoisePhase(audioPhase, progress);
    this.audio.updatePhaseEnvelope(audioPhase, progress);
  }

  playPhaseCue(profile: SensoryProfileV1, phase: SensoryPhaseId) {
    if (!profile.guidance.audioCues) return;
    const phaseAudio = profile.phases[phase].audio;
    const cueType = resolveStudioCueType(phaseAudio.cue, phase);
    if (!cueType) return;

    this.audio.playCue(cueType, profile.palette.orb, {
      gainScale: phaseAudio.volume,
      pitchSemitones: phaseAudio.pitchSemitones,
    });
  }

  pause() {
    this.playing = false;
    this.starting = false;
    this.ambientSignature = null;
    this.auditionGeneration += 1;
    this.generation += 1;
    this.stopAmbient();
    this.audio.stopCues();
  }

  async dispose() {
    this.pause();
    await this.audio.dispose();
  }

  private applyStaticProfile(profile: SensoryProfileV1) {
    this.audio.setBreathingMode(MODE_NAMES[profile.modeId]);
    this.audio.setThemeColor(profile.palette.orb);
    this.audio.setVolume(profile.audio.cueVolume, profile.audio.ambientVolume);
    this.audio.setPhaseEnvelopeGain(profile.audio.breathModulation);
  }

  private async resumeWithTimeout() {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => resolve(false), AUDIO_UNLOCK_TIMEOUT_MS);
    });
    try {
      return await Promise.race([this.audio.resume(), timeout]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private getAmbientSignature(profile: SensoryProfileV1) {
    return [
      profile.audio.soundscape,
      profile.palette.orb,
      profile.audio.breathModulation.toFixed(3),
    ].join(":");
  }

  private async queueAmbientStart(profile: SensoryProfileV1, generation: number) {
    let started = false;
    this.ambientQueue = this.ambientQueue
      .catch(() => undefined)
      .then(async () => {
        if (!this.isCurrent(generation)) return;
        this.stopAmbient();
        try {
          await this.startAmbient(profile);
          started = true;
        } catch {
          this.stopAmbient();
        }
        if (!this.isCurrent(generation)) {
          started = false;
          this.stopAmbient();
        }
      });
    await this.ambientQueue;
    return started;
  }

  private async startAmbient(profile: SensoryProfileV1) {
    const { soundscape, breathModulation } = profile.audio;
    if (soundscape === "silence") return;

    this.audio.setPinkNoiseGain(1);
    this.audio.setDroneGain(1);
    this.audio.setSubBassGain(1);

    if (soundscape === "warm-drone") {
      this.audio.setDroneGain(0.9);
      this.audio.setSubBassGain(0.6);
      const starts: Array<Promise<void>> = [
        this.audio.startDrone(profile.palette.orb),
        this.audio.startSubBass(profile.palette.orb),
      ];
      if (breathModulation > 0) starts.push(this.audio.startPhaseEnvelope(profile.palette.orb));
      await Promise.all(starts);
      return;
    }

    const preset = NOISE_PRESETS[soundscape];
    if (!preset) return;
    const modulation = clamp01(breathModulation);
    this.audio.setPinkNoiseGain(preset.gainScale);
    this.audio.setPinkNoiseFilterRange({
      baseHz: preset.baseHz,
      peakHz: preset.baseHz + (preset.peakHz - preset.baseHz) * modulation,
      q: preset.q,
    });

    const starts: Array<Promise<void>> = [this.audio.startPinkNoise()];
    if (soundscape === "deep-ocean") {
      this.audio.setSubBassGain(0.72);
      starts.push(this.audio.startSubBass(profile.palette.orb));
    }
    await Promise.all(starts);
  }

  private stopAmbient() {
    this.audio.stopPinkNoise();
    this.audio.stopDrone();
    this.audio.stopSubBass();
    this.audio.stopPhaseEnvelope();
    this.audio.stopBinaural();
  }

  private isCurrent(generation: number) {
    return this.playing && generation === this.generation;
  }

  private failStart(generation: number) {
    if (generation !== this.generation) return;
    this.playing = false;
    this.starting = false;
    this.ambientSignature = null;
    this.stopAmbient();
    this.audio.stopCues();
  }
}
