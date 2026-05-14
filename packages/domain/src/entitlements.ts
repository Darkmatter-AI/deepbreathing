export type Plan = "free" | "pro";

export type CapabilityKey =
  | "history.basic"
  | "history.advanced"
  | "audio.extra_soundscapes"
  | "protocols.advanced"
  | "insights.trends"
  | "export.pdf"
  | "reminders.cross_device"
  | "routines.advanced";

export interface SubscriptionRecord {
  userId: string;
  provider: "web" | "apple" | "google";
  providerCustomerId: string;
  status: "active" | "grace" | "lapsed" | "cancelled";
  periodEnd: string;
}

export interface EntitlementSnapshot {
  userId: string;
  plan: Plan;
  capabilities: CapabilityKey[];
  effectiveAt: string;
  expiresAt?: string | null;
}
