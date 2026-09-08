import path from "node:path";

import { breathingPages } from "@/data/breathing-pages";
import { useCasePages } from "@/data/use-case-pages";
import { getLocaleByPrefix, TRANSLATED_LOCALES } from "@/i18n";
import {
  isNativeRoutePreviewable,
  isNativeRoutePublished,
} from "@/i18n/route-manifest";
import { resolveNativeI18nMode } from "@/i18n/serving-mode";
import {
  buildSitemapEntries,
  EDGE_PROXY_LOCALE_PREFIXES,
} from "@/lib/seo/sitemap-routes";

const siteUrl = "https://deepbreathingexercises.com";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function GET() {
  const appDir = path.join(process.cwd(), "src", "app");
  const mode = resolveNativeI18nMode();
  const isNativeMode = mode !== "proxy";
  const localePrefixes = isNativeMode
    ? TRANSLATED_LOCALES.map((locale) => locale.routePrefix)
    : EDGE_PROXY_LOCALE_PREFIXES;
  const localeAvailability = isNativeMode
    ? (route: string, prefix: string) => {
        const locale = getLocaleByPrefix(prefix);
        if (!locale || !locale.routePrefix) return false;
        return mode === "native-preview"
          ? isNativeRoutePreviewable(route, locale.code)
          : isNativeRoutePublished(route, locale.code);
      }
    : undefined;

  const entries = buildSitemapEntries({
    appDir,
    siteUrl,
    localePrefixes,
    localeAvailability,
    breathingPageMeta: breathingPages.map((page) => ({
      slug: page.slug,
      dateModified: page.meta.dateModified,
    })),
    useCasePageMeta: useCasePages.map((page) => ({
      slug: page.slug,
      dateModified: page.meta.dateModified,
    })),
  });

  const urls = entries
    .map((entry) => {
      const alternateLinks = entry.alternates?.languages
        ? Object.entries(entry.alternates.languages)
            .map(
              ([lang, href]) =>
                `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href as string)}" />`
            )
            .join("\n")
        : "";

      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        entry.lastModified
          ? `    <lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified}</lastmod>`
          : "",
        entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : "",
        entry.priority != null ? `    <priority>${entry.priority}</priority>` : "",
        alternateLinks,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
