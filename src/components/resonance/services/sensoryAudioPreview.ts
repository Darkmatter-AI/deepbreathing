import type {
  SensoryModeId,
  SensoryAudioCue,
  SensoryPhaseId,
  SensoryProfileV1,
} from "@resonance/domain";

import { ModeName } from "../types";
import {
  AudioService,
  type CuePlaybackOptions,
  type CueType,
} from "./audioService";

type BreathAudioPhase = "inhale" | "exhale" | "hold";

export interface StudioAudioService {
  resume(): Promise<boolean>;
  setThemeColor(color: string): void;
  setBreathingMode(mode: ModeName): void;
  setVolume(cueVolume: number, ambientVolume: number): void;
  setCompressorParams(params: Partial<{ threshold: number; knee: number; ratio: number; attack: number; release: number }>): void;
  setLimiterParams(params: Partial<{ threshold: number; knee: number; ratio: number; attack: number; release: number }>): void;
  setMasterTrim(gain: number): void;
  setPinkNoiseFilterRange(range: Partial<{ baseHz: number; peakHz: number; q: number }>): void;
  setPinkNoiseGain(scale: number): void;
  setDroneGain(scale: number): void;
  setSubBassGain(scale: number): void;
  setSubBassFreqMultiplier(scale: number): void;
  setBinauralGain(scale: number): void;
  setPhaseEnvelopeGain(scale: number): void;
  setPhaseEnvelopeFreqMultiplier(scale: number): void;
  setCueToneScale(scale: number): void;
  setCueNoiseScale(scale: number): void;
  setCueReverbMix(scale: number): void;
  setArcWindowSeconds(seconds: number): void;
  setArcRootDriftFactor(scale: number): void;
  setArcLfoSlowdownFactor(scale: number): void;
  setArcOrbitSlowdownFactor(scale: number): void;
  startPinkNoise(): Promise<void>;
  startDrone(color: string): Promise<void>;
  startSubBass(color?: string): Promise<void>;
  startBinaural(beatHz?: number): Promise<void>;
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
  tickSessionArc(elapsedSeconds: number): void;
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
  private playbackStartedAtMs: number | null = null;
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
    this.applyStaticProfile(this.latestProfile ?? profile);

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
      this.playbackStartedAtMs = null;
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
    this.applyStaticProfile(profile);
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
    if (this.latestProfile?.audio.engine.sessionArcEnabled) {
      this.playbackStartedAtMs ??= time;
      this.audio.tickSessionArc(Math.max(0, (time - this.playbackStartedAtMs) / 1_000));
    }
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
    this.playbackStartedAtMs = null;
    this.stopAmbient();
    this.audio.stopCues();
  }

  async dispose() {
    this.pause();
    await this.audio.dispose();
  }

  private applyStaticProfile(profile: SensoryProfileV1) {
    const engine = profile.audio.engine;
    this.audio.setBreathingMode(MODE_NAMES[profile.modeId]);
    this.audio.setThemeColor(profile.palette.orb);
    this.audio.setVolume(profile.audio.cueVolume, profile.audio.ambientVolume);
    this.audio.setCompressorParams(engine.compressor);
    this.audio.setLimiterParams(engine.limiter);
    this.audio.setMasterTrim(engine.masterTrim);
    this.audio.setDroneGain(engine.droneScale);
    this.audio.setSubBassGain(engine.subBassScale);
    this.audio.setSubBassFreqMultiplier(engine.subBassFreqMultiplier);
    this.audio.setPinkNoiseGain(engine.pinkNoiseScale);
    this.audio.setPinkNoiseFilterRange({
      baseHz: engine.pinkNoiseFilter.baseHz,
      peakHz:
        engine.pinkNoiseFilter.baseHz +
        (engine.pinkNoiseFilter.peakHz - engine.pinkNoiseFilter.baseHz) *
          clamp01(profile.audio.breathModulation),
      q: engine.pinkNoiseFilter.q,
    });
    this.audio.setBinauralGain(engine.binauralScale);
    this.audio.setPhaseEnvelopeGain(
      engine.phaseEnvelopeScale * clamp01(profile.audio.breathModulation),
    );
    this.audio.setPhaseEnvelopeFreqMultiplier(engine.phaseEnvelopeFreqMultiplier);
    this.audio.setCueToneScale(engine.cueToneScale);
    this.audio.setCueNoiseScale(engine.cueNoiseScale);
    this.audio.setCueReverbMix(engine.cueReverbMix);
    this.audio.setArcWindowSeconds(engine.arcWindowSeconds);
    this.audio.setArcRootDriftFactor(engine.arcRootDriftFactor);
    this.audio.setArcLfoSlowdownFactor(engine.arcLfoSlowdownFactor);
    this.audio.setArcOrbitSlowdownFactor(engine.arcOrbitSlowdownFactor);
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
    const engine = profile.audio.engine;
    return [
      profile.palette.orb,
      engine.droneEnabled,
      engine.pinkNoiseEnabled,
      engine.subBassEnabled,
      engine.binauralEnabled,
      engine.phaseEnvelopeEnabled,
      engine.binauralBeatHz.toFixed(2),
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
    const engine = profile.audio.engine;
    const starts: Array<Promise<void>> = [];
    if (engine.droneEnabled) starts.push(this.audio.startDrone(profile.palette.orb));
    if (engine.pinkNoiseEnabled) starts.push(this.audio.startPinkNoise());
    if (engine.subBassEnabled) starts.push(this.audio.startSubBass(profile.palette.orb));
    if (engine.binauralEnabled) starts.push(this.audio.startBinaural(engine.binauralBeatHz));
    if (engine.phaseEnvelopeEnabled) {
      starts.push(this.audio.startPhaseEnvelope(profile.palette.orb));
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
