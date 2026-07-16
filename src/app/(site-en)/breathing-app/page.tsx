import sourceContent from "@/i18n/content/bespoke/rw03-app-pages/source/breathing-app.json";
import type { BreathingAppContent } from "@/i18n/content/bespoke/rw03-app-pages/types";

import {
  BreathingAppPage,
  createBreathingAppMetadataFromContent,
} from "./breathing-app-page";

const englishContent = sourceContent as BreathingAppContent;

export const metadata = createBreathingAppMetadataFromContent(englishContent);

export default function Page() {
  return <BreathingAppPage />;
}
