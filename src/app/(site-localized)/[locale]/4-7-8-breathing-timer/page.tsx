import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  TimerPage,
  createTimerMetadataFromContent,
} from "@/app/(site-en)/4-7-8-breathing-timer/timer-page";
import {
  SUPPORTED_LOCALES,
  TRANSLATED_LOCALES,
  buildHreflangAlternates,
  getLocaleByPrefix,
  localizePathname,
} from "@/i18n";
import {
  loadTimerContent,
  type TimerContentLocale,
} from "@/i18n/content/bespoke/timer-4-7-8/server/load-timer-content";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import {
  getNativeLocalizedRoutePaths,
  isNativeRoutePreviewable,
  isNativeRoutePublished,
} from "@/i18n/route-manifest";
import {
  getNativeLinkMode,
  resolveNativeI18nMode,
} from "@/i18n/serving-mode";

const sourceRoute = "/4-7-8-breathing-timer";
const siteUrl = "https://deepbreathingexercises.com";

export const dynamicParams = false;

export function generateStaticParams() {
  const mode = resolveNativeI18nMode();
  if (mode === "proxy") return [];
  const isAvailable = mode === "native-preview"
    ? isNativeRoutePreviewable
    : isNativeRoutePublished;

  return TRANSLATED_LOCALES
    .filter((locale) => isAvailable(sourceRoute, locale.code))
    .map((locale) => ({ locale: locale.routePrefix }));
}

function resolveTimerRequest(params: { locale: string }) {
  const locale = getLocaleByPrefix(params.locale);
  if (!locale || !locale.routePrefix) notFound();

  const mode = resolveNativeI18nMode();
  const linkMode = getNativeLinkMode(mode);
  if (!linkMode) notFound();
  const routeIsAvailable = mode === "native-preview"
    ? isNativeRoutePreviewable(sourceRoute, locale.code)
    : isNativeRoutePublished(sourceRoute, locale.code);
  if (!routeIsAvailable) notFound();

  return {
    canonicalPath: localizePathname(sourceRoute, locale.code),
    contentLocale: locale.code.toLowerCase() as TimerContentLocale,
    linkMode,
    locale,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const request = resolveTimerRequest(await params);
  const content = await loadTimerContent(request.contentLocale);
  const metadata = createTimerMetadataFromContent(content, request.canonicalPath);

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

export default async function LocalizedTimerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const request = resolveTimerRequest(await params);
  const content = await loadTimerContent(request.contentLocale);
  const renderContext: NativeRouteRenderContext = {
    canonicalPath: request.canonicalPath,
    linkMode: request.linkMode,
    locale: request.locale.code,
    localizedRoutePaths: getNativeLocalizedRoutePaths(
      request.locale.code,
      request.linkMode,
    ),
    routeId: "4-7-8-breathing-timer",
  };

  return <TimerPage content={content} renderContext={renderContext} />;
}
