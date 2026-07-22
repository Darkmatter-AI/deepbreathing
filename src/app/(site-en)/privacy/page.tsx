import sourceContent from "@/i18n/content/bespoke/privacy-support/source/privacy.json";
import type { PrivacyContent } from "@/i18n/content/bespoke/privacy-support/types";

import {
  createPrivacyMetadataFromContent,
  PrivacyPage,
} from "./privacy-page";

const content = sourceContent as PrivacyContent;

export const metadata = createPrivacyMetadataFromContent(content);

export default function Page() {
  return <PrivacyPage content={content} />;
}
