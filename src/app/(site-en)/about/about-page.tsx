import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import sourceContent from "@/i18n/content/bespoke/about/source.json";
import type { AboutPageContent } from "@/i18n/content/bespoke/about/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const englishContent = sourceContent as AboutPageContent;

export function createAboutMetadataFromContent(
  content: AboutPageContent,
  canonicalPath = "/about",
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = new URL(
    createOgImagePath(content.metadata.socialTitle),
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
      title: content.metadata.socialTitle,
      description: content.metadata.socialDescription,
      images: [ogImageUrl],
    },
  };
}

export function AboutPage({
  content = englishContent,
  renderContext,
}: {
  content?: AboutPageContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const canonicalPath = renderContext?.canonicalPath ?? "/about";
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const href = (path: string) => renderContext
    ? resolveNativeInternalHref(path, renderContext.locale, renderContext.linkMode)
    : path;
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
        name: content.breadcrumb.about,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbSchema} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">{content.hero.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">{content.hero.title}</h1>
        <p className="text-lg text-muted-foreground">{content.hero.intro}</p>
      </header>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">{content.sections.whatThisIs.title}</h2>
          <p className="mt-3">
            {content.sections.whatThisIs.beforeLink}
            <Link href={href("/breathe/physiological-sigh")} className="text-primary hover:underline">
              {content.sections.whatThisIs.linkLabel}
            </Link>
            {content.sections.whatThisIs.afterLink}
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">{content.sections.disclaimer.title}</h2>
          <p className="mt-3">{content.sections.disclaimer.body}</p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">{content.sections.whoBuilt.title}</h2>
          <p className="mt-3">
            {content.sections.whoBuilt.beforeLink}
            <Link href={href("/about/abi")} className="font-semibold text-primary hover:underline">
              {content.sections.whoBuilt.linkLabel}
            </Link>
            {content.sections.whoBuilt.afterLink}
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">{content.sections.editorial.title}</h2>
          <p className="mt-3">{content.sections.editorial.body}</p>
          <p className="mt-3">
            <Link href={href("/about/editorial-policy")} className="font-semibold text-primary hover:underline">
              {content.sections.editorial.linkLabel}
            </Link>
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">{content.sections.links.title}</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <Link href={href("/breathe")} className="font-semibold text-primary hover:underline">
                {content.sections.links.breathingTechniques}
              </Link>
            </p>
            <p>
              <Link href={href("/for")} className="font-semibold text-primary hover:underline">
                {content.sections.links.guidesByGoal}
              </Link>
            </p>
            <p>
              <Link href={href("/about/abi")} className="font-semibold text-primary hover:underline">
                {content.sections.links.aboutAbi}
              </Link>
            </p>
            <p>
              <Link href={href("/about/editorial-policy")} className="font-semibold text-primary hover:underline">
                {content.sections.links.editorialPolicy}
              </Link>
            </p>
            <p>
              <Link href={href("/privacy")} className="font-semibold text-primary hover:underline">
                {content.sections.links.privacy}
              </Link>
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-muted/60 p-4 text-sm">
          <p className="text-card-foreground">{content.sections.credits.title}</p>
          <p className="mt-2">
            <a
              href="https://abiassi.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              {content.sections.credits.abiassi}
            </a>
            {" + "}
            <a
              href="https://darkmatter.is/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              {content.sections.credits.darkmatter}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
