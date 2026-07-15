import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FadingHeroTitle } from "@/components/breathe/fading-hero-title";
import { JsonLd } from "@/components/seo/json-ld";
import { LanguageSwitcherFooter } from "@/components/language-switcher-footer-lazy";
import type { HomePageContent } from "@/i18n/content/bespoke/home/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { cn } from "@/lib/utils";
import { createOgImagePath } from "@/lib/seo/og-image";

const FEATURED_MODE_KEYS = [
  "box",
  "fourSevenEight",
  "coherent",
  "physiologicalSigh",
  "wimHof",
] as const;

const EDITORIAL_CARD_KEYS = [
  "calmByDesign",
  "builtForRealLife",
  "yourPace",
] as const;

const QUICK_ANCHOR_BULLET_KEYS = ["easy", "nasal", "exhale"] as const;

const PRACTICE_CUE_KEYS = ["nasal", "exhale", "shoulders"] as const;

const HOW_LONG_KEYS = ["quickReset", "deeperShift", "training"] as const;

const TIMER_LINK_KEYS = ["oneMin", "twoMin", "fiveMin"] as const;

const TIMER_LINK_PATHS = {
  oneMin: "/1-minute-breathing-exercise",
  twoMin: "/2-minute-breathing-exercise",
  fiveMin: "/5-minute-breathing-exercise",
} as const;

const BEST_MOMENT_KEYS = [
  "beforeEvents",
  "postConflict",
  "bedtime",
  "inFlight",
  "holidayStress",
] as const;

const WHY_IT_WORKS_KEYS = ["hrv", "exhale", "consistency"] as const;

const FAQ_ITEM_KEYS = [
  "howLong",
  "bestTime",
  "timing",
  "lightHeaded",
  "medical",
] as const;

const NEXT_LINK_KEYS = ["boxApp", "twoMinute", "running", "tummo"] as const;

const NEXT_LINK_PATHS = {
  boxApp: "/box-breathing-app",
  twoMinute: "/2-minute-breathing-exercise",
  running: "/for/running",
  tummo: "/breathe/tummo",
} as const;

const FOOTER_TECHNIQUE_KEYS = [
  "box",
  "four-seven-eight",
  "coherent",
  "physiological-sigh",
  "wim-hof",
  "pursed-lip",
  "nadi-shodhana",
  "ujjayi",
  "belly",
  "buteyko",
  "tummo",
  "breath-of-fire",
] as const;

const FOOTER_GUIDE_KEYS = [
  "public-speaking",
  "high-blood-pressure",
  "sleep",
  "running",
  "anxiety",
  "panic-attacks",
  "focus",
  "meditation",
  "athletes",
  "pregnancy",
  "holiday-stress",
  "travel-anxiety",
  "huberman",
  "stress",
  "kids",
  "pranayama",
  "singing",
  "lung-capacity",
] as const;

const FOOTER_TIMER_KEYS = [
  "one-minute",
  "two-minute",
  "five-minute",
  "four-seven-eight-timer",
  "coherent-app",
  "box-app",
  "holiday",
] as const;

const FOOTER_INFO_KEYS = [
  "all-techniques",
  "all-guides",
  "app",
  "visualizer",
  "embed",
  "about",
  "about-abi",
  "editorial-policy",
  "privacy",
  "my-stats",
] as const;

const FOOTER_SITUATION_KEYS = [
  "before-surgery",
  "panic-attack",
  "labor",
  "insomnia",
  "before-presentation",
] as const;

const CREDIT_LINKS = {
  abiassi: "https://abiassi.com/",
  darkmatter: "https://darkmatter.is/",
} as const;

const infoCardClass =
  "glow-card rounded-[36px] border border-border bg-card p-6 transition-colors duration-200";

export function createHomeMetadataFromContent(
  content: HomePageContent,
  canonicalPath = "/",
): Metadata {
  const siteUrl = content.site.baseUrl;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = new URL(
    createOgImagePath(content.metadata.openGraph.title),
    siteUrl,
  ).toString();

  return {
    metadataBase: new URL(siteUrl),
    title: content.metadata.title,
    description: content.metadata.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: content.metadata.openGraph.title,
      description: content.metadata.openGraph.description,
      url: canonicalUrl,
      type: content.metadata.openGraph.type,
      siteName: content.metadata.openGraph.siteName,
      images: [
        {
          url: ogImageUrl,
          width: content.metadata.openGraph.image.width,
          height: content.metadata.openGraph.image.height,
          alt: content.metadata.openGraph.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.twitter.title,
      description: content.metadata.twitter.description,
      creator: content.metadata.twitter.creator,
      images: [ogImageUrl],
    },
  };
}

function resolveHref(
  path: string,
  renderContext?: NativeRouteRenderContext,
): string {
  if (
    path.startsWith("http://")
    || path.startsWith("https://")
    || path.startsWith("#")
    || path === "/languages"
  ) {
    return path;
  }

  return renderContext
    ? resolveNativeInternalHref(path, renderContext.locale, renderContext.linkMode)
    : path;
}

export function HomePage({
  content,
  resonance,
  renderContext,
}: {
  content: HomePageContent;
  resonance: ReactNode;
  renderContext?: NativeRouteRenderContext;
}) {
  const href = (path: string) => resolveHref(path, renderContext);
  const faqSchema = {
    ...content.schema.faq,
    mainEntity: FAQ_ITEM_KEYS.map((key) => {
      const faq = content.sections.faq.items[key];
      return {
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      };
    }),
  };

  const heroHeader = (
    <div className="space-y-6">
      <FadingHeroTitle
        label={content.hero.label}
        title={content.hero.title}
        subtitle={content.hero.subtitle}
        headingLevel={content.hero.headingLevel === 2 ? 2 : 1}
      >
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            data-resonance-start
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 h-12 px-6 text-base shadow-none text-white hover:brightness-105 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white/70"
            style={{
              backgroundColor: content.hero.startButton.color,
              boxShadow: content.hero.startButton.shadow,
            }}
          >
            {content.hero.actions.startSession}
          </button>
          <a
            href="#mode-picker"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-6 text-base"
          >
            {content.hero.actions.pickMode}
          </a>
        </div>
      </FadingHeroTitle>
    </div>
  );

  return (
    <main className="bg-transparent pb-20">
      <JsonLd data={[content.schema.website, faqSchema]} />

      <section className="relative isolate z-20 w-full text-foreground min-h-screen">
        <section className="relative isolate flex min-h-[60vh] w-full flex-col bg-transparent lg:min-h-screen min-h-screen">
          <div className="relative flex flex-1 flex-col w-full min-h-0">
            {resonance}
          </div>
        </section>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 px-6 pb-20 sm:px-8 lg:hidden">
          <div className="pointer-events-auto">
            {heroHeader}
          </div>
        </div>
        <div className="absolute inset-y-0 left-0 z-30 hidden w-full max-w-xl px-6 py-20 lg:flex lg:flex-col lg:justify-center">
          {heroHeader}
        </div>
      </section>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="text-center">
          <h2 className="text-3xl font-semibold text-card-foreground">
            {content.sections.precision.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
            {content.sections.precision.body}
          </p>
        </section>

        <section className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
          {EDITORIAL_CARD_KEYS.map((key) => {
            const card = content.sections.editorialCards[key];
            return (
              <div
                key={key}
                className="min-w-[85vw] snap-center glow-card rounded-[32px] border border-border bg-card p-6 sm:min-w-[400px] lg:min-w-0"
              >
                <p className="text-sm uppercase tracking-wider text-primary">{card.eyebrow}</p>
                <p className="mt-3 text-muted-foreground">{card.body}</p>
              </div>
            );
          })}
        </section>

        <section id="mode-picker" className="glow-card rounded-[48px] border border-border bg-card p-8">
          <div>
            <h2 className="text-3xl font-semibold text-card-foreground">
              {content.sections.modePicker.title}
            </h2>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 md:hidden">
            {FEATURED_MODE_KEYS.map((key) => {
              const mode = content.sections.modePicker.featured[key];
              return (
                <a
                  key={key}
                  href={href(mode.href)}
                  className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                  style={{ borderColor: `${mode.color}60`, color: mode.color }}
                >
                  {mode.pillLabel}
                </a>
              );
            })}
            <a
              href={href("/breathe")}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              {content.sections.modePicker.allTechniquesLabel}
            </a>
          </div>

          <div className="hidden md:mt-8 md:grid md:grid-cols-2 md:gap-4">
            {FEATURED_MODE_KEYS.map((key) => {
              const mode = content.sections.modePicker.featured[key];
              return (
                <a
                  key={key}
                  href={href(mode.href)}
                  className="group relative rounded-3xl border bg-card p-6 transition-all hover:scale-[1.02]"
                  style={{ borderColor: `${mode.color}40` }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-[0.3em] opacity-80"
                    style={{ color: mode.color }}
                  >
                    {mode.displaySlug}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-card-foreground">{mode.cardTitle}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{mode.description}</p>
                  <span
                    className="mt-6 inline-flex items-center text-sm font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: mode.color }}
                  >
                    {mode.startCta}
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr,2fr]">
          <article className={cn("glow-card glow-card-inward rounded-[52px] border border-border bg-card p-10 transition-colors duration-200")}>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              {content.sections.quickAnchor.eyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-card-foreground sm:text-5xl">
              {content.sections.quickAnchor.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {content.sections.quickAnchor.intro}
            </p>
            <ul className="mt-6 space-y-3 text-base text-muted-foreground [&>li]:leading-relaxed">
              {QUICK_ANCHOR_BULLET_KEYS.map((key) => (
                <li key={key}>{content.sections.quickAnchor.bullets[key]}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              {content.sections.quickAnchor.closing}
            </p>
          </article>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar lg:grid lg:gap-6 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
            <div className="min-w-[85vw] snap-center grid gap-6 first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 lg:first:ml-0 lg:last:mr-0 sm:min-w-[400px] lg:min-w-0 sm:grid-cols-2">
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {content.sections.infoCards.dialItIn.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">
                  {content.sections.infoCards.dialItIn.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {content.sections.infoCards.dialItIn.body}
                </p>
              </article>
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {content.sections.infoCards.practiceCues.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">
                  {content.sections.infoCards.practiceCues.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {PRACTICE_CUE_KEYS.map((key) => (
                    <li key={key}>{content.sections.infoCards.practiceCues.items[key]}</li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="min-w-[85vw] snap-center grid gap-6 sm:min-w-[400px] lg:min-w-0 sm:grid-cols-2">
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {content.sections.infoCards.howLong.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">
                  {content.sections.infoCards.howLong.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {HOW_LONG_KEYS.map((key) => (
                    <li key={key}>{content.sections.infoCards.howLong.items[key]}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {TIMER_LINK_KEYS.map((key) => (
                    <a
                      key={key}
                      href={href(TIMER_LINK_PATHS[key])}
                      className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
                    >
                      {content.sections.infoCards.howLong.timerLinks[key]}
                    </a>
                  ))}
                </div>
              </article>
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {content.sections.infoCards.bestMoments.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">
                  {content.sections.infoCards.bestMoments.title}
                </h3>
                <div className="mt-4 space-y-3 text-lg font-semibold text-card-foreground leading-relaxed">
                  {BEST_MOMENT_KEYS.map((key) => (
                    <p key={key}>{content.sections.infoCards.bestMoments.items[key]}</p>
                  ))}
                </div>
              </article>
            </div>

            <div className="min-w-[85vw] snap-center first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 lg:first:ml-0 lg:last:mr-0 sm:min-w-[400px] lg:min-w-0">
              <article className={cn(infoCardClass, "h-full")}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {content.sections.infoCards.whyItWorks.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">
                  {content.sections.infoCards.whyItWorks.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {WHY_IT_WORKS_KEYS.map((key) => (
                    <li key={key}>{content.sections.infoCards.whyItWorks.items[key]}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="glow-card space-y-4 rounded-[40px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.faq.title}
          </h2>
          <div className="space-y-3">
            {FAQ_ITEM_KEYS.map((key) => {
              const faq = content.sections.faq.items[key];
              return (
                <details key={key} className="rounded-2xl bg-muted p-4">
                  <summary className="cursor-pointer text-lg font-medium text-foreground">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                </details>
              );
            })}
          </div>
        </section>

        <section className="glow-card rounded-[40px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.nextLinks.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {content.sections.nextLinks.intro}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {NEXT_LINK_KEYS.map((key) => (
              <a
                key={key}
                href={href(NEXT_LINK_PATHS[key])}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
              >
                {content.sections.nextLinks.links[key]}
              </a>
            ))}
          </div>
        </section>
      </div>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-xs text-muted-foreground">
          {content.footer.safetyNote}
        </p>

        <div className="mb-8 grid gap-8 text-left sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              {content.footer.columns.techniques.title}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {FOOTER_TECHNIQUE_KEYS.map((key) => {
                const link = content.footer.columns.techniques.links[key];
                return (
                  <li key={key}>
                    <a
                      href={href(link.href)}
                      className="underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              {content.footer.columns.guides.title}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {FOOTER_GUIDE_KEYS.map((key) => {
                const link = content.footer.columns.guides.links[key];
                return (
                  <li key={key}>
                    <a
                      href={href(link.href)}
                      className="underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              {content.footer.columns.timers.title}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {FOOTER_TIMER_KEYS.map((key) => {
                const link = content.footer.columns.timers.links[key];
                return (
                  <li key={key}>
                    <a
                      href={href(link.href)}
                      className="underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              {content.footer.columns.info.title}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {FOOTER_INFO_KEYS.map((key) => {
                const link = content.footer.columns.info.links[key];
                return (
                  <li key={key}>
                    <a
                      href={href(link.href)}
                      className="underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              {content.footer.columns.situations.title}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {FOOTER_SITUATION_KEYS.map((key) => {
                const link = content.footer.columns.situations.links[key];
                return (
                  <li key={key}>
                    <a
                      href={href(link.href)}
                      className="underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {content.footer.credits.prefix}{" "}
          <a
            href={CREDIT_LINKS.abiassi}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            {content.footer.credits.abiassi}
          </a>
          {" + "}
          <a
            href={CREDIT_LINKS.darkmatter}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            {content.footer.credits.darkmatter}
          </a>
        </p>
        <div className="mt-6">
          <LanguageSwitcherFooter
            basePath={renderContext ? "/" : undefined}
            locale={renderContext?.locale}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <a
            href="/languages"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {content.footer.languagesLink}
          </a>
        </p>
      </footer>
    </main>
  );
}
