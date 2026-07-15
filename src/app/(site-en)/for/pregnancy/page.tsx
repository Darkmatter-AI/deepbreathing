import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("pregnancy");

export default function PregnancyPage() {
  return <UseCasePage slug="pregnancy" />;
}
