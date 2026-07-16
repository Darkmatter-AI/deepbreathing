import source from "@/i18n/content/bespoke/resonance-guides/source/box-breathing-before-presentation.json";
import type { ResonanceGuideContent } from "@/i18n/content/bespoke/resonance-guides/types";

import {
  createResonanceGuideMetadataFromContent,
  ResonanceGuidePage,
} from "../resonance-guide-page";

const content = source as ResonanceGuideContent;
const sourceRoute = "/box-breathing-before-presentation";

export const metadata = createResonanceGuideMetadataFromContent(
  content,
  sourceRoute,
);

export default function BoxBreathingPresentationPage() {
  return (
    <ResonanceGuidePage
      route="box-breathing-before-presentation"
      content={content}
    />
  );
}
