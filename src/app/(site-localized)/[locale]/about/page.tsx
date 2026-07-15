import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AboutPage,
  createAboutMetadataFromContent,
} from "@/app/(site-en)/about/about-page";
import {
  SUPPORTED_LOCALES,
  TRANSLATED_LOCALES,
  buildHreflangAlternates,
  getLocaleByPrefix,
  localizePathname,
} from "@/i18n";
import {
  loadAboutContent,
  type AboutContentLocale,
} from "@/i18n/content/bespoke/about/server/load-about-content";
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

const sourceRoute = "/about";
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

function resolveAboutRequest(params: { locale: string }) {
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
    contentLocale: locale.code.toLowerCase() as AboutContentLocale,
    linkMode,
    locale,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const request = resolveAboutRequest(params);
  const content = await loadAboutContent(request.contentLocale);
  const metadata = createAboutMetadataFromContent(content, request.canonicalPath);

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

export default async function LocalizedAboutPage({
  params,
}: {
  params: { locale: string };
}) {
  const request = resolveAboutRequest(params);
  const content = await loadAboutContent(request.contentLocale);
  const renderContext: NativeRouteRenderContext = {
    canonicalPath: request.canonicalPath,
    linkMode: request.linkMode,
    locale: request.locale.code,
    localizedRoutePaths: getNativeLocalizedRoutePaths(
      request.locale.code,
      request.linkMode,
    ),
    routeId: "about",
  };

  return <AboutPage content={content} renderContext={renderContext} />;
}
