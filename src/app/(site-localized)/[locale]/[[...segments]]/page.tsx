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
  DurationExercisePage,
  createDurationMetadataFromContent,
} from "@/app/(site-en)/duration-exercise-page";
import {
  InsomniaPage,
  createInsomniaMetadataFromContent,
} from "@/app/(site-en)/4-7-8-breathing-for-insomnia/insomnia-page";
import {
  ResonanceGuidePage,
  createResonanceGuideMetadataFromContent,
} from "@/app/(site-en)/resonance-guide-page";
import {
  HolidayBreathingPage,
  createHolidayMetadataFromContent,
} from "@/app/(site-en)/holiday-breathing-exercises/holiday-breathing-page";
import {
  EmbedPage,
  createEmbedMetadataFromContent,
} from "@/app/(site-en)/embed/embed-page";
import {
  BreathingVisualizerPage,
  createBreathingVisualizerMetadataFromContent,
} from "@/app/(site-en)/breathing-visualizer/visualizer-page";
import {
  BoxBreathingAppPage,
  createBoxBreathingAppMetadataFromContent,
} from "@/app/(site-en)/box-breathing-app/box-breathing-app-page";
import {
  BreathingAppPage,
  createBreathingAppMetadataFromContent,
} from "@/app/(site-en)/breathing-app/breathing-app-page";
import {
  CoherentBreathingAppPage,
  createCoherentBreathingAppMetadataFromContent,
} from "@/app/(site-en)/coherent-breathing-app/coherent-breathing-app-page";
import {
  AbiPage,
  createAbiMetadataFromContent,
} from "@/app/(site-en)/about/abi/abi-page";
import {
  createEditorialPolicyMetadataFromContent,
  EditorialPolicyPage,
} from "@/app/(site-en)/about/editorial-policy/editorial-policy-page";
import {
  createPrivacyMetadataFromContent,
  PrivacyPage,
} from "@/app/(site-en)/privacy/privacy-page";
import {
  createSupportMetadataFromContent,
  SupportPage,
} from "@/app/(site-en)/support/support-page";
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
  loadDurationContent,
} from "@/i18n/content/bespoke/duration-exercises/server/load-duration-content";
import {
  DURATION_CONTENT_ROUTES,
  type DurationContentLocale,
  type DurationContentRoute,
} from "@/i18n/content/bespoke/duration-exercises/types";
import {
  loadInsomniaContent,
  type InsomniaContentLocale,
} from "@/i18n/content/bespoke/insomnia-4-7-8/server/load-insomnia-content";
import {
  loadResonanceGuideContent,
  RESONANCE_GUIDE_ROUTES,
  type ResonanceGuideContentLocale,
  type ResonanceGuideRoute,
} from "@/i18n/content/bespoke/resonance-guides/server/load-resonance-guide-content";
import { loadHolidayContent } from "@/i18n/content/bespoke/holiday-breathing/server/load-holiday-content";
import type { HolidayContentLocale } from "@/i18n/content/bespoke/holiday-breathing/types";
import { loadEmbedContent } from "@/i18n/content/bespoke/embed/server/load-embed-content";
import type { EmbedContentLocale } from "@/i18n/content/bespoke/embed/types";
import { loadBreathingVisualizerContent } from "@/i18n/content/bespoke/breathing-visualizer/server/load-breathing-visualizer-content";
import type { BreathingVisualizerLocale } from "@/i18n/content/bespoke/breathing-visualizer/types";
import {
  loadRw03AppContent,
  RW03_APP_ROUTES,
  type Rw03AppContentLocale,
  type Rw03AppRoute,
} from "@/i18n/content/bespoke/rw03-app-pages/server/load-rw03-app-content";
import { loadTrustPageContent } from "@/i18n/content/bespoke/trust-pages/server/load-trust-page-content";
import type { TrustPageContentLocale } from "@/i18n/content/bespoke/trust-pages/types";
import {
  loadPrivacyContent,
  loadSupportContent,
} from "@/i18n/content/bespoke/privacy-support/server/load-privacy-support-content";
import type { PrivacySupportLocale } from "@/i18n/content/bespoke/privacy-support/types";
import {
  loadRw02RouteClientMessages,
} from "@/i18n/content/remaining-pages/rw02-route-client/server/load-rw02-route-client-messages";
import {
  RW02_ROUTE_CLIENT_ROUTES,
  type Rw02RouteClientRoute,
} from "@/i18n/content/remaining-pages/rw02-route-client/types";
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
const durationContentRoutes = new Set<string>(DURATION_CONTENT_ROUTES);
const forContentSlugs = new Set<string>(FOR_CONTENT_SLUGS);
const insomniaSourceRoute = "/4-7-8-breathing-for-insomnia";
const resonanceGuideRoutes = new Set<string>(RESONANCE_GUIDE_ROUTES);
const rw02RouteClientRoutes = new Set<string>(RW02_ROUTE_CLIENT_ROUTES);
const holidaySourceRoute = "/holiday-breathing-exercises";
const embedSourceRoute = "/embed";
const visualizerSourceRoute = "/breathing-visualizer";
const rw03AppRoutes = new Set<string>(RW03_APP_ROUTES);
const abiSourceRoute = "/about/abi";
const editorialPolicySourceRoute = "/about/editorial-policy";
const privacySourceRoute = "/privacy";
const supportSourceRoute = "/support";

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

function getDurationContentRoute(
  sourceRoute: string,
): DurationContentRoute | null {
  const segments = sourceRoute.split("/").filter(Boolean);
  if (segments.length !== 1 || !durationContentRoutes.has(segments[0])) {
    return null;
  }
  return segments[0] as DurationContentRoute;
}

function getResonanceGuideRoute(
  sourceRoute: string,
): ResonanceGuideRoute | null {
  const segments = sourceRoute.split("/").filter(Boolean);
  if (segments.length !== 1 || !resonanceGuideRoutes.has(segments[0])) {
    return null;
  }
  return segments[0] as ResonanceGuideRoute;
}

function getRw02RouteClientRoute(
  sourceRoute: string,
): Rw02RouteClientRoute | null {
  return rw02RouteClientRoutes.has(sourceRoute)
    ? (sourceRoute as Rw02RouteClientRoute)
    : null;
}

function getRw03AppRoute(sourceRoute: string): Rw03AppRoute | null {
  const segments = sourceRoute.split("/").filter(Boolean);
  if (segments.length !== 1 || !rw03AppRoutes.has(segments[0])) return null;
  return segments[0] as Rw03AppRoute;
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
  const durationRoute = getDurationContentRoute(sourceRoute);
  const forSlug = getForContentSlug(sourceRoute);
  const isInsomniaRoute = sourceRoute === insomniaSourceRoute;
  const resonanceGuideRoute = getResonanceGuideRoute(sourceRoute);
  const rw02RouteClientRoute = getRw02RouteClientRoute(sourceRoute);
  const isHolidayRoute = sourceRoute === holidaySourceRoute;
  const isEmbedRoute = sourceRoute === embedSourceRoute;
  const isVisualizerRoute = sourceRoute === visualizerSourceRoute;
  const rw03AppRoute = getRw03AppRoute(sourceRoute);
  const trustPageKey =
    sourceRoute === abiSourceRoute
      ? "abi"
      : sourceRoute === editorialPolicySourceRoute
        ? "editorialPolicy"
        : null;
  const isPrivacyRoute = sourceRoute === privacySourceRoute;
  const isSupportRoute = sourceRoute === supportSourceRoute;
  if (
    !routeDefinition ||
    routeDefinition.localizedHandler !== "catch-all" ||
    (sourceRoute !== "/" &&
      sourceRoute !== "/breathe" &&
      !breatheSlug &&
      !durationRoute &&
      !isInsomniaRoute &&
      !resonanceGuideRoute &&
      !isHolidayRoute &&
      !isEmbedRoute &&
      !isVisualizerRoute &&
      !rw03AppRoute &&
      !trustPageKey &&
      !isPrivacyRoute &&
      !isSupportRoute &&
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
    durationRoute,
    forSlug,
    isInsomniaRoute,
    resonanceGuideRoute,
    rw02RouteClientRoute,
    isHolidayRoute,
    isEmbedRoute,
    isVisualizerRoute,
    rw03AppRoute,
    trustPageKey,
    isPrivacyRoute,
    isSupportRoute,
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

  if (request.durationRoute) {
    const content = await loadDurationContent(
      request.durationRoute,
      request.contentLocale as DurationContentLocale,
    );
    return withLocalizedAlternates(
      createDurationMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.isInsomniaRoute) {
    const content = await loadInsomniaContent(
      request.contentLocale as InsomniaContentLocale,
    );
    return withLocalizedAlternates(
      createInsomniaMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.resonanceGuideRoute) {
    const content = await loadResonanceGuideContent(
      request.resonanceGuideRoute,
      request.contentLocale as ResonanceGuideContentLocale,
    );
    return withLocalizedAlternates(
      createResonanceGuideMetadataFromContent(
        content,
        request.canonicalPath,
      ),
      request.canonicalPath,
    );
  }

  if (request.isHolidayRoute) {
    const content = await loadHolidayContent(
      request.contentLocale as HolidayContentLocale,
    );
    return withLocalizedAlternates(
      createHolidayMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.isEmbedRoute) {
    const content = await loadEmbedContent(
      request.contentLocale as EmbedContentLocale,
    );
    return withLocalizedAlternates(
      createEmbedMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.isVisualizerRoute) {
    const { content } = await loadBreathingVisualizerContent(
      request.contentLocale as BreathingVisualizerLocale,
    );
    return withLocalizedAlternates(
      createBreathingVisualizerMetadataFromContent(
        content,
        request.canonicalPath,
      ),
      request.canonicalPath,
    );
  }

  if (request.rw03AppRoute === "box-breathing-app") {
    const content = await loadRw03AppContent(
      "box-breathing-app",
      request.contentLocale as Rw03AppContentLocale,
    );
    return withLocalizedAlternates(
      createBoxBreathingAppMetadataFromContent(
        content,
        request.canonicalPath,
      ),
      request.canonicalPath,
    );
  }

  if (request.rw03AppRoute === "breathing-app") {
    const content = await loadRw03AppContent(
      "breathing-app",
      request.contentLocale as Rw03AppContentLocale,
    );
    return withLocalizedAlternates(
      createBreathingAppMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.rw03AppRoute === "coherent-breathing-app") {
    const content = await loadRw03AppContent(
      "coherent-breathing-app",
      request.contentLocale as Rw03AppContentLocale,
    );
    return withLocalizedAlternates(
      createCoherentBreathingAppMetadataFromContent(
        content,
        request.canonicalPath,
      ),
      request.canonicalPath,
    );
  }

  if (request.trustPageKey === "abi") {
    const content = await loadTrustPageContent(
      "abi",
      request.contentLocale as TrustPageContentLocale,
    );
    return withLocalizedAlternates(
      createAbiMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.trustPageKey === "editorialPolicy") {
    const content = await loadTrustPageContent(
      "editorialPolicy",
      request.contentLocale as TrustPageContentLocale,
    );
    return withLocalizedAlternates(
      createEditorialPolicyMetadataFromContent(
        content,
        request.canonicalPath,
      ),
      request.canonicalPath,
    );
  }

  if (request.isPrivacyRoute) {
    const content = await loadPrivacyContent(
      request.contentLocale as PrivacySupportLocale,
    );
    return withLocalizedAlternates(
      createPrivacyMetadataFromContent(content, request.canonicalPath),
      request.canonicalPath,
    );
  }

  if (request.isSupportRoute) {
    const content = await loadSupportContent(
      request.contentLocale as PrivacySupportLocale,
    );
    return withLocalizedAlternates(
      createSupportMetadataFromContent(content, request.canonicalPath),
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

  if (request.durationRoute) {
    const content = await loadDurationContent(
      request.durationRoute,
      request.contentLocale as DurationContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return (
      <DurationExercisePage
        content={content}
        renderContext={renderContext}
        route={request.durationRoute}
      />
    );
  }

  if (request.isInsomniaRoute) {
    const content = await loadInsomniaContent(
      request.contentLocale as InsomniaContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return <InsomniaPage content={content} renderContext={renderContext} />;
  }

  if (request.resonanceGuideRoute) {
    const [content, routeClientMessages] = await Promise.all([
      loadResonanceGuideContent(
        request.resonanceGuideRoute,
        request.contentLocale as ResonanceGuideContentLocale,
      ),
      request.rw02RouteClientRoute
        ? loadRw02RouteClientMessages(
            request.rw02RouteClientRoute,
            request.contentLocale as ResonanceGuideContentLocale,
          )
        : Promise.resolve(undefined),
    ]);
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return (
      <ResonanceGuidePage
        content={content}
        renderContext={renderContext}
        route={request.resonanceGuideRoute}
        routeClientMessages={routeClientMessages}
      />
    );
  }

  if (request.isHolidayRoute) {
    const content = await loadHolidayContent(
      request.contentLocale as HolidayContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return (
      <HolidayBreathingPage
        content={content}
        renderContext={renderContext}
      />
    );
  }

  if (request.isEmbedRoute) {
    const content = await loadEmbedContent(
      request.contentLocale as EmbedContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return <EmbedPage content={content} renderContext={renderContext} />;
  }

  if (request.isVisualizerRoute) {
    const { content, routeClientMessages } =
      await loadBreathingVisualizerContent(
        request.contentLocale as BreathingVisualizerLocale,
      );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return (
      <BreathingVisualizerPage
        content={content}
        renderContext={renderContext}
        routeClientMessages={routeClientMessages}
      />
    );
  }

  if (request.rw03AppRoute) {
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };

    if (request.rw03AppRoute === "box-breathing-app") {
      const content = await loadRw03AppContent(
        "box-breathing-app",
        request.contentLocale as Rw03AppContentLocale,
      );
      return (
        <BoxBreathingAppPage
          content={content}
          renderContext={renderContext}
        />
      );
    }

    if (request.rw03AppRoute === "breathing-app") {
      const content = await loadRw03AppContent(
        "breathing-app",
        request.contentLocale as Rw03AppContentLocale,
      );
      return <BreathingAppPage content={content} renderContext={renderContext} />;
    }

    const content = await loadRw03AppContent(
      "coherent-breathing-app",
      request.contentLocale as Rw03AppContentLocale,
    );
    return (
      <CoherentBreathingAppPage
        content={content}
        renderContext={renderContext}
      />
    );
  }

  if (request.trustPageKey === "abi") {
    const content = await loadTrustPageContent(
      "abi",
      request.contentLocale as TrustPageContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return <AbiPage content={content} renderContext={renderContext} />;
  }

  if (request.trustPageKey === "editorialPolicy") {
    const content = await loadTrustPageContent(
      "editorialPolicy",
      request.contentLocale as TrustPageContentLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return (
      <EditorialPolicyPage
        content={content}
        renderContext={renderContext}
      />
    );
  }

  if (request.isPrivacyRoute) {
    const content = await loadPrivacyContent(
      request.contentLocale as PrivacySupportLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return <PrivacyPage content={content} renderContext={renderContext} />;
  }

  if (request.isSupportRoute) {
    const content = await loadSupportContent(
      request.contentLocale as PrivacySupportLocale,
    );
    const renderContext: NativeRouteRenderContext = {
      ...baseRenderContext,
      routeId: request.routeDefinition.id,
    };
    return <SupportPage content={content} renderContext={renderContext} />;
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
