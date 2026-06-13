"use client";

/**
 * A/B bucketing for the post-session conversion prompt.
 *
 *  - "control"      = the existing SignInSheet ("Save your progress")
 *  - "social_stats" = Conversion Prompt B (social proof + personal stats) — paused 2026-06-14
 *  - "loss_aversion" = Conversion Prompt C (real session card + loss-aversion copy) — ACTIVE
 *
 * The active challenger is determined by ACTIVE_CHALLENGER. Setting CHALLENGER_SHARE = 0
 * is the instant rollback to control; setting it to 1 ships the challenger to everyone.
 *
 * Storage key v2 was bumped when switching from social_stats to loss_aversion so that
 * returning visitors who had been persisted as social_stats re-draw under the new
 * bucketing.
 */

export type ConversionVariant = "control" | "social_stats" | "loss_aversion";

/**
 * The currently active challenger variant. One line to swap challengers.
 */
export const ACTIVE_CHALLENGER: ConversionVariant = "loss_aversion";

/**
 * Share of visitors bucketed into the active challenger.
 *   1   = 100% challenger (current — measured pre/post vs baseline)
 *   0   = instant rollback to control
 *   0.5 = true 50/50 A/B (only worthwhile once traffic supports a split)
 */
export const CHALLENGER_SHARE = 1;

/**
 * Kept for reference; no longer drives assignment.
 * ACTIVE_CHALLENGER + CHALLENGER_SHARE are the live controls.
 */
export const SOCIAL_STATS_SHARE = 1;

// v2 key forces re-bucketing of visitors persisted under the old social_stats key.
const VARIANT_KEY = "resonance_conversion_variant_v2";

function isVariant(v: unknown): v is ConversionVariant {
  return v === "control" || v === "social_stats" || v === "loss_aversion";
}

/**
 * Returns the visitor's bucket, assigning and persisting one on first call.
 * Safe on the server (returns "control" without writing).
 */
export function getConversionVariant(): ConversionVariant {
  if (typeof window === "undefined") return "control";
  try {
    const saved = localStorage.getItem(VARIANT_KEY);
    if (isVariant(saved)) return saved;
    const assigned: ConversionVariant =
      Math.random() < CHALLENGER_SHARE ? ACTIVE_CHALLENGER : "control";
    localStorage.setItem(VARIANT_KEY, assigned);
    return assigned;
  } catch {
    return "control";
  }
}

/**
 * Read-only lookup that never assigns a bucket. Use where we only want to
 * attach the already-assigned bucket to an event (e.g. signup_user_identified,
 * which can fire after an OAuth round-trip).
 */
export function readConversionVariant(): ConversionVariant {
  if (typeof window === "undefined") return "control";
  try {
    const saved = localStorage.getItem(VARIANT_KEY);
    return isVariant(saved) ? saved : "control";
  } catch {
    return "control";
  }
}
