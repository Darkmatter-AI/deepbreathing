import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FadingHeroTitle } from "@/components/breathe/fading-hero-title";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import { JsonLd } from "@/components/seo/json-ld";
import { breathingPageMap, type BreathingPageContent, type OwnedVideoEmbed } from "@/data/breathing-pages";
import { LocalizedDate } from "@/components/seo/localized-date";
import { LanguageSwitcherFooter } from "@/components/language-switcher-footer-lazy";
import { renderInlineLinks } from "@/lib/render-inline-links";
// Lazy-load ShareButton via a client wrapper so its chunk stays out of first load.
import { ShareButton } from "@/components/ui/share-button-lazy";
import {
  resolveNativeInternalHref,
} from "@/i18n/route-manifest";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import type { ProofServerChromeMessages } from "@/i18n/content/proof/types";
import { ResonanceClient as Resonance } from "@/components/resonance/resonance-client";

const baseUrl = "https://deepbreathingexercises.com";

export function createPatternMetadataFromContent(
  pageContent: BreathingPageContent,
  canonicalPath = `/breathe/${pageContent.slug}`,
  serverMessages?: ProofServerChromeMessages,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, baseUrl).toString();
  // Use dynamic OG image route if available, otherwise fall back to static or custom image
  const ogImageUrl = pageContent.meta.ogImage && !pageContent.meta.ogImage.startsWith('og/')
    ? new URL(pageContent.meta.ogImage, baseUrl).toString()
    : new URL(`/og/${pageContent.slug}`, baseUrl).toString();

  return {
    metadataBase: new URL(baseUrl),
    title: pageContent.meta.title,
    description: pageContent.meta.description,
    keywords: pageContent.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "article",
      title: pageContent.meta.ogTitle || pageContent.meta.title,
      description: pageContent.meta.ogDescription || pageContent.meta.description,
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          alt: serverMessages?.["chrome.pattern.og-alt"] ?? `${pageContent.hero.title} – Interactive breathing visualizer`,
          width: 1200,
          height: 630
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: pageContent.meta.twitterTitle || pageContent.meta.title,
      description: pageContent.meta.twitterDescription || pageContent.meta.description,
      images: [ogImageUrl]
    }
  };
}

export function createPatternMetadata(slug: string): Metadata {
  const page = breathingPageMap[slug];
  return page ? createPatternMetadataFromContent(page) : {};
}

interface PatternPageProps {
  slug: string;
  content?: BreathingPageContent;
  canonicalPath?: string;
  renderContext?: NativeRouteRenderContext;
}

export function PatternPage({
  slug,
  content,
  canonicalPath,
  renderContext,
}: PatternPageProps) {
  const page = content ?? breathingPageMap[slug];
  if (!page) {
    notFound();
  }
  const routeSlug = page.slug;
  const chrome = (messageId: `chrome.${string}`, fallback: string) =>
    renderContext?.serverMessages?.[messageId] ?? fallback;
  const localizeInternalPath = (path: string) =>
    renderContext
      ? resolveNativeInternalHref(path, renderContext.locale, renderContext.linkMode)
      : path;
  const localizedAbsoluteUrl = (path: string) =>
    new URL(localizeInternalPath(path), baseUrl).toString();
  const canonicalUrl = new URL(
    renderContext?.canonicalPath ?? canonicalPath ?? `/breathe/${routeSlug}`,
    baseUrl,
  ).toString();
  const reviewerName = page.meta.reviewer || null;
  const ogImageUrl = page.meta.ogImage && !page.meta.ogImage.startsWith('og/')
    ? new URL(page.meta.ogImage, baseUrl).toString()
    : new URL(`/og/${page.slug}`, baseUrl).toString();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: page.hero.title,
    description: page.hero.intro || page.hero.subtitle,
    step: page.howTo.steps.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.instruction,
      url: `${canonicalUrl}#how-to`
    })),
    tool: page.howTo.tools.length
      ? page.howTo.tools.map((tool) => ({
        "@type": "HowToTool",
        name: tool
      }))
      : undefined,
    supply: page.howTo.supplies.length
      ? page.howTo.supplies.map((supply) => ({
        "@type": "HowToSupply",
        name: supply
      }))
      : undefined
  };

  const siteOrganization = {
    "@type": "Organization",
    name: "Deep Breathing Exercises",
    url: baseUrl
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.meta.title,
    description: page.meta.description,
    image: ogImageUrl,
    author: page.meta.author
      ? {
        "@type": "Person",
        name: page.meta.author,
        url: localizedAbsoluteUrl("/about/abi")
      }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: baseUrl
    },
    ...(reviewerName ? {
      reviewedBy: {
        "@type": "Person",
        name: reviewerName
      }
    } : {}),
    datePublished: page.meta.datePublished,
    dateModified: page.meta.dateModified,
    mainEntityOfPage: canonicalUrl,
    keywords: page.keywords.join(", ")
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: chrome("chrome.shared.breadcrumb-home", "Home"),
        item: localizedAbsoluteUrl("/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: chrome("chrome.pattern.breadcrumb-techniques", "Breathing Techniques"),
        item: localizedAbsoluteUrl("/breathe")
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.hero.title
      }
    ]
  };

  // VideoObject schema goes on the OWNED video (our channel) so GSC can verify it.
  // Third-party authority videos remain as plain embeds with no competing VideoObject.
  const ownedVideo: OwnedVideoEmbed | undefined = page.ownedVideo;
  const videoSchema = ownedVideo ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: ownedVideo.title,
    description: ownedVideo.description,
    thumbnailUrl: `https://img.youtube.com/vi/${ownedVideo.youtubeId}/maxresdefault.jpg`,
    uploadDate: `${ownedVideo.uploadDate}T08:00:00+00:00`,
    duration: ownedVideo.duration,
    embedUrl: `https://www.youtube.com/embed/${ownedVideo.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${ownedVideo.youtubeId}`
  } : null;

  const structuredData = [faqSchema, howToSchema, articleSchema, breadcrumbSchema, ...(videoSchema ? [videoSchema] : [])];

  const heroHeader = (
    <FadingHeroTitle
      label={chrome("chrome.shared.brand-eyebrow", "DEEP BREATHING EXERCISES")}
      title={page.hero.title}
      subtitle={page.hero.subtitle}
      headingLevel={2}
    >
      <div className="pt-2">
        <ShareButton
          url={canonicalUrl}
          title={page.hero.title}
          text={chrome("chrome.pattern.hero-share-text", `Try this guided ${page.hero.title.toLowerCase()} exercise — it really helps.`)}
          buttonText={chrome("chrome.shared.share-exercise", "Share this exercise")}
          locale={renderContext?.locale}
          variant="accent"
          accentColor={BREATHING_PATTERNS[page.mode].color}
        />
      </div>
    </FadingHeroTitle>
  );

  return (
    <main className="bg-transparent">
      <h1 className="sr-only">{page.hero.title}</h1>
      <JsonLd data={structuredData} />

      <section className="relative isolate z-20 min-h-screen w-full text-foreground">
        <Resonance
          defaultMode={page.mode}
          className="min-h-screen"
          locale={renderContext?.locale}
          localizedRoutePaths={renderContext?.localizedRoutePaths}
          modeDisplayName={page.hero.title}
        />
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-6 pb-6 text-center pointer-events-none sm:inset-y-0 sm:left-0 sm:max-w-xl sm:items-start sm:justify-center sm:py-20 sm:text-left">
          <div className="pointer-events-auto">
            {heroHeader}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-6 w-full max-w-6xl space-y-12 rounded-t-[48px] bg-background/95 px-4 pb-20 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        {page.meta.dateModified && (
          <p className="text-xs text-muted-foreground -mt-6" data-i18n="credentials">
            <LocalizedDate
              date={page.meta.dateModified}
              lastUpdatedLabel={chrome("chrome.shared.date-last-updated", "Last updated")}
              locale={renderContext?.locale}
              reviewedByLabel={chrome("chrome.shared.date-reviewed-by", "Reviewed by")}
              reviewerName={reviewerName}
            />
          </p>
        )}
        {page.hero.intro && (
          <div className="prose prose-lg max-w-none text-muted-foreground -mt-8" data-i18n="intro">
            <p className="text-xl leading-relaxed">{page.hero.intro}</p>
          </div>
        )}
        {page.lineage && (
          <p className="text-sm text-muted-foreground italic -mt-8 max-w-3xl" data-i18n="lineage">
            {page.lineage.split(/(\*[^*]+\*)/g).map((part, i) =>
              part.startsWith('*') && part.endsWith('*') && part.length > 2
                ? <em key={i} className="not-italic font-medium text-foreground/80">{part.slice(1, -1)}</em>
                : <span key={i}>{part}</span>
            )}
          </p>
        )}
        {/* Voice Search Q&A - prominently placed for featured snippets */}
        {page.voiceSearch && page.voiceSearch.length > 0 && (
          <section className="space-y-6">
            {page.voiceSearch.map((qa) => (
              <div key={qa.question} className="glow-card rounded-[32px] border border-border bg-card p-8 text-card-foreground">
                <h2 className="text-2xl font-semibold text-card-foreground">{qa.question}</h2>
                <p className="mt-4 text-lg text-muted-foreground">{qa.answer}</p>
              </div>
            ))}
          </section>
        )}

        {page.body.length ? (
          <section className="glow-card rounded-[32px] border border-border bg-card p-8 text-card-foreground">
            <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.technique-overview", "Technique overview")}</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {page.body.map((section) => (
                <div key={section.heading}>
                  <h2 className="text-2xl font-semibold">{section.heading}</h2>
                  <p className="mt-2 text-muted-foreground">{renderInlineLinks(section.content)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
          {page.benefits.map((benefit) => (
            <div key={benefit.title} className="min-w-[70vw] snap-center glow-card rounded-[32px] border border-border bg-card p-6 first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 lg:first:ml-0 lg:last:mr-0 sm:min-w-[400px] lg:min-w-0">
              <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.benefit", "Benefit")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-card-foreground">{benefit.title}</h2>
              <p className="mt-2 text-muted-foreground">{renderInlineLinks(benefit.description)}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div id="how-to" className="glow-card space-y-6 rounded-[32px] border border-border bg-card p-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.step-by-step", "Step-by-step")}</p>
              <h2 className="text-2xl font-semibold text-card-foreground">{chrome("chrome.pattern.how-to-practice", "How to practice")}</h2>
              <p className="text-muted-foreground">{chrome("chrome.pattern.how-to-description", "Structured walkthrough pulled from the editorial brief.")}</p>
            </div>

            <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              {page.howTo.totalTime ? (
                <div>
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">{chrome("chrome.pattern.total-time", "Total time")}</dt>
                  <dd className="text-base text-card-foreground">{page.howTo.totalTime}</dd>
                </div>
              ) : null}
              {page.howTo.difficulty ? (
                <div>
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">{chrome("chrome.pattern.difficulty", "Difficulty")}</dt>
                  <dd className="text-base text-card-foreground capitalize">{page.howTo.difficulty}</dd>
                </div>
              ) : null}
              {page.howTo.tools.length ? (
                <div className="sm:col-span-2">
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">{chrome("chrome.pattern.tools", "Tools")}</dt>
                  <dd className="text-base text-card-foreground">{page.howTo.tools.join(", ")}</dd>
                </div>
              ) : null}
              {page.howTo.supplies.length ? (
                <div className="sm:col-span-2">
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">{chrome("chrome.pattern.supplies", "Supplies")}</dt>
                  <dd className="text-base text-card-foreground">{page.howTo.supplies.join(", ")}</dd>
                </div>
              ) : null}
            </dl>

            <ol className="space-y-4">
              {page.howTo.steps.map((step, index) => (
                <li key={step.name} className="flex gap-4 rounded-2xl bg-muted/70 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-card-foreground">{step.name}</p>
                    <p className="text-sm text-muted-foreground">{step.instruction}</p>
                    {step.duration ? <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{step.duration}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="glow-card space-y-6 rounded-[32px] border border-border bg-card p-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.use-cases", "Use cases")}</p>
              <h2 className="text-2xl font-semibold text-card-foreground">{chrome("chrome.pattern.where-it-fits", "Where it fits")}</h2>
              <p className="text-muted-foreground">{chrome("chrome.pattern.use-cases-description", "Situations where this breathing cadence excels.")}</p>
            </div>
            <div className="space-y-4">
              {page.useCases.map((useCase) => (
                <div key={useCase.name} className="rounded-2xl border border-border/60 p-4">
                  <p className="text-lg font-semibold text-card-foreground">{useCase.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{useCase.description}</p>
                  {useCase.dose ? <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{useCase.dose}</p> : null}
                </div>
              ))}
            </div>
            {page.frequency ? (
              <div className="rounded-2xl bg-muted/70 p-4">
                <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.suggested-frequency", "Suggested frequency")}</p>
                <p className="mt-1 text-base text-card-foreground">{page.frequency}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="glow-card space-y-6 rounded-[32px] border border-border bg-card p-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.practice-notes", "Practice notes")}</p>
              <h2 className="text-2xl font-semibold text-card-foreground">{chrome("chrome.pattern.keep-it-gentle", "Keep it gentle")}</h2>
              <p className="text-muted-foreground">{chrome("chrome.pattern.practice-notes-description", "Helpful reminders so the pattern stays sustainable day after day.")}</p>
            </div>
            <ul className="space-y-4">
              {page.practiceTips.map((tip) => (
                <li key={tip.title}>
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">{tip.title}</p>
                  <p className="text-base text-card-foreground">{tip.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div id="faq" className="glow-card space-y-6 rounded-[32px] border border-border bg-card p-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.faq", "FAQ")}</p>
              <h2 className="text-2xl font-semibold text-card-foreground">{chrome("chrome.pattern.common-questions", "Common questions")}</h2>
              <p className="text-muted-foreground">{chrome("chrome.pattern.faq-description", "Evidence-backed answers we hear from practitioners most often.")}</p>
            </div>
            <div className="space-y-6">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl bg-muted p-4">
                  <h3 className="text-lg font-semibold text-card-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{renderInlineLinks(faq.answer)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {(page.video || page.ownedVideo) ? (
          <section className="glow-card space-y-8 rounded-[32px] border border-border bg-card p-8">
            {page.video && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-widest text-primary">
                    {chrome("chrome.pattern.watch-learn", "Watch & learn")}
                  </p>
                  <h2 className="text-2xl font-semibold text-card-foreground">{page.video.title}</h2>
                  <p className="text-muted-foreground">{page.video.description}</p>
                </div>
                <div className="aspect-video w-full overflow-hidden rounded-2xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${page.video.youtubeId}`}
                    title={page.video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
            {page.ownedVideo && (
              <div className="space-y-4">
                {page.video && <hr className="border-border" />}
                <div>
                  <p className="text-sm uppercase tracking-widest text-primary">
                    {chrome("chrome.pattern.guided-session", "Guided session")}
                  </p>
                  <h2 className="text-2xl font-semibold text-card-foreground">{page.ownedVideo.title}</h2>
                  <p className="text-muted-foreground">
                    {chrome(
                      "chrome.pattern.guided-session-description",
                      "Watch the guided pacer session — the same exercise as above, recorded as a video you can follow anywhere.",
                    )}
                  </p>
                </div>
                <div className="aspect-video w-full overflow-hidden rounded-2xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${page.ownedVideo.youtubeId}`}
                    title={page.ownedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </section>
        ) : null}

        <section className="glow-card space-y-6 rounded-[32px] border border-border bg-card p-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.research-safety", "Research & safety")}</p>
            <h2 className="text-2xl font-semibold text-card-foreground">{chrome("chrome.pattern.what-evidence-says", "What evidence says")}</h2>
            <p className="text-muted-foreground">{chrome("chrome.pattern.research-description", "Peer-reviewed highlights and guardrails pulled from the content brief.")}</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground">{chrome("chrome.pattern.study-highlights", "Study highlights")}</h3>
              <ul className="space-y-4">
                {page.research.studies.map((study) => (
                  study.url ? (
                    <li key={study.title}>
                      <a
                        href={study.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-2xl bg-muted/70 p-4 transition-colors hover:bg-muted"
                      >
                        <p className="font-semibold text-primary underline underline-offset-2">
                          {study.title}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{study.summary}</p>
                      </a>
                    </li>
                  ) : (
                    <li key={study.title} className="rounded-2xl bg-muted/70 p-4">
                      <p className="font-semibold text-card-foreground">{study.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{study.summary}</p>
                    </li>
                  )
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground">{chrome("chrome.pattern.safety-notes", "Safety notes")}</h3>
              <ul className="grid grid-cols-1 gap-3 text-sm text-card-foreground sm:grid-cols-2">
                {page.research.safety.map((note, index) => (
                  <li key={`${note}-${index}`} className="rounded-2xl border border-border/60 bg-muted/60 p-4">
                    {note}
                  </li>
                ))}
              </ul>
              {page.research.quotes.length ? (
                <div className="space-y-3 rounded-2xl bg-background/60 p-4">
                  {page.research.quotes.map((quote, index) => (
                    <blockquote key={`${quote.text}-${index}`}>
                      <p className="text-card-foreground">&quot;{quote.text}&quot;</p>
                      <cite className="mt-2 block text-sm uppercase tracking-widest text-muted-foreground">{quote.attribution}</cite>
                    </blockquote>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {page.related?.length ? (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.related-techniques", "Related techniques")}</p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.related.map((relatedPattern) => {
                const relatedPage = breathingPageMap[relatedPattern.slug];
                const pattern = relatedPage ? BREATHING_PATTERNS[relatedPage.mode] : BREATHING_PATTERNS[page.mode];

                return (
                  <a
                    key={relatedPattern.slug}
                    href={localizeInternalPath(`/breathe/${relatedPattern.slug}`)}
                    className="min-w-[70vw] snap-center group rounded-[28px] border bg-card p-5 transition hover:border-primary first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 md:first:ml-0 md:last:mr-0 sm:min-w-0"
                    style={{ borderColor: pattern ? `${pattern.color}40` : undefined }}
                  >
                    <p className="text-lg font-semibold text-card-foreground">
                      {chrome(
                        `chrome.pattern.related-${relatedPattern.slug}-title`,
                        relatedPage?.hero.title ?? relatedPattern.slug,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{relatedPattern.reason}</p>
                    <span
                      className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                      style={{ color: pattern?.color }}
                    >
                      {chrome("chrome.pattern.practice-action", "Practice →")}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}

        {page.relatedUseCases && page.relatedUseCases.length > 0 && (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.related-use-cases", "Use case guides")}</p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.relatedUseCases.map((useCase) => {
                const pattern = BREATHING_PATTERNS[page.mode];

                return (
                  <a
                    key={useCase.slug}
                    href={localizeInternalPath(`/for/${useCase.slug}`)}
                    className="min-w-[70vw] snap-center group rounded-[28px] border bg-card p-5 transition hover:border-primary first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 md:first:ml-0 md:last:mr-0 sm:min-w-0"
                    style={{ borderColor: pattern ? `${pattern.color}40` : undefined }}
                  >
                    <p className="text-lg font-semibold text-card-foreground">
                      {useCase.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{useCase.teaser}</p>
                    <span
                      className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                      style={{ color: pattern?.color }}
                    >
                      {chrome("chrome.pattern.learn-more-action", "Learn more →")}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {page.relatedGuides && page.relatedGuides.length > 0 && (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">
              {chrome("chrome.pattern.in-depth-guides", "In-depth guides")}
            </p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.relatedGuides.map((guide) => {
                const pattern = BREATHING_PATTERNS[page.mode];

                return (
                  <a
                    key={guide.href}
                    href={localizeInternalPath(guide.href)}
                    className="min-w-[70vw] snap-center group rounded-[28px] border bg-card p-5 transition hover:border-primary first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 md:first:ml-0 md:last:mr-0 sm:min-w-0"
                    style={{ borderColor: pattern ? `${pattern.color}40` : undefined }}
                  >
                    <p className="text-lg font-semibold text-card-foreground">
                      {guide.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{guide.teaser}</p>
                    <span
                      className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                      style={{ color: pattern?.color }}
                    >
                      {chrome("chrome.pattern.read-guide-action", "Read guide →")}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {page.related.length ? (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.pattern.related-patterns", "Related patterns")}</p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.related.map((relatedPattern) => {
                const relatedPage = breathingPageMap[relatedPattern.slug];
                const pattern = relatedPage ? BREATHING_PATTERNS[relatedPage.mode] : null;

                return (
                  <a
                    key={relatedPattern.slug}
                    href={localizeInternalPath(`/breathe/${relatedPattern.slug}`)}
                    className="min-w-[70vw] snap-center group rounded-[28px] border bg-card p-5 transition hover:border-primary first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 md:first:ml-0 md:last:mr-0 sm:min-w-0"
                    style={{ borderColor: pattern ? `${pattern.color}40` : undefined }}
                  >
                    <p className="text-lg font-semibold text-card-foreground">
                      {chrome(
                        `chrome.pattern.related-${relatedPattern.slug}-title`,
                        relatedPage?.hero.title ?? relatedPattern.slug,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{relatedPattern.reason}</p>
                    <span
                      className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                      style={{ color: pattern?.color }}
                    >
                      {chrome("chrome.pattern.practice-action", "Practice →")}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Quick sessions - not applicable for protocol-based patterns like Wim Hof */}
        {routeSlug !== "wim-hof" && (
          <section className="glow-card rounded-[32px] border border-border bg-card p-6">
            <p className="text-sm uppercase tracking-widest text-primary">{chrome("chrome.shared.quick-sessions", "Quick sessions")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{chrome("chrome.shared.quick-sessions-description", "Short on time? Try a timed session:")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={localizeInternalPath("/1-minute-breathing-exercise")} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
                {chrome("chrome.shared.one-minute", "1 minute")}
              </a>
              <a href={localizeInternalPath("/2-minute-breathing-exercise")} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
                {chrome("chrome.shared.two-minutes", "2 minutes")}
              </a>
              <a href={localizeInternalPath("/5-minute-breathing-exercise")} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
                {chrome("chrome.shared.five-minutes", "5 minutes")}
              </a>
            </div>
            {/* Dedicated app links based on breathing technique */}
            {routeSlug === "box" && (
              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href={localizeInternalPath("/box-breathing-app")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                >
                  {chrome(
                    "chrome.pattern.dedicated-box-app-action",
                    "Try the dedicated Box Breathing App →",
                  )}
                </a>
              </div>
            )}
            {routeSlug === "coherent" && (
              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href={localizeInternalPath("/coherent-breathing-app")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                >
                  {chrome(
                    "chrome.pattern.dedicated-coherent-app-action",
                    "Try the dedicated Coherent Breathing App →",
                  )}
                </a>
              </div>
            )}
            {routeSlug === "4-7-8" && (
              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href={localizeInternalPath("/4-7-8-breathing-timer")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                >
                  {chrome(
                    "chrome.pattern.dedicated-4-7-8-timer-action",
                    "Try the dedicated 4-7-8 Breathing Timer →",
                  )}
                </a>
              </div>
            )}
          </section>
        )}

        <section className="rounded-[32px] p-8 text-center" style={{ backgroundColor: `${BREATHING_PATTERNS[page.mode].color}10` }}>
          <h2 className="text-2xl font-semibold text-card-foreground">{chrome("chrome.pattern.share-technique", "Share this technique")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            {chrome("chrome.pattern.share-section-text", `Know someone who could benefit from ${page.hero.title.toLowerCase()}? Send them a direct link.`)}
          </p>
          <div className="mt-4 flex justify-center">
            <ShareButton
              url={canonicalUrl}
              title={page.hero.title}
              text={chrome("chrome.pattern.hero-share-text", `Try this guided ${page.hero.title.toLowerCase()} exercise — it really helps.`)}
              buttonText={chrome("chrome.shared.share-exercise", "Share this exercise")}
              embedBaseUrl={localizedAbsoluteUrl("/embed").replace(/\/$/, "")}
              embedBrowseHref={localizeInternalPath("/embed")}
              locale={renderContext?.locale}
              variant="accent"
              accentColor={BREATHING_PATTERNS[page.mode].color}
              embedSlug={page.slug}
            />
          </div>
        </section>

        <footer className="rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            {chrome("chrome.shared.safety-warning", "Stop if dizzy, tingly, or chest-tight. Resume later with shorter, easier breaths.")}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <a href={localizeInternalPath("/breathe")} className="underline underline-offset-2 transition-colors hover:text-foreground">
              {chrome("chrome.shared.footer-techniques", "Techniques")}
            </a>
            <a href={localizeInternalPath("/for")} className="underline underline-offset-2 transition-colors hover:text-foreground">
              {chrome("chrome.shared.footer-guides", "Guides")}
            </a>
            <a href={localizeInternalPath("/breathing-app")} className="underline underline-offset-2 transition-colors hover:text-foreground">
              {chrome("chrome.shared.footer-app", "App")}
            </a>
            <a href={localizeInternalPath("/about")} className="underline underline-offset-2 transition-colors hover:text-foreground">
              {chrome("chrome.shared.footer-about", "About")}
            </a>
            <a href={localizeInternalPath("/about/abi")} className="underline underline-offset-2 transition-colors hover:text-foreground">
              {chrome("chrome.shared.footer-about-abi", "About Abi")}
            </a>
            <a href={localizeInternalPath("/embed")} className="underline underline-offset-2 transition-colors hover:text-foreground">
              {chrome("chrome.shared.footer-embed", "Embed")}
            </a>
            <a href={localizeInternalPath("/privacy")} className="underline underline-offset-2 transition-colors hover:text-foreground">
              {chrome("chrome.shared.footer-privacy", "Privacy")}
            </a>
          </div>
          <div className="mt-4">
            <LanguageSwitcherFooter
              basePath={`/breathe/${routeSlug}`}
              locale={renderContext?.locale}
            />
          </div>
        </footer>
      </section>
    </main>
  );
}
