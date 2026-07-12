import {
  cloneSensoryProfile,
  DEFAULT_SENSORY_PROFILES,
  SENSORY_AUDIO_CUES,
  SENSORY_PHASE_IDS,
  type SensoryAudioCue,
} from "@resonance/domain";
import { describe, expect, it } from "vitest";

import type { CuePlaybackOptions, CueType } from "./audioService";
import {
  StudioAudioPreview,
  type StudioAudioService,
  resolveStudioCueType,
} from "./sensoryAudioPreview";

class FakeAudioService implements StudioAudioService {
  calls: Array<{ name: string; args: unknown[] }> = [];
  pinkNoiseStartPromise: Promise<void> | null = null;
  resumePromise: Promise<boolean> | null = null;
  resumeResult = true;

  private record(name: string, ...args: unknown[]) {
    this.calls.push({ name, args });
  }

  async resume() {
    this.record("resume");
    if (this.resumePromise) return this.resumePromise;
    return this.resumeResult;
  }

  setThemeColor(color: string) { this.record("setThemeColor", color); }
  setBreathingMode(mode: unknown) { this.record("setBreathingMode", mode); }
  setVolume(cue: number, ambient: number) { this.record("setVolume", cue, ambient); }
  setPinkNoiseFilterRange(range: unknown) { this.record("setPinkNoiseFilterRange", range); }
  setPinkNoiseGain(scale: number) { this.record("setPinkNoiseGain", scale); }
  setDroneGain(scale: number) { this.record("setDroneGain", scale); }
  setSubBassGain(scale: number) { this.record("setSubBassGain", scale); }
  setPhaseEnvelopeGain(scale: number) { this.record("setPhaseEnvelopeGain", scale); }
  async startPinkNoise() {
    this.record("startPinkNoise");
    if (this.pinkNoiseStartPromise) await this.pinkNoiseStartPromise;
  }
  async startDrone(color: string) { this.record("startDrone", color); }
  async startSubBass(color?: string) { this.record("startSubBass", color); }
  async startPhaseEnvelope(color?: string) { this.record("startPhaseEnvelope", color); }
  stopPinkNoise() { this.record("stopPinkNoise"); }
  stopDrone() { this.record("stopDrone"); }
  stopSubBass() { this.record("stopSubBass"); }
  stopPhaseEnvelope() { this.record("stopPhaseEnvelope"); }
  stopBinaural() { this.record("stopBinaural"); }
  stopCues() { this.record("stopCues"); }
  updatePinkNoisePhase(phase: unknown, progress: number) { this.record("updatePinkNoisePhase", phase, progress); }
  updatePhaseEnvelope(phase: unknown, progress: number) { this.record("updatePhaseEnvelope", phase, progress); }
  updateSpatial(time: number) { this.record("updateSpatial", time); }
  playCue(type: CueType, color?: string, options?: CuePlaybackOptions) {
    this.record("playCue", type, color, options);
  }
  async dispose() { this.record("dispose"); }
}

const names = (audio: FakeAudioService) => audio.calls.map((call) => call.name);

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const flushMicrotasks = async () => {
  for (let index = 0; index < 10; index += 1) await Promise.resolve();
};

const cueMatrix = {
  "none": [null, null, null, null, null],
  "soft-rise": ["inhale", "inhale", "inhale", "inhale", "inhale"],
  "top-up": ["inhale", "inhale", "inhale", "inhale", "inhale"],
  "crisp-tick": ["hold", "hold", "hold", "hold", "hold"],
  "soft-bell": ["hold", "hold", "hold", "hold", "hold"],
  "long-release": ["exhale", "exhale", "exhale", "exhale", "exhale"],
  "ocean-turn": ["inhale", "inhale", "hold", "exhale", "hold"],
  "warm-pulse": ["inhale", "inhale", "hold", "exhale", "hold"],
} satisfies Record<SensoryAudioCue, ReadonlyArray<CueType | null>>;

const cueMatrixCases = SENSORY_AUDIO_CUES.flatMap((cue) =>
  SENSORY_PHASE_IDS.map((phase, phaseIndex) => [
    cue,
    phase,
    cueMatrix[cue][phaseIndex],
  ] as const),
);

describe("StudioAudioPreview", () => {
  it.each(cueMatrixCases)("maps %s on %s to %s", (cue, phase, expected) => {
    expect(resolveStudioCueType(cue, phase)).toBe(expected);
  });

  it("awaits the production audio unlock, starts a rain bed, then plays the phase cue", async () => {
    const audio = new FakeAudioService();
    const preview = new StudioAudioPreview(audio);
    const profile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.relax);

    await expect(preview.start(profile, "inhale")).resolves.toBe(true);

    expect(names(audio)).toContain("startPinkNoise");
    expect(names(audio).indexOf("resume")).toBeLessThan(names(audio).indexOf("startPinkNoise"));
    expect(names(audio).indexOf("startPinkNoise")).toBeLessThan(names(audio).indexOf("playCue"));
    expect(audio.calls.find((call) => call.name === "setVolume")?.args).toEqual([
      profile.audio.cueVolume,
      profile.audio.ambientVolume,
    ]);
  });

  it("maps the warm drone to production drone, sub-bass, and breath envelope layers", async () => {
    const audio = new FakeAudioService();
    const preview = new StudioAudioPreview(audio);
    const profile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.belly);

    await preview.start(profile, "inhale");

    expect(names(audio)).toEqual(expect.arrayContaining([
      "startDrone",
      "startSubBass",
      "startPhaseEnvelope",
    ]));
  });

  it("drives ambient breath modulation and stops every layer on pause", async () => {
    const audio = new FakeAudioService();
    const preview = new StudioAudioPreview(audio);
    const profile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.coherent);

    await preview.start(profile, "inhale");
    preview.updateFrame("exhale", 0.64, 1234);
    preview.pause();

    expect(audio.calls).toContainEqual({ name: "updatePinkNoisePhase", args: ["exhale", 0.64] });
    expect(names(audio)).toEqual(expect.arrayContaining([
      "stopPinkNoise",
      "stopDrone",
      "stopSubBass",
      "stopPhaseEnvelope",
      "stopBinaural",
      "stopCues",
    ]));
  });

  it("maps authored cue style, gain, and pitch into the production cue pipeline", async () => {
    const audio = new FakeAudioService();
    const preview = new StudioAudioPreview(audio);
    const profile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.sigh);
    profile.phases.inhale2.audio.pitchSemitones = 2;

    await preview.auditionCue(profile, "inhale2");

    expect(resolveStudioCueType("top-up", "inhale2")).toBe("inhale");
    expect(audio.calls.find((call) => call.name === "playCue")?.args).toEqual([
      "inhale",
      profile.palette.orb,
      {
        gainScale: profile.phases.inhale2.audio.volume,
        pitchSemitones: 2,
      },
    ]);
  });

  it("does not start layers or cues when the browser blocks audio unlock", async () => {
    const audio = new FakeAudioService();
    audio.resumeResult = false;
    const preview = new StudioAudioPreview(audio);

    await expect(preview.start(DEFAULT_SENSORY_PROFILES.box, "inhale")).resolves.toBe(false);

    expect(names(audio)).not.toContain("startPinkNoise");
    expect(names(audio)).not.toContain("startDrone");
    expect(names(audio)).not.toContain("playCue");
  });

  it("uses the latest profile when settings change during a delayed audio unlock", async () => {
    const unlock = deferred<boolean>();
    const audio = new FakeAudioService();
    audio.resumePromise = unlock.promise;
    const preview = new StudioAudioPreview(audio);
    const initialProfile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.coherent);
    const latestProfile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.belly);

    const startPromise = preview.start(initialProfile, "inhale");
    await preview.syncProfile(latestProfile);

    expect(names(audio).filter((name) => name.startsWith("start"))).toEqual([]);

    unlock.resolve(true);
    await expect(startPromise).resolves.toBe(true);

    expect(names(audio)).toEqual(expect.arrayContaining([
      "startDrone",
      "startSubBass",
      "startPhaseEnvelope",
    ]));
    expect(names(audio)).not.toContain("startPinkNoise");
    expect(audio.calls.findLast((call) => call.name === "playCue")?.args[0]).toBe("inhale");
  });

  it("does not revive ambient layers or play a cue after pausing during startup", async () => {
    const unlock = deferred<boolean>();
    const audio = new FakeAudioService();
    audio.resumePromise = unlock.promise;
    const preview = new StudioAudioPreview(audio);

    const startPromise = preview.start(DEFAULT_SENSORY_PROFILES.coherent, "inhale");
    preview.pause();
    unlock.resolve(true);

    await expect(startPromise).resolves.toBe(false);
    expect(names(audio)).toContain("stopCues");
    expect(names(audio).filter((name) => name.startsWith("start"))).toEqual([]);
    expect(names(audio)).not.toContain("playCue");
  });

  it("ignores an older cue audition when a newer one unlocks at the same time", async () => {
    const unlock = deferred<boolean>();
    const audio = new FakeAudioService();
    audio.resumePromise = unlock.promise;
    const preview = new StudioAudioPreview(audio);
    const profile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.coherent);

    const staleAudition = preview.auditionCue(profile, "inhale");
    const latestAudition = preview.auditionCue(profile, "exhale");
    unlock.resolve(true);

    await expect(staleAudition).resolves.toBe(false);
    await expect(latestAudition).resolves.toBe(true);
    expect(audio.calls.filter((call) => call.name === "playCue")).toEqual([
      expect.objectContaining({ args: expect.arrayContaining(["exhale"]) }),
    ]);
  });

  it("replaces an ambient bed with the latest profile when it changes during startup", async () => {
    const pinkNoiseStarted = deferred<void>();
    const audio = new FakeAudioService();
    audio.pinkNoiseStartPromise = pinkNoiseStarted.promise;
    const preview = new StudioAudioPreview(audio);
    const initialProfile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.coherent);
    const latestProfile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.belly);

    const startPromise = preview.start(initialProfile, "inhale");
    await flushMicrotasks();
    expect(names(audio)).toContain("startPinkNoise");

    await preview.syncProfile(latestProfile);
    pinkNoiseStarted.resolve();
    await expect(startPromise).resolves.toBe(true);

    expect(names(audio).filter((name) => name === "startPinkNoise")).toHaveLength(1);
    expect(names(audio).filter((name) => name === "startDrone")).toHaveLength(1);
    expect(audio.calls.findLast((call) => call.name === "playCue")?.args[0]).toBe("inhale");
  });

  it("cleans up a stale ambient start before the queued replacement takes ownership", async () => {
    const pinkNoiseStarted = deferred<void>();
    const audio = new FakeAudioService();
    const preview = new StudioAudioPreview(audio);
    const silentProfile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.box);
    silentProfile.audio.soundscape = "silence";
    await preview.start(silentProfile, "inhale");

    audio.pinkNoiseStartPromise = pinkNoiseStarted.promise;
    const rainProfile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.relax);
    const warmProfile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.belly);
    const rainSync = preview.syncProfile(rainProfile);
    await flushMicrotasks();
    const pinkNoiseStartIndex = names(audio).lastIndexOf("startPinkNoise");
    expect(pinkNoiseStartIndex).toBeGreaterThan(-1);

    const warmSync = preview.syncProfile(warmProfile);
    pinkNoiseStarted.resolve();
    await Promise.all([rainSync, warmSync]);

    const stoppedStaleNoiseIndex = audio.calls.findIndex(
      (call, index) => index > pinkNoiseStartIndex && call.name === "stopPinkNoise",
    );
    const droneStartIndex = names(audio).lastIndexOf("startDrone");
    expect(stoppedStaleNoiseIndex).toBeGreaterThan(pinkNoiseStartIndex);
    expect(droneStartIndex).toBeGreaterThan(stoppedStaleNoiseIndex);
    expect(names(audio).filter((name) => name === "startDrone")).toHaveLength(1);

    await preview.syncProfile(warmProfile);
    expect(names(audio).filter((name) => name === "startDrone")).toHaveLength(1);
  });

  it.each([
    ["silence", []],
    ["air", ["startPinkNoise"]],
    ["rain", ["startPinkNoise"]],
    ["ocean", ["startPinkNoise"]],
    ["deep-ocean", ["startPinkNoise", "startSubBass"]],
    ["warm-drone", ["startDrone", "startSubBass", "startPhaseEnvelope"]],
    ["soft-noise", ["startPinkNoise"]],
  ] as const)("maps %s to its production ambient layers", async (soundscape, expectedLayers) => {
    const audio = new FakeAudioService();
    const preview = new StudioAudioPreview(audio);
    const profile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.box);
    profile.audio.soundscape = soundscape;

    await preview.start(profile, "inhale");

    const startedLayers = names(audio).filter((name) => name.startsWith("start"));
    expect(startedLayers).toEqual(expectedLayers);
  });
});
