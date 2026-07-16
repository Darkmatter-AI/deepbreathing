import type { Metadata } from "next";

import sourceContent from "@/i18n/content/bespoke/stats/source.json";
import type { StatsContent } from "@/i18n/content/bespoke/stats/types";

import { StatsPage, createStatsMetadataFromContent } from "./stats-page";

const englishContent = sourceContent as StatsContent;

export const metadata: Metadata = {
  ...createStatsMetadataFromContent(englishContent),
  // Keep the existing noindex contract explicit at the route boundary.
  robots: { index: false },
};

export default function EnglishStatsPage() {
  return <StatsPage content={englishContent} />;
}
