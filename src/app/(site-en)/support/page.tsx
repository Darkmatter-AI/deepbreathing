import sourceContent from "@/i18n/content/bespoke/privacy-support/source/support.json";
import type { SupportContent } from "@/i18n/content/bespoke/privacy-support/types";

import {
  createSupportMetadataFromContent,
  SupportPage,
} from "./support-page";

const content = sourceContent as SupportContent;

export const metadata = createSupportMetadataFromContent(content);

export default function Page() {
  return <SupportPage content={content} />;
}
