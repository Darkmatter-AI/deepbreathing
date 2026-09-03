"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  PRODUCTION_HOSTNAMES,
} from "@/lib/analytics/google-analytics";
import { resolveAgentHandoffSessionId } from "@/lib/agent-referral";

const TRACKED_SESSION_KEY = "agent_handoff_landing:recommend:ga_session";

interface AgentHandoffGtag {
  (
    command: "get",
    target: typeof GOOGLE_ANALYTICS_MEASUREMENT_ID,
    fieldName: "session_id",
    callback: (value: unknown) => void,
  ): void;
  (
    command: "event",
    name: "agent_handoff_landing",
    params: {
      handoff_agent: "assistant";
      handoff_surface: "recommend";
    },
  ): void;
}

export function shouldTrackAgentHandoff({
  pathname,
  hostname,
  marker,
}: {
  pathname: string;
  hostname: string;
  marker: string | null;
}): boolean {
  return pathname === "/recommend"
    && PRODUCTION_HOSTNAMES.has(hostname)
    && marker === "assistant";
}

export function AgentHandoffLandingTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;

    if (
      !shouldTrackAgentHandoff({
        pathname,
        hostname: window.location.hostname,
        marker: searchParams?.get("agent_handoff") ?? null,
      })
    ) {
      return;
    }

    const gtag = (window as unknown as { gtag?: AgentHandoffGtag }).gtag;
    if (typeof gtag !== "function") return;

    gtag("get", GOOGLE_ANALYTICS_MEASUREMENT_ID, "session_id", (currentSessionId) => {
      const sessionIdToTrack = resolveAgentHandoffSessionId({
        storedSessionId: localStorage.getItem(TRACKED_SESSION_KEY),
        currentSessionId,
      });
      if (!sessionIdToTrack) return;

      localStorage.setItem(TRACKED_SESSION_KEY, sessionIdToTrack);
      gtag("event", "agent_handoff_landing", {
        handoff_agent: "assistant",
        handoff_surface: "recommend",
      });
    });
  }, [pathname, searchParams]);

  return null;
}
