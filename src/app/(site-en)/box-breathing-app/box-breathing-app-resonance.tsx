"use client";

import dynamic from "next/dynamic";
import { createContext, useContext } from "react";

import { ModeName } from "@/components/resonance/types";
import type { LocaleCode } from "@/i18n";

const LoadingLabelContext = createContext("Loading breathing exercise");

function LoadingFallback() {
  const loadingAriaLabel = useContext(LoadingLabelContext);

  return (
    <div
      aria-label={loadingAriaLabel}
      className="min-h-screen flex items-center justify-center bg-background"
      role="status"
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

export function BoxBreathingAppResonance({
  className,
  loadingAriaLabel,
  locale,
  localizedRoutePaths,
  modeDisplayName,
}: {
  className?: string;
  loadingAriaLabel: string;
  locale?: LocaleCode;
  localizedRoutePaths?: readonly string[];
  modeDisplayName: string;
}) {
  return (
    <LoadingLabelContext.Provider value={loadingAriaLabel}>
      <Resonance
        className={className}
        defaultMode={ModeName.Box}
        locale={locale}
        localizedRoutePaths={localizedRoutePaths}
        modeDisplayName={modeDisplayName}
      />
    </LoadingLabelContext.Provider>
  );
}
