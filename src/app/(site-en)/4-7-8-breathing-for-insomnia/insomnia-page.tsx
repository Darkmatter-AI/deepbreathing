import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import sourceContent from "@/i18n/content/bespoke/insomnia-4-7-8/source.json";
import type {
  InsomniaMessageId,
  InsomniaPageContent,
} from "@/i18n/content/bespoke/insomnia-4-7-8/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

import { InsomniaResonance } from "./insomnia-resonance";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/4-7-8-breathing-for-insomnia";
const englishContent = sourceContent as InsomniaPageContent;

export function createInsomniaMetadataFromContent(
  content: InsomniaPageContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = createOgImagePath(content["metadata.imageAlt"]);
  return {
    metadataBase: new URL(siteUrl),
    title: content["metadata.title"],
    description: content["metadata.description"],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: content["metadata.socialTitle"],
      description: content["metadata.socialDescription"],
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: content["metadata.imageAlt"],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content["metadata.socialTitle"],
      description: content["metadata.twitterDescription"],
      images: [ogImageUrl],
    },
  };
}

export function InsomniaPage({
  content = englishContent,
  renderContext,
}: {
  content?: InsomniaPageContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const copy = (messageId: InsomniaMessageId) => content[messageId];
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
  const wordGap = renderContext?.locale === "ja-JP" ? "" : " ";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy("breadcrumb.home"),
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: copy("hero.title"),
        item: canonicalUrl,
      },
    ],
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: copy("metadata.socialTitle"),
    description: copy("schema.articleDescription"),
    author: {
      "@type": "Person",
      name: copy("schema.authorName"),
      url: new URL(href("/about/abi"), siteUrl).toString(),
    },
    publisher: {
      "@type": "Organization",
      name: copy("schema.publisherName"),
      url: siteUrl,
    },
    datePublished: "2026-01-27",
    dateModified: "2026-01-27",
    mainEntityOfPage: canonicalUrl,
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: Array.from({ length: 3 }, (_, index) => ({
      "@type": "Question",
      name: copy(`schema.faq.items.${index}.question` as InsomniaMessageId),
      acceptedAnswer: {
        "@type": "Answer",
        text: copy(`schema.faq.items.${index}.answer` as InsomniaMessageId),
      },
    })),
  };
  const settings = ["pattern", "cycles", "position", "restless"] as const;
  const steps = Array.from({ length: 6 }, (_, index) => ({
    body: copy(`sections.steps.items.${index}.body` as InsomniaMessageId),
    title: copy(`sections.steps.items.${index}.title` as InsomniaMessageId),
  }));
  const faqItems = Array.from({ length: 3 }, (_, index) => ({
    answer: copy(`sections.faq.items.${index}.answer` as InsomniaMessageId),
    question: copy(`sections.faq.items.${index}.question` as InsomniaMessageId),
  }));
  const resonanceLocaleProps = renderContext
    ? {
        locale: renderContext.locale,
        localizedRoutePaths: renderContext.localizedRoutePaths,
        modeDisplayName: copy("hero.title"),
      }
    : {};

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <InsomniaResonance
          loadingAriaLabel={copy("loading.ariaLabel")}
          {...resonanceLocaleProps}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">
              {copy("hero.eyebrow")}
            </p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
              {copy("hero.title")}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {copy("hero.intro")}
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">{copy("updated")}</p>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("sections.start.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy("sections.start.body")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={href("/breathe/4-7-8")}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                {copy("sections.start.timerLink")}
              </Link>
              <Link
                href={href("/4-7-8-breathing-timer")}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
              >
                {copy("sections.start.guideLink")}
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("sections.settings.title")}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {settings.map((setting) => (
                <li key={setting}>
                  <strong className="text-card-foreground">
                    {copy(`sections.settings.items.${setting}.label`)}
                  </strong>
                  {wordGap}
                  {copy(`sections.settings.items.${setting}.body`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("sections.why.title")}
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("sections.why.paragraph1")}</p>
              <p>
                {copy("sections.why.paragraph2.beforeEmphasis")}
                {wordGap}
                <strong className="text-card-foreground">
                  {copy("sections.why.paragraph2.emphasis")}
                </strong>
                {copy("sections.why.paragraph2.afterEmphasis")}
              </p>
              <p>
                {copy("sections.why.paragraph3.beforeEmphasis")}
                {wordGap}
                <em>{copy("sections.why.paragraph3.emphasis")}</em>
                {wordGap}
                {copy("sections.why.paragraph3.afterEmphasis")}
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("sections.steps.title")}
            </h2>
            <ol className="mt-4 space-y-4 text-muted-foreground">
              {steps.map((step, index) => (
                <li className="flex gap-4" key={step.title}>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <strong className="text-card-foreground">
                      {step.title}
                    </strong>
                    <p className="mt-1 text-sm">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("sections.faq.title")}
            </h2>
            <div className="mt-6 space-y-6">
              {faqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">
            {copy("related.label")}
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href={href("/for/sleep")}
              className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary"
            >
              <p className="text-lg font-semibold text-card-foreground">
                {copy("related.cards.sleep.title")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy("related.cards.sleep.body")}
              </p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
                {copy("related.learnMore")}
              </span>
            </Link>
            <Link
              href={href("/breathe/4-7-8")}
              className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary"
            >
              <p className="text-lg font-semibold text-card-foreground">
                {copy("related.cards.timer.title")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy("related.cards.timer.body")}
              </p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
                {copy("related.learnMore")}
              </span>
            </Link>
            <Link
              href={href("/for/anxiety")}
              className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary"
            >
              <p className="text-lg font-semibold text-card-foreground">
                {copy("related.cards.anxiety.title")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy("related.cards.anxiety.body")}
              </p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
                {copy("related.learnMore")}
              </span>
            </Link>
          </div>
        </section>

        <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            {copy("footer.safety")}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link
              href={href("/breathe")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.techniques")}
            </Link>
            <Link
              href={href("/for")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.guides")}
            </Link>
            <Link
              href={href("/breathing-app")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.app")}
            </Link>
            <Link
              href={href("/about")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.about")}
            </Link>
            <Link
              href={href("/about/abi")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.aboutAbi")}
            </Link>
            <Link
              href={href("/embed")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.embed")}
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
