import type { Metadata } from "next";
import Link from "next/link";

import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import type {
  ResonanceGuideContent,
  ResonanceGuideRoute,
} from "@/i18n/content/bespoke/resonance-guides/types";
import type { ResonanceRouteClientMessages } from "@/i18n/content/remaining-pages/rw02-route-client/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

import { ResonanceGuideResonance } from "./resonance-guide-resonance";

const siteUrl = "https://deepbreathingexercises.com";

interface GuideRouteConfig {
  readonly sourceRoute: `/${ResonanceGuideRoute}`;
  readonly defaultMode: ModeName;
  readonly starterHrefs?: readonly [string, string];
  readonly urgentHref?: string;
  readonly relatedHrefs: readonly [string, string, string];
}

const ROUTE_CONFIG: Record<ResonanceGuideRoute, GuideRouteConfig> = {
  "box-breathing-before-presentation": {
    sourceRoute: "/box-breathing-before-presentation",
    defaultMode: ModeName.Box,
    starterHrefs: ["/breathe/box", "/for/public-speaking"],
    relatedHrefs: ["/for/public-speaking", "/breathe/box", "/for/anxiety"],
  },
  "breathing-exercises-before-surgery": {
    sourceRoute: "/breathing-exercises-before-surgery",
    defaultMode: ModeName.Box,
    starterHrefs: ["/breathe/box", "/breathe/physiological-sigh"],
    relatedHrefs: [
      "/for/anxiety",
      "/breathe/box",
      "/breathe/physiological-sigh",
    ],
  },
  "breathing-exercises-for-labor": {
    sourceRoute: "/breathing-exercises-for-labor",
    defaultMode: ModeName.Relax,
    starterHrefs: ["/breathe/4-7-8", "/for/pregnancy"],
    relatedHrefs: ["/for/pregnancy", "/breathe/4-7-8", "/for/anxiety"],
  },
  "physiological-sigh-panic-attack": {
    sourceRoute: "/physiological-sigh-panic-attack",
    defaultMode: ModeName.Sigh,
    urgentHref: "/breathe/physiological-sigh",
    relatedHrefs: [
      "/for/panic-attacks",
      "/breathe/physiological-sigh",
      "/for/anxiety",
    ],
  },
};

const footerHrefs = [
  "/breathe",
  "/for",
  "/breathing-app",
  "/about",
  "/about/abi",
  "/embed",
] as const;

export function createResonanceGuideMetadataFromContent(
  content: ResonanceGuideContent,
  canonicalPath: string,
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

function gapBefore(value: string | undefined, isJapanese: boolean) {
  if (!value || isJapanese || /^[,.;:!?，。！？；：]/u.test(value)) return "";
  return " ";
}

function ProseSection({
  content,
  isJapanese,
}: {
  content: ResonanceGuideContent;
  isJapanese: boolean;
}) {
  const renderParagraph = (
    paragraph: ResonanceGuideContent["prose"]["paragraphs"][number],
    index: number,
  ) => (
    <p key={index}>
      {paragraph.text ?? paragraph.before}
      {paragraph.strong ? (
        <>
          {gapBefore(paragraph.strong, isJapanese)}
          <strong className="text-card-foreground">{paragraph.strong}</strong>
        </>
      ) : null}
      {paragraph.emphasis ? (
        <>
          {gapBefore(paragraph.emphasis, isJapanese)}
          <em>{paragraph.emphasis}</em>
        </>
      ) : null}
      {gapBefore(paragraph.after, isJapanese)}
      {paragraph.after}
    </p>
  );
  const [first, second, ...rest] = content.prose.paragraphs;

  return (
    <div className="glow-card rounded-[32px] border border-border bg-card p-8">
      <h2 className="text-2xl font-semibold text-card-foreground">
        {content.prose.title}
      </h2>
      <div className="mt-4 space-y-4 text-muted-foreground">
        {first ? renderParagraph(first, 0) : null}
        {second ? renderParagraph(second, 1) : null}
        {content.prose.bullets ? (
          <ul className="space-y-2 pl-4">
            {content.prose.bullets.map((item) => (
              <li key={item.label}>
                <strong className="text-card-foreground">{item.label}</strong>
                {gapBefore(item.body, isJapanese)}
                {item.body}
              </li>
            ))}
          </ul>
        ) : null}
        {rest.map((paragraph, index) => renderParagraph(paragraph, index + 2))}
      </div>
    </div>
  );
}

function NumberedSteps({ content }: { content: ResonanceGuideContent }) {
  return (
    <div className="glow-card rounded-[32px] border border-border bg-card p-8">
      <h2 className="text-2xl font-semibold text-card-foreground">
        {content.numberedSteps.title}
      </h2>
      <ol className="mt-4 space-y-4 text-muted-foreground">
        {content.numberedSteps.steps.map((step, index) => (
          <li className="flex gap-4" key={step.title}>
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <div>
              <strong className="text-card-foreground">{step.title}</strong>
              <p className="mt-1 text-sm">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FaqSection({ content }: { content: ResonanceGuideContent }) {
  return (
    <div className="glow-card rounded-[32px] border border-border bg-card p-8">
      <h2 className="text-2xl font-semibold text-card-foreground">
        {content.faq.title}
      </h2>
      <div className="mt-6 space-y-6">
        {content.faq.items.map((item) => (
          <div key={item.question}>
            <h3 className="text-lg font-semibold text-card-foreground">
              {item.question}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarterGrid({
  content,
  href,
  hrefs,
  isJapanese,
}: {
  content: ResonanceGuideContent;
  href: (path: string) => string;
  hrefs: readonly [string, string];
  isJapanese: boolean;
}) {
  if (!content.starterGrid)
    throw new Error("Standard guide content lacks starter-grid copy");
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {content.starterGrid.starter.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {content.starterGrid.starter.body}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={href(hrefs[0])}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {content.starterGrid.starter.primaryAction}
          </Link>
          <Link
            href={href(hrefs[1])}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {content.starterGrid.starter.secondaryAction}
          </Link>
        </div>
      </div>

      <div className="glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {content.starterGrid.protocol.title}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {content.starterGrid.protocol.items.map((item) => (
            <li key={item.label}>
              <strong className="text-card-foreground">{item.label}</strong>
              {gapBefore(item.body, isJapanese)}
              {item.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function UrgentProtocol({
  content,
  href,
  hrefPath,
  isJapanese,
}: {
  content: ResonanceGuideContent;
  href: (path: string) => string;
  hrefPath: string;
  isJapanese: boolean;
}) {
  if (!content.urgentProtocol)
    throw new Error("Panic guide content lacks urgent-protocol copy");
  return (
    <section className="mb-8 rounded-[32px] border-2 border-primary bg-primary/5 p-8">
      <h2 className="text-2xl font-semibold text-card-foreground">
        {content.urgentProtocol.title}
      </h2>
      <ol className="mt-4 space-y-3 text-lg">
        {content.urgentProtocol.items.map((item, index) => (
          <li className="flex gap-3" key={item.title}>
            <span className="font-bold text-primary">{index + 1}.</span>
            <span>
              <strong>{item.title}</strong>
              {gapBefore(item.detail, isJapanese)}
              {item.detail}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <Link
          href={href(hrefPath)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
        >
          {content.urgentProtocol.action}
        </Link>
      </div>
    </section>
  );
}

function TimelineCards({ content }: { content: ResonanceGuideContent }) {
  if (!content.timelineCards) return null;
  return (
    <div className="glow-card rounded-[32px] border border-border bg-card p-8">
      <h2 className="text-2xl font-semibold text-card-foreground">
        {content.timelineCards.title}
      </h2>
      <div className="mt-4 space-y-6">
        {content.timelineCards.cards.map((card) => (
          <div className="rounded-2xl bg-muted/50 p-4" key={card.title}>
            <h3 className="font-semibold text-card-foreground">{card.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedAndFooter({
  content,
  href,
  relatedHrefs,
}: {
  content: ResonanceGuideContent;
  href: (path: string) => string;
  relatedHrefs: readonly [string, string, string];
}) {
  return (
    <>
      <section className="mt-12 space-y-4">
        <p className="text-sm uppercase tracking-widest text-primary">
          {content.related.label}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {content.related.cards.map((card, index) => (
            <Link
              href={href(relatedHrefs[index])}
              className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary"
              key={card.title}
            >
              <p className="text-lg font-semibold text-card-foreground">
                {card.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
                {card.action}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
        <p className="text-xs text-muted-foreground">{content.footer.safety}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {content.footer.links.map((label, index) => (
            <Link
              href={href(footerHrefs[index])}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
              key={footerHrefs[index]}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </>
  );
}

export function ResonanceGuidePage({
  route,
  content,
  renderContext,
  routeClientMessages,
}: {
  route: ResonanceGuideRoute;
  content: ResonanceGuideContent;
  renderContext?: NativeRouteRenderContext;
  routeClientMessages?: ResonanceRouteClientMessages;
}) {
  const config = ROUTE_CONFIG[route];
  const canonicalPath = renderContext?.canonicalPath ?? config.sourceRoute;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const href = (path: string) =>
    renderContext
      ? resolveNativeInternalHref(
          path,
          renderContext.locale,
          renderContext.linkMode,
        )
      : path;
  const isJapanese = renderContext?.locale === "ja-JP";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: content.schema.breadcrumbHome,
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: content.schema.breadcrumbCurrent,
        item: canonicalUrl,
      },
    ],
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.schema.articleHeadline,
    description: content.schema.articleDescription,
    author: {
      "@type": "Person",
      name: content.schema.authorName,
      url: new URL(href("/about/abi"), siteUrl).toString(),
    },
    publisher: {
      "@type": "Organization",
      name: content.schema.publisherName,
      url: siteUrl,
    },
    datePublished: "2026-01-27",
    dateModified: "2026-01-27",
    mainEntityOfPage: canonicalUrl,
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.schema.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <ResonanceGuideResonance
          defaultMode={config.defaultMode}
          loadingAriaLabel={content.loading.ariaLabel}
          locale={renderContext?.locale}
          localizedRoutePaths={renderContext?.localizedRoutePaths}
          modeDisplayName={content.runtime.modeDisplayName}
          routeClientMessages={routeClientMessages}
        />
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
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">{content.updated}</p>

        {content.alert ? (
          <section className="mb-8 rounded-2xl border-l-4 border-amber-500 bg-amber-500/10 p-6">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              {content.alert.label}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {content.alert.body}
            </p>
          </section>
        ) : null}

        {config.starterHrefs ? (
          <StarterGrid
            content={content}
            href={href}
            hrefs={config.starterHrefs}
            isJapanese={isJapanese}
          />
        ) : (
          <UrgentProtocol
            content={content}
            href={href}
            hrefPath={config.urgentHref ?? "/breathe/physiological-sigh"}
            isJapanese={isJapanese}
          />
        )}

        <section
          className={config.starterHrefs ? "mt-12 space-y-6" : "space-y-6"}
        >
          <ProseSection content={content} isJapanese={isJapanese} />
          <TimelineCards content={content} />
          <NumberedSteps content={content} />
          <FaqSection content={content} />
        </section>

        <RelatedAndFooter
          content={content}
          href={href}
          relatedHrefs={config.relatedHrefs}
        />
      </div>
    </main>
  );
}
