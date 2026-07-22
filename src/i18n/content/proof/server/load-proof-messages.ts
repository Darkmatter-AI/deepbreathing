import "server-only";

import publication from "../publication.json";

export type ProofLocale = "de-de" | "es-es" | "fr-fr" | "ja-jp" | "pt-br";
export type ProofRoute = "/breathe/buteyko" | "/for/anxiety";

const bundleLoaders = {
  "/breathe/buteyko": {
    "de-de": () => import("../messages/de-de/breathe-buteyko.json").then((module) => module.default),
    "es-es": () => import("../messages/es-es/breathe-buteyko.json").then((module) => module.default),
    "fr-fr": () => import("../messages/fr-fr/breathe-buteyko.json").then((module) => module.default),
    "ja-jp": () => import("../messages/ja-jp/breathe-buteyko.json").then((module) => module.default),
    "pt-br": () => import("../messages/pt-br/breathe-buteyko.json").then((module) => module.default),
  },
  "/for/anxiety": {
    "de-de": () => import("../messages/de-de/for-anxiety.json").then((module) => module.default),
    "es-es": () => import("../messages/es-es/for-anxiety.json").then((module) => module.default),
    "fr-fr": () => import("../messages/fr-fr/for-anxiety.json").then((module) => module.default),
    "ja-jp": () => import("../messages/ja-jp/for-anxiety.json").then((module) => module.default),
    "pt-br": () => import("../messages/pt-br/for-anxiety.json").then((module) => module.default),
  },
} as const;

type Coverage = {
  expectedMessages: number;
  missingMessages: number;
  presentMessages: number;
  publishable: boolean;
};

export async function loadProofMessages(
  route: ProofRoute,
  locale: ProofLocale,
): Promise<Readonly<Record<string, string>>> {
  const coverage = publication.routes[route].locales[locale] as Coverage;
  if (!coverage.publishable || coverage.missingMessages !== 0) {
    throw new Error(
      `Native i18n proof bundle is incomplete for ${route}:${locale} ` +
      `(${coverage.presentMessages}/${coverage.expectedMessages}); refusing English fallback`,
    );
  }

  const messages = await bundleLoaders[route][locale]() as Readonly<Record<string, string>>;
  if (Object.keys(messages).length !== coverage.expectedMessages) {
    throw new Error(`Native i18n proof bundle count drift for ${route}:${locale}`);
  }
  return messages;
}
