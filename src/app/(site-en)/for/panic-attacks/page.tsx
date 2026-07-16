import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("panic-attacks");

export default function PanicAttacksPage() {
  return <UseCasePage slug="panic-attacks" />;
}
