import sourceContent from "@/i18n/content/bespoke/for-index/source.json";
import type { ForIndexContent } from "@/i18n/content/bespoke/for-index/types";

import {
  ForIndexPage,
  createForIndexMetadataFromContent,
} from "./for-index-page";

const content = sourceContent as ForIndexContent;

export const metadata = createForIndexMetadataFromContent(content);

export default function EnglishForIndexPage() {
  return <ForIndexPage content={content} />;
}
