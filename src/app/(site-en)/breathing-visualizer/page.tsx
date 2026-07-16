import sourceContent from "@/i18n/content/bespoke/breathing-visualizer/source.json";
import type { BreathingVisualizerContent } from "@/i18n/content/bespoke/breathing-visualizer/types";

import {
  BreathingVisualizerPage,
  createBreathingVisualizerMetadataFromContent,
} from "./visualizer-page";

const content = sourceContent as BreathingVisualizerContent;

export const metadata = createBreathingVisualizerMetadataFromContent(content);

export default function Page() {
  return <BreathingVisualizerPage content={content} />;
}
