export const FOR_INDEX_CARD_SLUGS = [
  "public-speaking",
  "high-blood-pressure",
  "sleep",
  "running",
  "anxiety",
  "panic-attacks",
  "focus",
  "meditation",
  "athletes",
  "pregnancy",
  "holiday-stress",
  "travel-anxiety",
  "huberman",
  "stress",
  "kids",
  "pranayama",
  "singing",
  "lung-capacity",
] as const;

export type ForIndexCardSlug = (typeof FOR_INDEX_CARD_SLUGS)[number];

export interface ForIndexContent {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
    readonly twitterDescription: string;
  };
  readonly breadcrumb: {
    readonly home: string;
    readonly useCases: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
  };
  readonly cards: Readonly<Record<ForIndexCardSlug, {
    readonly title: string;
    readonly subtitle: string;
  }>>;
  readonly cardAction: string;
  readonly techniques: {
    readonly title: string;
    readonly description: string;
    readonly action: string;
  };
}
