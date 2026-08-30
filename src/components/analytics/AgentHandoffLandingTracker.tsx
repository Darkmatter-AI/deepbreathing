"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { PRODUCTION_HOSTNAMES } from "@/lib/analytics/google-analytics";

const TRACKED_SESSION_KEY = "agent_handoff_landing:recommend";

type AgentHandoffGtag = (
  command: "event",
  name: "agent_handoff_landing",
  params: {
    handoff_agent: "assistant";
    handoff_surface: "recommend";
  },
) => void;

export function shouldTrackAgentHandoff({
  pathname,
  hostname,
  marker,
  alreadyTracked,
}: {
  pathname: string;
  hostname: string;
  marker: string | null;
  alreadyTracked: boolean;
}): boolean {
  return pathname === "/recommend"
    && PRODUCTION_HOSTNAMES.has(hostname)
    && marker === "assistant"
    && !alreadyTracked;
}

export function AgentHandoffLandingTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;

    const alreadyTracked = sessionStorage.getItem(TRACKED_SESSION_KEY) === "1";
    if (!shouldTrackAgentHandoff({
      pathname,
      hostname: window.location.hostname,
      marker: searchParams?.get("agent_handoff") ?? null,
      alreadyTracked,
    })) return;

    const gtag = (window as unknown as { gtag?: AgentHandoffGtag }).gtag;
    if (typeof gtag !== "function") return;

    sessionStorage.setItem(TRACKED_SESSION_KEY, "1");
    gtag("event", "agent_handoff_landing", {
      handoff_agent: "assistant",
      handoff_surface: "recommend",
    });
  }, [pathname, searchParams]);

  return null;
}
