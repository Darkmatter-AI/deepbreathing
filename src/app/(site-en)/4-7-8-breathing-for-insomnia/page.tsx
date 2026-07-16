import sourceContent from "@/i18n/content/bespoke/insomnia-4-7-8/source.json";
import type { InsomniaPageContent } from "@/i18n/content/bespoke/insomnia-4-7-8/types";

import {
  createInsomniaMetadataFromContent,
  InsomniaPage,
} from "./insomnia-page";

const englishContent = sourceContent as InsomniaPageContent;

export const metadata = createInsomniaMetadataFromContent(englishContent);

export default function FourSevenEightInsomniaPage() {
  return <InsomniaPage />;
}
