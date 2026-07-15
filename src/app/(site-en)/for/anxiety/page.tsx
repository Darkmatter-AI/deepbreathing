import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("anxiety");

export default function AnxietyPage() {
  return <UseCasePage slug="anxiety" />;
}
