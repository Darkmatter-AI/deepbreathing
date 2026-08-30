import type { Metadata } from "next";
import { Suspense } from "react";

import { AppStorePromotion } from "@/components/app-store-promotion";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import {
  VISUALIZER_TECHNIQUE_SLUGS,
  type BreathingVisualizerContent,
  type VisualizerTechniqueSlug,
} from "@/i18n/content/bespoke/breathing-visualizer/types";
import type { ResonanceRouteClientMessages } from "@/i18n/content/remaining-pages/rw02-route-client/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

import { VisualizerResonance } from "./visualizer-resonance";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/breathing-visualizer";

const techniqueModes: Readonly<Record<VisualizerTechniqueSlug, ModeName>> = {
  box: ModeName.Box,
  "4-7-8": ModeName.Relax,
  coherent: ModeName.Coherent,
  "physiological-sigh": ModeName.Sigh,
  "wim-hof": ModeName.WimHof,
  "pursed-lip": ModeName.PursedLip,
  "nadi-shodhana": ModeName.NadiShodhana,
  ujjayi: ModeName.Ujjayi,
  belly: ModeName.Belly,
  buteyko: ModeName.Buteyko,
  tummo: ModeName.Tummo,
  "breath-of-fire": ModeName.BreathOfFire,
  "9d-breathwork": ModeName.WimHof,
  "hope-cartel-9d-breathwork": ModeName.WimHof,
};

const moreToolRoutes = [
  "/box-breathing-app",
  "/4-7-8-breathing-timer",
  "/coherent-breathing-app",
  "/breathing-app",
] as const;

const footerRoutes = [
  "/breathe",
  "/for",
  "/breathing-app",
  "/about",
  "/about/abi",
  "/embed",
  "/privacy",
] as const;

function formatTiming(pattern: (typeof BREATHING_PATTERNS)[ModeName]) {
  const parts: string[] = [String(pattern.inhale)];
  if ("inhale2" in pattern && pattern.inhale2) {
    parts.push(String(pattern.inhale2));
  }
  parts.push(
    String(pattern.holdIn),
    String(pattern.exhale),
    String(pattern.holdOut),
  );
  return parts.join("-");
}

export function createBreathingVisualizerMetadataFromContent(
  content: BreathingVisualizerContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = createOgImagePath(content.metadata.imageAlt);
  return {
    metadataBase: new URL(siteUrl),
    title: content.metadata.title,
    description: content.metadata.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: content.metadata.socialTitle,
      description: content.metadata.socialDescription,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: content.metadata.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.twitterTitle,
      description: content.metadata.twitterDescription,
      images: [ogImageUrl],
    },
  };
}

export function BreathingVisualizerPage({
  content,
  renderContext,
  routeClientMessages,
}: {
  content: BreathingVisualizerContent;
  renderContext?: NativeRouteRenderContext;
  routeClientMessages?: ResonanceRouteClientMessages;
}) {
  const canonicalPath = renderContext?.canonicalPath ?? sourceRoute;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const href = (path: string) =>
    renderContext
      ? resolveNativeInternalHref(
          path,
          renderContext.locale,
          renderContext.linkMode,
        )
      : path;
  const locale = renderContext?.locale;
  const localizedRoutePaths = renderContext?.localizedRoutePaths;
  const homeUrl = renderContext
    ? new URL(href("/"), siteUrl).toString()
    : siteUrl;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: content.breadcrumb.home,
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: content.breadcrumb.current,
        item: canonicalUrl,
      },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: content.schema.howToName,
    description: content.schema.howToDescription,
    totalTime: "PT2M",
    step: content.howItWorks.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, faqSchema, howToSchema]} />

      {/* Hero with full-screen visualizer */}
      <section className="relative isolate min-h-screen w-full text-foreground">
        <Suspense
          fallback={<div className="min-h-screen w-full bg-background" aria-hidden />}
        >
          <VisualizerResonance
            locale={locale}
            localizedRoutePaths={localizedRoutePaths}
            modeDisplayName={content.runtime.modeDisplayName}
            routeClientMessages={routeClientMessages}
          />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">
              {content.hero.eyebrow}
            </p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
              {content.hero.title}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {content.hero.intro}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={href("/breathe/box")}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                {content.hero.startAction}
              </a>
              <a
                href={href("#techniques")}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
              >
                {content.hero.pickAction}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        {!renderContext ? (
          <AppStorePromotion className="mb-12" variant="strip" />
        ) : null}

        {/* Voice search / Quick answer */}
        <div className="mb-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.quickAnswer.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {content.quickAnswer.body}
          </p>
        </div>

        {/* Why use a breathing visualizer, 2x3 grid */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-card-foreground text-center mb-8">
            {content.benefits.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.benefits.items.map((benefit) => (
              <div
                key={benefit.title}
                className="glow-card rounded-[32px] border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold text-card-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {benefit.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Preserve the current data-backed card set beneath the existing claim. */}
        <section id="techniques" className="mb-12">
          <h2 className="text-3xl font-semibold text-card-foreground text-center mb-8">
            {content.techniques.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {VISUALIZER_TECHNIQUE_SLUGS.map((slug) => {
              const technique = content.techniques.items[slug];
              const pattern = BREATHING_PATTERNS[techniqueModes[slug]];
              return (
                <a
                  key={slug}
                  href={href(`/breathe/${slug}`)}
                  className="group glow-card rounded-[32px] border bg-card p-6 transition-all hover:scale-[1.02]"
                  style={{ borderColor: `${pattern.color}40` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: pattern.color }}
                    />
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {technique.name}
                    </h3>
                    <span className="ml-auto text-xs font-mono text-muted-foreground">
                      {formatTiming(pattern)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {technique.description}
                  </p>
                  <span
                    className="mt-3 inline-flex items-center text-sm font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: pattern.color }}
                  >
                    {technique.action}
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12 glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.howItWorks.title}
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {content.howItWorks.steps.map((step) => (
              <div key={step.title}>
                <p className="text-sm uppercase tracking-wider text-primary">
                  {step.label}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-card-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12 glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.faq.title}
          </h2>
          <div className="mt-6 space-y-6">
            {content.faq.items.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* More tools */}
        <section className="mb-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.moreTools.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {content.moreTools.body}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {content.moreTools.links.map((label, index) => (
              <a
                key={moreToolRoutes[index]}
                href={href(moreToolRoutes[index])}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            {content.footer.warning}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            {content.footer.links.map((label, index) => (
              <a
                key={footerRoutes[index]}
                href={href(footerRoutes[index])}
                className="underline underline-offset-2 transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
