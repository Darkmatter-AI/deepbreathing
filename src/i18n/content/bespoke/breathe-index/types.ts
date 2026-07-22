export const BREATHE_INDEX_CARD_SLUGS = [
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

export type BreatheIndexCardSlug = (typeof BREATHE_INDEX_CARD_SLUGS)[number];

export interface BreatheIndexContent {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
    readonly twitterDescription: string;
  };
  readonly breadcrumb: {
    readonly home: string;
    readonly techniques: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
  };
  readonly cards: Readonly<Record<BreatheIndexCardSlug, {
    readonly title: string;
    readonly subtitle: string;
  }>>;
  readonly cardAction: string;
  readonly guides: {
    readonly title: string;
    readonly description: string;
    readonly action: string;
  };
}
