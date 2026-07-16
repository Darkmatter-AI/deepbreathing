import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("kids");

export default function KidsPage() {
  return <UseCasePage slug="kids" />;
}
