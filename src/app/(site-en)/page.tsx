import dynamic from "next/dynamic";

import sourceContent from "@/i18n/content/bespoke/home/source.json";
import type { HomePageContent } from "@/i18n/content/bespoke/home/types";
import type { ModeName } from "@/components/resonance/types";

import { HomePage } from "./home-page";

// Keep the useSearchParams-driven interactive experience inside a client island
// so the homepage sections, FAQ, and footer remain static server HTML (a direct
// import of Resonance bails the whole page out to client-side rendering).
const Resonance = dynamic(
  () => import("@/components/resonance/Resonance"),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden="true" className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    ),
  },
);

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
