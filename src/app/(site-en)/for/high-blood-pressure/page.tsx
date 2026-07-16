import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("high-blood-pressure");

export default function HighBloodPressurePage() {
  return <UseCasePage slug="high-blood-pressure" />;
}
