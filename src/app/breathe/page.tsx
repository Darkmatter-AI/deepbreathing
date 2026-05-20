import type { Metadata } from "next";
import Link from "next/link";

import { breathingPages } from "@/data/breathing-pages";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/breathe`;
const ogImageUrl = createOgImagePath("Breathing Techniques (Free Guided Visualizers)");

export const metadata: Metadata = {
  title: "Breathing Techniques: Box, 4-7-8, Coherent, Sigh, Wim Hof",
  description:
    "Free guided breathing visualizers: box breathing, 4-7-8, coherent breathing, physiological sigh, and Wim Hof. Pick a technique and start—no signup.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Breathing Techniques (Free Guided Visualizers)",
    description:
      "Box breathing, 4-7-8, coherent breathing, physiological sigh, and Wim Hof method—free guided visualizers. No signup required.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Breathing Techniques (Free Guided Visualizers)"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Breathing Techniques (Free Guided Visualizers)",
    description:
      "Box breathing, 4-7-8, coherent breathing, physiological sigh, and Wim Hof—free guided visualizers.",
    images: [ogImageUrl]
  }
};

export default function BreatheIndexPage() {
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
        name: "Breathing Techniques",
        item: canonicalUrl
      }
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: breathingPages.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.hero.title,
      url: `${siteUrl}/breathe/${page.slug}`
    }))
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Breathing techniques</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Pick a technique, press Start, and follow the visual guide. All sessions are free and customizable.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {breathingPages.map((page) => (
          <Link
            key={page.slug}
            href={`/breathe/${page.slug}`}
            className="glow-card group rounded-[32px] border border-border bg-card p-6 transition hover:scale-[1.01]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">/{page.slug}</p>
            <h2 className="mt-3 text-2xl font-semibold text-card-foreground">{page.hero.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{page.hero.subtitle}</p>
            <p className="mt-5 text-sm font-semibold text-primary group-hover:underline">Start session →</p>
          </Link>
        ))}
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">Guides by goal</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Want something more specific? Browse breathing guides for sleep, anxiety, panic, focus, and performance.
        </p>
        <div className="mt-5">
          <Link href="/for" className="text-sm font-semibold text-primary hover:underline">
            Browse all use cases →
          </Link>
        </div>
      </section>
    </main>
  );
}
