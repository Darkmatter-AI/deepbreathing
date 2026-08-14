import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { JsonLd } from "@/components/seo/json-ld";
import type {
  DurationContentRoute,
  DurationExercisePageContent,
} from "@/i18n/content/bespoke/duration-exercises/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";
import { ShareButton } from "@/components/ui/share-button-lazy";

const siteUrl = "https://deepbreathingexercises.com";

interface DurationRouteConfig {
  readonly sourceRoute: `/${DurationContentRoute}`;
  readonly practice: readonly {
    readonly href: string;
    readonly embedSlug: string;
  }[];
  readonly faqLinks: readonly string[];
  readonly moreOptionHrefs: readonly string[];
}

const ROUTE_CONFIG: Record<DurationContentRoute, DurationRouteConfig> = {
  "1-minute-breathing-exercise": {
    sourceRoute: "/1-minute-breathing-exercise",
    practice: [{ href: "/breathe/box?duration=60", embedSlug: "box" }],
    faqLinks: [
      "/2-minute-breathing-exercise",
      "/5-minute-breathing-exercise",
      "/breathing-app",
    ],
    moreOptionHrefs: [
      "/2-minute-breathing-exercise",
      "/5-minute-breathing-exercise",
      "/for/public-speaking",
      "/for/anxiety",
      "/breathe",
    ],
  },
  "2-minute-breathing-exercise": {
    sourceRoute: "/2-minute-breathing-exercise",
    practice: [
      { href: "/breathe/box?duration=120", embedSlug: "box" },
      { href: "/breathe/coherent?duration=120", embedSlug: "coherent" },
    ],
    faqLinks: [
      "/5-minute-breathing-exercise",
      "/1-minute-breathing-exercise",
      "/breathing-app",
    ],
    moreOptionHrefs: [
      "/1-minute-breathing-exercise",
      "/5-minute-breathing-exercise",
      "/4-7-8-breathing-timer",
      "/box-breathing-app",
      "/for/anxiety",
      "/for/running",
      "/for/focus",
      "/breathe",
    ],
  },
  "5-minute-breathing-exercise": {
    sourceRoute: "/5-minute-breathing-exercise",
    practice: [
      { href: "/breathe/coherent?duration=300", embedSlug: "coherent" },
    ],
    faqLinks: [
      "/1-minute-breathing-exercise",
      "/2-minute-breathing-exercise",
      "/coherent-breathing-app",
    ],
    moreOptionHrefs: [
      "/1-minute-breathing-exercise",
      "/2-minute-breathing-exercise",
      "/coherent-breathing-app",
      "/for/focus",
      "/for/sleep",
      "/breathe",
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
  "/privacy",
] as const;

export function createDurationMetadataFromContent(
  content: DurationExercisePageContent,
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
      title: content.metadata.socialTitle,
      description: content.metadata.twitterDescription,
      images: [ogImageUrl],
    },
  };
}

function LabeledList({
  items,
  separator,
}: {
  items: DurationExercisePageContent["useCases"]["items"];
  separator: string;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li className="flex gap-3" key={`${item.label}:${item.body}`}>
          <span className="text-primary">•</span>
          <span>
            <strong className="text-card-foreground">{item.label}</strong>
            {separator}
            {item.body}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ContentSection({
  section,
  separator,
}: {
  section: DurationExercisePageContent["primarySection"];
  separator: string;
}) {
  return (
    <div className="glow-card rounded-[32px] border border-border bg-card p-8">
      <h2 className="text-2xl font-semibold text-card-foreground">
        {section.title}
      </h2>
      <div className="mt-4 space-y-4 text-muted-foreground">
        {section.intro ? <p>{section.intro}</p> : null}
        {section.paragraphs?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.items ? (
          <LabeledList items={section.items} separator={separator} />
        ) : null}
      </div>
    </div>
  );
}

function RichFaqAnswer({
  fragments,
  hrefs,
  resolveHref,
}: {
  fragments: readonly string[];
  hrefs: readonly string[];
  resolveHref: (path: string) => string;
}) {
  let linkIndex = 0;
  return fragments.map((fragment, index) => {
    if (index % 2 === 0) return <Fragment key={index}>{fragment}</Fragment>;
    const href = hrefs[linkIndex++];
    if (!href) return <Fragment key={index}>{fragment}</Fragment>;
    return (
      <Link
        href={resolveHref(href)}
        className="underline hover:text-foreground"
        key={index}
      >
        {fragment}
      </Link>
    );
  });
}

export function DurationExercisePage({
  content,
  renderContext,
  route,
}: {
  content: DurationExercisePageContent;
  renderContext?: NativeRouteRenderContext;
  route: DurationContentRoute;
}) {
  const config = ROUTE_CONFIG[route];
  const wordSeparator = renderContext?.locale === "ja-JP" ? "" : " ";
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
  const clientLocalization = renderContext
    ? {
        embedBaseUrl: new URL(href("/embed"), siteUrl)
          .toString()
          .replace(/\/$/, ""),
        embedBrowseHref: href("/embed"),
        locale: renderContext.locale,
      }
    : {};
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: content.breadcrumb.home,
        item: siteUrl,
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
    mainEntity: content.schemaFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const linkedFaqIndex = content.faq.items.findIndex(
    (item) => item.answerFragments.length > 1,
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">
          {content.hero.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          {content.hero.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {content.hero.intro}
        </p>
      </header>

      {content.quickAnswer ? (
        <div className="mt-8 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.quickAnswer.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {content.quickAnswer.body}
          </p>
        </div>
      ) : null}

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {content.practiceCards.map((card, index) => {
          const practice = config.practice[index];
          return (
            <div
              className="glow-card rounded-[32px] border border-border bg-card p-6"
              key={practice.href}
            >
              <h2 className="text-2xl font-semibold text-card-foreground">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={href(practice.href)}
                  rel="nofollow"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  {card.action}
                </Link>
                <ShareButton
                  url={canonicalUrl}
                  title={card.shareTitle}
                  text={card.shareText}
                  buttonText={card.shareButtonText}
                  embedSlug={practice.embedSlug}
                  {...clientLocalization}
                />
              </div>
            </div>
          );
        })}

        {content.pattern ? (
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {content.pattern.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {content.pattern.intro}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {content.pattern.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="mt-12 space-y-6">
        <ContentSection
          section={content.primarySection}
          separator={wordSeparator}
        />
        {content.secondarySection ? (
          <ContentSection
            section={content.secondarySection}
            separator={wordSeparator}
          />
        ) : null}

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.useCases.title}
          </h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <LabeledList
              items={content.useCases.items}
              separator={wordSeparator}
            />
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.faq.title}
          </h2>
          <div className="mt-6 space-y-6">
            {content.faq.items.map((item, index) => (
              <div key={item.question}>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  <RichFaqAnswer
                    fragments={item.answerFragments}
                    hrefs={index === linkedFaqIndex ? config.faqLinks : []}
                    resolveHref={href}
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        {content.features.map((feature) => (
          <div
            className="glow-card rounded-[32px] border border-border bg-card p-6"
            key={feature.title}
          >
            <h2 className="text-xl font-semibold text-card-foreground">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {content.moreOptions.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {content.moreOptions.intro}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {content.moreOptions.labels.map((label, index) => (
            <Link
              href={href(config.moreOptionHrefs[index])}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
              key={`${config.moreOptionHrefs[index]}:${label}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[32px] bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {content.share.title}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          {content.share.body}
        </p>
        <div className="mt-4 flex justify-center">
          <ShareButton
            url={canonicalUrl}
            title={content.share.shareTitle}
            text={content.share.shareText}
            buttonText={content.share.buttonText}
            {...clientLocalization}
          />
        </div>
      </section>

      <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
        <p className="text-xs text-muted-foreground">
          {content.footer.warning}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {content.footer.labels.map((label, index) => (
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
    </main>
  );
}
