export interface AboutPageContent {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
  };
  readonly breadcrumb: {
    readonly home: string;
    readonly about: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly intro: string;
  };
  readonly sections: {
    readonly whatThisIs: RichLinkSection;
    readonly disclaimer: TextSection;
    readonly whoBuilt: RichLinkSection;
    readonly editorial: TextSection & {
      readonly linkLabel: string;
    };
    readonly links: {
      readonly title: string;
      readonly breathingTechniques: string;
      readonly guidesByGoal: string;
      readonly aboutAbi: string;
      readonly editorialPolicy: string;
      readonly privacy: string;
    };
    readonly credits: {
      readonly title: string;
      readonly abiassi: string;
      readonly darkmatter: string;
    };
  };
}

interface TextSection {
  readonly title: string;
  readonly body: string;
}

interface RichLinkSection {
  readonly title: string;
  readonly beforeLink: string;
  readonly linkLabel: string;
  readonly afterLink: string;
}
