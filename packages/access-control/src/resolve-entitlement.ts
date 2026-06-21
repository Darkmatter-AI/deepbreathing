/**
 * resolve-entitlement.ts
 *
 * Pure, IO-free resolver: maps (userId | null, plan) → EntitlementSnapshot.
 *
 * Rules:
 *  - No session (guest)      → plan "free", capabilities [] (empty = gated)
 *  - Authenticated, no sub   → plan "free", capabilities from PLAN_CAPABILITIES.free
 *  - Authenticated, pro sub  → plan "pro",  capabilities from PLAN_CAPABILITIES.pro
 *
 * Why guests get plan:"free" with empty capabilities: EntitlementSnapshot.plan
 * is typed as Plan ("free"|"pro") with no "guest" variant. Empty capabilities
 * let the app distinguish guest-free from authenticated-free without a schema
 * change, and getFeatureAccess() blocks guests via the UserState guard.
 *
 * TODO(RevenueCat/Stripe): replace the `plan` param source in the route with a
 * real entitlement lookup once webhooks are wired. The resolver itself is stable.
 */

import { capabilitiesForPlan } from "./index";
import type { EntitlementSnapshot } from "@resonance/domain";

export interface ResolveEntitlementInput {
  /** Authenticated user ID, or null for a guest session. */
  userId: string | null;
  /**
   * The resolved plan for this user.
   * - Pass "free"  for authenticated users with no active subscription.
   * - Pass "pro"   for users with an active entitlement.
   * When userId is null (guest) this value is ignored.
   */
  plan: "free" | "pro";
  /**
   * The ISO-8601 timestamp to stamp as effectiveAt.
   * Injected rather than derived from Date.now() so callers and tests can
   * produce stable, deterministic snapshots.
   */
  effectiveAt: string;
}

export interface EntitlementResult {
  snapshot: EntitlementSnapshot;
  /** Derived UserState suitable for passing to getFeatureAccess(). */
  userState: "guest" | "authenticated_free" | "authenticated_pro";
}

export function resolveEntitlement(input: ResolveEntitlementInput): EntitlementResult {
  const { userId, plan, effectiveAt } = input;

  // Guest: no authenticated session
  if (userId === null) {
    return {
      snapshot: {
        userId: "guest",
        plan: "free",
        capabilities: [], // empty = gated; distinguishes guest from free member
        effectiveAt,
        expiresAt: null,
      },
      userState: "guest",
    };
  }

  // Authenticated user — free or pro
  const capabilities = capabilitiesForPlan(plan);

  return {
    snapshot: {
      userId,
      plan,
      capabilities,
      effectiveAt,
      expiresAt: null,
    },
    userState: plan === "pro" ? "authenticated_pro" : "authenticated_free",
  };
}
