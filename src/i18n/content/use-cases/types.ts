import type { UseCasePageContent } from "@/data/use-case-pages";

export const FOR_CONTENT_LOCALES = ["de-de","es-es","fr-fr","ja-jp","pt-br"] as const;
export const FOR_CONTENT_SLUGS = ["anxiety","athletes","focus","high-blood-pressure","holiday-stress","huberman","kids","lung-capacity","meditation","panic-attacks","pranayama","pregnancy","public-speaking","running","singing","sleep","stress","travel-anxiety"] as const;

export type ForContentLocale = (typeof FOR_CONTENT_LOCALES)[number];
export type ForContentSlug = (typeof FOR_CONTENT_SLUGS)[number];
export type UseCaseChromeMessages = Readonly<Record<`chrome.${string}`, string>>;
export interface UseCaseRouteBundle { readonly chrome: UseCaseChromeMessages; readonly content: UseCasePageContent; }
