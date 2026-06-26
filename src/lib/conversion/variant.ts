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

export type ConversionVariant =
  | "control"
  | "social_stats"
  | "loss_aversion"
  | "loss_aversion_banner";

/**
 * The currently active challenger variant. One line to swap challengers.
 *
 * 2026-06-26: swapped "loss_aversion" (Prompt C modal) → "loss_aversion_banner"
 * (non-blocking top notification) and shipped to 100%. Rollback to the Prompt C
 * modal = set this back to "loss_aversion"; full rollback to control = CHALLENGER_SHARE = 0.
 */
export const ACTIVE_CHALLENGER: ConversionVariant = "loss_aversion_banner";

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

// Bumped v2 → v3 on the 2026-06-26 banner ship so visitors persisted as
// "loss_aversion" (Prompt C modal) re-draw and land on "loss_aversion_banner" —
// required for a true 100% swap to returning visitors, not just new ones.
const VARIANT_KEY = "resonance_conversion_variant_v3";

function isVariant(v: unknown): v is ConversionVariant {
  return (
    v === "control" ||
    v === "social_stats" ||
    v === "loss_aversion" ||
    v === "loss_aversion_banner"
  );
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

/**
 * Force-persist a variant bucket. Used to tag the non-blocking banner cohort
 * (`loss_aversion_banner`) so the existing funnel events — conversion_prompt_shown,
 * conversion_signup_completed, signup_user_identified — and the `conversion_variant`
 * GA4 user property all carry it, segmenting "saw + registered via the banner" from
 * the modal. Idempotent.
 */
export function setConversionVariant(v: ConversionVariant) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(VARIANT_KEY) !== v) localStorage.setItem(VARIANT_KEY, v);
  } catch {
    /* ignore */
  }
}
