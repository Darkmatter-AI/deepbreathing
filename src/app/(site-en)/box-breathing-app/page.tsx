import sourceContent from "@/i18n/content/bespoke/rw03-app-pages/source/box-breathing-app.json";
import type { BoxBreathingAppContent } from "@/i18n/content/bespoke/rw03-app-pages/types";

import {
  BoxBreathingAppPage,
  createBoxBreathingAppMetadataFromContent,
} from "./box-breathing-app-page";

const englishContent = sourceContent as BoxBreathingAppContent;

export const metadata =
  createBoxBreathingAppMetadataFromContent(englishContent);

export default function Page() {
  return <BoxBreathingAppPage />;
}
