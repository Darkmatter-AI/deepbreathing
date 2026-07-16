import dynamic from "next/dynamic";

import type { ModeName } from "@/components/resonance/types";
import type { LocaleCode } from "@/i18n";

const Resonance = dynamic(
  () => import("@/components/resonance/Resonance"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    ),
  },
);

export function LocalizedHomeResonance({
  locale,
  localizedRoutePaths,
  modeDisplayName,
}: {
  locale: LocaleCode;
  localizedRoutePaths: readonly string[];
  modeDisplayName: string;
}) {
  return (
    <Resonance
      apiKey={process.env.NEXT_PUBLIC_GEMINI_API_KEY}
      className="flex-1 min-h-[60vh] w-full overflow-hidden lg:min-h-screen"
      defaultMode={"Box Breathing" as ModeName}
      noMobileBottomPad
      locale={locale}
      localizedRoutePaths={localizedRoutePaths}
      modeDisplayName={modeDisplayName}
    />
  );
}
