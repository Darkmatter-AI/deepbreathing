import source from "@/i18n/content/bespoke/resonance-guides/source/breathing-exercises-before-surgery.json";
import type { ResonanceGuideContent } from "@/i18n/content/bespoke/resonance-guides/types";

import {
  createResonanceGuideMetadataFromContent,
  ResonanceGuidePage,
} from "../resonance-guide-page";

const content = source as ResonanceGuideContent;
const sourceRoute = "/breathing-exercises-before-surgery";

export const metadata = createResonanceGuideMetadataFromContent(
  content,
  sourceRoute,
);

export default function BreathingExercisesBeforeSurgeryPage() {
  return (
    <ResonanceGuidePage
      route="breathing-exercises-before-surgery"
      content={content}
    />
  );
}
