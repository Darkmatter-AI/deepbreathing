import "server-only";

import publication from "../publication.json";
import type {
  PrivacyContent,
  PrivacySupportLocale,
  SupportContent,
} from "../types";

const privacyLoaders = {
  "de-de": () => import("../messages/privacy/de-de.json").then((module) => module.default),
  "es-es": () => import("../messages/privacy/es-es.json").then((module) => module.default),
  "fr-fr": () => import("../messages/privacy/fr-fr.json").then((module) => module.default),
  "ja-jp": () => import("../messages/privacy/ja-jp.json").then((module) => module.default),
  "pt-br": () => import("../messages/privacy/pt-br.json").then((module) => module.default),
} as const;

const supportLoaders = {
  "de-de": () => import("../messages/support/de-de.json").then((module) => module.default),
  "es-es": () => import("../messages/support/es-es.json").then((module) => module.default),
  "fr-fr": () => import("../messages/support/fr-fr.json").then((module) => module.default),
  "ja-jp": () => import("../messages/support/ja-jp.json").then((module) => module.default),
  "pt-br": () => import("../messages/support/pt-br.json").then((module) => module.default),
} as const;

type RoutePublication = {
  expectedMessages: number;
  reviewedGapCells: number;
  renderedGapCells: number;
  staleGapCells: number;
  locales: Record<
    PrivacySupportLocale,
    {
      publishable: boolean;
      resolvedMessages: number;
      sha256: string;
    }
  >;
};

type Publication = {
  unresolvedCells: number;
  routes: {
    privacy: RoutePublication;
    support: RoutePublication;
  };
};

function assertComplete(
  route: "privacy" | "support",
  locale: PrivacySupportLocale,
) {
  const report = publication as Publication;
  const routeReport = report.routes[route];
  const coverage = routeReport.locales[locale];
  if (
    report.unresolvedCells !== 0 ||
    !coverage?.publishable ||
    coverage.resolvedMessages !== routeReport.expectedMessages ||
    !/^[0-9a-f]{64}$/.test(coverage.sha256) ||
    routeReport.reviewedGapCells !== (route === "privacy" ? 15 : 140) ||
    routeReport.renderedGapCells !== (route === "privacy" ? 15 : 125) ||
    routeReport.staleGapCells !== (route === "privacy" ? 0 : 15)
  ) {
    throw new Error(
      `Native i18n ${route} content is incomplete for ${locale}; refusing English fallback`,
    );
  }
}

export async function loadPrivacyContent(
  locale: PrivacySupportLocale,
): Promise<PrivacyContent> {
  assertComplete("privacy", locale);
  return privacyLoaders[locale]() as Promise<PrivacyContent>;
}

export async function loadSupportContent(
  locale: PrivacySupportLocale,
): Promise<SupportContent> {
  assertComplete("support", locale);
  return supportLoaders[locale]() as Promise<SupportContent>;
}
