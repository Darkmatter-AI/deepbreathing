export const HOLIDAY_CONTENT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
] as const;

export type HolidayContentLocale = (typeof HOLIDAY_CONTENT_LOCALES)[number];

export type HolidayRichTextToken =
  | { readonly text: string }
  | { readonly linkText: string };

interface HolidayCardContent {
  readonly title: string;
  readonly description: string;
}

export interface HolidayBreathingContent {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
    readonly twitterTitle: string;
    readonly twitterDescription: string;
    readonly imageTitle: string;
    readonly imageSubtitle: string;
    readonly imageAlt: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly action: string;
  };
  readonly share: {
    readonly text: string;
    readonly buttonText: string;
    readonly copiedText: string;
  };
  readonly holidayGuides: {
    readonly title: string;
    readonly action: string;
    readonly items: readonly (HolidayCardContent & {
      readonly timing: string;
    })[];
  };
  readonly quickStart: {
    readonly title: string;
    readonly action: string;
    readonly items: readonly (HolidayCardContent & {
      readonly timing: string;
    })[];
  };
  readonly moments: {
    readonly title: string;
    readonly items: readonly (HolidayCardContent & {
      readonly technique: string;
    })[];
  };
  readonly dayPlans: {
    readonly title: string;
    readonly items: readonly {
      readonly title: string;
      readonly steps: readonly {
        readonly timing: string;
        readonly action: string;
      }[];
    }[];
  };
  readonly whyItWorks: {
    readonly title: string;
    readonly items: readonly HolidayCardContent[];
  };
  readonly comfortTips: {
    readonly title: string;
    readonly items: readonly string[];
  };
  readonly faq: {
    readonly title: string;
    readonly items: readonly {
      readonly question: string;
      readonly answer: { readonly parts: readonly HolidayRichTextToken[] };
    }[];
  };
  readonly relatedGuides: {
    readonly title: string;
    readonly items: readonly HolidayCardContent[];
  };
  readonly footer: string;
  readonly schema: {
    readonly articleHeadline: string;
    readonly articleDescription: string;
    readonly howToName: string;
    readonly howToDescription: string;
    readonly howToSteps: readonly {
      readonly name: string;
      readonly text: string;
    }[];
  };
}
