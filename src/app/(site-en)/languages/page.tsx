import type { Metadata } from "next";
import Link from "next/link";

import { createOgImagePath } from "@/lib/seo/og-image";

const SITE_URL = "https://deepbreathingexercises.com";

const LOCALES = [
  { prefix: "", native: "English", name: "English", code: "en" },
  { prefix: "/es", native: "Español", name: "Spanish", code: "es" },
  {
    prefix: "/pt",
    native: "Português",
    name: "Portuguese (Brazil)",
    code: "pt",
  },
  { prefix: "/fr", native: "Français", name: "French", code: "fr" },
  { prefix: "/de", native: "Deutsch", name: "German", code: "de" },
  { prefix: "/ja", native: "日本語", name: "Japanese", code: "ja" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

type LocalizedKeyPage = {
  path: string;
  labels: Record<LocaleCode, string>;
};

const KEY_PAGES = [
  {
    path: "/",
    labels: {
      en: "Home",
      es: "Inicio",
      pt: "Início",
      fr: "Accueil",
      de: "Startseite",
      ja: "ホーム",
    },
  },
  {
    path: "/breathe",
    labels: {
      en: "Techniques",
      es: "Técnicas",
      pt: "Técnicas",
      fr: "Techniques de respiration",
      de: "Atemtechniken",
      ja: "呼吸法",
    },
  },
  {
    path: "/for",
    labels: {
      en: "Use cases",
      es: "Casos de uso",
      pt: "Casos de uso",
      fr: "Cas d’utilisation",
      de: "Anwendungsfälle",
      ja: "目的別ガイド",
    },
  },
  {
    path: "/breathing-visualizer",
    labels: {
      en: "Breathing visualizer",
      es: "Visualizador de respiración",
      pt: "Visualizador de respiração",
      fr: "Visualiseur de respiration",
      de: "Atemvisualisierer",
      ja: "呼吸ビジュアライザー",
    },
  },
  {
    path: "/breathing-app",
    labels: {
      en: "Breathing app",
      es: "Aplicación de respiración",
      pt: "Aplicativo de respiração",
      fr: "Application de respiration",
      de: "Atem-App",
      ja: "呼吸アプリ",
    },
  },
  {
    path: "/4-7-8-breathing-timer",
    labels: {
      en: "4-7-8 breathing timer",
      es: "Temporizador de respiración 4-7-8",
      pt: "Temporizador de respiração 4-7-8",
      fr: "Minuteur de respiration 4-7-8",
      de: "4-7-8-Atemtimer",
      ja: "4-7-8呼吸タイマー",
    },
  },
  {
    path: "/box-breathing-app",
    labels: {
      en: "Box breathing app",
      es: "App de respiración cuadrada",
      pt: "Aplicativo de respiração quadrada",
      fr: "Application de respiration carrée",
      de: "Box-Breathing-App",
      ja: "ボックス呼吸アプリ",
    },
  },
  {
    path: "/coherent-breathing-app",
    labels: {
      en: "Coherent breathing app",
      es: "App de respiración coherente",
      pt: "Aplicativo de respiração coerente",
      fr: "Application de cohérence cardiaque",
      de: "App für kohärente Atmung",
      ja: "コヒーレント呼吸アプリ",
    },
  },
  {
    path: "/breathe/4-7-8",
    labels: {
      en: "4-7-8 breathing",
      es: "Respiración 4-7-8",
      pt: "Respiração 4-7-8",
      fr: "Respiration 4-7-8",
      de: "4-7-8-Atemtechnik",
      ja: "4-7-8呼吸法",
    },
  },
  {
    path: "/breathe/box",
    labels: {
      en: "Box breathing",
      es: "Respiración cuadrada",
      pt: "Respiração quadrada",
      fr: "Respiration carrée",
      de: "Box-Atmung",
      ja: "ボックス呼吸法",
    },
  },
  {
    path: "/breathe/buteyko",
    labels: {
      en: "Buteyko breathing",
      es: "Respiración Buteyko",
      pt: "Respiração Buteyko",
      fr: "Respiration Buteyko",
      de: "Buteyko-Atmung",
      ja: "ブテイコ呼吸法",
    },
  },
  {
    path: "/breathe/coherent",
    labels: {
      en: "Coherent breathing",
      es: "Respiración coherente",
      pt: "Respiração coerente",
      fr: "Cohérence cardiaque",
      de: "Kohärente Atmung",
      ja: "コヒーレント呼吸法",
    },
  },
  {
    path: "/breathe/tummo",
    labels: {
      en: "Tummo breathing",
      es: "Respiración Tummo",
      pt: "Respiração Tummo",
      fr: "Respiration Tummo",
      de: "Tummo-Atmung",
      ja: "トゥンモ呼吸法",
    },
  },
  {
    path: "/breathe/ujjayi",
    labels: {
      en: "Ujjayi breathing",
      es: "Respiración Ujjayi",
      pt: "Respiração Ujjayi",
      fr: "Respiration Ujjayi",
      de: "Ujjayi-Atmung",
      ja: "ウジャイ呼吸法",
    },
  },
  {
    path: "/breathe/wim-hof",
    labels: {
      en: "Wim Hof breathing",
      es: "Respiración Wim Hof",
      pt: "Respiração Wim Hof",
      fr: "Méthode Wim Hof",
      de: "Wim Hof Methode",
      ja: "ヴィム・ホフ呼吸法",
    },
  },
  {
    path: "/breathe/physiological-sigh",
    labels: {
      en: "Physiological sigh",
      es: "Suspiro fisiológico",
      pt: "Suspiro fisiológico",
      fr: "Soupir physiologique",
      de: "Physiologischer Seufzer",
      ja: "生理的ため息",
    },
  },
  {
    path: "/breathe/belly",
    labels: {
      en: "Belly breathing",
      es: "Respiración abdominal",
      pt: "Respiração abdominal",
      fr: "Respiration abdominale",
      de: "Bauchatmung",
      ja: "腹式呼吸",
    },
  },
  {
    path: "/breathe/breath-of-fire",
    labels: {
      en: "Breath of fire",
      es: "Respiración de fuego",
      pt: "Respiração do fogo",
      fr: "Respiration du feu",
      de: "Feueratmung",
      ja: "火の呼吸",
    },
  },
  {
    path: "/breathe/nadi-shodhana",
    labels: {
      en: "Nadi Shodhana",
      es: "Nadi Shodhana",
      pt: "Nadi Shodhana",
      fr: "Respiration alternée (Nadi Shodhana)",
      de: "Wechselatmung (Nadi Shodhana)",
      ja: "ナーディ・ショーダナ",
    },
  },
  {
    path: "/breathe/pursed-lip",
    labels: {
      en: "Pursed-lip breathing",
      es: "Respiración con labios fruncidos",
      pt: "Respiração com lábios franzidos",
      fr: "Respiration à lèvres pincées",
      de: "Lippenbremse",
      ja: "口すぼめ呼吸",
    },
  },
  {
    path: "/for/anxiety",
    labels: {
      en: "For anxiety",
      es: "Para la ansiedad",
      pt: "Para ansiedade",
      fr: "Pour l’anxiété",
      de: "Bei Angst",
      ja: "不安対策",
    },
  },
  {
    path: "/for/panic-attacks",
    labels: {
      en: "For panic attacks",
      es: "Para ataques de pánico",
      pt: "Para ataques de pânico",
      fr: "Pour les crises de panique",
      de: "Bei Panikattacken",
      ja: "パニック発作対策",
    },
  },
  {
    path: "/for/sleep",
    labels: {
      en: "For sleep",
      es: "Para dormir",
      pt: "Para dormir",
      fr: "Pour le sommeil",
      de: "Für den Schlaf",
      ja: "睡眠のための呼吸法",
    },
  },
  {
    path: "/for/stress",
    labels: {
      en: "For stress",
      es: "Para el estrés",
      pt: "Para estresse",
      fr: "Pour le stress",
      de: "Bei Stress",
      ja: "ストレス対策",
    },
  },
  {
    path: "/for/huberman",
    labels: {
      en: "Huberman protocols",
      es: "Protocolos de Huberman",
      pt: "Protocolos do Huberman",
      fr: "Protocoles Huberman",
      de: "Huberman-Protokolle",
      ja: "ヒューバーマンの呼吸プロトコル",
    },
  },
] as const satisfies readonly LocalizedKeyPage[];

function resolveHref(prefix: string, path: string): string {
  if (path === "/") return `${SITE_URL}${prefix || "/"}`;
  return `${SITE_URL}${prefix}${path}`;
}

const OG_IMAGE_ALT = "Deep Breathing Exercises in 6 languages";
const ogImageUrl = createOgImagePath(OG_IMAGE_ALT);

export const metadata: Metadata = {
  title: "Languages — Deep Breathing Exercises in 6 languages",
  description:
    "Deep Breathing Exercises is available in English, Español, Português, Français, Deutsch, and 日本語. Jump straight to techniques and guides in your language.",
  alternates: { canonical: `${SITE_URL}/languages` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Deep Breathing Exercises in 6 languages",
    description:
      "Breathing techniques, timers, and guides in English, Español, Português, Français, Deutsch, and 日本語.",
    url: `${SITE_URL}/languages`,
    type: "website",
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Breathing Exercises in 6 languages",
    description:
      "Breathing techniques, timers, and guides in 6 languages. Pick yours.",
    images: [ogImageUrl],
  },
};

export default function LanguagesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
        Available in 6 languages
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Deep Breathing Exercises is translated into Spanish, Portuguese, French,
        German, and Japanese. Each language has its own set of breathing
        techniques, timers, and guides. Pick a language below to browse
        translated pages.
      </p>

      <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {LOCALES.map(({ prefix, native, name, code }) => (
          <section
            key={code}
            aria-labelledby={`lang-${code}`}
            lang={code}
            className="space-y-3"
          >
            <h2
              id={`lang-${code}`}
              lang={code === "en" ? undefined : code}
              className="text-xl font-semibold text-foreground"
            >
              <a
                href={resolveHref(prefix, "/")}
                className="underline underline-offset-4 hover:text-primary"
              >
                {native}
              </a>
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({name})
              </span>
            </h2>
            <ul className="space-y-1.5 text-sm">
              {KEY_PAGES.map(({ path, labels }) => (
                <li key={path}>
                  <a
                    href={resolveHref(prefix, path)}
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {labels[code]}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 text-sm text-muted-foreground">
        <Link
          href="/"
          className="underline underline-offset-4 hover:text-foreground"
        >
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
