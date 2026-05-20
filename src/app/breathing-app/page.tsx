import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/breathing-app`;
const ogImageUrl = createOgImagePath("Free Breathing App (No Download)");

export const metadata: Metadata = {
  title: "Free Breathing App (No Download): Calm Anxiety, Sleep & Focus",
  description:
    "Free breathing app: box breathing, 4-7-8, coherent breathing, and physiological sigh timers. No download, no signup. Start your session now.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Free Breathing App (No Download)",
    description:
      "A free breathing app that runs in your browser: box breathing, 4-7-8, coherent breathing (HRV), and the physiological sigh. No signup.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Free Breathing App (No Download)"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Breathing App (No Download)",
    description:
      "A free breathing app that runs in your browser: box breathing, 4-7-8, coherent breathing (HRV), and the physiological sigh.",
    images: [ogImageUrl]
  }
};

export default function BreathingAppPage() {
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
        name: "Breathing App",
        item: canonicalUrl
      }
    ]
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Deep Breathing Exercises",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, appSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Free breathing app</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A simple breathing app that runs in your browser, no download and no signup. Use it for calm, focus, sleep, or
          a quick stress reset.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Start a session</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a breathing technique and press Start. You can adjust pacing, sound, and haptics.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Open the visualizer
            </Link>
            <Link href="/breathe" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Browse techniques
            </Link>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">What’s included</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Box breathing (4-4-4-4) for stress + focus</li>
            <li>4-7-8 breathing for sleep + relaxation</li>
            <li>Coherent breathing (~5–6 breaths/min) for HRV training</li>
            <li><Link href="/breathe/physiological-sigh" className="text-primary hover:underline">Physiological sigh</Link> for rapid stress relief</li>
          </ul>
          <div className="mt-5">
            <Link href="/for" className="text-sm font-semibold text-primary hover:underline">
              Explore guides by goal →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Fast</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Designed to load quickly and get you into a session within seconds.
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Customizable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Adjust pacing and settings so the practice stays comfortable and sustainable.
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Evidence-informed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Each guide includes practical instructions, safety notes, and references to relevant research.
          </p>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">Popular breathing timers</h2>
        <p className="mt-2 text-sm text-muted-foreground">Jump straight into the most common app-style breathing timers.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/box-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Box breathing app
          </Link>
          <Link href="/4-7-8-breathing-timer" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            4-7-8 breathing timer
          </Link>
          <Link href="/coherent-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Coherent (HRV) breathing
          </Link>
          <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            2 minute breathing exercise
          </Link>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">Explore by goal</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use a quick reset, a running-specific recovery guide, or an advanced technique when you want a different kind of session.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Fast 2 minute reset
          </Link>
          <Link href="/for/running" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Breathing for running
          </Link>
          <Link href="/breathe/tummo" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Tummo breathing
          </Link>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">Breathing visualizer</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Want to see all 10 techniques with an interactive visual guide? Try the full breathing visualizer.
        </p>
        <div className="mt-4">
          <Link href="/breathing-visualizer" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Open breathing visualizer
          </Link>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">Can I install this like an app?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You can add it to your home screen from your browser (look for “Add to Home Screen”). This will create an app
          icon and open the visualizer in a standalone window.
        </p>
        <div className="mt-4">
          <Link href="/privacy" className="text-sm font-semibold text-primary hover:underline">
            Privacy policy →
          </Link>
        </div>
      </section>
    </main>
  );
}
