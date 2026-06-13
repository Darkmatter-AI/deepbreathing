import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { FadingHeroTitle } from "@/components/breathe/fading-hero-title";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import { JsonLd } from "@/components/seo/json-ld";
import { breathingPageMap, type BreathingPageContent, type OwnedVideoEmbed } from "@/data/breathing-pages";
import { LocalizedDate } from "@/components/seo/localized-date";
import { LanguageSwitcherFooter } from "@/components/language-switcher";
import { renderInlineLinks } from "@/lib/render-inline-links";

const ShareButton = dynamic(
  () => import("@/components/ui/share-button").then(mod => ({ default: mod.ShareButton })),
  { ssr: false }
);

// Lazy-load Resonance to improve initial page load
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

export function createPatternMetadata(slug: string): Metadata {
  const page = breathingPageMap[slug];
  if (!page) return {};

  const pageContent: BreathingPageContent = page;
  const canonicalUrl = `${baseUrl}/breathe/${pageContent.slug}`;
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
          alt: `${pageContent.hero.title} – Interactive breathing visualizer`,
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

export function PatternPage({ slug }: { slug: string }) {
  const page = breathingPageMap[slug];
  if (!page) {
    notFound();
  }
  const canonicalUrl = `${baseUrl}/breathe/${page.slug}`;
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
        url: `${baseUrl}/about/abi`
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
        name: "Home",
        item: baseUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Breathing Techniques",
        item: `${baseUrl}/breathe`
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
      label="DEEP BREATHING EXERCISES"
      title={page.hero.title}
      subtitle={page.hero.subtitle}
      headingLevel={2}
    >
      <div className="pt-2">
        <ShareButton
          url={canonicalUrl}
          title={page.hero.title}
          text={`Try this guided ${page.hero.title.toLowerCase()} exercise — it really helps.`}
          buttonText="Share this exercise"
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
        <Resonance defaultMode={page.mode} className="min-h-screen" />
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-6 pb-6 text-center pointer-events-none sm:inset-y-0 sm:left-0 sm:max-w-xl sm:items-start sm:justify-center sm:py-20 sm:text-left">
          <div className="pointer-events-auto">
            {heroHeader}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-6 w-full max-w-6xl space-y-12 rounded-t-[48px] bg-background/95 px-4 pb-20 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        {page.meta.dateModified && (
          <p className="text-xs text-muted-foreground -mt-6" data-i18n="credentials">
            <LocalizedDate date={page.meta.dateModified} reviewerName={reviewerName} />
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
            <p className="text-sm uppercase tracking-widest text-primary">Technique overview</p>
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
              <p className="text-sm uppercase tracking-widest text-primary">Benefit</p>
              <h2 className="mt-2 text-2xl font-semibold text-card-foreground">{benefit.title}</h2>
              <p className="mt-2 text-muted-foreground">{renderInlineLinks(benefit.description)}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div id="how-to" className="glow-card space-y-6 rounded-[32px] border border-border bg-card p-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">Step-by-step</p>
              <h2 className="text-2xl font-semibold text-card-foreground">How to practice</h2>
              <p className="text-muted-foreground">Structured walkthrough pulled from the editorial brief.</p>
            </div>

            <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              {page.howTo.totalTime ? (
                <div>
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">Total time</dt>
                  <dd className="text-base text-card-foreground">{page.howTo.totalTime}</dd>
                </div>
              ) : null}
              {page.howTo.difficulty ? (
                <div>
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">Difficulty</dt>
                  <dd className="text-base text-card-foreground capitalize">{page.howTo.difficulty}</dd>
                </div>
              ) : null}
              {page.howTo.tools.length ? (
                <div className="sm:col-span-2">
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">Tools</dt>
                  <dd className="text-base text-card-foreground">{page.howTo.tools.join(", ")}</dd>
                </div>
              ) : null}
              {page.howTo.supplies.length ? (
                <div className="sm:col-span-2">
                  <dt className="font-semibold uppercase tracking-widest text-xs text-primary">Supplies</dt>
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
              <p className="text-sm uppercase tracking-widest text-primary">Use cases</p>
              <h2 className="text-2xl font-semibold text-card-foreground">Where it fits</h2>
              <p className="text-muted-foreground">Situations where this breathing cadence excels.</p>
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
                <p className="text-sm uppercase tracking-widest text-primary">Suggested frequency</p>
                <p className="mt-1 text-base text-card-foreground">{page.frequency}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="glow-card space-y-6 rounded-[32px] border border-border bg-card p-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">Practice notes</p>
              <h2 className="text-2xl font-semibold text-card-foreground">Keep it gentle</h2>
              <p className="text-muted-foreground">Helpful reminders so the pattern stays sustainable day after day.</p>
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
              <p className="text-sm uppercase tracking-widest text-primary">FAQ</p>
              <h2 className="text-2xl font-semibold text-card-foreground">Common questions</h2>
              <p className="text-muted-foreground">Evidence-backed answers we hear from practitioners most often.</p>
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
                  <p className="text-sm uppercase tracking-widest text-primary">Watch & learn</p>
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
                  <p className="text-sm uppercase tracking-widest text-primary">Guided session</p>
                  <h2 className="text-2xl font-semibold text-card-foreground">{page.ownedVideo.title}</h2>
                  <p className="text-muted-foreground">Watch the guided pacer session — the same exercise as above, recorded as a video you can follow anywhere.</p>
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
            <p className="text-sm uppercase tracking-widest text-primary">Research & safety</p>
            <h2 className="text-2xl font-semibold text-card-foreground">What evidence says</h2>
            <p className="text-muted-foreground">Peer-reviewed highlights and guardrails pulled from the content brief.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground">Study highlights</h3>
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
              <h3 className="text-lg font-semibold text-card-foreground">Safety notes</h3>
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
            <p className="text-sm uppercase tracking-widest text-primary">Related techniques</p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.related.map((relatedPattern) => {
                const relatedPage = breathingPageMap[relatedPattern.slug];
                const pattern = relatedPage ? BREATHING_PATTERNS[relatedPage.mode] : BREATHING_PATTERNS[page.mode];

                return (
                  <Link
                    key={relatedPattern.slug}
                    href={`/breathe/${relatedPattern.slug}`}
                    className="min-w-[70vw] snap-center group rounded-[28px] border bg-card p-5 transition hover:border-primary first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 md:first:ml-0 md:last:mr-0 sm:min-w-0"
                    style={{ borderColor: pattern ? `${pattern.color}40` : undefined }}
                  >
                    <p className="text-lg font-semibold text-card-foreground">
                      {relatedPage?.hero.title ?? relatedPattern.slug}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{relatedPattern.reason}</p>
                    <span
                      className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                      style={{ color: pattern?.color }}
                    >
                      Practice →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {page.relatedUseCases && page.relatedUseCases.length > 0 && (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">Use case guides</p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.relatedUseCases.map((useCase) => {
                const pattern = BREATHING_PATTERNS[page.mode];

                return (
                  <Link
                    key={useCase.slug}
                    href={`/for/${useCase.slug}`}
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
                      Learn more →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {page.relatedGuides && page.relatedGuides.length > 0 && (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">In-depth guides</p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.relatedGuides.map((guide) => {
                const pattern = BREATHING_PATTERNS[page.mode];

                return (
                  <Link
                    key={guide.href}
                    href={guide.href}
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
                      Read guide →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {page.related.length ? (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">Related patterns</p>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              {page.related.map((relatedPattern) => {
                const relatedPage = breathingPageMap[relatedPattern.slug];
                const pattern = relatedPage ? BREATHING_PATTERNS[relatedPage.mode] : null;

                return (
                  <Link
                    key={relatedPattern.slug}
                    href={`/breathe/${relatedPattern.slug}`}
                    className="min-w-[70vw] snap-center group rounded-[28px] border bg-card p-5 transition hover:border-primary first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 md:first:ml-0 md:last:mr-0 sm:min-w-0"
                    style={{ borderColor: pattern ? `${pattern.color}40` : undefined }}
                  >
                    <p className="text-lg font-semibold text-card-foreground">
                      {relatedPage?.hero.title ?? relatedPattern.slug}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{relatedPattern.reason}</p>
                    <span
                      className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                      style={{ color: pattern?.color }}
                    >
                      Practice →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Quick sessions - not applicable for protocol-based patterns like Wim Hof */}
        {slug !== "wim-hof" && (
          <section className="glow-card rounded-[32px] border border-border bg-card p-6">
            <p className="text-sm uppercase tracking-widest text-primary">Quick sessions</p>
            <p className="mt-2 text-sm text-muted-foreground">Short on time? Try a timed session:</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/1-minute-breathing-exercise" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
                1 minute
              </Link>
              <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
                2 minutes
              </Link>
              <Link href="/5-minute-breathing-exercise" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
                5 minutes
              </Link>
            </div>
            {/* Dedicated app links based on breathing technique */}
            {slug === "box" && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href="/box-breathing-app"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                >
                  Try the dedicated Box Breathing App →
                </Link>
              </div>
            )}
            {slug === "coherent" && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href="/coherent-breathing-app"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                >
                  Try the dedicated Coherent Breathing App →
                </Link>
              </div>
            )}
            {slug === "4-7-8" && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href="/4-7-8-breathing-timer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                >
                  Try the dedicated 4-7-8 Breathing Timer →
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="rounded-[32px] p-8 text-center" style={{ backgroundColor: `${BREATHING_PATTERNS[page.mode].color}10` }}>
          <h2 className="text-2xl font-semibold text-card-foreground">Share this technique</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Know someone who could benefit from {page.hero.title.toLowerCase()}? Send them a direct link.
          </p>
          <div className="mt-4 flex justify-center">
            <ShareButton
              url={canonicalUrl}
              title={page.hero.title}
              text={`Try this guided ${page.hero.title.toLowerCase()} exercise — it really helps.`}
              buttonText="Share this exercise"
              variant="accent"
              accentColor={BREATHING_PATTERNS[page.mode].color}
              embedSlug={page.slug}
            />
          </div>
        </section>

        <footer className="rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Stop if dizzy, tingly, or chest-tight. Resume later with shorter, easier breaths.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/breathe" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Techniques
            </Link>
            <Link href="/for" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Guides
            </Link>
            <Link href="/breathing-app" className="underline underline-offset-2 transition-colors hover:text-foreground">
              App
            </Link>
            <Link href="/about" className="underline underline-offset-2 transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/about/abi" className="underline underline-offset-2 transition-colors hover:text-foreground">
              About Abi
            </Link>
            <Link href="/embed" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Embed
            </Link>
            <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Privacy
            </Link>
          </div>
          <div className="mt-4">
            <LanguageSwitcherFooter />
          </div>
        </footer>
      </section>
    </main>
  );
}
