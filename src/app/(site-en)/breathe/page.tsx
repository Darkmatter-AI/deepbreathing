import sourceContent from "@/i18n/content/bespoke/breathe-index/source.json";
import type { BreatheIndexContent } from "@/i18n/content/bespoke/breathe-index/types";

import {
  BreatheIndexPage,
  createBreatheIndexMetadataFromContent,
} from "./breathe-index-page";

const content = sourceContent as BreatheIndexContent;

export const metadata = createBreatheIndexMetadataFromContent(content);

export default function EnglishBreatheIndexPage() {
  return <BreatheIndexPage content={content} />;
}
