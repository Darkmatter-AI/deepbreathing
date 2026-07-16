import { PatternPage, createPatternMetadata } from "../pattern-page";

export const metadata = createPatternMetadata("buteyko");

export default function ButeykoPage() {
  return <PatternPage slug="buteyko" />;
}
