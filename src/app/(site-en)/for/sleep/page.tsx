import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("sleep");

export default function SleepPage() {
  return <UseCasePage slug="sleep" />;
}
