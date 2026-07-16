import "server-only";

import type { StatsContent } from "../types";

import publication from "../publication.json";

export type StatsContentLocale =
  | "de-de"
  | "es-es"
  | "fr-fr"
  | "ja-jp"
  | "pt-br";

const contentLoaders = {
  "de-de": () =>
    import("../messages/de-de.json").then((module) => module.default),
  "es-es": () =>
    import("../messages/es-es.json").then((module) => module.default),
  "fr-fr": () =>
    import("../messages/fr-fr.json").then((module) => module.default),
  "ja-jp": () =>
    import("../messages/ja-jp.json").then((module) => module.default),
  "pt-br": () =>
    import("../messages/pt-br.json").then((module) => module.default),
} as const;

type Coverage = {
  expectedMessages: number;
  coverage: Record<
    StatsContentLocale,
    {
      publishable: boolean;
      resolvedMessages: number;
      sha256: string | null;
    }
  >;
};

export async function loadStatsContent(
  locale: StatsContentLocale,
): Promise<StatsContent> {
  const coverage = publication as Coverage;
  const localeCoverage = coverage.coverage[locale];
  if (
    !localeCoverage.publishable ||
    !localeCoverage.sha256 ||
    localeCoverage.resolvedMessages !== coverage.expectedMessages
  ) {
    throw new Error(
      `Native i18n stats content is incomplete for ${locale}; refusing English fallback`,
    );
  }

  return contentLoaders[locale]() as Promise<StatsContent>;
}
