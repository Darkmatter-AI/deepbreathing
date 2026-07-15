import "server-only";

import type { BreathingPageContent } from "@/data/breathing-pages";
import publication from "../publication.json";
import type { BreatheChromeMessages, BreatheContentLocale, BreatheContentSlug, BreatheRouteBundle } from "../types";

const contentLoaders = {
  "de-de:4-7-8": () => import("../routes/de-de/4-7-8.json"),
  "de-de:9d-breathwork": () => import("../routes/de-de/9d-breathwork.json"),
  "de-de:belly": () => import("../routes/de-de/belly.json"),
  "de-de:box": () => import("../routes/de-de/box.json"),
  "de-de:breath-of-fire": () => import("../routes/de-de/breath-of-fire.json"),
  "de-de:buteyko": () => import("../routes/de-de/buteyko.json"),
  "de-de:coherent": () => import("../routes/de-de/coherent.json"),
  "de-de:hope-cartel-9d-breathwork": () => import("../routes/de-de/hope-cartel-9d-breathwork.json"),
  "de-de:nadi-shodhana": () => import("../routes/de-de/nadi-shodhana.json"),
  "de-de:physiological-sigh": () => import("../routes/de-de/physiological-sigh.json"),
  "de-de:pursed-lip": () => import("../routes/de-de/pursed-lip.json"),
  "de-de:tummo": () => import("../routes/de-de/tummo.json"),
  "de-de:ujjayi": () => import("../routes/de-de/ujjayi.json"),
  "de-de:wim-hof": () => import("../routes/de-de/wim-hof.json"),
  "es-es:4-7-8": () => import("../routes/es-es/4-7-8.json"),
  "es-es:9d-breathwork": () => import("../routes/es-es/9d-breathwork.json"),
  "es-es:belly": () => import("../routes/es-es/belly.json"),
  "es-es:box": () => import("../routes/es-es/box.json"),
  "es-es:breath-of-fire": () => import("../routes/es-es/breath-of-fire.json"),
  "es-es:buteyko": () => import("../routes/es-es/buteyko.json"),
  "es-es:coherent": () => import("../routes/es-es/coherent.json"),
  "es-es:hope-cartel-9d-breathwork": () => import("../routes/es-es/hope-cartel-9d-breathwork.json"),
  "es-es:nadi-shodhana": () => import("../routes/es-es/nadi-shodhana.json"),
  "es-es:physiological-sigh": () => import("../routes/es-es/physiological-sigh.json"),
  "es-es:pursed-lip": () => import("../routes/es-es/pursed-lip.json"),
  "es-es:tummo": () => import("../routes/es-es/tummo.json"),
  "es-es:ujjayi": () => import("../routes/es-es/ujjayi.json"),
  "es-es:wim-hof": () => import("../routes/es-es/wim-hof.json"),
  "fr-fr:4-7-8": () => import("../routes/fr-fr/4-7-8.json"),
  "fr-fr:9d-breathwork": () => import("../routes/fr-fr/9d-breathwork.json"),
  "fr-fr:belly": () => import("../routes/fr-fr/belly.json"),
  "fr-fr:box": () => import("../routes/fr-fr/box.json"),
  "fr-fr:breath-of-fire": () => import("../routes/fr-fr/breath-of-fire.json"),
  "fr-fr:buteyko": () => import("../routes/fr-fr/buteyko.json"),
  "fr-fr:coherent": () => import("../routes/fr-fr/coherent.json"),
  "fr-fr:hope-cartel-9d-breathwork": () => import("../routes/fr-fr/hope-cartel-9d-breathwork.json"),
  "fr-fr:nadi-shodhana": () => import("../routes/fr-fr/nadi-shodhana.json"),
  "fr-fr:physiological-sigh": () => import("../routes/fr-fr/physiological-sigh.json"),
  "fr-fr:pursed-lip": () => import("../routes/fr-fr/pursed-lip.json"),
  "fr-fr:tummo": () => import("../routes/fr-fr/tummo.json"),
  "fr-fr:ujjayi": () => import("../routes/fr-fr/ujjayi.json"),
  "fr-fr:wim-hof": () => import("../routes/fr-fr/wim-hof.json"),
  "ja-jp:4-7-8": () => import("../routes/ja-jp/4-7-8.json"),
  "ja-jp:9d-breathwork": () => import("../routes/ja-jp/9d-breathwork.json"),
  "ja-jp:belly": () => import("../routes/ja-jp/belly.json"),
  "ja-jp:box": () => import("../routes/ja-jp/box.json"),
  "ja-jp:breath-of-fire": () => import("../routes/ja-jp/breath-of-fire.json"),
  "ja-jp:buteyko": () => import("../routes/ja-jp/buteyko.json"),
  "ja-jp:coherent": () => import("../routes/ja-jp/coherent.json"),
  "ja-jp:hope-cartel-9d-breathwork": () => import("../routes/ja-jp/hope-cartel-9d-breathwork.json"),
  "ja-jp:nadi-shodhana": () => import("../routes/ja-jp/nadi-shodhana.json"),
  "ja-jp:physiological-sigh": () => import("../routes/ja-jp/physiological-sigh.json"),
  "ja-jp:pursed-lip": () => import("../routes/ja-jp/pursed-lip.json"),
  "ja-jp:tummo": () => import("../routes/ja-jp/tummo.json"),
  "ja-jp:ujjayi": () => import("../routes/ja-jp/ujjayi.json"),
  "ja-jp:wim-hof": () => import("../routes/ja-jp/wim-hof.json"),
  "pt-br:4-7-8": () => import("../routes/pt-br/4-7-8.json"),
  "pt-br:9d-breathwork": () => import("../routes/pt-br/9d-breathwork.json"),
  "pt-br:belly": () => import("../routes/pt-br/belly.json"),
  "pt-br:box": () => import("../routes/pt-br/box.json"),
  "pt-br:breath-of-fire": () => import("../routes/pt-br/breath-of-fire.json"),
  "pt-br:buteyko": () => import("../routes/pt-br/buteyko.json"),
  "pt-br:coherent": () => import("../routes/pt-br/coherent.json"),
  "pt-br:hope-cartel-9d-breathwork": () => import("../routes/pt-br/hope-cartel-9d-breathwork.json"),
  "pt-br:nadi-shodhana": () => import("../routes/pt-br/nadi-shodhana.json"),
  "pt-br:physiological-sigh": () => import("../routes/pt-br/physiological-sigh.json"),
  "pt-br:pursed-lip": () => import("../routes/pt-br/pursed-lip.json"),
  "pt-br:tummo": () => import("../routes/pt-br/tummo.json"),
  "pt-br:ujjayi": () => import("../routes/pt-br/ujjayi.json"),
  "pt-br:wim-hof": () => import("../routes/pt-br/wim-hof.json"),
} as const;

const chromeLoaders = {
  "de-de:4-7-8": () => import("../chrome/de-de/4-7-8.json"),
  "de-de:9d-breathwork": () => import("../chrome/de-de/9d-breathwork.json"),
  "de-de:belly": () => import("../chrome/de-de/belly.json"),
  "de-de:box": () => import("../chrome/de-de/box.json"),
  "de-de:breath-of-fire": () => import("../chrome/de-de/breath-of-fire.json"),
  "de-de:buteyko": () => import("../chrome/de-de/buteyko.json"),
  "de-de:coherent": () => import("../chrome/de-de/coherent.json"),
  "de-de:hope-cartel-9d-breathwork": () => import("../chrome/de-de/hope-cartel-9d-breathwork.json"),
  "de-de:nadi-shodhana": () => import("../chrome/de-de/nadi-shodhana.json"),
  "de-de:physiological-sigh": () => import("../chrome/de-de/physiological-sigh.json"),
  "de-de:pursed-lip": () => import("../chrome/de-de/pursed-lip.json"),
  "de-de:tummo": () => import("../chrome/de-de/tummo.json"),
  "de-de:ujjayi": () => import("../chrome/de-de/ujjayi.json"),
  "de-de:wim-hof": () => import("../chrome/de-de/wim-hof.json"),
  "es-es:4-7-8": () => import("../chrome/es-es/4-7-8.json"),
  "es-es:9d-breathwork": () => import("../chrome/es-es/9d-breathwork.json"),
  "es-es:belly": () => import("../chrome/es-es/belly.json"),
  "es-es:box": () => import("../chrome/es-es/box.json"),
  "es-es:breath-of-fire": () => import("../chrome/es-es/breath-of-fire.json"),
  "es-es:buteyko": () => import("../chrome/es-es/buteyko.json"),
  "es-es:coherent": () => import("../chrome/es-es/coherent.json"),
  "es-es:hope-cartel-9d-breathwork": () => import("../chrome/es-es/hope-cartel-9d-breathwork.json"),
  "es-es:nadi-shodhana": () => import("../chrome/es-es/nadi-shodhana.json"),
  "es-es:physiological-sigh": () => import("../chrome/es-es/physiological-sigh.json"),
  "es-es:pursed-lip": () => import("../chrome/es-es/pursed-lip.json"),
  "es-es:tummo": () => import("../chrome/es-es/tummo.json"),
  "es-es:ujjayi": () => import("../chrome/es-es/ujjayi.json"),
  "es-es:wim-hof": () => import("../chrome/es-es/wim-hof.json"),
  "fr-fr:4-7-8": () => import("../chrome/fr-fr/4-7-8.json"),
  "fr-fr:9d-breathwork": () => import("../chrome/fr-fr/9d-breathwork.json"),
  "fr-fr:belly": () => import("../chrome/fr-fr/belly.json"),
  "fr-fr:box": () => import("../chrome/fr-fr/box.json"),
  "fr-fr:breath-of-fire": () => import("../chrome/fr-fr/breath-of-fire.json"),
  "fr-fr:buteyko": () => import("../chrome/fr-fr/buteyko.json"),
  "fr-fr:coherent": () => import("../chrome/fr-fr/coherent.json"),
  "fr-fr:hope-cartel-9d-breathwork": () => import("../chrome/fr-fr/hope-cartel-9d-breathwork.json"),
  "fr-fr:nadi-shodhana": () => import("../chrome/fr-fr/nadi-shodhana.json"),
  "fr-fr:physiological-sigh": () => import("../chrome/fr-fr/physiological-sigh.json"),
  "fr-fr:pursed-lip": () => import("../chrome/fr-fr/pursed-lip.json"),
  "fr-fr:tummo": () => import("../chrome/fr-fr/tummo.json"),
  "fr-fr:ujjayi": () => import("../chrome/fr-fr/ujjayi.json"),
  "fr-fr:wim-hof": () => import("../chrome/fr-fr/wim-hof.json"),
  "ja-jp:4-7-8": () => import("../chrome/ja-jp/4-7-8.json"),
  "ja-jp:9d-breathwork": () => import("../chrome/ja-jp/9d-breathwork.json"),
  "ja-jp:belly": () => import("../chrome/ja-jp/belly.json"),
  "ja-jp:box": () => import("../chrome/ja-jp/box.json"),
  "ja-jp:breath-of-fire": () => import("../chrome/ja-jp/breath-of-fire.json"),
  "ja-jp:buteyko": () => import("../chrome/ja-jp/buteyko.json"),
  "ja-jp:coherent": () => import("../chrome/ja-jp/coherent.json"),
  "ja-jp:hope-cartel-9d-breathwork": () => import("../chrome/ja-jp/hope-cartel-9d-breathwork.json"),
  "ja-jp:nadi-shodhana": () => import("../chrome/ja-jp/nadi-shodhana.json"),
  "ja-jp:physiological-sigh": () => import("../chrome/ja-jp/physiological-sigh.json"),
  "ja-jp:pursed-lip": () => import("../chrome/ja-jp/pursed-lip.json"),
  "ja-jp:tummo": () => import("../chrome/ja-jp/tummo.json"),
  "ja-jp:ujjayi": () => import("../chrome/ja-jp/ujjayi.json"),
  "ja-jp:wim-hof": () => import("../chrome/ja-jp/wim-hof.json"),
  "pt-br:4-7-8": () => import("../chrome/pt-br/4-7-8.json"),
  "pt-br:9d-breathwork": () => import("../chrome/pt-br/9d-breathwork.json"),
  "pt-br:belly": () => import("../chrome/pt-br/belly.json"),
  "pt-br:box": () => import("../chrome/pt-br/box.json"),
  "pt-br:breath-of-fire": () => import("../chrome/pt-br/breath-of-fire.json"),
  "pt-br:buteyko": () => import("../chrome/pt-br/buteyko.json"),
  "pt-br:coherent": () => import("../chrome/pt-br/coherent.json"),
  "pt-br:hope-cartel-9d-breathwork": () => import("../chrome/pt-br/hope-cartel-9d-breathwork.json"),
  "pt-br:nadi-shodhana": () => import("../chrome/pt-br/nadi-shodhana.json"),
  "pt-br:physiological-sigh": () => import("../chrome/pt-br/physiological-sigh.json"),
  "pt-br:pursed-lip": () => import("../chrome/pt-br/pursed-lip.json"),
  "pt-br:tummo": () => import("../chrome/pt-br/tummo.json"),
  "pt-br:ujjayi": () => import("../chrome/pt-br/ujjayi.json"),
  "pt-br:wim-hof": () => import("../chrome/pt-br/wim-hof.json"),
} as const;

function assertPublishable(slug: BreatheContentSlug, locale: BreatheContentLocale) {
  const route = publication.routes[`/breathe/${slug}` as keyof typeof publication.routes];
  const localeState = route?.locales[locale as keyof typeof route.locales];
  if (!localeState?.publishable) throw new Error(`Breathe content is not publishable: ${locale}:${slug}`);
}

export async function loadBreatheContent(slug: BreatheContentSlug, locale: BreatheContentLocale): Promise<BreathingPageContent> {
  assertPublishable(slug, locale);
  const contentModule = await contentLoaders[`${locale}:${slug}`]();
  return contentModule.default as BreathingPageContent;
}

export async function loadBreatheChrome(slug: BreatheContentSlug, locale: BreatheContentLocale): Promise<BreatheChromeMessages> {
  assertPublishable(slug, locale);
  const chromeModule = await chromeLoaders[`${locale}:${slug}`]();
  return chromeModule.default as BreatheChromeMessages;
}

export async function loadBreatheRoute(slug: BreatheContentSlug, locale: BreatheContentLocale): Promise<BreatheRouteBundle> {
  const [content, chrome] = await Promise.all([loadBreatheContent(slug, locale), loadBreatheChrome(slug, locale)]);
  return { chrome, content };
}
