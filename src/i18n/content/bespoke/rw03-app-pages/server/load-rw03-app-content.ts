import "server-only";

import type {
  Rw03AppContentByRoute,
  Rw03AppContentLocale,
  Rw03AppRoute,
} from "../types";

import publication from "../publication.json";

export { RW03_APP_ROUTES } from "../types";
export type {
  Rw03AppContentByRoute,
  Rw03AppContentLocale,
  Rw03AppRoute,
} from "../types";

const contentLoaders = {
  "box-breathing-app": {
    "de-de": () =>
      import("../messages/de-de/box-breathing-app.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/box-breathing-app.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/box-breathing-app.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/box-breathing-app.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/box-breathing-app.json").then(
        (module) => module.default,
      ),
  },
  "breathing-app": {
    "de-de": () =>
      import("../messages/de-de/breathing-app.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/breathing-app.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/breathing-app.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/breathing-app.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/breathing-app.json").then(
        (module) => module.default,
      ),
  },
  "coherent-breathing-app": {
    "de-de": () =>
      import("../messages/de-de/coherent-breathing-app.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/coherent-breathing-app.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/coherent-breathing-app.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/coherent-breathing-app.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/coherent-breathing-app.json").then(
        (module) => module.default,
      ),
  },
} as const;

type Publication = {
  coverage: Record<
    Rw03AppRoute,
    Record<
      Rw03AppContentLocale,
      {
        expectedMessages: number;
        resolvedMessages: number;
        publishable: boolean;
        sha256: string | null;
      }
    >
  >;
};

export async function loadRw03AppContent<R extends Rw03AppRoute>(
  route: R,
  locale: Rw03AppContentLocale,
): Promise<Rw03AppContentByRoute[R]> {
  const coverage = (publication as Publication).coverage[route][locale];
  if (
    !coverage.publishable ||
    !coverage.sha256 ||
    !/^[0-9a-f]{64}$/.test(coverage.sha256) ||
    coverage.resolvedMessages !== coverage.expectedMessages
  ) {
    throw new Error(
      `Native i18n app content is incomplete for ${route}:${locale}; refusing English fallback`,
    );
  }
  return contentLoaders[route][locale]() as Promise<Rw03AppContentByRoute[R]>;
}
