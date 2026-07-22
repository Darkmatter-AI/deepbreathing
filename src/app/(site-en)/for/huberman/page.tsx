import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("huberman");

export default function HubermanPage() {
  return <UseCasePage slug="huberman" />;
}
