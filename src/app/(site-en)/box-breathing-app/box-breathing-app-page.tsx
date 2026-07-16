import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import sourceContent from "@/i18n/content/bespoke/rw03-app-pages/source/box-breathing-app.json";
import type {
  BoxBreathingAppMessageId,
  BoxBreathingAppContent,
} from "@/i18n/content/bespoke/rw03-app-pages/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

import { BoxBreathingAppResonance } from "./box-breathing-app-resonance";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/box-breathing-app";
const englishContent = sourceContent as BoxBreathingAppContent;

export function createBoxBreathingAppMetadataFromContent(
  content: BoxBreathingAppContent,
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
      title: content["metadata.twitterTitle"],
      description: content["metadata.twitterDescription"],
      images: [ogImageUrl],
    },
  };
}

export function BoxBreathingAppPage({
  content = englishContent,
  renderContext,
}: {
  content?: BoxBreathingAppContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const copy = (messageId: BoxBreathingAppMessageId) => content[messageId];
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
        name: copy("breadcrumb.current"),
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: copy("faq.items.0.question"),
        acceptedAnswer: {
          "@type": "Answer",
          text: copy("faq.items.0.answer"),
        },
      },
      {
        "@type": "Question",
        name: copy("faq.items.1.question"),
        acceptedAnswer: {
          "@type": "Answer",
          text: copy("faq.items.1.answer"),
        },
      },
      {
        "@type": "Question",
        name: copy("faq.items.2.question"),
        acceptedAnswer: {
          "@type": "Answer",
          text: copy("faq.items.2.answer"),
        },
      },
      {
        "@type": "Question",
        name: copy("faq.items.3.question"),
        acceptedAnswer: {
          "@type": "Answer",
          text: copy("faq.items.3.answer"),
        },
      },
      {
        "@type": "Question",
        name: copy("faq.items.4.question"),
        acceptedAnswer: {
          "@type": "Answer",
          text: copy("faq.items.4.answer"),
        },
      },
      {
        "@type": "Question",
        name: copy("faq.items.5.question"),
        acceptedAnswer: {
          "@type": "Answer",
          text: copy("faq.items.5.answer"),
        },
      },
    ],
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <BoxBreathingAppResonance
          className="min-h-screen"
          loadingAriaLabel={copy("loading.ariaLabel")}
          locale={renderContext?.locale}
          localizedRoutePaths={renderContext?.localizedRoutePaths}
          modeDisplayName={copy("runtime.modeDisplayName")}
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
        <div className="mb-8 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {copy("quickAnswer.title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {copy("quickAnswer.body")}
          </p>
        </div>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("starter.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy("starter.body")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={href("/breathe/box")}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                {copy("starter.primaryAction")}
              </Link>
              <Link
                href={href("/breathing-app")}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
              >
                {copy("starter.secondaryAction")}
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("settings.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy("settings.intro")}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>{copy("settings.items.0")}</li>
              <li>{copy("settings.items.1")}</li>
              <li>{copy("settings.items.2")}</li>
              <li>{copy("settings.items.3")}</li>
            </ul>
            <div className="mt-5">
              <Link
                href={href("/breathe/box#how-to")}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {copy("settings.action")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("faq.items.0.question")}
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("definition.paragraphs.0")}</p>
              <p>{copy("definition.paragraphs.1")}</p>
              <p>{copy("definition.paragraphs.2")}</p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("benefits.title")}
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("benefits.intro")}</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("benefits.items.0.label")}
                    </strong>
                    {wordGap}
                    {copy("benefits.items.0.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("benefits.items.1.label")}
                    </strong>
                    {wordGap}
                    {copy("benefits.items.1.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("benefits.items.2.label")}
                    </strong>
                    {wordGap}
                    {copy("benefits.items.2.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("benefits.items.3.label")}
                    </strong>
                    {wordGap}
                    {copy("benefits.items.3.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("benefits.items.4.label")}
                    </strong>
                    {wordGap}
                    {copy("benefits.items.4.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("benefits.items.5.label")}
                    </strong>
                    {wordGap}
                    {copy("benefits.items.5.body")}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("mechanism.title")}
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("mechanism.paragraphs.0")}</p>
              <p>{copy("mechanism.paragraphs.1")}</p>
              <p>{copy("mechanism.paragraphs.2")}</p>
              <p>{copy("mechanism.paragraphs.3")}</p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("useCases.title")}
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("useCases.intro")}</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("useCases.items.0.label")}
                    </strong>
                    {wordGap}
                    {copy("useCases.items.0.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("useCases.items.1.label")}
                    </strong>
                    {wordGap}
                    {copy("useCases.items.1.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("useCases.items.2.label")}
                    </strong>
                    {wordGap}
                    {copy("useCases.items.2.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("useCases.items.3.label")}
                    </strong>
                    {wordGap}
                    {copy("useCases.items.3.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("useCases.items.4.label")}
                    </strong>
                    {wordGap}
                    {copy("useCases.items.4.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("useCases.items.5.label")}
                    </strong>
                    {wordGap}
                    {copy("useCases.items.5.body")}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">
                      {copy("useCases.items.6.label")}
                    </strong>
                    {wordGap}
                    {copy("useCases.items.6.body")}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {copy("faq.title")}
            </h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {copy("faq.items.0.question")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy("faq.items.0.answer")}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {copy("faq.items.1.question")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy("faq.items.1.answer")}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {copy("faq.items.2.question")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy("faq.items.2.answer")}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {copy("faq.items.3.question")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy("faq.items.3.answer")}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {copy("faq.items.4.question")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy("faq.items.4.answer")}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {copy("faq.items.5.question")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy("faq.items.5.answer")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">
              {copy("features.items.0.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy("features.items.0.body")}
            </p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">
              {copy("features.items.1.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy("features.items.1.body")}
            </p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">
              {copy("features.items.2.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy("features.items.2.body")}
            </p>
          </div>
        </section>

        <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {copy("moreTimers.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy("moreTimers.intro")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={href("/4-7-8-breathing-timer")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
            >
              {copy("moreTimers.links.0.label")}
            </Link>
            <Link
              href={href("/coherent-breathing-app")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
            >
              {copy("moreTimers.links.1.label")}
            </Link>
            <Link
              href={href("/2-minute-breathing-exercise")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
            >
              {copy("moreTimers.links.2.label")}
            </Link>
            <Link
              href={href("/for/running")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
            >
              {copy("moreTimers.links.3.label")}
            </Link>
            <Link
              href={href("/breathe")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
            >
              {copy("moreTimers.links.4.label")}
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
              {copy("footer.links.0.label")}
            </Link>
            <Link
              href={href("/for")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.links.1.label")}
            </Link>
            <Link
              href={href("/breathing-app")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.links.2.label")}
            </Link>
            <Link
              href={href("/about")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.links.3.label")}
            </Link>
            <Link
              href={href("/about/abi")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.links.4.label")}
            </Link>
            <Link
              href={href("/embed")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.links.5.label")}
            </Link>
            <Link
              href={href("/privacy")}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {copy("footer.links.6.label")}
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
