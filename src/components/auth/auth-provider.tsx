"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useSync } from "@/lib/sync/use-sync";
import { readConversionVariant } from "@/lib/conversion/variant";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string; image?: string | null } | null;
  syncSettings: (settings: { mode: string; speed: number; duration: number | null }) => void;
  syncStats: (totalMinutes: number, sessionsCompleted: number) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  syncSettings: () => {},
  syncStats: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function gtagSafe(...args: unknown[]) {
  if (typeof window === "undefined") return;
  const fn = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof fn === "function") fn(...args);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { mergeGuestData, hydrateFromServer, syncSettings, syncStats } =
    useSync(isAuthenticated);
  const hasMerged = useRef(false);

  // On first auth, merge guest data then hydrate
  useEffect(() => {
    if (!isAuthenticated || hasMerged.current) return;
    hasMerged.current = true;

    (async () => {
      await mergeGuestData();
      await hydrateFromServer();
    })();
  }, [isAuthenticated, mergeGuestData, hydrateFromServer]);

  // Identify the user to GA4 so events stitch across devices and signed-up
  // users are segmentable in reports. Send only the non-PII user UUID — never
  // email or name. Fires the one-shot signup_user_identified marker the first
  // time GA4 sees this user_id in this browser, so we can split pre/post
  // identification analytics later.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      // On logout, detach so subsequent events aren't attributed to the prior user.
      gtagSafe("set", "user_id", null);
      return;
    }

    // Attach the A/B bucket as a user property so the converted user is
    // segmentable by arm in GA4 (the truth metric: prompt_shown -> real signup).
    const variant = readConversionVariant();
    gtagSafe("set", "user_id", userId);
    gtagSafe("set", "user_properties", { signed_up: true, conversion_variant: variant });

    if (typeof window === "undefined") return;
    const flagKey = `ga_user_identified_${userId}`;
    if (!localStorage.getItem(flagKey)) {
      localStorage.setItem(flagKey, "1");
      gtagSafe("event", "signup_user_identified", { user_id_set: true, variant });
    }
  }, [userId]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: session?.user ?? null,
        syncSettings,
        syncStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
