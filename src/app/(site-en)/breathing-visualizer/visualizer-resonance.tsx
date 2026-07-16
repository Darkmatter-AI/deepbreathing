"use client";

import Resonance from "@/components/resonance/Resonance";
import { ModeName } from "@/components/resonance/types";
import type { LocaleCode } from "@/i18n";
import type { ResonanceRouteClientMessages } from "@/i18n/content/remaining-pages/rw02-route-client/types";

export function VisualizerResonance({
  locale,
  localizedRoutePaths,
  modeDisplayName,
  routeClientMessages,
}: {
  locale?: LocaleCode;
  localizedRoutePaths?: readonly string[];
  modeDisplayName: string;
  routeClientMessages?: ResonanceRouteClientMessages;
}) {
  return (
    <Resonance
      className="min-h-screen"
      defaultMode={ModeName.Box}
      locale={locale}
      localizedRoutePaths={localizedRoutePaths}
      modeDisplayName={modeDisplayName}
      routeClientMessages={routeClientMessages}
    />
  );
}
