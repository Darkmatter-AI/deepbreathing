import "server-only";

import type {
  TrustPageContentLocale,
  TrustPageContentMap,
  TrustPageKey,
} from "../types";

import publication from "../publication.json";

const contentLoaders = {
  "de-de:abi": () =>
    import("../messages/de-de/abi.json").then((module) => module.default),
  "de-de:editorialPolicy": () =>
    import("../messages/de-de/editorialPolicy.json").then(
      (module) => module.default,
    ),
  "es-es:abi": () =>
    import("../messages/es-es/abi.json").then((module) => module.default),
  "es-es:editorialPolicy": () =>
    import("../messages/es-es/editorialPolicy.json").then(
      (module) => module.default,
    ),
  "fr-fr:abi": () =>
    import("../messages/fr-fr/abi.json").then((module) => module.default),
  "fr-fr:editorialPolicy": () =>
    import("../messages/fr-fr/editorialPolicy.json").then(
      (module) => module.default,
    ),
  "ja-jp:abi": () =>
    import("../messages/ja-jp/abi.json").then((module) => module.default),
  "ja-jp:editorialPolicy": () =>
    import("../messages/ja-jp/editorialPolicy.json").then(
      (module) => module.default,
    ),
  "pt-br:abi": () =>
    import("../messages/pt-br/abi.json").then((module) => module.default),
  "pt-br:editorialPolicy": () =>
    import("../messages/pt-br/editorialPolicy.json").then(
      (module) => module.default,
    ),
} as const;

type Coverage = {
  routes: Record<
    TrustPageKey,
    {
      expectedMessages: number;
      locales: Record<
        TrustPageContentLocale,
        {
          publishable: boolean;
          resolvedMessages: number;
          sha256: string | null;
        }
      >;
    }
  >;
};

export async function loadTrustPageContent<K extends TrustPageKey>(
  routeKey: K,
  locale: TrustPageContentLocale,
): Promise<TrustPageContentMap[K]> {
  const coverage = publication as Coverage;
  const routeCoverage = coverage.routes[routeKey];
  const localeCoverage = routeCoverage?.locales[locale];
  if (
    !localeCoverage?.publishable ||
    !localeCoverage.sha256 ||
    localeCoverage.resolvedMessages !== routeCoverage.expectedMessages
  ) {
    throw new Error(
      `Native i18n trust content is incomplete for ${routeKey}:${locale}; refusing English fallback`,
    );
  }

  const key = `${locale}:${routeKey}` as keyof typeof contentLoaders;
  return contentLoaders[key]() as Promise<TrustPageContentMap[K]>;
}
