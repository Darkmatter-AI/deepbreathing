import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("holiday-stress");

export default function HolidayStressPage() {
  return <UseCasePage slug="holiday-stress" />;
}
