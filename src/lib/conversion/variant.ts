"use client";

/**
 * A/B bucketing for the post-session conversion prompt.
 *
 *  - "control"      = the existing SignInSheet ("Save your progress")
 *  - "social_stats" = Conversion Prompt B (social proof + personal stats)
 *
 * The bucket is assigned once per visitor and persisted in localStorage so it
 * is stable across reloads and survives the OAuth round-trip. Events are tagged
 * with the bucket (see use-conversion-triggers + auth-provider) so GA4 can
 * compute prompt_shown -> signup per arm.
 */

export type ConversionVariant = "control" | "social_stats";

/**
 * Share of visitors bucketed into the "social_stats" challenger.
 *   1   = ship the challenger to everyone (current: measured pre/post vs baseline)
 *   0   = full rollback to control
 *   0.5 = true 50/50 A/B (only worthwhile once traffic supports a split)
 *
 * Shipping at 100% and reading pre/post against the funnel baseline, because at
 * current traffic (~50 prompt impressions/week) a concurrent split is
 * underpowered. See docs/design/conversion-prompt-B-rollout.md.
 */
export const SOCIAL_STATS_SHARE = 1;

const VARIANT_KEY = "resonance_conversion_variant";

function isVariant(v: unknown): v is ConversionVariant {
  return v === "control" || v === "social_stats";
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
      Math.random() < SOCIAL_STATS_SHARE ? "social_stats" : "control";
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
