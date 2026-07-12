import { cloneSensoryProfile, DEFAULT_SENSORY_PROFILES } from "@resonance/domain";
import { describe, expect, it } from "vitest";

import {
  isLegacyStudioDraft,
  migrateLegacyAudioInput,
} from "./sensoryStudioMigration";

describe("sensory studio audio migration", () => {
  it("recognizes exported v1 Studio drafts without confusing profile schema v1", () => {
    expect(isLegacyStudioDraft({ storageVersion: 1, schemaVersion: 1 })).toBe(true);
    expect(isLegacyStudioDraft({ storageVersion: 2, schemaVersion: 1 })).toBe(false);
    expect(isLegacyStudioDraft({ version: 1, modeId: "box" })).toBe(false);
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
});
