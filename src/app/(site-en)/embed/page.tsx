import sourceContent from "@/i18n/content/bespoke/embed/source.json";
import type { EmbedContent } from "@/i18n/content/bespoke/embed/types";

import { createEmbedMetadataFromContent, EmbedPage } from "./embed-page";

const content = sourceContent as EmbedContent;

export const metadata = createEmbedMetadataFromContent(content);

export default function EmbedLandingPage() {
  return <EmbedPage content={content} />;
}
