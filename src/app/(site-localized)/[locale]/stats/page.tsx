import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  StatsPage,
  createStatsMetadataFromContent,
} from "@/app/(site-en)/stats/stats-page";
import {
  SUPPORTED_LOCALES,
  buildHreflangAlternates,
  getLocaleByPrefix,
  localizePathname,
} from "@/i18n";
import {
  loadStatsContent,
  type StatsContentLocale,
} from "@/i18n/content/bespoke/stats/server/load-stats-content";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import {
  getNativeLocalizedRoutePaths,
  isNativeRoutePreviewable,
  isNativeRoutePublished,
} from "@/i18n/route-manifest";
import { getNativeLinkMode, resolveNativeI18nMode } from "@/i18n/serving-mode";

const sourceRoute = "/stats";
const siteUrl = "https://deepbreathingexercises.com";

export const dynamic = "force-dynamic";

function resolveStatsRequest(params: { locale: string }) {
  const locale = getLocaleByPrefix(params.locale);
  if (!locale || !locale.routePrefix) notFound();

  const mode = resolveNativeI18nMode();
  const linkMode = getNativeLinkMode(mode);
  if (!linkMode) notFound();
  const routeIsAvailable =
    mode === "native-preview"
      ? isNativeRoutePreviewable(sourceRoute, locale.code)
      : isNativeRoutePublished(sourceRoute, locale.code);
  if (!routeIsAvailable) notFound();

  return {
    canonicalPath: localizePathname(sourceRoute, locale.code),
    contentLocale: locale.code.toLowerCase() as StatsContentLocale,
    linkMode,
    locale,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const request = resolveStatsRequest(await params);
  const content = await loadStatsContent(request.contentLocale);
  const metadata = createStatsMetadataFromContent(
    content,
    request.canonicalPath,
  );

  return {
    ...metadata,
    alternates: {
      canonical: new URL(request.canonicalPath, siteUrl).toString(),
      languages: buildHreflangAlternates(
        siteUrl,
        request.canonicalPath,
        SUPPORTED_LOCALES,
      ),
    },
  };
}

export default async function LocalizedStatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const request = resolveStatsRequest(await params);
  const content = await loadStatsContent(request.contentLocale);
  const renderContext: NativeRouteRenderContext = {
    canonicalPath: request.canonicalPath,
    linkMode: request.linkMode,
    locale: request.locale.code,
    localizedRoutePaths: getNativeLocalizedRoutePaths(
      request.locale.code,
      request.linkMode,
    ),
    routeId: "stats",
  };

  return <StatsPage content={content} renderContext={renderContext} />;
}
