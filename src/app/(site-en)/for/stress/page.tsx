import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("stress");

export default function StressPage() {
  return <UseCasePage slug="stress" />;
}
