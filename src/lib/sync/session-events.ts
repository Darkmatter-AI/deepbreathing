import type {
  BreathingMode,
  SessionEndReason,
  SessionEvent,
} from "@resonance/domain";

const BREATHING_MODES = new Set<BreathingMode>([
  "Box Breathing",
  "4-7-8 Relax",
  "Coherent Breathing",
  "Physiological Sigh",
  "Wim Hof Breathing",
  "Pursed Lip Breathing",
  "Nadi Shodhana",
  "Ujjayi Breathing",
  "Belly Breathing",
  "Buteyko Breathing",
  "Tummo Breathing",
  "Breath of Fire",
]);

const END_REASONS = new Set<SessionEndReason>([
  "completed",
  "paused",
  "mode_switched",
]);

const PLATFORMS = new Set(["web", "ios", "android"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ValidSessionEvent = Omit<SessionEvent, "userId">;

export type SessionEventValidation =
  | { ok: true; event: ValidSessionEvent }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function isLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !LOCAL_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateSessionEvent(value: unknown): SessionEventValidation {
  if (!isRecord(value)) return { ok: false, error: "Event must be an object" };

  if (typeof value.id !== "string" || !UUID_PATTERN.test(value.id)) {
    return { ok: false, error: "Event id must be a UUID" };
  }
  if (
    typeof value.practiceId !== "string" ||
    !UUID_PATTERN.test(value.practiceId)
  ) {
    return { ok: false, error: "practiceId must be a UUID" };
  }
  if (!isIsoTimestamp(value.startedAt) || !isIsoTimestamp(value.endedAt)) {
    return { ok: false, error: "Session timestamps must be ISO 8601 UTC values" };
  }
  if (Date.parse(value.endedAt) < Date.parse(value.startedAt)) {
    return { ok: false, error: "Session cannot end before it starts" };
  }
  if (
    typeof value.seconds !== "number" ||
    !Number.isInteger(value.seconds) ||
    value.seconds < 1 ||
    value.seconds > 3600
  ) {
    return { ok: false, error: "Session seconds must be an integer from 1 to 3600" };
  }
  if (!BREATHING_MODES.has(value.mode as BreathingMode)) {
    return { ok: false, error: "Unknown breathing mode" };
  }
  if (typeof value.completed !== "boolean") {
    return { ok: false, error: "completed must be a boolean" };
  }
  if (!END_REASONS.has(value.endReason as SessionEndReason)) {
    return { ok: false, error: "Unknown session end reason" };
  }
  if (!PLATFORMS.has(value.platform as string)) {
    return { ok: false, error: "Unknown platform" };
  }
  if (!isLocalDate(value.localDate)) {
    return { ok: false, error: "localDate must be a real YYYY-MM-DD date" };
  }
  if (
    value.guestId !== undefined &&
    (typeof value.guestId !== "string" || value.guestId.length > 128)
  ) {
    return { ok: false, error: "guestId is invalid" };
  }
  if (
    value.clientVersion !== undefined &&
    (typeof value.clientVersion !== "string" || value.clientVersion.length > 64)
  ) {
    return { ok: false, error: "clientVersion is invalid" };
  }

  const event: ValidSessionEvent = {
    id: value.id,
    practiceId: value.practiceId,
    ...(value.guestId ? { guestId: value.guestId } : {}),
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    seconds: value.seconds,
    mode: value.mode as BreathingMode,
    completed: value.completed,
    endReason: value.endReason as SessionEndReason,
    platform: value.platform as ValidSessionEvent["platform"],
    localDate: value.localDate,
    ...(value.clientVersion ? { clientVersion: value.clientVersion } : {}),
  };

  return { ok: true, event };
}

export function encodeSessionCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify([createdAt, id]), "utf8").toString("base64url");
}

export function decodeSessionCursor(
  cursor: string
): { createdAt: string; id: string } | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    );
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 2 ||
      !isIsoTimestamp(parsed[0]) ||
      typeof parsed[1] !== "string" ||
      !UUID_PATTERN.test(parsed[1])
    ) {
      return null;
    }
    return { createdAt: parsed[0], id: parsed[1] };
  } catch {
    return null;
  }
}
