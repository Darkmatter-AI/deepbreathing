import type { LocaleCode } from "@/i18n";
import { BREATHE_CONTENT_SLUGS } from "@/i18n/content/breathe/types";

export const EMBED_CONTENT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
] as const;

export const VALID_EMBED_SLUGS = BREATHE_CONTENT_SLUGS;

export const EMBED_GENERATOR_SLUGS = [
  "box",
  "4-7-8",
  "coherent",
  "physiological-sigh",
  "wim-hof",
  "pursed-lip",
  "belly",
  "9d-breathwork",
  "hope-cartel-9d-breathwork",
] as const;

export const EMBED_GENERATOR_LOCALES = [
  "en",
  "es",
  "pt",
  "fr",
  "de",
  "ja",
] as const;

export type EmbedContentLocale = (typeof EMBED_CONTENT_LOCALES)[number];
export type EmbedSlug = (typeof VALID_EMBED_SLUGS)[number];
export type EmbedGeneratorSlug = (typeof EMBED_GENERATOR_SLUGS)[number];
export type EmbedGeneratorLocaleCode = (typeof EMBED_GENERATOR_LOCALES)[number];

interface EmbedPatternContent {
  readonly title: string;
  readonly description: string;
}

interface EmbedInfoCardContent {
  readonly title: string;
  readonly description: string;
}

export interface EmbedContent {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
    readonly twitterTitle: string;
    readonly twitterDescription: string;
    readonly imageAlt: string;
  };
  readonly generator: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly choosePattern: string;
    readonly patterns: Readonly<
      Record<EmbedGeneratorSlug, EmbedPatternContent>
    >;
    readonly appearance: {
      readonly title: string;
      readonly auto: string;
      readonly light: string;
      readonly dark: string;
    };
    readonly widgetLanguageAria: string;
    readonly localeLabels: Readonly<Record<EmbedGeneratorLocaleCode, string>>;
    readonly durationAria: string;
    readonly durationLabels: {
      readonly open: string;
      readonly seconds30: string;
      readonly minute1: string;
      readonly minutes3: string;
      readonly minutes5: string;
      readonly minutes10: string;
    };
    readonly sound: {
      readonly title: string;
      readonly binauralLabel: string;
    };
    readonly preview: {
      readonly title: string;
      readonly iframeTitleTemplate: string;
    };
    readonly snippet: {
      readonly title: string;
      readonly copy: string;
      readonly copied: string;
    };
    readonly info: {
      readonly free: EmbedInfoCardContent;
      readonly responsive: EmbedInfoCardContent;
      readonly theme: EmbedInfoCardContent;
    };
    readonly footer: {
      readonly techniques: string;
      readonly guides: string;
      readonly app: string;
      readonly about: string;
    };
  };
  readonly player: {
    readonly loadingAriaLabel: string;
    readonly embedLabel: string;
  };
}

export interface EmbedGeneratorPattern {
  readonly slug: EmbedGeneratorSlug;
  readonly title: string;
  readonly description: string;
  readonly color: string;
}

export interface EmbedGeneratorLocaleOption {
  readonly code: EmbedGeneratorLocaleCode;
  readonly label: string;
  readonly prefix: string;
}

export interface EmbedGeneratorFooterLink {
  readonly href: string;
  readonly label: string;
}

export interface EmbedGeneratorProps {
  readonly content: EmbedContent["generator"];
  readonly initialLocale: EmbedGeneratorLocaleCode;
  readonly pageLocale: LocaleCode;
  readonly localeOptions: readonly EmbedGeneratorLocaleOption[];
  readonly patterns: readonly EmbedGeneratorPattern[];
  readonly footerLinks: readonly EmbedGeneratorFooterLink[];
}

export function toEmbedGeneratorLocale(
  locale: LocaleCode,
): EmbedGeneratorLocaleCode {
  return locale === "en-US"
    ? "en"
    : (locale.slice(0, 2).toLowerCase() as EmbedGeneratorLocaleCode);
}
