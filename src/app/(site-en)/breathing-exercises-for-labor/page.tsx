import source from "@/i18n/content/bespoke/resonance-guides/source/breathing-exercises-for-labor.json";
import type { ResonanceGuideContent } from "@/i18n/content/bespoke/resonance-guides/types";

import {
  createResonanceGuideMetadataFromContent,
  ResonanceGuidePage,
} from "../resonance-guide-page";

const content = source as ResonanceGuideContent;
const sourceRoute = "/breathing-exercises-for-labor";

export const metadata = createResonanceGuideMetadataFromContent(
  content,
  sourceRoute,
);

export default function BreathingExercisesForLaborPage() {
  return (
    <ResonanceGuidePage
      route="breathing-exercises-for-labor"
      content={content}
    />
  );
}
