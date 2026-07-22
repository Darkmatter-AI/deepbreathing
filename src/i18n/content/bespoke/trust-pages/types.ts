export const TRUST_PAGE_CONTENT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
] as const;

export const TRUST_PAGE_KEYS = ["abi", "editorialPolicy"] as const;

export type TrustPageContentLocale =
  (typeof TRUST_PAGE_CONTENT_LOCALES)[number];
export type TrustPageKey = (typeof TRUST_PAGE_KEYS)[number];

interface TrustMetadataContent {
  readonly title: string;
  readonly description: string;
  readonly socialTitle: string;
  readonly socialDescription: string;
  readonly twitterTitle: string;
  readonly twitterDescription: string;
}

interface MethodologyStepContent {
  readonly title: string;
  readonly body: string;
}

interface FooterContent {
  readonly about: string;
  readonly techniques: string;
  readonly guides: string;
  readonly embed: string;
  readonly privacy: string;
}

export interface AbiPageContent {
  readonly metadata: TrustMetadataContent;
  readonly hero: {
    readonly imageAlt: string;
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
  };
  readonly story: {
    readonly family: string;
    readonly visualizer: string;
    readonly hope: string;
  };
  readonly elsewhere: {
    readonly title: string;
    readonly personalSite: string;
    readonly linkedin: string;
    readonly twitter: string;
  };
  readonly methodology: {
    readonly title: string;
    readonly intro: string;
    readonly steps: {
      readonly coverage: MethodologyStepContent;
      readonly lineage: {
        readonly title: string;
        readonly beforeBook: string;
        readonly bookTitle: string;
        readonly afterBook: string;
      };
      readonly research: MethodologyStepContent;
      readonly verification: MethodologyStepContent;
      readonly evidence: MethodologyStepContent;
      readonly sources: MethodologyStepContent;
    };
    readonly disclaimer: string;
    readonly policyLink: string;
  };
  readonly contact: {
    readonly title: string;
    readonly beforeEmail: string;
    readonly email: string;
    readonly afterEmail: string;
  };
  readonly footer: FooterContent & {
    readonly editorialPolicy: string;
  };
}

interface EditorialPriorityContent {
  readonly title: string;
  readonly body: string;
}

export interface EditorialPolicyPageContent {
  readonly metadata: TrustMetadataContent;
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly lastUpdated: string;
  };
  readonly content: {
    readonly whatSiteIs: {
      readonly title: string;
      readonly beforeAbi: string;
      readonly abiName: string;
      readonly afterAbi: string;
    };
    readonly attribution: {
      readonly title: string;
      readonly originators: string;
      readonly longerLineage: string;
    };
    readonly citations: {
      readonly title: string;
      readonly intro: string;
      readonly priorityIntro: string;
      readonly priorities: {
        readonly reviews: EditorialPriorityContent;
        readonly trials: EditorialPriorityContent;
        readonly mechanisms: EditorialPriorityContent;
        readonly practitioners: EditorialPriorityContent;
      };
    };
    readonly claims: {
      readonly title: string;
      readonly evidence: string;
      readonly scrutiny: string;
    };
    readonly exclusions: {
      readonly title: string;
      readonly diagnoses: string;
      readonly cures: string;
      readonly credentials: string;
      readonly overstatement: string;
    };
    readonly updates: {
      readonly title: string;
      readonly beforeEmail: string;
      readonly email: string;
      readonly afterEmail: string;
    };
    readonly whoBuilt: {
      readonly title: string;
      readonly beforeAbi: string;
      readonly abiName: string;
      readonly beforeDarkmatter: string;
      readonly darkmatterName: string;
      readonly disclaimer: string;
    };
  };
  readonly footer: FooterContent & {
    readonly aboutAbi: string;
  };
}

export interface TrustPageContentMap {
  readonly abi: AbiPageContent;
  readonly editorialPolicy: EditorialPolicyPageContent;
}
