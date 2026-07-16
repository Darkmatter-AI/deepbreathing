import "server-only";

import type {
  DurationContentLocale,
  DurationContentRoute,
  DurationExercisePageContent,
} from "../types";

import publication from "../publication.json";

const contentLoaders = {
  "1-minute-breathing-exercise": {
    "de-de": () =>
      import("../messages/de-de/1-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/1-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/1-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/1-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/1-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
  },
  "2-minute-breathing-exercise": {
    "de-de": () =>
      import("../messages/de-de/2-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/2-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/2-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/2-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/2-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
  },
  "5-minute-breathing-exercise": {
    "de-de": () =>
      import("../messages/de-de/5-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/es-es/5-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/fr-fr/5-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/ja-jp/5-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/pt-br/5-minute-breathing-exercise.json").then(
        (module) => module.default,
      ),
  },
} as const;

type Coverage = {
  coverage: Record<
    DurationContentRoute,
    Record<
      DurationContentLocale,
      {
        publishable: boolean;
        resolvedMessages: number;
        sha256: string | null;
      }
    >
  >;
  expectedMessages: Record<DurationContentRoute, number>;
};

export async function loadDurationContent(
  route: DurationContentRoute,
  locale: DurationContentLocale,
): Promise<DurationExercisePageContent> {
  const coverage = publication as Coverage;
  const localeCoverage = coverage.coverage[route]?.[locale];
  if (
    !localeCoverage?.publishable ||
    !localeCoverage.sha256 ||
    localeCoverage.resolvedMessages !== coverage.expectedMessages[route]
  ) {
    throw new Error(
      `Native i18n duration content is incomplete for ${route}:${locale}; refusing English fallback`,
    );
  }

  return contentLoaders[route][
    locale
  ]() as Promise<DurationExercisePageContent>;
}
