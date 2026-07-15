import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("public-speaking");

export default function PublicSpeakingPage() {
  return <UseCasePage slug="public-speaking" />;
}
