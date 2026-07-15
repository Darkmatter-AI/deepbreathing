import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PatternPage,
  createPatternMetadataFromContent,
} from "@/app/(site-en)/breathe/pattern-page";
import {
  UseCasePage,
  createUseCaseMetadataFromContent,
} from "@/app/(site-en)/for/use-case-page";
import {
  ForIndexPage,
  createForIndexMetadataFromContent,
} from "@/app/(site-en)/for/for-index-page";
import {
  HomePage,
  createHomeMetadataFromContent,
} from "@/app/(site-en)/home-page";
import {
  BreatheIndexPage,
  createBreatheIndexMetadataFromContent,
} from "@/app/(site-en)/breathe/breathe-index-page";
import {
  loadBreatheIndexContent,
  type BreatheIndexContentLocale,
} from "@/i18n/content/bespoke/breathe-index/server/load-breathe-index-content";
import { loadBreatheRoute } from "@/i18n/content/breathe/server/load-breathe-content";
import {
  BREATHE_CONTENT_SLUGS,
  type BreatheContentLocale,
  type BreatheContentSlug,
} from "@/i18n/content/breathe/types";
import {
  loadHomeContent,
  type HomeContentLocale,
} from "@/i18n/content/bespoke/home/server/load-home-content";
import {
  loadForIndexContent,
  type ForIndexContentLocale,
} from "@/i18n/content/bespoke/for-index/server/load-for-index-content";
import { loadUseCaseRoute } from "@/i18n/content/use-cases/server/load-use-case-content";
import {
  FOR_CONTENT_SLUGS,
  type ForContentLocale,
  type ForContentSlug,
} from "@/i18n/content/use-cases/types";
import {
  SUPPORTED_LOCALES,
  buildHreflangAlternates,
  getLocaleByPrefix,
  localizePathname,
} from "@/i18n";
import {
  getLocalizedStaticParams,
  getNativeRouteByPath,
  getNativeLocalizedRoutePaths,
  getPreviewLocalizedStaticParams,
  isNativeRoutePreviewable,
  isNativeRoutePublished,
} from "@/i18n/route-manifest";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { getNativeLinkMode, resolveNativeI18nMode } from "@/i18n/serving-mode";

import { LocalizedHomeResonance } from "./localized-home-resonance";

const siteUrl = "https://deepbreathingexercises.com";
const breatheContentSlugs = new Set<string>(BREATHE_CONTENT_SLUGS);
const forContentSlugs = new Set<string>(FOR_CONTENT_SLUGS);

export const dynamicParams = false;

export function generateStaticParams() {
  const mode = resolveNativeI18nMode();
  if (mode === "native-preview") return [...getPreviewLocalizedStaticParams()];
  if (mode === "native") return [...getLocalizedStaticParams()];
  return [];
}

function getBreatheContentSlug(sourceRoute: string): BreatheContentSlug | null {
  const segments = sourceRoute.split("/").filter(Boolean);
  if (
    segments.length !== 2 ||
    segments[0] !== "breathe" ||
    !breatheContentSlugs.has(segments[1])
  ) {
    return null;
  }

  return segments[1] as BreatheContentSlug;
}

function getForContentSlug(sourceRoute: string): ForContentSlug | null {
  const segments = sourceRoute.split("/").filter(Boolean);
  if (
    segments.length !== 2 ||
    segments[0] !== "for" ||
    !forContentSlugs.has(segments[1])
  ) {
    return null;
  }

  return segments[1] as ForContentSlug;
}

function resolveLocalizedRequest(params: {
  locale: string;
  segments?: string[];
}) {
  const locale = getLocaleByPrefix(params.locale);
  if (!locale || !locale.routePrefix) notFound();

  const mode = resolveNativeI18nMode();
  const linkMode = getNativeLinkMode(mode);
  if (!linkMode) notFound();

  const sourceRoute = `/${params.segments?.join("/") ?? ""}`;
  const routeDefinition = getNativeRouteByPath(sourceRoute);
  const routeIsAvailable =
    mode === "native-preview"
      ? isNativeRoutePreviewable(sourceRoute, locale.code)
      : isNativeRoutePublished(sourceRoute, locale.code);
  const breatheSlug = getBreatheContentSlug(sourceRoute);
  const forSlug = getForContentSlug(sourceRoute);
  if (
    !routeDefinition ||
    routeDefinition.localizedHandler !== "catch-all" ||
    (sourceRoute !== "/" &&
      sourceRoute !== "/breathe" &&
      !breatheSlug &&
      sourceRoute !== "/for" &&
      !forSlug) ||
    !routeIsAvailable
  ) {
    notFound();
  }

  return {
    canonicalPath: localizePathname(sourceRoute, locale.code),
    linkMode,
    locale,
    breatheSlug,
    forSlug,
    contentLocale: locale.code.toLowerCase(),
    routeDefinition,
    sourceRoute,
  };
}

function withLocalizedAlternates(
  metadata: Metadata,
  canonicalPath: string,
): Metadata {
  return {
    ...metadata,
    alternates: {
      canonical: new URL(canonicalPath, siteUrl).toString(),
      languages: buildHreflangAlternates(
        siteUrl,
        canonicalPath,
        SUPPORTED_LOCALES,
      ),
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; segments?: string[] };
}): Promise<Metadata> {
  const request = resolveLocalizedRequest(params);

  if (request.sourceRoute === "/") {
    const content = await loadHomeContent(
      request.contentLocale as HomeContentLocale,
    );
    return withLocalizedAlternates(
      createHomeMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.sourceRoute === "/breathe") {
    const content = await loadBreatheIndexContent(
      request.contentLocale as BreatheIndexContentLocale,
    );
    return withLocalizedAlternates(
      createBreatheIndexMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.breatheSlug) {
    const { chrome, content } = await loadBreatheRoute(
      request.breatheSlug,
      request.contentLocale as BreatheContentLocale,
    );
    return withLocalizedAlternates(
      createPatternMetadataFromContent(content, request.canonicalPath, chrome),
      request.canonicalPath,
    );
  }

  if (request.sourceRoute === "/for") {
    const content = await loadForIndexContent(
      request.contentLocale as ForIndexContentLocale,
    );
    return withLocalizedAlternates(
      createForIndexMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.forSlug) {
    const { content } = await loadUseCaseRoute(
      request.forSlug,
      request.contentLocale as ForContentLocale,
    );
    return withLocalizedAlternates(
      createUseCaseMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  notFound();
}

export default async function LocalizedContentPage({
  params,
}: {
  params: { locale: string; segments?: string[] };
}) {
  const request = resolveLocalizedRequest(params);
  const baseRenderContext = {
    canonicalPath: request.canonicalPath,
    linkMode: request.linkMode,
    locale: request.locale.code,
    localizedRoutePaths: getNativeLocalizedRoutePaths(
      request.locale.code,
      request.linkMode,
    ),
  };

  if (request.sourceRoute === "/") {
    const content = await loadHomeContent(
      request.contentLocale as HomeContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: "home",
    };
    return (
      <HomePage
        content={content}
        resonance={
          <LocalizedHomeResonance
            locale={renderContext.locale}
            localizedRoutePaths={renderContext.localizedRoutePaths}
            modeDisplayName={content.sections.modePicker.featured.box.cardTitle}
          />
        }
        renderContext={renderContext}
      />
    );
  }

  if (request.sourceRoute === "/breathe") {
    const content = await loadBreatheIndexContent(
      request.contentLocale as BreatheIndexContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: "breathe",
    };
    return <BreatheIndexPage content={content} renderContext={renderContext} />;
  }

  if (request.breatheSlug) {
    const { chrome, content } = await loadBreatheRoute(
      request.breatheSlug,
      request.contentLocale as BreatheContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
      serverMessages: chrome,
    };
    return (
      <PatternPage
        content={content}
        renderContext={renderContext}
        slug={request.breatheSlug}
      />
    );
  }

  if (request.sourceRoute === "/for") {
    const content = await loadForIndexContent(
      request.contentLocale as ForIndexContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return <ForIndexPage content={content} renderContext={renderContext} />;
  }

  if (request.forSlug) {
    const { chrome, content } = await loadUseCaseRoute(
      request.forSlug,
      request.contentLocale as ForContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
      serverMessages: chrome,
    };
    return (
      <UseCasePage
        content={content}
        renderContext={renderContext}
        slug={request.forSlug}
      />
    );
  }

  notFound();
}
