import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("lung-capacity");

export default function LungCapacityPage() {
  return <UseCasePage slug="lung-capacity" />;
}
