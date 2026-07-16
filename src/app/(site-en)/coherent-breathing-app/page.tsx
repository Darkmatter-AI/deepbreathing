import sourceContent from "@/i18n/content/bespoke/rw03-app-pages/source/coherent-breathing-app.json";
import type { CoherentBreathingAppContent } from "@/i18n/content/bespoke/rw03-app-pages/types";

import {
  CoherentBreathingAppPage,
  createCoherentBreathingAppMetadataFromContent,
} from "./coherent-breathing-app-page";

const englishContent = sourceContent as CoherentBreathingAppContent;

export const metadata =
  createCoherentBreathingAppMetadataFromContent(englishContent);

export default function Page() {
  return <CoherentBreathingAppPage />;
}
