import sourceContent from "@/i18n/content/bespoke/home/source.json";
import type { HomePageContent } from "@/i18n/content/bespoke/home/types";
import Resonance from "@/components/resonance/Resonance";
import type { ModeName } from "@/components/resonance/types";

import { HomePage } from "./home-page";

const englishContent = sourceContent as unknown as HomePageContent;

export default function EnglishHomePage() {
  return (
    <HomePage
      content={englishContent}
      resonance={(
        <Resonance
          apiKey={process.env.NEXT_PUBLIC_GEMINI_API_KEY}
          className="flex-1 min-h-[60vh] w-full overflow-hidden lg:min-h-screen"
          defaultMode={"Box Breathing" as ModeName}
          noMobileBottomPad
        />
      )}
    />
  );
}
