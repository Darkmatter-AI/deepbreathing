import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import type { BreatheIndexContent } from "@/i18n/content/bespoke/breathe-index/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/breathe";

export const BREATHE_INDEX_SLUGS = [
  "box",
  "4-7-8",
  "coherent",
  "physiological-sigh",
  "wim-hof",
  "pursed-lip",
  "nadi-shodhana",
  "ujjayi",
  "belly",
  "buteyko",
  "tummo",
  "breath-of-fire",
  "9d-breathwork",
  "hope-cartel-9d-breathwork",
] as const;

export function createBreatheIndexMetadataFromContent(
  content: BreatheIndexContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = createOgImagePath(content.metadata.socialTitle);

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
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: content.metadata.socialTitle,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.socialTitle,
      description: content.metadata.twitterDescription,
      images: [ogImageUrl],
    },
  };
}

export function BreatheIndexPage({
  content,
  renderContext,
}: {
  content: BreatheIndexContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const href = (path: string) => renderContext
    ? resolveNativeInternalHref(path, renderContext.locale, renderContext.linkMode)
    : path;
  const canonicalPath = renderContext?.canonicalPath ?? sourceRoute;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const absoluteHref = (path: string) => renderContext
    ? new URL(href(path), siteUrl).toString()
    : path === "/"
      ? siteUrl
      : new URL(path, siteUrl).toString();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: content.breadcrumb.home,
        item: absoluteHref("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: content.breadcrumb.techniques,
        item: canonicalUrl,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: BREATHE_INDEX_SLUGS.map((slug, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: content.cards[slug].title,
      url: absoluteHref(`/breathe/${slug}`),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">{content.hero.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">{content.hero.title}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{content.hero.description}</p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {BREATHE_INDEX_SLUGS.map((slug) => {
          const card = content.cards[slug];
          return (
            <Link
              key={slug}
              href={href(`/breathe/${slug}`)}
              className="glow-card group rounded-[32px] border border-border bg-card p-6 transition hover:scale-[1.01]"
            >
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">/{slug}</p>
              <h2 className="mt-3 text-2xl font-semibold text-card-foreground">{card.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.subtitle}</p>
              <p className="mt-5 text-sm font-semibold text-primary group-hover:underline">{content.cardAction}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">{content.guides.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{content.guides.description}</p>
        <div className="mt-5">
          <Link href={href("/for")} className="text-sm font-semibold text-primary hover:underline">
            {content.guides.action}
          </Link>
        </div>
      </section>
    </main>
  );
}
