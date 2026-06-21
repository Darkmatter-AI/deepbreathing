import type { CapabilityKey, EntitlementSnapshot, Plan } from "@resonance/domain";
import type { UserState } from "@resonance/domain";

export type FeatureKey =
  | "basic_history"
  | "advanced_history"
  | "advanced_protocols"
  | "extra_soundscapes"
  | "insights_trends"
  | "pdf_export"
  | "cross_device_reminders"
  | "advanced_routines";

export type GateReason = "ok" | "guest" | "not_authenticated" | "missing_capability";

export interface FeatureAccess {
  allowed: boolean;
  reason: GateReason;
}

export const PLAN_CAPABILITIES: Record<Plan, CapabilityKey[]> = {
  free: ["history.basic"],
  pro: [
    "history.basic",
    "history.advanced",
    "audio.extra_soundscapes",
    "protocols.advanced",
    "insights.trends",
    "export.pdf",
    "reminders.cross_device",
    "routines.advanced",
  ],
};

export const FEATURE_MATRIX: Record<FeatureKey, CapabilityKey> = {
  basic_history: "history.basic",
  advanced_history: "history.advanced",
  advanced_protocols: "protocols.advanced",
  extra_soundscapes: "audio.extra_soundscapes",
  insights_trends: "insights.trends",
  pdf_export: "export.pdf",
  cross_device_reminders: "reminders.cross_device",
  advanced_routines: "routines.advanced",
};

export function hasCapability(capabilities: CapabilityKey[] | undefined, key: CapabilityKey): boolean {
  return Boolean(capabilities?.includes(key));
}

export function hasAnyCapability(capabilities: CapabilityKey[] | undefined, keys: CapabilityKey[]): boolean {
  if (!capabilities?.length) return false;
  return keys.some((key) => capabilities.includes(key));
}

export function capabilitiesForPlan(plan: Plan): CapabilityKey[] {
  return PLAN_CAPABILITIES[plan];
}

export function getFeatureAccess(
  userState: UserState,
  capabilities: CapabilityKey[] | undefined,
  featureKey: FeatureKey
): FeatureAccess {
  const requiredCapability = FEATURE_MATRIX[featureKey];
  if (!requiredCapability) {
    return { allowed: false, reason: "missing_capability" };
  }

  if (userState === "guest") {
    return { allowed: false, reason: "guest" };
  }

  if (userState === "authenticated_lapsed") {
    return { allowed: false, reason: "missing_capability" };
  }

  if (userState === "authenticated_free" || userState === "authenticated_pro") {
    return hasCapability(capabilities, requiredCapability)
      ? { allowed: true, reason: "ok" }
      : { allowed: false, reason: "missing_capability" };
  }

  return { allowed: false, reason: "not_authenticated" };
}

export function deriveCapabilities(snapshot: EntitlementSnapshot | null): CapabilityKey[] {
  if (!snapshot) return PLAN_CAPABILITIES.free;
  if (snapshot.capabilities.length > 0) return snapshot.capabilities;
  return PLAN_CAPABILITIES[snapshot.plan];
}

export * from "./resolve-entitlement";
