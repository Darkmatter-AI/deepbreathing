import "server-only";

import type { ProofServerChromeMessages } from "../types";

import publication from "../server-chrome-publication.json";

import type { ProofContentLocale, ProofContentRoute } from "./load-proof-content";

const chromeLoaders = {
  "/breathe/buteyko": {
    "de-de": () => import("../server-chrome/de-de/breathe-buteyko.json").then((module) => module.default),
    "es-es": () => import("../server-chrome/es-es/breathe-buteyko.json").then((module) => module.default),
    "fr-fr": () => import("../server-chrome/fr-fr/breathe-buteyko.json").then((module) => module.default),
    "ja-jp": () => import("../server-chrome/ja-jp/breathe-buteyko.json").then((module) => module.default),
    "pt-br": () => import("../server-chrome/pt-br/breathe-buteyko.json").then((module) => module.default),
  },
  "/for/anxiety": {
    "de-de": () => import("../server-chrome/de-de/for-anxiety.json").then((module) => module.default),
    "es-es": () => import("../server-chrome/es-es/for-anxiety.json").then((module) => module.default),
    "fr-fr": () => import("../server-chrome/fr-fr/for-anxiety.json").then((module) => module.default),
    "ja-jp": () => import("../server-chrome/ja-jp/for-anxiety.json").then((module) => module.default),
    "pt-br": () => import("../server-chrome/pt-br/for-anxiety.json").then((module) => module.default),
  },
} as const;

type Coverage = {
  expectedMessages: number;
  locales: Record<ProofContentLocale, {
    publishable: boolean;
    resolvedMessages: number;
    sha256: string | null;
  }>;
};

export async function loadProofServerChrome(
  route: ProofContentRoute,
  locale: ProofContentLocale,
): Promise<ProofServerChromeMessages> {
  const routeCoverage = publication.routes[route] as Coverage;
  const localeCoverage = routeCoverage.locales[locale];
  if (
    !localeCoverage.publishable ||
    !localeCoverage.sha256 ||
    localeCoverage.resolvedMessages !== routeCoverage.expectedMessages
  ) {
    throw new Error(
      `Native i18n server chrome is unavailable for ${route}:${locale}; refusing incomplete chrome`,
    );
  }

  return chromeLoaders[route][locale]() as Promise<ProofServerChromeMessages>;
}
