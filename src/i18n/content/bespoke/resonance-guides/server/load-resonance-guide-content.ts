import "server-only";

import type {
  ResonanceGuideContent,
  ResonanceGuideContentLocale,
  ResonanceGuideRoute,
} from "../types";

import publication from "../publication.json";

export { RESONANCE_GUIDE_ROUTES } from "../types";
export type {
  ResonanceGuideContentLocale,
  ResonanceGuideRoute,
} from "../types";

const contentLoaders = {
  "box-breathing-before-presentation": {
    "de-de": () =>
      import("../messages/de-de/box-breathing-before-presentation.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/box-breathing-before-presentation.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/box-breathing-before-presentation.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/box-breathing-before-presentation.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/box-breathing-before-presentation.json").then(
        (module) => module.default,
      ),
  },
  "breathing-exercises-before-surgery": {
    "de-de": () =>
      import("../messages/de-de/breathing-exercises-before-surgery.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/breathing-exercises-before-surgery.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/breathing-exercises-before-surgery.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/breathing-exercises-before-surgery.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/breathing-exercises-before-surgery.json").then(
        (module) => module.default,
      ),
  },
  "breathing-exercises-for-labor": {
    "de-de": () =>
      import("../messages/de-de/breathing-exercises-for-labor.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/breathing-exercises-for-labor.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/breathing-exercises-for-labor.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/breathing-exercises-for-labor.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/breathing-exercises-for-labor.json").then(
        (module) => module.default,
      ),
  },
  "physiological-sigh-panic-attack": {
    "de-de": () =>
      import("../messages/de-de/physiological-sigh-panic-attack.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/physiological-sigh-panic-attack.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/physiological-sigh-panic-attack.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/physiological-sigh-panic-attack.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/physiological-sigh-panic-attack.json").then(
        (module) => module.default,
      ),
  },
} as const;

type Publication = {
  coverage: Record<
    ResonanceGuideRoute,
    Record<
      ResonanceGuideContentLocale,
      {
        expectedMessages: number;
        resolvedMessages: number;
        publishable: boolean;
        sha256: string | null;
      }
    >
  >;
};

export async function loadResonanceGuideContent(
  route: ResonanceGuideRoute,
  locale: ResonanceGuideContentLocale,
): Promise<ResonanceGuideContent> {
  const coverage = (publication as Publication).coverage[route][locale];
  if (
    !coverage.publishable ||
    !coverage.sha256 ||
    !/^[0-9a-f]{64}$/.test(coverage.sha256) ||
    coverage.resolvedMessages !== coverage.expectedMessages
  ) {
    throw new Error(
      `Native i18n guide content is incomplete for ${route}:${locale}; refusing English fallback`,
    );
  }
  return contentLoaders[route][locale]() as Promise<ResonanceGuideContent>;
}
