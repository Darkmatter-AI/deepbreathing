import "server-only";

import type { ResonanceRouteClientMessages } from "@/i18n/content/remaining-pages/rw02-route-client/types";

import publication from "../publication.json";
import type {
  BreathingVisualizerContent,
  BreathingVisualizerLocale,
} from "../types";

const contentLoaders = {
  "de-de": () => import("../messages/de-de.json").then((module) => module.default),
  "es-es": () => import("../messages/es-es.json").then((module) => module.default),
  "fr-fr": () => import("../messages/fr-fr.json").then((module) => module.default),
  "ja-jp": () => import("../messages/ja-jp.json").then((module) => module.default),
  "pt-br": () => import("../messages/pt-br.json").then((module) => module.default),
} as const;

const routeClientLoaders = {
  "de-de": () =>
    import("../route-client/messages/de-de.json").then((module) => module.default),
  "es-es": () =>
    import("../route-client/messages/es-es.json").then((module) => module.default),
  "fr-fr": () =>
    import("../route-client/messages/fr-fr.json").then((module) => module.default),
  "ja-jp": () =>
    import("../route-client/messages/ja-jp.json").then((module) => module.default),
  "pt-br": () =>
    import("../route-client/messages/pt-br.json").then((module) => module.default),
} as const;

type Publication = {
  expectedServerMessages: number;
  routeClientMessagesPerLocale: number;
  routeClientReviewedCells: number;
  staleCatalogOnlyCells: number;
  unresolvedCells: number;
  locales: Record<
    BreathingVisualizerLocale,
    {
      contentSha256: string;
      publishable: boolean;
      resolvedRouteClientMessages: number;
      resolvedServerMessages: number;
      routeClientSha256: string;
    }
  >;
};

export interface LoadedBreathingVisualizerContent {
  readonly content: BreathingVisualizerContent;
  readonly routeClientMessages: ResonanceRouteClientMessages;
}

export async function loadBreathingVisualizerContent(
  locale: BreathingVisualizerLocale,
): Promise<LoadedBreathingVisualizerContent> {
  const report = publication as Publication;
  const coverage = report.locales[locale];
  if (
    !coverage?.publishable ||
    report.unresolvedCells !== 0 ||
    report.routeClientReviewedCells !== 60 ||
    report.staleCatalogOnlyCells !== 5 ||
    coverage.resolvedServerMessages !== report.expectedServerMessages ||
    coverage.resolvedRouteClientMessages !==
      report.routeClientMessagesPerLocale ||
    !/^[0-9a-f]{64}$/.test(coverage.contentSha256) ||
    !/^[0-9a-f]{64}$/.test(coverage.routeClientSha256)
  ) {
    throw new Error(
      `Native i18n breathing visualizer content is incomplete for ${locale}; refusing English fallback`,
    );
  }

  const [content, routeClientMessages] = await Promise.all([
    contentLoaders[locale](),
    routeClientLoaders[locale](),
  ]);
  return {
    content: content as BreathingVisualizerContent,
    routeClientMessages: routeClientMessages as ResonanceRouteClientMessages,
  };
}
