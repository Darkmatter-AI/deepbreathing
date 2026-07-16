import type { Metadata } from "next";

import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import type { BreathingPageContent } from "@/data/breathing-pages";
import type { EmbedContent } from "@/i18n/content/bespoke/embed/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";

import { EmbedPlayerResonance } from "./embed-player-resonance";

const baseUrl = "https://deepbreathingexercises.com";

export interface EmbedPlayerSearchParams {
  readonly theme?: string;
}

export function createEmbedPlayerMetadata(
  content: BreathingPageContent,
  embedLabel: string,
): Metadata {
  return {
    title: `${content.hero.title} — ${embedLabel}`,
    description: content.meta.description,
    robots: { index: false, follow: false },
  };
}

export function EmbedPlayer({
  content,
  playerContent,
  renderContext,
  searchParams,
}: {
  content: BreathingPageContent;
  playerContent: EmbedContent["player"];
  renderContext?: NativeRouteRenderContext;
  searchParams: EmbedPlayerSearchParams;
}) {
  const pattern = BREATHING_PATTERNS[content.mode];
  const fullPageHref = renderContext
    ? resolveNativeInternalHref(
        `/breathe/${content.slug}`,
        renderContext.locale,
        renderContext.linkMode,
      )
    : `/breathe/${content.slug}`;
  const fullPageUrl = new URL(fullPageHref, baseUrl).toString();
  const forcedTheme =
    searchParams.theme === "dark" || searchParams.theme === "light"
      ? searchParams.theme
      : undefined;

  return (
    <main className="relative min-h-screen w-full">
      <EmbedPlayerResonance
        defaultMode={content.mode}
        forcedTheme={forcedTheme}
        loadingAriaLabel={playerContent.loadingAriaLabel}
        locale={renderContext?.locale}
        localizedRoutePaths={renderContext?.localizedRoutePaths}
        modeDisplayName={renderContext ? content.hero.title : undefined}
      />
      <div className="absolute bottom-4 left-4 z-30">
        <a
          href={fullPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition hover:text-white"
          style={{ backgroundColor: `${pattern.color}40` }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          deepbreathingexercises.com
        </a>
      </div>
    </main>
  );
}
