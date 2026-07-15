import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("pranayama");

export default function PranayamaPage() {
  return <UseCasePage slug="pranayama" />;
}
