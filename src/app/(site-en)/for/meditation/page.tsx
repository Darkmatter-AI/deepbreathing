import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("meditation");

export default function MeditationPage() {
  return <UseCasePage slug="meditation" />;
}
