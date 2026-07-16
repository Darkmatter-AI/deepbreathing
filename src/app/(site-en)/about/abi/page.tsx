import sourceContent from "@/i18n/content/bespoke/trust-pages/source.json";
import type { AbiPageContent } from "@/i18n/content/bespoke/trust-pages/types";

import { AbiPage, createAbiMetadataFromContent } from "./abi-page";

const englishContent = sourceContent.abi as AbiPageContent;

export const metadata = createAbiMetadataFromContent(englishContent);

export default function EnglishAbiPage() {
  return <AbiPage content={englishContent} />;
}
