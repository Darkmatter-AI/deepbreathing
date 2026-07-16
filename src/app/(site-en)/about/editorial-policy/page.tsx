import sourceContent from "@/i18n/content/bespoke/trust-pages/source.json";
import type { EditorialPolicyPageContent } from "@/i18n/content/bespoke/trust-pages/types";

import {
  createEditorialPolicyMetadataFromContent,
  EditorialPolicyPage,
} from "./editorial-policy-page";

const englishContent =
  sourceContent.editorialPolicy as EditorialPolicyPageContent;

export const metadata =
  createEditorialPolicyMetadataFromContent(englishContent);

export default function EnglishEditorialPolicyPage() {
  return <EditorialPolicyPage content={englishContent} />;
}
