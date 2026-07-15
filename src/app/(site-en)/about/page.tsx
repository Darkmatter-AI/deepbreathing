import sourceContent from "@/i18n/content/bespoke/about/source.json";
import type { AboutPageContent } from "@/i18n/content/bespoke/about/types";

import {
  AboutPage,
  createAboutMetadataFromContent,
} from "./about-page";

const englishContent = sourceContent as AboutPageContent;

export const metadata = createAboutMetadataFromContent(englishContent);

export default function EnglishAboutPage() {
  return <AboutPage />;
}

