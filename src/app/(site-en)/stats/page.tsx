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

// StatsPage reads the signed-in user's session, so this route must never be
// prerendered. It was: `auth.api` is evaluated before the `headers()` call that
// would otherwise bail the render to dynamic, so a build with no
// BETTER_AUTH_SECRET constructed betterAuth() during static generation and
// crashed the worker — every preview branch, since all Vercel preview env vars
// are branch-scoped. Being explicit here also matches the noindex contract
// above: this page is per-user and has nothing cacheable to prerender.
export const dynamic = "force-dynamic";

export default function EnglishStatsPage() {
  return <StatsPage content={englishContent} />;
}
