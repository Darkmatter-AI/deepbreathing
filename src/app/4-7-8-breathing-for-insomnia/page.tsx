import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/4-7-8-breathing-for-insomnia`;
const ogImageUrl = createOgImagePath("4-7-8 Breathing for Insomnia, Fall Asleep in Minutes");

export const metadata: Metadata = {
  title: "4-7-8 Breathing for Insomnia: Fall Asleep in Minutes (Free Timer)",
  description:
    "Free 4-7-8 breathing timer for insomnia, Dr. Weil's 'natural tranquilizer' helps you fall asleep in 2-5 minutes. No pills, no download. Start tonight.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "4-7-8 Breathing for Insomnia: Fall Asleep in Minutes",
    description:
      "Dr. Weil's 'natural tranquilizer' for insomnia. Fall asleep in 2-5 minutes without pills. Free breathing timer.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "4-7-8 Breathing for Insomnia, Fall Asleep in Minutes"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "4-7-8 Breathing for Insomnia: Fall Asleep in Minutes",
    description:
      "Dr. Weil's 'natural tranquilizer' for insomnia. Fall asleep in 2-5 minutes. Free timer. Try tonight.",
    images: [ogImageUrl]
  }
};

// Lazy-load Resonance
const Resonance = dynamic(
  () => import("@/components/resonance/Resonance"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading breathing exercise">
        <div aria-hidden="true" className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }
);

export default function FourSevenEightInsomniaPage() {
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
        name: "4-7-8 Breathing for Insomnia",
        item: canonicalUrl
      }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "4-7-8 Breathing for Insomnia: Fall Asleep in Minutes",
    description: "How to use 4-7-8 breathing to overcome insomnia naturally. Dr. Weil's technique that works in 2-5 minutes.",
    author: {
      "@type": "Person",
      name: "Abi Abiassi",
      url: `${siteUrl}/about/abi`
    },
    publisher: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: siteUrl
    },
    datePublished: "2026-01-27",
    dateModified: "2026-01-27",
    mainEntityOfPage: canonicalUrl
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does 4-7-8 breathing really help with insomnia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, 4-7-8 breathing is one of the most effective natural techniques for insomnia. The extended exhale (8 counts) activates your parasympathetic nervous system, slowing your heart rate and signaling your body it's safe to sleep. Dr. Andrew Weil, who popularized the technique, calls it a 'natural tranquilizer' that becomes more effective with regular practice."
        }
      },
      {
        "@type": "Question",
        name: "How many cycles of 4-7-8 should I do for insomnia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start with 4 cycles (about 1 minute) when you get into bed. Most people start feeling drowsy within 2-4 cycles. If you're still awake after 4 cycles, rest for 30 seconds and do another 4 cycles. Dr. Weil recommends not exceeding 8 cycles in one session when you're new to the technique."
        }
      },
      {
        "@type": "Question",
        name: "Why does 4-7-8 breathing work for sleep?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "4-7-8 works for sleep through three mechanisms: (1) the long exhale activates the vagus nerve, triggering relaxation, (2) the breath hold allows CO2 to build slightly, which has a calming effect, and (3) the counting gives your mind a single focus, interrupting racing thoughts that keep you awake."
        }
      }
    ]
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance defaultMode={ModeName.Relax} className="min-h-screen" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">INSOMNIA RELIEF</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">4-7-8 Breathing for Insomnia</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Can&apos;t sleep? This breathing technique is called the &ldquo;natural tranquilizer&rdquo; because it helps most people
              fall asleep within 2-5 minutes. Press Start, breathe with the animation, and let your body relax.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">Last updated: January 27, 2026</p>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Start the insomnia timer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Do 4-8 cycles in bed with the lights off. Most people start feeling drowsy by cycle 3-4.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/breathe/4-7-8" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Open 4-7-8 timer
              </Link>
              <Link href="/4-7-8-breathing-timer" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
                Full 4-7-8 guide
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Best settings for insomnia</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-card-foreground">Pattern:</strong> Classic 4-7-8 (inhale 4s, hold 7s, exhale 8s)</li>
              <li><strong className="text-card-foreground">Cycles:</strong> 4-8 cycles (about 2-3 minutes total)</li>
              <li><strong className="text-card-foreground">Position:</strong> Lying down with lights off</li>
              <li><strong className="text-card-foreground">If restless:</strong> Do another 4 cycles after a 30-second rest</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Why 4-7-8 breathing works for insomnia</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                If you&apos;ve ever lain awake at 2 AM with a racing mind, you know how frustrating insomnia can be. Your body is
                tired but your nervous system is stuck in &ldquo;alert mode&rdquo;, the sympathetic fight-or-flight state that evolved
                to keep our ancestors safe from predators.
              </p>
              <p>
                4-7-8 breathing is uniquely effective for insomnia because of its <strong className="text-card-foreground">exhale-dominant pattern</strong>.
                The 8-count exhale is twice as long as the 4-count inhale. This ratio activates your vagus nerve, which acts like a
                &ldquo;brake pedal&rdquo; for your nervous system, slowing your heart rate, lowering blood pressure, and signaling
                your body that it&apos;s safe to rest.
              </p>
              <p>
                Dr. Andrew Weil, who popularized this technique, describes it as a &ldquo;natural tranquilizer for the nervous system.&rdquo;
                Unlike sleeping pills that can lose effectiveness over time, 4-7-8 breathing actually becomes <em>more</em> powerful
                with regular practice. Most people notice improvement within the first few nights.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">How to use 4-7-8 for insomnia tonight</h2>
            <ol className="mt-4 space-y-4 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
                <div>
                  <strong className="text-card-foreground">Get into bed and turn off the lights</strong>
                  <p className="mt-1 text-sm">Lie on your back with your arms relaxed at your sides.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
                <div>
                  <strong className="text-card-foreground">Exhale completely through your mouth</strong>
                  <p className="mt-1 text-sm">Make a whoosh sound to empty your lungs fully before starting.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
                <div>
                  <strong className="text-card-foreground">Inhale through your nose for 4 counts</strong>
                  <p className="mt-1 text-sm">Let your belly rise gently. Keep your shoulders relaxed.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">4</span>
                <div>
                  <strong className="text-card-foreground">Hold your breath for 7 counts</strong>
                  <p className="mt-1 text-sm">Stay relaxed. This shouldn&apos;t feel strained.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">5</span>
                <div>
                  <strong className="text-card-foreground">Exhale through your mouth for 8 counts</strong>
                  <p className="mt-1 text-sm">Make a quiet whoosh sound. This is where the magic happens.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">6</span>
                <div>
                  <strong className="text-card-foreground">Repeat for 4-8 cycles</strong>
                  <p className="mt-1 text-sm">Most people start feeling drowsy by cycle 3-4. Let yourself drift off.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Does 4-7-8 breathing really help with insomnia?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, 4-7-8 breathing is one of the most effective natural techniques for insomnia. The extended exhale (8 counts)
                  activates your parasympathetic nervous system, slowing your heart rate and signaling your body it&apos;s safe to sleep.
                  Dr. Andrew Weil, who popularized the technique, calls it a &ldquo;natural tranquilizer&rdquo; that becomes more effective
                  with regular practice.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">How many cycles should I do for insomnia?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start with 4 cycles (about 1 minute) when you get into bed. Most people start feeling drowsy within 2-4 cycles.
                  If you&apos;re still awake after 4 cycles, rest for 30 seconds and do another 4 cycles. Don&apos;t exceed 8 cycles
                  in one session when you&apos;re new to the technique.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Why does 4-7-8 breathing work for sleep?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  4-7-8 works through three mechanisms: (1) the long exhale activates the vagus nerve, triggering relaxation,
                  (2) the breath hold allows CO2 to build slightly, which has a calming effect, and (3) the counting gives your
                  mind a single focus, interrupting racing thoughts that keep you awake.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">Related guides</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/for/sleep" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Breathing for Sleep</p>
              <p className="mt-1 text-sm text-muted-foreground">Complete guide to breathing techniques for better sleep</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/breathe/4-7-8" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">4-7-8 Breathing Guide</p>
              <p className="mt-1 text-sm text-muted-foreground">The complete guide to Dr. Weil&apos;s relaxation technique</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/for/anxiety" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Anxiety Relief</p>
              <p className="mt-1 text-sm text-muted-foreground">Breathing techniques for anxiety and racing thoughts</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
          </div>
        </section>

        <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Stop if dizzy or uncomfortable. If insomnia persists for more than 2 weeks, consult a healthcare provider.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/breathe" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Techniques
            </Link>
            <Link href="/for" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Guides
            </Link>
            <Link href="/breathing-app" className="underline underline-offset-2 transition-colors hover:text-foreground">
              App
            </Link>
            <Link href="/about" className="underline underline-offset-2 transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/about/abi" className="underline underline-offset-2 transition-colors hover:text-foreground">
              About Abi
            </Link>
            <Link href="/embed" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Embed
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
