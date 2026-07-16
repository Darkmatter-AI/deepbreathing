import { cloneSensoryProfile, DEFAULT_SENSORY_PROFILES } from "@resonance/domain";
import { describe, expect, it } from "vitest";

import {
  getStudioDraftVersion,
  hasProductionAudioEngine,
  isLegacyStudioDraft,
  migrateLegacyAudioInput,
  migrateProductionAudioInput,
} from "./sensoryStudioMigration";

describe("sensory studio audio migration", () => {
  it("recognizes exported v1 Studio drafts without confusing profile schema v1", () => {
    expect(isLegacyStudioDraft({ storageVersion: 1, schemaVersion: 1 })).toBe(true);
    expect(isLegacyStudioDraft({ storageVersion: 2, schemaVersion: 1 })).toBe(false);
    expect(isLegacyStudioDraft({ version: 1, modeId: "box" })).toBe(false);
    expect(getStudioDraftVersion({ storageVersion: 2 })).toBe(2);
    expect(getStudioDraftVersion({ version: 1 })).toBeNull();
    expect(hasProductionAudioEngine(DEFAULT_SENSORY_PROFILES.box)).toBe(true);
    expect(hasProductionAudioEngine({ audio: { soundscape: "rain" } })).toBe(false);
  });

  it("neutralizes only placeholder-era default pitch values", () => {
    const profile = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.sigh);
    profile.phases.inhale.audio.pitchSemitones = 3;
    profile.phases.inhale2.audio.pitchSemitones = 8;
    profile.phases.inhale2.audio.cue = "top-up";
    profile.phases.exhale.audio.pitchSemitones = -6;

    const migrated = migrateLegacyAudioInput(profile) as typeof profile;

    expect(migrated.phases.inhale.audio.pitchSemitones).toBe(0);
    expect(migrated.phases.inhale2.audio.pitchSemitones).toBe(0);
    expect(migrated.phases.inhale2.audio.cue).toBe("soft-rise");
    expect(migrated.phases.exhale.audio.pitchSemitones).toBe(-6);
    expect(profile.phases.inhale.audio.pitchSemitones).toBe(3);
  });

  it("upgrades untouched v2 audio defaults while preserving authored changes", () => {
    const legacyBox = cloneSensoryProfile(DEFAULT_SENSORY_PROFILES.box);
    legacyBox.audio.soundscape = "soft-noise";
    legacyBox.audio.ambientVolume = 0.14;
    legacyBox.audio.cueVolume = 0.52;
    legacyBox.audio.breathModulation = 0.12;
    legacyBox.phases.inhale.audio.cue = "crisp-tick";
    legacyBox.phases.inhale.audio.volume = 0.35;
    legacyBox.phases.exhale.audio.cue = "crisp-tick";
    const migratedBox = migrateProductionAudioInput(legacyBox) as typeof legacyBox;
    expect(migratedBox.audio).toMatchObject({
      soundscape: "warm-drone",
      ambientVolume: 0.3,
      cueVolume: 0.32,
      breathModulation: 1,
    });
    expect(migratedBox.phases.inhale.audio.cue).toBe("soft-rise");
    expect(migratedBox.phases.inhale.audio.volume).toBe(1);
    expect(migratedBox.phases.exhale.audio.cue).toBe("long-release");

    const authored = cloneSensoryProfile(legacyBox);
    authored.audio.soundscape = "ocean";
    authored.audio.ambientVolume = 0.61;
    delete (authored.audio as Partial<typeof authored.audio>).engine;
    const migratedAuthored = migrateProductionAudioInput(authored) as typeof authored;
    expect(migratedAuthored.audio.soundscape).toBe("ocean");
    expect(migratedAuthored.audio.ambientVolume).toBe(0.61);
    expect(migratedAuthored.audio.engine).toMatchObject({
      droneEnabled: false,
      pinkNoiseEnabled: true,
      pinkNoiseScale: 1.15,
    });
  });
});
