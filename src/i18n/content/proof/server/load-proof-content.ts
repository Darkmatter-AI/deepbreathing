import "server-only";

import type { BreathingPageContent } from "@/data/breathing-pages";
import type { UseCasePageContent } from "@/data/use-case-pages";

import publication from "../route-content-publication.json";

export type ProofContentLocale = "de-de" | "es-es" | "fr-fr" | "ja-jp" | "pt-br";
export type ProofContentRoute = "/breathe/buteyko" | "/for/anxiety";

type ProofContentByRoute = {
  "/breathe/buteyko": BreathingPageContent;
  "/for/anxiety": UseCasePageContent;
};

const routeContentLoaders = {
  "/breathe/buteyko": {
    "de-de": () => import("../routes/de-de/breathe-buteyko.json").then((module) => module.default),
    "es-es": () => import("../routes/es-es/breathe-buteyko.json").then((module) => module.default),
    "fr-fr": () => import("../routes/fr-fr/breathe-buteyko.json").then((module) => module.default),
    "ja-jp": () => import("../routes/ja-jp/breathe-buteyko.json").then((module) => module.default),
    "pt-br": () => import("../routes/pt-br/breathe-buteyko.json").then((module) => module.default),
  },
  "/for/anxiety": {
    "de-de": () => import("../routes/de-de/for-anxiety.json").then((module) => module.default),
    "es-es": () => import("../routes/es-es/for-anxiety.json").then((module) => module.default),
    "fr-fr": () => import("../routes/fr-fr/for-anxiety.json").then((module) => module.default),
    "ja-jp": () => import("../routes/ja-jp/for-anxiety.json").then((module) => module.default),
    "pt-br": () => import("../routes/pt-br/for-anxiety.json").then((module) => module.default),
  },
} as const;

type Coverage = {
  publishable: boolean;
  sha256: string;
};

export async function loadProofContent<Route extends ProofContentRoute>(
  route: Route,
  locale: ProofContentLocale,
): Promise<Readonly<ProofContentByRoute[Route]>> {
  const coverage = publication.routes[route].locales[locale] as Coverage;
  if (!coverage.publishable || !coverage.sha256) {
    throw new Error(
      `Native i18n proof bundle is unavailable for ${route}:${locale}; refusing incomplete content`,
    );
  }

  const content = await routeContentLoaders[route][locale]();
  return content as unknown as Readonly<ProofContentByRoute[Route]>;
}
