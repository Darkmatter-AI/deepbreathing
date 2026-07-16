"use client";

import dynamic from "next/dynamic";
import { createContext, useContext } from "react";

import type { ModeName } from "@/components/resonance/types";
import type { LocaleCode } from "@/i18n";
import type { ResonanceRouteClientMessages } from "@/i18n/content/remaining-pages/rw02-route-client/types";

const LoadingLabelContext = createContext("Loading breathing exercise");

function LoadingFallback() {
  const loadingAriaLabel = useContext(LoadingLabelContext);
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      role="status"
      aria-label={loadingAriaLabel}
    >
      <div
        aria-hidden="true"
        className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
      />
    </div>
  );
}

const Resonance = dynamic(() => import("@/components/resonance/Resonance"), {
  ssr: false,
  loading: LoadingFallback,
});

export function ResonanceGuideResonance({
  defaultMode,
  loadingAriaLabel,
  locale,
  localizedRoutePaths,
  modeDisplayName,
  routeClientMessages,
}: {
  defaultMode: ModeName;
  loadingAriaLabel: string;
  locale?: LocaleCode;
  localizedRoutePaths?: readonly string[];
  modeDisplayName: string;
  routeClientMessages?: ResonanceRouteClientMessages;
}) {
  return (
    <LoadingLabelContext.Provider value={loadingAriaLabel}>
      <Resonance
        defaultMode={defaultMode}
        className="min-h-screen"
        locale={locale}
        localizedRoutePaths={localizedRoutePaths}
        modeDisplayName={modeDisplayName}
        routeClientMessages={routeClientMessages}
      />
    </LoadingLabelContext.Provider>
  );
}
