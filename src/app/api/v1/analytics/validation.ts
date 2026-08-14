const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BREATHING_MODES = new Set([
  "Box Breathing", "4-7-8 Relax", "Coherent Breathing", "Physiological Sigh",
  "Wim Hof Breathing", "Pursed Lip Breathing", "Nadi Shodhana", "Ujjayi Breathing",
  "Belly Breathing", "Buteyko Breathing", "Tummo Breathing", "Breath of Fire",
]);
const END_REASONS = new Set(["completed", "paused", "mode_switched"]);
const EVENT_NAMES = new Set([
  "breathing_session_start", "breathing_session_end", "mode_switch", "page_viewed_breathing",
]);

export type AnalyticsEventName =
  | "breathing_session_start"
  | "breathing_session_end"
  | "mode_switch"
  | "page_viewed_breathing";

export type AnalyticsPayload = {
  eventName: AnalyticsEventName;
  clientId: string;
  params: Record<string, string | number>;
  platform: "ios" | "android" | "unknown";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function eventParamKeys(eventName: AnalyticsEventName): readonly string[] {
  switch (eventName) {
    case "breathing_session_start": return ["duration", "mode"];
    case "breathing_session_end": return ["mode", "reason", "seconds_elapsed"];
    case "mode_switch": return ["from", "to"];
    case "page_viewed_breathing": return ["mode"];
  }
}

function validateMode(value: unknown): value is string {
  return typeof value === "string" && BREATHING_MODES.has(value);
}

function validateParams(
  eventName: AnalyticsEventName,
  value: unknown,
): Record<string, string | number> | null {
  if (!isRecord(value)) return null;
  const expectedKeys = eventParamKeys(eventName);
  const actualKeys = Object.keys(value).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== [...expectedKeys].sort()[index])
  ) return null;

  if (eventName === "breathing_session_start") {
    const { duration, mode } = value;
    if (!validateMode(mode) || typeof duration !== "number" || !Number.isInteger(duration) || duration < 0 || duration > 3_600) return null;
    return { duration, mode };
  }
  if (eventName === "breathing_session_end") {
    const { mode, reason, seconds_elapsed } = value;
    if (!validateMode(mode) || typeof reason !== "string" || !END_REASONS.has(reason) || typeof seconds_elapsed !== "number" || !Number.isInteger(seconds_elapsed) || seconds_elapsed < 0 || seconds_elapsed > 3_600) return null;
    return { mode, reason, seconds_elapsed };
  }
  if (eventName === "mode_switch") {
    const { from, to } = value;
    if (!validateMode(from) || !validateMode(to)) return null;
    return { from, to };
  }
  const { mode } = value;
  return validateMode(mode) ? { mode } : null;
}

export function validateAnalyticsPayload(value: unknown): AnalyticsPayload | null {
  if (!isRecord(value)) return null;
  const { eventName, clientId, params, platform } = value;
  if (
    typeof eventName !== "string" || !EVENT_NAMES.has(eventName) ||
    typeof clientId !== "string" || !UUID_PATTERN.test(clientId) ||
    (platform !== "ios" && platform !== "android" && platform !== "unknown")
  ) return null;
  const safeParams = validateParams(eventName as AnalyticsEventName, params);
  if (!safeParams) return null;
  return { eventName: eventName as AnalyticsEventName, clientId, params: safeParams, platform };
}
