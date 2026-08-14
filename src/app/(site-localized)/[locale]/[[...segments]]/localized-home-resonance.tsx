import type { ModeName } from "@/components/resonance/types";
import type { LocaleCode } from "@/i18n";
import { ResonanceClient as Resonance } from "@/components/resonance/resonance-client";

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
