import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import type { EditorialPolicyPageContent } from "@/i18n/content/bespoke/trust-pages/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/about/editorial-policy";
const datePublished = "2026-01-27";
const dateModified = "2026-05-06";
const englishArticleDescription =
  "How we research, write, and update our breathing-technique guides. Lineage attribution, peer-reviewed citations, honest framing.";

export function createEditorialPolicyMetadataFromContent(
  content: EditorialPolicyPageContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = createOgImagePath(content.metadata.socialTitle);

  return {
    metadataBase: new URL(siteUrl),
    title: content.metadata.title,
    description: content.metadata.description,
    alternates: {
      canonical: canonicalUrl,
    },
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
          alt: content.metadata.socialTitle,
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

export function EditorialPolicyPage({
  content,
  renderContext,
}: {
  content: EditorialPolicyPageContent;
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
  const absoluteInternalHref = (path: string) =>
    new URL(href(path), siteUrl).toString();
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: content.footer.about,
        item: absoluteInternalHref("/about"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: content.hero.title,
        item: canonicalUrl,
      },
    ],
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.metadata.socialTitle,
    description: renderContext
      ? content.metadata.socialDescription
      : englishArticleDescription,
    author: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: siteUrl,
    },
    datePublished,
    dateModified,
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, articleSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">
          {content.hero.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          {content.hero.title}
        </h1>
        <p className="text-lg text-muted-foreground">{content.hero.intro}</p>
        <p className="text-xs text-muted-foreground">
          {content.hero.lastUpdated}
        </p>
      </header>

      <section className="mt-10 space-y-8 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.content.whatSiteIs.title}
          </h2>
          <p className="mt-4">
            {content.content.whatSiteIs.beforeAbi}{" "}
            <Link
              href={href("/about/abi")}
              className="text-primary hover:underline"
            >
              {content.content.whatSiteIs.abiName}
            </Link>{" "}
            {content.content.whatSiteIs.afterAbi}
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.content.attribution.title}
          </h2>
          <div className="mt-4 space-y-3">
            <p>{content.content.attribution.originators}</p>
            <p>{content.content.attribution.longerLineage}</p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.content.citations.title}
          </h2>
          <div className="mt-4 space-y-4">
            <p>{content.content.citations.intro}</p>
            <p>{content.content.citations.priorityIntro}</p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">
                    {content.content.citations.priorities.reviews.title}
                  </strong>{" "}
                  {content.content.citations.priorities.reviews.body}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">
                    {content.content.citations.priorities.trials.title}
                  </strong>{" "}
                  {content.content.citations.priorities.trials.body}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">
                    {content.content.citations.priorities.mechanisms.title}
                  </strong>{" "}
                  {content.content.citations.priorities.mechanisms.body}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">
                    {content.content.citations.priorities.practitioners.title}
                  </strong>{" "}
                  {content.content.citations.priorities.practitioners.body}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.content.claims.title}
          </h2>
          <div className="mt-4 space-y-4">
            <p>{content.content.claims.evidence}</p>
            <p>{content.content.claims.scrutiny}</p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.content.exclusions.title}
          </h2>
          <div className="mt-4 space-y-4">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>{content.content.exclusions.diagnoses}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>{content.content.exclusions.cures}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>{content.content.exclusions.credentials}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>{content.content.exclusions.overstatement}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.content.updates.title}
          </h2>
          <div className="mt-4 space-y-4">
            <p>
              {content.content.updates.beforeEmail}{" "}
              <a
                href="mailto:hi@abiassi.com"
                className="text-primary hover:underline"
              >
                {content.content.updates.email}
              </a>
              {content.content.updates.afterEmail}
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.content.whoBuilt.title}
          </h2>
          <div className="mt-4 space-y-4">
            <p>
              {content.content.whoBuilt.beforeAbi}{" "}
              <Link
                href={href("/about/abi")}
                className="text-primary hover:underline"
              >
                {content.content.whoBuilt.abiName}
              </Link>{" "}
              {content.content.whoBuilt.beforeDarkmatter}{" "}
              <a
                href="https://darkmatter.is/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {content.content.whoBuilt.darkmatterName}
              </a>
              .
            </p>
            <p className="text-sm">{content.content.whoBuilt.disclaimer}</p>
          </div>
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link
          href={href("/about")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.about}
        </Link>
        <Link
          href={href("/about/abi")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.aboutAbi}
        </Link>
        <Link
          href={href("/breathe")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.techniques}
        </Link>
        <Link
          href={href("/for")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.guides}
        </Link>
        <Link
          href={href("/embed")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.embed}
        </Link>
        <Link
          href={href("/privacy")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.privacy}
        </Link>
      </footer>
    </main>
  );
}
