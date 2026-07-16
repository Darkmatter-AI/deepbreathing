export type BreathingVisualizerLocale =
  | "de-de"
  | "es-es"
  | "fr-fr"
  | "ja-jp"
  | "pt-br";

export const VISUALIZER_TECHNIQUE_SLUGS = [
  "box",
  "4-7-8",
  "coherent",
  "physiological-sigh",
  "wim-hof",
  "pursed-lip",
  "nadi-shodhana",
  "ujjayi",
  "belly",
  "buteyko",
  "tummo",
  "breath-of-fire",
  "9d-breathwork",
  "hope-cartel-9d-breathwork",
] as const;

export type VisualizerTechniqueSlug =
  (typeof VISUALIZER_TECHNIQUE_SLUGS)[number];

export interface BreathingVisualizerContent {
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
  readonly breadcrumb: {
    readonly home: string;
    readonly current: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly startAction: string;
    readonly pickAction: string;
  };
  readonly quickAnswer: TextBlock;
  readonly benefits: {
    readonly title: string;
    readonly items: readonly TextBlock[];
  };
  readonly techniques: {
    readonly title: string;
    readonly items: Readonly<Record<VisualizerTechniqueSlug, TechniqueCard>>;
  };
  readonly howItWorks: {
    readonly title: string;
    readonly steps: readonly HowToStep[];
  };
  readonly faq: {
    readonly title: string;
    readonly items: readonly FaqItem[];
  };
  readonly moreTools: {
    readonly title: string;
    readonly body: string;
    readonly links: readonly string[];
  };
  readonly footer: {
    readonly warning: string;
    readonly links: readonly string[];
  };
  readonly schema: {
    readonly howToName: string;
    readonly howToDescription: string;
  };
}

interface TextBlock {
  readonly title: string;
  readonly body: string;
}

interface TechniqueCard {
  readonly name: string;
  readonly description: string;
  readonly action: string;
}

interface HowToStep extends TextBlock {
  readonly label: string;
}

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}
