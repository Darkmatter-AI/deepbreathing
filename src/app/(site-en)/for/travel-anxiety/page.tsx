import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("travel-anxiety");

export default function TravelAnxietyPage() {
  return <UseCasePage slug="travel-anxiety" />;
}
