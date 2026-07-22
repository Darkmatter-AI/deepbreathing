import "server-only";

import type {
  ResonanceRouteClientMessages,
  Rw02RouteClientLocale,
  Rw02RouteClientRoute,
} from "../types";

import publication from "../publication.json";

const messageLoaders = {
  "/box-breathing-before-presentation": {
    "de-de": () =>
      import("../messages/box-breathing-before-presentation/de-de.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/box-breathing-before-presentation/es-es.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/box-breathing-before-presentation/fr-fr.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/box-breathing-before-presentation/ja-jp.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/box-breathing-before-presentation/pt-br.json").then(
        (module) => module.default,
      ),
  },
  "/physiological-sigh-panic-attack": {
    "de-de": () =>
      import("../messages/physiological-sigh-panic-attack/de-de.json").then(
        (module) => module.default,
      ),
    "es-es": () =>
      import("../messages/physiological-sigh-panic-attack/es-es.json").then(
        (module) => module.default,
      ),
    "fr-fr": () =>
      import("../messages/physiological-sigh-panic-attack/fr-fr.json").then(
        (module) => module.default,
      ),
    "ja-jp": () =>
      import("../messages/physiological-sigh-panic-attack/ja-jp.json").then(
        (module) => module.default,
      ),
    "pt-br": () =>
      import("../messages/physiological-sigh-panic-attack/pt-br.json").then(
        (module) => module.default,
      ),
  },
} as const;

const commonKeys = [
  "saveSessionAria",
  "closeAria",
  "title",
  "sessionComplete",
  "modeName",
  "continueWithGoogle",
  "oneTapNoPassword",
  "emailAddressAria",
  "emailPlaceholder",
  "sendLink",
  "saveWithEmail",
] as const;

type Publication = {
  routes: Record<
    Rw02RouteClientRoute,
    {
      messagesPerLocale: number;
      locales: Record<
        Rw02RouteClientLocale,
        {
          publishable: boolean;
          resolvedMessages: number;
          sha256: string | null;
        }
      >;
    }
  >;
};

function assertMessageShape(
  route: Rw02RouteClientRoute,
  locale: Rw02RouteClientLocale,
  value: unknown,
): asserts value is ResonanceRouteClientMessages {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid R-W02 route-client messages for ${route}:${locale}`);
  }
  const messages = value as Record<string, unknown>;
  const expectedKeys =
    route === "/box-breathing-before-presentation"
      ? [...commonKeys, "justNow"]
      : [...commonKeys];
  if (
    Object.keys(messages).length !== expectedKeys.length ||
    expectedKeys.some(
      (key) => typeof messages[key] !== "string" || !messages[key],
    )
  ) {
    throw new Error(`Incomplete R-W02 route-client messages for ${route}:${locale}`);
  }
}

export async function loadRw02RouteClientMessages(
  route: Rw02RouteClientRoute,
  locale: Rw02RouteClientLocale,
): Promise<ResonanceRouteClientMessages> {
  const manifest = publication as Publication;
  const routeCoverage = manifest.routes[route];
  const localeCoverage = routeCoverage?.locales[locale];
  if (
    !localeCoverage?.publishable ||
    !localeCoverage.sha256 ||
    !/^[0-9a-f]{64}$/.test(localeCoverage.sha256) ||
    localeCoverage.resolvedMessages !== routeCoverage.messagesPerLocale
  ) {
    throw new Error(
      `Native i18n R-W02 route-client content is incomplete for ${route}:${locale}; refusing English substitution`,
    );
  }

  const messages = await messageLoaders[route][locale]();
  assertMessageShape(route, locale, messages);
  return messages;
}
