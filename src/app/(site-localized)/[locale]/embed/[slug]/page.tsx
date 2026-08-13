import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createEmbedPlayerMetadata,
  EmbedPlayer,
  type EmbedPlayerSearchParams,
} from "@/app/(site-en)/embed/[slug]/embed-player";
import {
  SUPPORTED_LOCALES,
  TRANSLATED_LOCALES,
  buildHreflangAlternates,
  getLocaleByPrefix,
  localizePathname,
} from "@/i18n";
import { loadBreatheContent } from "@/i18n/content/breathe/server/load-breathe-content";
import type {
  BreatheContentLocale,
  BreatheContentSlug,
} from "@/i18n/content/breathe/types";
import { loadEmbedContent } from "@/i18n/content/bespoke/embed/server/load-embed-content";
import {
  VALID_EMBED_SLUGS,
  type EmbedContentLocale,
  type EmbedSlug,
} from "@/i18n/content/bespoke/embed/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import {
  getNativeLocalizedRoutePaths,
  isNativeRoutePreviewable,
  isNativeRoutePublished,
} from "@/i18n/route-manifest";
import { getNativeLinkMode, resolveNativeI18nMode } from "@/i18n/serving-mode";

const sourceRoute = "/embed";
const siteUrl = "https://deepbreathingexercises.com";
const validSlugs = new Set<string>(VALID_EMBED_SLUGS);

export const dynamicParams = false;

export function generateStaticParams() {
  const mode = resolveNativeI18nMode();
  if (mode === "proxy") return [];
  const isAvailable =
    mode === "native-preview"
      ? isNativeRoutePreviewable
      : isNativeRoutePublished;

  return TRANSLATED_LOCALES.flatMap((locale) =>
    isAvailable(sourceRoute, locale.code)
      ? VALID_EMBED_SLUGS.map((slug) => ({
          locale: locale.routePrefix,
          slug,
        }))
      : [],
  );
}

function resolveEmbedPlayerRequest(params: { locale: string; slug: string }) {
  const locale = getLocaleByPrefix(params.locale);
  if (!locale || !locale.routePrefix || !validSlugs.has(params.slug)) {
    notFound();
  }

  const mode = resolveNativeI18nMode();
  const linkMode = getNativeLinkMode(mode);
  if (!linkMode) notFound();
  const routeIsAvailable =
    mode === "native-preview"
      ? isNativeRoutePreviewable(sourceRoute, locale.code)
      : isNativeRoutePublished(sourceRoute, locale.code);
  if (!routeIsAvailable) notFound();

  const slug = params.slug as EmbedSlug;
  return {
    canonicalPath: localizePathname(`/embed/${slug}`, locale.code),
    contentLocale: locale.code.toLowerCase() as EmbedContentLocale,
    linkMode,
    locale,
    slug,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const request = resolveEmbedPlayerRequest(await params);
  const [content, embedContent] = await Promise.all([
    loadBreatheContent(
      request.slug as BreatheContentSlug,
      request.contentLocale as BreatheContentLocale,
    ),
    loadEmbedContent(request.contentLocale),
  ]);
  const metadata = createEmbedPlayerMetadata(
    content,
    embedContent.player.embedLabel,
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

export default async function LocalizedEmbedPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<EmbedPlayerSearchParams>;
}) {
  const request = resolveEmbedPlayerRequest(await params);
  const resolvedSearchParams = await searchParams;
  const [content, embedContent] = await Promise.all([
    loadBreatheContent(
      request.slug as BreatheContentSlug,
      request.contentLocale as BreatheContentLocale,
    ),
    loadEmbedContent(request.contentLocale),
  ]);
  const renderContext: NativeRouteRenderContext = {
    canonicalPath: request.canonicalPath,
    linkMode: request.linkMode,
    locale: request.locale.code,
    localizedRoutePaths: getNativeLocalizedRoutePaths(
      request.locale.code,
      request.linkMode,
    ),
    routeId: "embed-slug",
  };

  return (
    <EmbedPlayer
      content={content}
      playerContent={embedContent.player}
      renderContext={renderContext}
      searchParams={resolvedSearchParams}
    />
  );
}
