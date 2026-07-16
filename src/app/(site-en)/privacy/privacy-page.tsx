import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import type { PrivacyContent } from "@/i18n/content/bespoke/privacy-support/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/privacy";

export function createPrivacyMetadataFromContent(
  content: PrivacyContent,
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

export function PrivacyPage({
  content,
  renderContext,
}: {
  content: PrivacyContent;
  renderContext?: NativeRouteRenderContext;
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
  const wordGap = renderContext?.locale === "ja-JP" ? "" : " ";
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

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbSchema} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">
          {content.hero.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          {content.hero.title}
        </h1>
        <p className="text-lg text-muted-foreground">{content.hero.intro}</p>
        <p className="text-sm text-muted-foreground">
          {content.hero.lastUpdated}
        </p>
      </header>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.collection.title}
          </h2>
          <p className="mt-3">{content.sections.collection.body}</p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.accounts.title}
          </h2>
          <p className="mt-3">{content.sections.accounts.body}</p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.useAndShare.title}
          </h2>
          <p className="mt-3">{content.sections.useAndShare.body}</p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.deletion.title}
          </h2>
          <p className="mt-3">
            {content.sections.deletion.beforeAction}
            {wordGap}&ldquo;{content.sections.deletion.action}&rdquo;
            {wordGap}
            {content.sections.deletion.afterAction}
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.device.title}
          </h2>
          <p className="mt-3">{content.sections.device.body}</p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.thirdParty.title}
          </h2>
          <p className="mt-3">{content.sections.thirdParty.body}</p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.sections.contact.title}
          </h2>
          <p className="mt-3">{content.sections.contact.intro}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <a
                href="https://abiassi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {content.sections.contact.abiassiLabel}
              </a>
            </p>
            <p>
              <a
                href="https://darkmatter.is/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {content.sections.contact.darkmatterLabel}
              </a>
            </p>
          </div>
          <div className="mt-4">
            <Link
              href={href("/")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {content.sections.contact.backLink}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
