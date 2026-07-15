import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { FadingHeroTitle } from "@/components/breathe/fading-hero-title";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import { JsonLd } from "@/components/seo/json-ld";
import { useCasePageMap, type UseCasePageContent } from "@/data/use-case-pages";
import { LocalizedDate } from "@/components/seo/localized-date";
import { LanguageSwitcherFooter } from "@/components/language-switcher";
import { renderInlineLinks } from "@/lib/render-inline-links";
import { createOgImagePath } from "@/lib/seo/og-image";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import type { NativeRouteRenderContext } from "@/i18n/render-context";

// Dynamic import for client component
const ShareButton = dynamic(
  () =>
    import("@/components/ui/share-button").then((mod) => ({
      default: mod.ShareButton,
    })),
  { ssr: false },
);

// Lazy-load Resonance to improve initial page load
const Resonance = dynamic(() => import("@/components/resonance/Resonance"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="min-h-screen flex items-center justify-center bg-background"
    >
      <div className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

const baseUrl = "https://deepbreathingexercises.com";

// Internal link opportunities identified by Ahrefs — one link per keyword per page.
// linkifyOnce finds the FIRST occurrence of a keyword in a string and wraps it in a Link.
// Subsequent occurrences remain as plain text (tracked via the `linked` Set).
const internalLinkMappings: Record<
  string,
  Array<{ keyword: string; href: string }>
> = {
  "public-speaking": [
    { keyword: "physiological sigh", href: "/breathe/physiological-sigh" },
  ],
  anxiety: [
    { keyword: "the physiological sigh", href: "/breathe/physiological-sigh" },
  ],
  "travel-anxiety": [
    { keyword: "the physiological sigh", href: "/breathe/physiological-sigh" },
  ],
  "lung-capacity": [
    { keyword: "pursed-lip breathing", href: "/breathe/pursed-lip" },
  ],
};

function linkifyOnce(
  text: string,
  mappings: Array<{ keyword: string; href: string }>,
  linked: Set<string>,
  resolveHref: (href: string) => string,
): React.ReactNode {
  for (const { keyword, href } of mappings) {
    if (linked.has(keyword)) continue;
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const idx = lowerText.indexOf(lowerKeyword);
    if (idx === -1) continue;
    linked.add(keyword);
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + keyword.length);
    const after = text.slice(idx + keyword.length);
    return (
      <>
        {before}
        <Link href={resolveHref(href)} className="text-primary hover:underline">
          {match}
        </Link>
        {after}
      </>
    );
  }
  return text;
}

export function createUseCaseMetadataFromContent(
  pageContent: UseCasePageContent,
  canonicalPath = `/for/${pageContent.slug}`,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, baseUrl).toString();
  const pattern = BREATHING_PATTERNS[pageContent.mode];
  const ogImage = createOgImagePath(
    pageContent.meta.ogTitle || pageContent.meta.title,
    {
      subtitle: pageContent.hero.subtitle,
      color: pattern?.color,
    },
  );

  return {
    metadataBase: new URL(baseUrl),
    title: pageContent.meta.title,
    description: pageContent.meta.description,
    keywords: pageContent.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title: pageContent.meta.ogTitle || pageContent.meta.title,
      description:
        pageContent.meta.ogDescription || pageContent.meta.description,
      url: canonicalUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: pageContent.meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageContent.meta.twitterTitle || pageContent.meta.title,
      description:
        pageContent.meta.twitterDescription || pageContent.meta.description,
      images: [ogImage],
    },
  };
}

export function createUseCaseMetadata(slug: string): Metadata {
  const page = useCasePageMap[slug];
  return page ? createUseCaseMetadataFromContent(page) : {};
}

// Winter blue colors (must match Resonance.tsx)
const WINTER_BLUE = "#0c1929";
const WINTER_CARD = "#162a43"; // Lighter blue for cards
const WINTER_MUTED = "#1a3352"; // Even lighter for nested elements

interface UseCasePageProps {
  slug: string;
  content?: UseCasePageContent;
  canonicalPath?: string;
  renderContext?: NativeRouteRenderContext;
}

export function UseCasePage({
  slug,
  content,
  canonicalPath,
  renderContext,
}: UseCasePageProps) {
  const page = content ?? useCasePageMap[slug];
  if (!page) {
    notFound();
  }

  const routeSlug = page.slug;
  const chrome = (messageId: `chrome.${string}`, fallback: string) =>
    renderContext?.serverMessages?.[messageId] ?? fallback;
  const localizeInternalPath = (path: string) =>
    renderContext
      ? resolveNativeInternalHref(
          path,
          renderContext.locale,
          renderContext.linkMode,
        )
      : path;
  const localizedAbsoluteUrl = (path: string) =>
    new URL(localizeInternalPath(path), baseUrl).toString();
  const isHolidayPage =
    routeSlug === "holiday-stress" || routeSlug === "travel-anxiety";
  const pattern = BREATHING_PATTERNS[page.mode];
  const canonicalUrl = new URL(
    renderContext?.canonicalPath ?? canonicalPath ?? `/for/${routeSlug}`,
    baseUrl,
  ).toString();
  const reviewerName = page.meta.reviewer || null;
  const ogImage = createOgImagePath(page.meta.ogTitle || page.meta.title, {
    subtitle: page.hero.subtitle,
    color: pattern?.color,
  });

  // Internal link opportunity tracking — ensures each keyword is only linked once per page
  const pageLinkMappings = (internalLinkMappings[routeSlug] ?? []).map(
    (mapping) =>
      routeSlug === "lung-capacity" && mapping.href === "/breathe/pursed-lip"
        ? {
            ...mapping,
            keyword: chrome(
              "chrome.use-case.internal-link-pursed-lip-keyword",
              "pursed-lip breathing",
            ),
          }
        : mapping,
  );
  const linkedKeywords = new Set<string>();
  const linkify = (text: string) =>
    linkifyOnce(text, pageLinkMappings, linkedKeywords, localizeInternalPath);

  const ogImagePath = createOgImagePath(page.meta.ogTitle || page.meta.title, {
    subtitle: page.hero.subtitle,
    color: pattern?.color,
  });
  const ogImageUrl = new URL(ogImagePath, baseUrl).toString();

  const siteOrganization = {
    "@type": "Organization",
    name: "Deep Breathing Exercises",
    url: baseUrl,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
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
    name: page.hero.title,
    description: page.hero.intro,
    step: page.howTo.steps.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.instruction,
      url: `${canonicalUrl}#how-to`,
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.meta.title,
    description: page.meta.description,
    image: ogImage,
    author: page.meta.author
      ? {
          "@type": "Person",
          name: page.meta.author,
          url: localizedAbsoluteUrl("/about/abi"),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: baseUrl,
    },
    ...(reviewerName
      ? {
          reviewedBy: {
            "@type": "Person",
            name: reviewerName,
          },
        }
      : {}),
    datePublished: page.meta.datePublished,
    dateModified: page.meta.dateModified,
    mainEntityOfPage: canonicalUrl,
    keywords: page.keywords.join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: chrome("chrome.shared.breadcrumb-home", "Home"),
        item: localizedAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: chrome("chrome.use-case.breadcrumb-use-cases", "Use Cases"),
        item: localizedAbsoluteUrl("/for"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.hero.title,
      },
    ],
  };

  const videoSchema = page.video
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: page.video.title,
        description: page.video.description,
        thumbnailUrl: `https://img.youtube.com/vi/${page.video.youtubeId}/maxresdefault.jpg`,
        uploadDate: `${page.meta.datePublished}T08:00:00+00:00`,
        embedUrl: `https://www.youtube.com/embed/${page.video.youtubeId}`,
        contentUrl: `https://www.youtube.com/watch?v=${page.video.youtubeId}`,
      }
    : null;

  const structuredData = [
    faqSchema,
    howToSchema,
    articleSchema,
    breadcrumbSchema,
    ...(videoSchema ? [videoSchema] : []),
  ];

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
          text={chrome(
            "chrome.use-case.hero-share-text",
            `Try this guided breathing exercise for ${page.hero.title.toLowerCase().replace(/^breathing (exercises? )?for /, "")}.`,
          )}
          buttonText={chrome(
            "chrome.use-case.share-with-someone",
            "Share with someone",
          )}
          embedBaseUrl={localizedAbsoluteUrl("/embed").replace(/\/$/, "")}
          embedBrowseHref={localizeInternalPath("/embed")}
          locale={renderContext?.locale}
          variant={isHolidayPage ? "default" : "accent"}
          accentColor={pattern.color}
          embedSlug={page.breathingPageSlug}
        />
      </div>
    </FadingHeroTitle>
  );

  return (
    <main
      className={isHolidayPage ? "dark" : "bg-transparent"}
      style={isHolidayPage ? { backgroundColor: WINTER_BLUE } : undefined}
    >
      <h1 className="sr-only">{page.hero.title}</h1>
      <JsonLd data={structuredData} />

      {/* Hero with Visualizer */}
      <section
        id="practice"
        className="relative isolate z-20 min-h-screen w-full text-foreground"
      >
        <Resonance
          defaultMode={page.mode}
          locale={renderContext?.locale}
          localizedRoutePaths={renderContext?.localizedRoutePaths}
          modeDisplayName={chrome(
            "chrome.use-case.box-breathing-name",
            "Box Breathing",
          )}
          className="min-h-screen"
          snowMode={isHolidayPage}
          forcedTheme={isHolidayPage ? "dark" : undefined}
          backgroundVariant={isHolidayPage ? "winter-blue" : "default"}
        />
        <div className="absolute inset-y-0 left-0 z-30 flex w-full max-w-xl flex-col justify-end sm:justify-center px-6 py-20 pointer-events-none">
          <div className="pointer-events-auto">{heroHeader}</div>
        </div>
      </section>

      {/* Main Content */}
      <section
        className={`relative z-10 mx-auto mt-6 w-full max-w-6xl space-y-12 rounded-t-[48px] px-4 pb-20 pt-16 sm:px-6 lg:px-8 ${
          isHolidayPage
            ? "bg-[#0f1f33]/95 backdrop-blur-sm"
            : "bg-background/95 backdrop-blur-sm"
        }`}
        style={
          isHolidayPage
            ? { backgroundColor: "rgba(15, 31, 51, 0.97)" }
            : undefined
        }
      >
        {/* Back to Holiday Hub link */}
        {isHolidayPage && (
          <div className="-mt-4 mb-2">
            <Link
              href={localizeInternalPath("/holiday-breathing-exercises")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              {chrome(
                "chrome.use-case.back-to-holiday-hub",
                "Back to Holiday Hub",
              )}
            </Link>
          </div>
        )}

        {/* Intro */}
        <p
          className="text-xs text-muted-foreground -mt-4"
          data-i18n="credentials"
        >
          <LocalizedDate
            date={page.meta.dateModified}
            lastUpdatedLabel={chrome(
              "chrome.shared.date-last-updated",
              "Last updated",
            )}
            locale={renderContext?.locale}
            reviewedByLabel={chrome(
              "chrome.shared.date-reviewed-by",
              "Reviewed by",
            )}
            reviewerName={reviewerName}
          />
        </p>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p className="text-xl leading-relaxed">{page.hero.intro}</p>
        </div>

        {/* Voice Search Q&A - prominently placed for featured snippets */}
        {page.voiceSearch && page.voiceSearch.length > 0 && (
          <section className="space-y-6">
            {page.voiceSearch.map((qa) => (
              <div
                key={qa.question}
                className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
                style={
                  isHolidayPage
                    ? {
                        backgroundColor: WINTER_CARD,
                        borderColor: "rgba(255,255,255,0.1)",
                      }
                    : undefined
                }
              >
                <h2 className="text-2xl font-semibold text-card-foreground">
                  {qa.question}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  {qa.answer}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Medical Disclaimer (if present) */}
        {page.disclaimer && (
          <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-500/10 p-6">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              {chrome("chrome.use-case.important", "Important")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {page.disclaimer}
            </p>
          </div>
        )}

        {/* The Problem */}
        <section
          className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-sm uppercase tracking-widest text-primary">
            {chrome("chrome.use-case.problem", "The Problem")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {page.problem.heading}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {renderInlineLinks(page.problem.content)}
          </p>

          {page.problem.symptoms && page.problem.symptoms.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {chrome("chrome.use-case.common-symptoms", "Common symptoms")}
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {page.problem.symptoms.map((symptom) => (
                  <li
                    key={symptom}
                    className="flex items-start gap-2 text-sm text-card-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* The Solution */}
        <section
          className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-sm uppercase tracking-widest text-primary">
            {chrome("chrome.use-case.solution", "The Solution")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {page.solution.heading}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {renderInlineLinks(page.solution.content)}
          </p>

          <div
            className="mt-6 rounded-2xl p-4"
            style={
              isHolidayPage ? { backgroundColor: WINTER_MUTED } : undefined
            }
          >
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              {chrome(
                "chrome.use-case.why-this-technique",
                "Why this technique",
              )}
            </p>
            <p className="mt-2 text-card-foreground">
              {renderInlineLinks(page.solution.whyThisPattern)}
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href="#practice"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: pattern.color }}
            >
              {chrome(
                "chrome.use-case.start-practicing",
                "Start practicing now →",
              )}
            </a>
            <Link
              href={localizeInternalPath(
                `/breathe/${page.relatedTechnique.slug}`,
              )}
              className="inline-flex items-center gap-2 text-sm font-medium transition hover:underline"
              style={{ color: pattern.color }}
            >
              {chrome(
                "chrome.use-case.learn-box-breathing",
                `Learn more about ${pattern.name} →`,
              )}
            </Link>
          </div>
        </section>

        {/* Why It Works (Science) */}
        <section
          className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-sm uppercase tracking-widest text-primary">
            {chrome("chrome.use-case.why-it-works", "Why It Works")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {page.science.heading}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {page.science.points.map((point) => (
              <div
                key={point.mechanism}
                className="rounded-2xl p-4"
                style={
                  isHolidayPage ? { backgroundColor: WINTER_MUTED } : undefined
                }
              >
                <p className="font-semibold text-card-foreground">
                  {point.mechanism}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {renderInlineLinks(point.explanation)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How-To Steps */}
        <section
          id="how-to"
          className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-sm uppercase tracking-widest text-primary">
            {chrome("chrome.use-case.step-by-step", "Step-by-Step")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {chrome("chrome.use-case.how-to-practice", "How to Practice")}
          </h2>

          <ol className="mt-6 space-y-4">
            {page.howTo.steps.map((step, index) => (
              <li
                key={step.name}
                className="flex gap-4 rounded-2xl p-4"
                style={
                  isHolidayPage ? { backgroundColor: WINTER_MUTED } : undefined
                }
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium text-card-foreground">
                    {step.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.instruction}
                  </p>
                  {step.timing && (
                    <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                      {step.timing}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {page.howTo.tips.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {chrome("chrome.use-case.pro-tips", "Pro tips")}
              </p>
              <ul className="mt-3 space-y-2">
                {page.howTo.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-2 text-sm text-card-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {linkify(tip)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* References */}
        <section
          className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-sm uppercase tracking-widest text-primary">
            {chrome(
              "chrome.use-case.research-references",
              "Research & References",
            )}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {chrome("chrome.use-case.scientific-sources", "Scientific Sources")}
          </h2>

          <ul className="mt-6 space-y-4">
            {page.references.map((ref) => (
              <li
                key={ref.url}
                className="rounded-2xl p-4"
                style={
                  isHolidayPage ? { backgroundColor: WINTER_MUTED } : undefined
                }
              >
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  {ref.title}
                </a>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {ref.source}
                </p>
                {ref.summary && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ref.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Video */}
        {page.video && (
          <section
            className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
            style={
              isHolidayPage
                ? {
                    backgroundColor: WINTER_CARD,
                    borderColor: "rgba(255,255,255,0.1)",
                  }
                : undefined
            }
          >
            <p className="text-sm uppercase tracking-widest text-primary">
              {chrome("chrome.use-case.watch-learn", "Watch & Learn")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{page.video.title}</h2>
            <p className="mt-2 text-muted-foreground">
              {page.video.description}
            </p>
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${page.video.youtubeId}`}
                title={page.video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
                loading="lazy"
              />
            </div>
          </section>
        )}

        {/* FAQ */}
        <section
          id="faq"
          className="glow-card rounded-[32px] border border-border p-8 text-card-foreground"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-sm uppercase tracking-widest text-primary">
            {chrome("chrome.use-case.faq", "FAQ")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {chrome("chrome.use-case.common-questions", "Common Questions")}
          </h2>

          <div className="mt-6 space-y-6">
            {page.faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl p-4"
                style={
                  isHolidayPage
                    ? { backgroundColor: WINTER_MUTED }
                    : { backgroundColor: "hsl(var(--muted))" }
                }
              >
                <h3 className="text-lg font-semibold text-card-foreground">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {renderInlineLinks(faq.answer)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Use Cases */}
        {page.relatedUseCases.length > 0 && (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">
              {chrome("chrome.use-case.more-guides", "More Breathing Guides")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {page.relatedUseCases.map((related) => {
                const relatedPage = useCasePageMap[related.slug];
                const relatedPattern = relatedPage
                  ? BREATHING_PATTERNS[relatedPage.mode]
                  : null;

                return (
                  <Link
                    key={related.slug}
                    href={localizeInternalPath(`/for/${related.slug}`)}
                    className="group rounded-[28px] border p-5 transition hover:border-primary"
                    style={{
                      borderColor: relatedPattern
                        ? `${relatedPattern.color}40`
                        : undefined,
                      backgroundColor: isHolidayPage ? WINTER_CARD : undefined,
                    }}
                  >
                    <p className="text-lg font-semibold text-card-foreground">
                      {chrome(
                        (
                          {
                            "panic-attacks":
                              "chrome.use-case.related-panic-title",
                            "public-speaking":
                              "chrome.use-case.related-public-speaking-title",
                            "holiday-stress":
                              "chrome.use-case.related-holiday-title",
                            "travel-anxiety":
                              "chrome.use-case.related-travel-title",
                            kids: "chrome.use-case.related-kids-title",
                            huberman: "chrome.use-case.related-huberman-title",
                          } as Record<string, `chrome.${string}`>
                        )[related.slug] ??
                          `chrome.use-case.related-${related.slug}-title`,
                        relatedPage?.hero.title ?? related.slug,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {related.teaser}
                    </p>
                    <span
                      className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                      style={{ color: relatedPattern?.color }}
                    >
                      {chrome(
                        "chrome.use-case.learn-more-action",
                        "Learn more →",
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* In-depth guides for specific situations */}
        {page.relatedGuides && page.relatedGuides.length > 0 && (
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">
              {chrome("chrome.use-case.in-depth-guides", "In-Depth Guides")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {page.relatedGuides.map((guide) => (
                <Link
                  key={guide.href}
                  href={localizeInternalPath(guide.href)}
                  className="group rounded-[28px] border p-5 transition hover:border-primary"
                  style={{
                    borderColor: `${pattern.color}40`,
                    backgroundColor: isHolidayPage ? WINTER_CARD : undefined,
                  }}
                >
                  <p className="text-lg font-semibold text-card-foreground">
                    {guide.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {guide.teaser}
                  </p>
                  <span
                    className="mt-3 inline-flex items-center text-sm font-semibold text-primary"
                    style={{ color: pattern.color }}
                  >
                    {chrome(
                      "chrome.use-case.read-guide-action",
                      "Read guide →",
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ready to practice */}
        <section
          className="rounded-[32px] p-8 text-center"
          style={{ backgroundColor: `${pattern.color}10` }}
        >
          <p
            className="text-sm uppercase tracking-widest"
            style={{ color: pattern.color }}
          >
            {chrome("chrome.use-case.ready-to-practice", "Ready to practice?")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">
            {chrome("chrome.use-case.start-session", "Start Your Session")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            {chrome(
              "chrome.use-case.visualizer-description",
              "Use the interactive visualizer above to guide your breathing. Follow the animation and let your body relax.",
            )}
          </p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#practice"
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: pattern.color }}
              >
                {chrome(
                  "chrome.use-case.go-to-visualizer",
                  "Go to visualizer →",
                )}
              </a>
              <ShareButton
                url={canonicalUrl}
                title={page.hero.title}
                text={chrome(
                  "chrome.use-case.hero-share-text",
                  `Try this guided breathing exercise for ${page.hero.title.toLowerCase().replace(/^breathing (exercises? )?for /, "")}.`,
                )}
                buttonText={chrome(
                  "chrome.shared.share-exercise",
                  "Share this exercise",
                )}
                embedBaseUrl={localizedAbsoluteUrl("/embed").replace(/\/$/, "")}
                embedBrowseHref={localizeInternalPath("/embed")}
                locale={renderContext?.locale}
                size="large"
                variant={isHolidayPage ? "default" : "accent"}
                accentColor={pattern.color}
                embedSlug={page.breathingPageSlug}
              />
            </div>
            <Link
              href={localizeInternalPath(
                `/breathe/${page.relatedTechnique.slug}`,
              )}
              className="inline-flex items-center gap-2 text-sm font-medium transition hover:underline"
              style={{ color: pattern.color }}
            >
              {chrome(
                "chrome.use-case.learn-box-breathing",
                `Learn more about ${pattern.name} →`,
              )}
            </Link>
          </div>
        </section>

        <section
          className="glow-card rounded-[32px] border border-border p-6"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-sm uppercase tracking-widest text-primary">
            {chrome("chrome.shared.quick-sessions", "Quick sessions")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isHolidayPage
              ? chrome(
                  "chrome.use-case.holiday-ready-sessions",
                  "Holiday-ready sessions:",
                )
              : chrome(
                  "chrome.shared.quick-sessions-description",
                  "Short on time? Try a timed session:",
                )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {isHolidayPage ? (
              <>
                <Link
                  href={localizeInternalPath(
                    `/breathe/${page.breathingPageSlug}?duration=30`,
                  )}
                  rel="nofollow"
                  className="rounded-full border px-4 py-2 text-sm font-medium text-card-foreground transition-colors"
                  style={{
                    borderColor: "rgba(255,255,255,0.2)",
                    backgroundColor: WINTER_MUTED,
                  }}
                >
                  {chrome("chrome.use-case.holiday-30s-reset", "30s Reset")}
                </Link>
                <Link
                  href={localizeInternalPath(
                    `/breathe/${page.breathingPageSlug}?duration=60`,
                  )}
                  rel="nofollow"
                  className="rounded-full border px-4 py-2 text-sm font-medium text-card-foreground transition-colors"
                  style={{
                    borderColor: "rgba(255,255,255,0.2)",
                    backgroundColor: WINTER_MUTED,
                  }}
                >
                  {chrome(
                    "chrome.use-case.holiday-1min-breather",
                    "1min Breather",
                  )}
                </Link>
                <Link
                  href={localizeInternalPath(
                    `/breathe/${page.breathingPageSlug}?duration=120`,
                  )}
                  rel="nofollow"
                  className="rounded-full border px-4 py-2 text-sm font-medium text-card-foreground transition-colors"
                  style={{
                    borderColor: "rgba(255,255,255,0.2)",
                    backgroundColor: WINTER_MUTED,
                  }}
                >
                  {chrome(
                    "chrome.use-case.holiday-2min-calm-down",
                    "2min Calm Down",
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={localizeInternalPath("/1-minute-breathing-exercise")}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
                >
                  {chrome("chrome.shared.one-minute", "1 minute")}
                </Link>
                <Link
                  href={localizeInternalPath("/2-minute-breathing-exercise")}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
                >
                  {chrome("chrome.shared.two-minutes", "2 minutes")}
                </Link>
                <Link
                  href={localizeInternalPath("/5-minute-breathing-exercise")}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
                >
                  {chrome("chrome.shared.five-minutes", "5 minutes")}
                </Link>
              </>
            )}
          </div>
          {/* Dedicated app links based on breathing technique */}
          {!isHolidayPage && page.breathingPageSlug === "box" && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href={localizeInternalPath("/box-breathing-app")}
                className="inline-flex items-center gap-2 text-sm font-medium transition hover:underline"
                style={{ color: pattern.color }}
              >
                {chrome(
                  "chrome.use-case.try-box-app",
                  "Try the dedicated Box Breathing App →",
                )}
              </Link>
            </div>
          )}
          {!isHolidayPage && page.breathingPageSlug === "coherent" && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href={localizeInternalPath("/coherent-breathing-app")}
                className="inline-flex items-center gap-2 text-sm font-medium transition hover:underline"
                style={{ color: pattern.color }}
              >
                {chrome(
                  "chrome.use-case.try-coherent-app",
                  "Try the dedicated Coherent Breathing App →",
                )}
              </Link>
            </div>
          )}
          {!isHolidayPage && page.breathingPageSlug === "4-7-8" && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href={localizeInternalPath("/4-7-8-breathing-timer")}
                className="inline-flex items-center gap-2 text-sm font-medium transition hover:underline"
                style={{ color: pattern.color }}
              >
                {chrome(
                  "chrome.use-case.try-4-7-8-timer",
                  "Try the dedicated 4-7-8 Breathing Timer →",
                )}
              </Link>
            </div>
          )}
        </section>

        <footer
          className="rounded-[32px] border border-border p-6 text-center"
          style={
            isHolidayPage
              ? {
                  backgroundColor: WINTER_CARD,
                  borderColor: "rgba(255,255,255,0.1)",
                }
              : undefined
          }
        >
          <p className="text-xs text-muted-foreground">
            {chrome(
              "chrome.shared.safety-warning",
              "Stop if dizzy, tingly, or chest-tight. Resume later with shorter, easier breaths.",
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link
              href={localizeInternalPath("/breathe")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {chrome("chrome.shared.footer-techniques", "Techniques")}
            </Link>
            <Link
              href={localizeInternalPath("/for")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {chrome("chrome.shared.footer-guides", "Guides")}
            </Link>
            <Link
              href={localizeInternalPath("/breathing-app")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {chrome("chrome.shared.footer-app", "App")}
            </Link>
            <Link
              href={localizeInternalPath("/about")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {chrome("chrome.shared.footer-about", "About")}
            </Link>
            <Link
              href={localizeInternalPath("/about/abi")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {chrome("chrome.shared.footer-about-abi", "About Abi")}
            </Link>
            <Link
              href={localizeInternalPath("/embed")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {chrome("chrome.shared.footer-embed", "Embed")}
            </Link>
            <Link
              href={localizeInternalPath("/privacy")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {chrome("chrome.shared.footer-privacy", "Privacy")}
            </Link>
          </div>
          <div className="mt-4">
            <LanguageSwitcherFooter
              basePath={`/for/${routeSlug}`}
              locale={renderContext?.locale}
            />
          </div>
        </footer>
      </section>
    </main>
  );
}
