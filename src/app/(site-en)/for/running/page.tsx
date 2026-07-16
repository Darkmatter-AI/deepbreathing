import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("running");

export default function RunningPage() {
  return <UseCasePage slug="running" />;
}
