import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { breathingPageMap } from "@/data/breathing-pages";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";

const Resonance = dynamic(
  () => import("@/components/resonance/Resonance"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading breathing exercise">
        <div aria-hidden="true" className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }
);

const baseUrl = "https://deepbreathingexercises.com";

const validSlugs = Object.keys(breathingPageMap);

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = breathingPageMap[params.slug];
  if (!page) return {};

  return {
    title: `${page.hero.title} — Embed`,
    description: page.meta.description,
    robots: { index: false, follow: false },
  };
}

export default function EmbedPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { theme?: string };
}) {
  const page = breathingPageMap[params.slug];
  if (!page) {
    notFound();
  }

  const pattern = BREATHING_PATTERNS[page.mode];
  const fullPageUrl = `${baseUrl}/breathe/${page.slug}`;

  const forcedTheme = searchParams.theme === 'dark' || searchParams.theme === 'light'
    ? searchParams.theme
    : undefined;

  return (
    <main className="relative min-h-screen w-full">
      <Resonance
        defaultMode={page.mode}
        className="min-h-screen"
        embedMode
        forcedTheme={forcedTheme}
      />
      <div className="absolute bottom-4 left-4 z-30">
        <a
          href={fullPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition hover:text-white"
          style={{ backgroundColor: `${pattern.color}40` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
