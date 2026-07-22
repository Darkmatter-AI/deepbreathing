import { UseCasePage, createUseCaseMetadata } from "../use-case-page";

export const metadata = createUseCaseMetadata("focus");

export default function FocusPage() {
  return <UseCasePage slug="focus" />;
}
