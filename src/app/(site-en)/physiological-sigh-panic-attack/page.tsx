import source from "@/i18n/content/bespoke/resonance-guides/source/physiological-sigh-panic-attack.json";
import type { ResonanceGuideContent } from "@/i18n/content/bespoke/resonance-guides/types";

import {
  createResonanceGuideMetadataFromContent,
  ResonanceGuidePage,
} from "../resonance-guide-page";

const content = source as ResonanceGuideContent;
const sourceRoute = "/physiological-sigh-panic-attack";

export const metadata = createResonanceGuideMetadataFromContent(
  content,
  sourceRoute,
);

export default function PhysiologicalSighPanicAttackPage() {
  return (
    <ResonanceGuidePage
      route="physiological-sigh-panic-attack"
      content={content}
    />
  );
}
