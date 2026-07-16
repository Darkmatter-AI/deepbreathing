import "server-only";

import type { InsomniaPageContent } from "../types";

import publication from "../publication.json";

export type InsomniaContentLocale =
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

type Publication = {
  expectedMessages: number;
  locales: Record<
    InsomniaContentLocale,
    {
      publishable: boolean;
      resolvedMessages: number;
      sha256: string | null;
    }
  >;
};

export async function loadInsomniaContent(
  locale: InsomniaContentLocale,
): Promise<InsomniaPageContent> {
  const coverage = (publication as Publication).locales[locale];
  if (
    !coverage.publishable ||
    !coverage.sha256 ||
    !/^[0-9a-f]{64}$/.test(coverage.sha256) ||
    coverage.resolvedMessages !== (publication as Publication).expectedMessages
  ) {
    throw new Error(
      `Native i18n insomnia content is incomplete for ${locale}; refusing English fallback`,
    );
  }
  return contentLoaders[locale]() as Promise<InsomniaPageContent>;
}
