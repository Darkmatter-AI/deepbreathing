export const AGENT_HANDOFF_DEFAULTS = {
  agent_handoff: "assistant",
  utm_source: "ai_assistant",
  utm_medium: "referral",
  utm_campaign: "recommendation_handoff",
} as const;

const ALLOWED_VALUES = {
  agent_handoff: new Set(["assistant"]),
  utm_source: new Set(["ai_assistant", "chatgpt", "claude", "perplexity"]),
  utm_medium: new Set(["referral"]),
  utm_campaign: new Set(["recommendation_handoff"]),
} satisfies Record<keyof typeof AGENT_HANDOFF_DEFAULTS, ReadonlySet<string>>;

type AgentReferralKey = keyof typeof AGENT_HANDOFF_DEFAULTS;
type SearchParamValue = string | readonly string[] | undefined;
export type AgentReferralSearchParams = Readonly<Record<string, SearchParamValue>>;

export function resolveAgentHandoffSessionId({
  storedSessionId,
  currentSessionId,
}: {
  storedSessionId: string | null;
  currentSessionId: unknown;
}): string | null {
  let normalizedSessionId: string | null = null;
  if (
    typeof currentSessionId === "number"
    && Number.isSafeInteger(currentSessionId)
    && currentSessionId > 0
  ) {
    normalizedSessionId = String(currentSessionId);
  } else if (
    typeof currentSessionId === "string"
    && /^[1-9]\d*$/.test(currentSessionId)
  ) {
    normalizedSessionId = currentSessionId;
  }

  return normalizedSessionId === storedSessionId ? null : normalizedSessionId;
}

function firstValue(value: SearchParamValue): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

function isAgentReferralKey(key: string): key is AgentReferralKey {
  return Object.prototype.hasOwnProperty.call(ALLOWED_VALUES, key);
}

export function readAgentReferralParams(
  searchParams: AgentReferralSearchParams,
): URLSearchParams {
  const result = new URLSearchParams();

  if (searchParams.agent_handoff !== AGENT_HANDOFF_DEFAULTS.agent_handoff) {
    return result;
  }

  for (const key of Object.keys(AGENT_HANDOFF_DEFAULTS)) {
    if (!isAgentReferralKey(key)) continue;
    const candidate = firstValue(searchParams[key]);
    const value = candidate && ALLOWED_VALUES[key].has(candidate)
      ? candidate
      : AGENT_HANDOFF_DEFAULTS[key];
    result.set(key, value);
  }

  return result;
}

export function buildAgentReferralHref(
  internalPath: string,
  searchParams: AgentReferralSearchParams,
): string {
  if (
    !internalPath.startsWith("/")
    || internalPath.startsWith("//")
    || internalPath.includes("?")
    || internalPath.includes("#")
  ) {
    throw new Error("Agent referral links require a plain internal path.");
  }

  const referralParams = readAgentReferralParams(searchParams);
  return referralParams.size > 0
    ? `${internalPath}?${referralParams.toString()}`
    : internalPath;
}
