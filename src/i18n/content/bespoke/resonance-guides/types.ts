export const RESONANCE_GUIDE_ROUTES = [
  "box-breathing-before-presentation",
  "breathing-exercises-before-surgery",
  "breathing-exercises-for-labor",
  "physiological-sigh-panic-attack",
] as const;

export type ResonanceGuideRoute = (typeof RESONANCE_GUIDE_ROUTES)[number];

export type ResonanceGuideContentLocale =
  | "de-de"
  | "es-es"
  | "fr-fr"
  | "ja-jp"
  | "pt-br";

export interface ResonanceGuideContent {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
    readonly twitterTitle: string;
    readonly twitterDescription: string;
    readonly imageAlt: string;
  };
  readonly runtime: {
    readonly modeDisplayName: string;
  };
  readonly schema: {
    readonly breadcrumbHome: string;
    readonly breadcrumbCurrent: string;
    readonly articleHeadline: string;
    readonly articleDescription: string;
    readonly authorName: string;
    readonly publisherName: string;
    readonly faq: readonly {
      readonly question: string;
      readonly answer: string;
    }[];
  };
  readonly loading: {
    readonly ariaLabel: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
  };
  readonly updated: string;
  readonly alert?: {
    readonly label: string;
    readonly body: string;
  };
  readonly starterGrid?: {
    readonly starter: TextBlock & {
      readonly primaryAction: string;
      readonly secondaryAction: string;
    };
    readonly protocol: {
      readonly title: string;
      readonly items: readonly LabeledItem[];
    };
  };
  readonly urgentProtocol?: {
    readonly title: string;
    readonly items: readonly {
      readonly title: string;
      readonly detail: string;
    }[];
    readonly action: string;
  };
  readonly prose: {
    readonly title: string;
    readonly paragraphs: readonly ProseParagraph[];
    readonly bullets?: readonly LabeledItem[];
  };
  readonly timelineCards?: {
    readonly title: string;
    readonly cards: readonly TextBlock[];
  };
  readonly numberedSteps: {
    readonly title: string;
    readonly steps: readonly TextBlock[];
  };
  readonly faq: {
    readonly title: string;
    readonly items: readonly FaqItem[];
  };
  readonly related: {
    readonly label: string;
    readonly cards: readonly (TextBlock & { readonly action: string })[];
  };
  readonly footer: {
    readonly safety: string;
    readonly links: readonly string[];
  };
}

interface TextBlock {
  readonly title: string;
  readonly body: string;
}

interface LabeledItem {
  readonly label: string;
  readonly body: string;
}

interface ProseParagraph {
  readonly text?: string;
  readonly before?: string;
  readonly strong?: string;
  readonly emphasis?: string;
  readonly after?: string;
}

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}
