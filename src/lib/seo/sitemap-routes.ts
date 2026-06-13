import type { MetadataRoute } from "next";

import {
  DEFAULT_EXCLUDED_ROUTES as rawDefaultExcludedRoutes,
  DEFAULT_LOCALE_PREFIXES as rawDefaultLocalePrefixes,
  EDGE_PROXY_LOCALE_PREFIXES as rawEdgeProxyLocalePrefixes,
  buildSitemapEntries as rawBuildSitemapEntries,
  discoverPageRoutes as rawDiscoverPageRoutes,
  isLocaleUrl as rawIsLocaleUrl,
} from "./sitemap-routes.mjs";

export type RouteMetaInput = {
  slug: string;
  dateModified?: string | Date | null | undefined;
};

export type BuildSitemapEntriesInput = {
  appDir: string;
  siteUrl: string;
  excludedRoutes?: string[];
  localePrefixes?: string[];
  breathingPageMeta?: RouteMetaInput[];
  useCasePageMeta?: RouteMetaInput[];
  now?: Date;
};

export type SitemapEntry = MetadataRoute.Sitemap[number] & {
  alternates?: { languages: Record<string, string> };
};

export const DEFAULT_EXCLUDED_ROUTES = rawDefaultExcludedRoutes as string[];
export const DEFAULT_LOCALE_PREFIXES = rawDefaultLocalePrefixes as string[];
export const EDGE_PROXY_LOCALE_PREFIXES = rawEdgeProxyLocalePrefixes as string[];

export function discoverPageRoutes(appDir: string, excludedRoutes = DEFAULT_EXCLUDED_ROUTES): string[] {
  return rawDiscoverPageRoutes(appDir, excludedRoutes) as string[];
}

export function buildSitemapEntries(input: BuildSitemapEntriesInput): SitemapEntry[] {
  return rawBuildSitemapEntries(input as any) as SitemapEntry[];
}

export function isLocaleUrl(
  url: string,
  siteUrl: string,
  localePrefixes: string[] = EDGE_PROXY_LOCALE_PREFIXES
): boolean {
  return rawIsLocaleUrl(url, siteUrl, localePrefixes) as boolean;
}
