export type PrivacySupportLocale =
  | "de-de"
  | "es-es"
  | "fr-fr"
  | "ja-jp"
  | "pt-br";

export interface PrivacyContent {
  readonly metadata: PageMetadataContent;
  readonly breadcrumb: BreadcrumbContent;
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
    readonly lastUpdated: string;
  };
  readonly sections: {
    readonly collection: TextSection;
    readonly accounts: TextSection;
    readonly useAndShare: TextSection;
    readonly deletion: QuotedActionSection;
    readonly device: TextSection;
    readonly thirdParty: TextSection;
    readonly contact: {
      readonly title: string;
      readonly intro: string;
      readonly abiassiLabel: string;
      readonly darkmatterLabel: string;
      readonly backLink: string;
    };
  };
}

export interface SupportContent {
  readonly metadata: PageMetadataContent;
  readonly breadcrumb: BreadcrumbContent;
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
  };
  readonly contact: {
    readonly title: string;
    readonly emailBefore: string;
    readonly emailAddress: string;
    readonly emailAfter: string;
    readonly teamBefore: string;
    readonly darkmatterLabel: string;
  };
  readonly commonQuestions: {
    readonly title: string;
    readonly account: QuestionAnswer;
    readonly deletion: QuotedActionQuestion;
    readonly data: {
      readonly question: string;
      readonly bodyBeforeLink: string;
      readonly linkLabel: string;
      readonly bodyAfterLink: string;
    };
    readonly audio: QuestionAnswer;
    readonly medical: QuestionAnswer;
  };
  readonly safety: TextSection;
  readonly backLink: string;
}

interface PageMetadataContent {
  readonly title: string;
  readonly description: string;
  readonly socialTitle: string;
  readonly socialDescription: string;
  readonly twitterTitle: string;
  readonly twitterDescription: string;
  readonly imageAlt: string;
}

interface BreadcrumbContent {
  readonly home: string;
  readonly current: string;
}

interface TextSection {
  readonly title: string;
  readonly body: string;
}

interface QuotedActionSection {
  readonly title: string;
  readonly beforeAction: string;
  readonly action: string;
  readonly afterAction: string;
}

interface QuestionAnswer {
  readonly question: string;
  readonly answer: string;
}

interface QuotedActionQuestion {
  readonly question: string;
  readonly beforeAction: string;
  readonly action: string;
  readonly afterAction: string;
}
