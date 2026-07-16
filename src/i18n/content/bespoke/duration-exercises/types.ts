export const DURATION_EXERCISE_ROUTES = [
  "1-minute-breathing-exercise",
  "2-minute-breathing-exercise",
  "5-minute-breathing-exercise",
] as const;

export type DurationExerciseRoute = (typeof DURATION_EXERCISE_ROUTES)[number];

export const DURATION_CONTENT_ROUTES = DURATION_EXERCISE_ROUTES;
export type DurationContentRoute = DurationExerciseRoute;
export type DurationContentLocale =
  | "de-de"
  | "es-es"
  | "fr-fr"
  | "ja-jp"
  | "pt-br";

export interface DurationExercisePageContent {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
    readonly twitterDescription: string;
    readonly imageAlt: string;
  };
  readonly breadcrumb: {
    readonly home: string;
    readonly current: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
  };
  readonly quickAnswer?: TextBlock;
  readonly practiceCards: readonly PracticeCard[];
  readonly pattern?: {
    readonly title: string;
    readonly intro: string;
    readonly items: readonly string[];
  };
  readonly primarySection: ContentSection;
  readonly secondarySection?: ContentSection;
  readonly useCases: {
    readonly title: string;
    readonly items: readonly LabeledItem[];
  };
  readonly schemaFaq: readonly FaqSchemaItem[];
  readonly faq: {
    readonly title: string;
    readonly items: readonly VisibleFaqItem[];
  };
  readonly features: readonly TextBlock[];
  readonly moreOptions: {
    readonly title: string;
    readonly intro: string;
    readonly labels: readonly string[];
  };
  readonly share: {
    readonly title: string;
    readonly body: string;
    readonly shareTitle: string;
    readonly shareText: string;
    readonly buttonText: string;
  };
  readonly footer: {
    readonly warning: string;
    readonly labels: readonly string[];
  };
}

interface TextBlock {
  readonly title: string;
  readonly body: string;
}

interface PracticeCard extends TextBlock {
  readonly action: string;
  readonly shareTitle: string;
  readonly shareText: string;
  readonly shareButtonText: string;
}

interface ContentSection {
  readonly title: string;
  readonly intro?: string;
  readonly paragraphs?: readonly string[];
  readonly items?: readonly LabeledItem[];
}

interface LabeledItem {
  readonly label: string;
  readonly body: string;
}

interface FaqSchemaItem {
  readonly question: string;
  readonly answer: string;
}

interface VisibleFaqItem {
  readonly question: string;
  /** Text fragments are joined verbatim; route config places links between them. */
  readonly answerFragments: readonly string[];
}
