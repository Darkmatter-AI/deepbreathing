import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("singing");

export default function SingingPage() {
  return <UseCasePage slug="singing" />;
}
