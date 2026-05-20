import type { Metadata } from "next";
import Link from "next/link";

import { useCasePages } from "@/data/use-case-pages";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/for`;
const ogImageUrl = createOgImagePath("Breathing Guides by Goal");

export const metadata: Metadata = {
  title: "Breathing Guides by Goal: Sleep, Anxiety & Focus",
  description:
    "Science-based breathing guides for common situations—paired with free interactive visualizers. Pick a goal and start practicing.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Breathing Guides by Goal",
    description:
      "Sleep, anxiety, panic, focus, athletic performance, public speaking and more—breathing guides paired with free interactive visualizers.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Breathing Guides by Goal"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Breathing Guides by Goal",
    description:
      "Sleep, anxiety, panic, focus, athletic performance, public speaking and more—breathing guides paired with free interactive visualizers.",
    images: [ogImageUrl]
  }
};

export default function UseCasesIndexPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Use Cases",
        item: canonicalUrl
      }
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: useCasePages.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.hero.title,
      url: `${siteUrl}/for/${page.slug}`
    }))
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Breathing guides by goal</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Pick a situation and follow a step-by-step guide—each one links to a matching breathing visualizer.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {useCasePages.map((page) => (
          <Link
            key={page.slug}
            href={`/for/${page.slug}`}
            className="glow-card group rounded-[32px] border border-border bg-card p-6 transition hover:scale-[1.01]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">/{page.slug}</p>
            <h2 className="mt-3 text-2xl font-semibold text-card-foreground">{page.hero.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{page.hero.subtitle}</p>
            <p className="mt-5 text-sm font-semibold text-primary group-hover:underline">Read guide →</p>
          </Link>
        ))}
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">Want the techniques list?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the breathing patterns and jump straight into a guided session.
        </p>
        <div className="mt-5">
          <Link href="/breathe" className="text-sm font-semibold text-primary hover:underline">
            Browse all breathing techniques →
          </Link>
        </div>
      </section>
    </main>
  );
}
