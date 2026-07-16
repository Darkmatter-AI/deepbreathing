import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("athletes");

export default function AthletesPage() {
  return <UseCasePage slug="athletes" />;
}
