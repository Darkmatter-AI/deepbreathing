import type { BreathingPageContent } from "@/data/breathing-pages";

export const BREATHE_CONTENT_LOCALES = ["de-de","es-es","fr-fr","ja-jp","pt-br"] as const;
export const BREATHE_CONTENT_SLUGS = ["4-7-8","9d-breathwork","belly","box","breath-of-fire","buteyko","coherent","hope-cartel-9d-breathwork","nadi-shodhana","physiological-sigh","pursed-lip","tummo","ujjayi","wim-hof"] as const;

export type BreatheContentLocale = (typeof BREATHE_CONTENT_LOCALES)[number];
export type BreatheContentSlug = (typeof BREATHE_CONTENT_SLUGS)[number];
export type BreatheChromeMessages = Readonly<Record<`chrome.${string}`, string>>;
export interface BreatheRouteBundle { readonly chrome: BreatheChromeMessages; readonly content: BreathingPageContent; }
