export interface HomeLink {
  readonly href: string;
  readonly label: string;
}

export interface HomeModeCard {
  readonly slug: string;
  readonly displaySlug: string;
  readonly mode: string;
  readonly color: string;
  readonly href: string;
  readonly pillLabel: string;
  readonly cardTitle: string;
  readonly description: string;
  readonly startCta: string;
}

export interface HomePageContent {
  readonly site: {
    readonly baseUrl: string;
  };
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly openGraph: {
      readonly title: string;
      readonly description: string;
      readonly siteName: string;
      readonly type: "website";
      readonly image: {
        readonly width: number;
        readonly height: number;
      };
      readonly imageAlt: string;
    };
    readonly twitter: {
      readonly title: string;
      readonly description: string;
      readonly creator: string;
    };
  };
  readonly schema: {
    readonly website: {
      readonly "@context": "https://schema.org";
      readonly "@type": "WebSite";
      readonly name: string;
      readonly url: string;
      readonly description: string;
    };
    readonly faq: {
      readonly "@context": "https://schema.org";
      readonly "@type": "FAQPage";
    };
  };
  readonly hero: {
    readonly label: string;
    readonly title: string;
    readonly subtitle: string;
    readonly actions: {
      readonly startSession: string;
      readonly pickMode: string;
    };
    readonly startButton: {
      readonly color: string;
      readonly shadow: string;
    };
    readonly headingLevel: number;
  };
  readonly sections: {
    readonly precision: {
      readonly title: string;
      readonly body: string;
    };
    readonly editorialCards: {
      readonly calmByDesign: { readonly eyebrow: string; readonly body: string };
      readonly builtForRealLife: { readonly eyebrow: string; readonly body: string };
      readonly yourPace: { readonly eyebrow: string; readonly body: string };
    };
    readonly modePicker: {
      readonly title: string;
      readonly allTechniquesLabel: string;
      readonly featured: {
        readonly box: HomeModeCard;
        readonly fourSevenEight: HomeModeCard;
        readonly coherent: HomeModeCard;
        readonly physiologicalSigh: HomeModeCard;
        readonly wimHof: HomeModeCard;
      };
    };
    readonly quickAnchor: {
      readonly eyebrow: string;
      readonly title: string;
      readonly intro: string;
      readonly bullets: {
        readonly easy: string;
        readonly nasal: string;
        readonly exhale: string;
      };
      readonly closing: string;
    };
    readonly infoCards: {
      readonly dialItIn: { readonly eyebrow: string; readonly title: string; readonly body: string };
      readonly practiceCues: {
        readonly eyebrow: string;
        readonly title: string;
        readonly items: { readonly nasal: string; readonly exhale: string; readonly shoulders: string };
      };
      readonly howLong: {
        readonly eyebrow: string;
        readonly title: string;
        readonly items: {
          readonly quickReset: string;
          readonly deeperShift: string;
          readonly training: string;
        };
        readonly timerLinks: {
          readonly oneMin: string;
          readonly twoMin: string;
          readonly fiveMin: string;
        };
      };
      readonly bestMoments: {
        readonly eyebrow: string;
        readonly title: string;
        readonly items: {
          readonly beforeEvents: string;
          readonly postConflict: string;
          readonly bedtime: string;
          readonly inFlight: string;
          readonly holidayStress: string;
        };
      };
      readonly whyItWorks: {
        readonly eyebrow: string;
        readonly title: string;
        readonly items: { readonly hrv: string; readonly exhale: string; readonly consistency: string };
      };
    };
    readonly faq: {
      readonly title: string;
      readonly items: {
        readonly howLong: { readonly question: string; readonly answer: string };
        readonly bestTime: { readonly question: string; readonly answer: string };
        readonly timing: { readonly question: string; readonly answer: string };
        readonly lightHeaded: { readonly question: string; readonly answer: string };
        readonly medical: { readonly question: string; readonly answer: string };
      };
    };
    readonly nextLinks: {
      readonly title: string;
      readonly intro: string;
      readonly links: {
        readonly boxApp: string;
        readonly twoMinute: string;
        readonly running: string;
        readonly tummo: string;
      };
    };
  };
  readonly footer: {
    readonly safetyNote: string;
    readonly columns: {
      readonly techniques: { readonly title: string; readonly links: Record<string, HomeLink> };
      readonly guides: { readonly title: string; readonly links: Record<string, HomeLink> };
      readonly timers: { readonly title: string; readonly links: Record<string, HomeLink> };
      readonly info: { readonly title: string; readonly links: Record<string, HomeLink> };
      readonly situations: { readonly title: string; readonly links: Record<string, HomeLink> };
    };
    readonly credits: {
      readonly prefix: string;
      readonly abiassi: string;
      readonly darkmatter: string;
    };
    readonly languagesLink: string;
  };
}
