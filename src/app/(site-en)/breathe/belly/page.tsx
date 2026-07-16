import { PatternPage, createPatternMetadata } from "../pattern-page";

export const metadata = createPatternMetadata("belly");

export default function BellyPage() {
  return <PatternPage slug="belly" />;
}
