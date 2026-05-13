import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/box-breathing-before-presentation`;
const ogImageUrl = createOgImagePath("Box Breathing Before Presentation, Calm Nerves in 60 Seconds");

export const metadata: Metadata = {
  title: "Box Breathing Before Presentation: Calm Nerves in 60 Seconds (Free Timer)",
  description:
    "Free box breathing timer for presentations, the Navy SEAL technique to stop stage fright in 60 seconds. Calm your nerves before you speak. Try now.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Box Breathing Before Presentation: Calm Nerves in 60 Seconds",
    description:
      "The Navy SEAL breathing technique to stop stage fright. Calm your nerves in 60 seconds before any presentation. Free timer.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Box Breathing Before Presentation, Calm Nerves in 60 Seconds"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Box Breathing Before Presentation: Stop Stage Fright",
    description:
      "Navy SEAL technique to calm presentation nerves in 60 seconds. Free timer. Try now.",
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

export default function BoxBreathingPresentationPage() {
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
        name: "Box Breathing Before Presentation",
        item: canonicalUrl
      }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Box Breathing Before Presentation: Calm Nerves in 60 Seconds",
    description: "How Navy SEALs use box breathing to stay calm under pressure: and how you can use it before your next presentation.",
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
        name: "How long before a presentation should I do box breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start 5-10 minutes before your presentation for best results. Do 4-6 cycles (about 90 seconds) in a quiet spot: a bathroom stall, your car, or a hallway works fine. If you feel nerves rising while waiting, do another quick set of 2-3 cycles. The effects last 15-30 minutes."
        }
      },
      {
        "@type": "Question",
        name: "Why do Navy SEALs use box breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Navy SEALs use box breathing because it reliably activates the parasympathetic nervous system within 60-90 seconds. Mark Divine, a retired SEAL Commander, introduced it to BUD/S training. The structured 4-count rhythm gives the mind something to focus on while the slow pace physiologically lowers heart rate and cortisol, exactly what you need before high-stakes situations."
        }
      },
      {
        "@type": "Question",
        name: "Can I do box breathing right before I speak?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! If you're being introduced or waiting to take the stage, do 2-3 silent cycles. Breathe through your nose, count in your head, and keep your shoulders relaxed. No one will notice, and you'll feel noticeably calmer when you start speaking."
        }
      }
    ]
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance defaultMode={ModeName.Box} className="min-h-screen" />
        <div className="absolute inset-y-0 left-0 z-30 flex w-full max-w-xl flex-col justify-end sm:justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">PRESENTATION NERVES</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Box Breathing Before a Presentation</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Heart racing before a presentation? Navy SEALs use this technique before high-stakes missions.
              4-6 cycles (about 90 seconds) will calm your nerves so you can speak clearly and confidently.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">Last updated: January 27, 2026</p>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Quick pre-presentation calm</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Do 4-6 cycles 5-10 minutes before you present. Find a quiet spot: bathroom, hallway, or your car.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/breathe/box" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Open box breathing timer
              </Link>
              <Link href="/for/public-speaking" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
                Public speaking guide
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Presentation protocol</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-card-foreground">5-10 min before:</strong> Do 4-6 full cycles (90 seconds)</li>
              <li><strong className="text-card-foreground">While waiting:</strong> 2-3 silent cycles to stay calm</li>
              <li><strong className="text-card-foreground">Pattern:</strong> 4s inhale, 4s hold, 4s exhale, 4s hold</li>
              <li><strong className="text-card-foreground">If nervous during:</strong> Take one slow breath through your nose</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Why box breathing works for presentation anxiety</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                When you&apos;re about to present, your brain can&apos;t distinguish between a boardroom and a life-threatening situation.
                It triggers the same ancient alarm system: adrenaline floods your bloodstream, your heart races, blood diverts from
                your brain to your muscles. This was useful for outrunning predators, not so helpful for explaining Q3 results.
              </p>
              <p>
                Box breathing works because it <strong className="text-card-foreground">interrupts this panic response</strong> through
                two mechanisms. First, the structured 4-4-4-4 counting occupies your prefrontal cortex (thinking brain), preventing
                it from spinning worst-case scenarios. Second, the slow, even rhythm activates your parasympathetic nervous system, the
                &ldquo;rest and digest&rdquo; mode that tells your body the threat has passed.
              </p>
              <p>
                Mark Divine, a retired Navy SEAL Commander, introduced box breathing to BUD/S training because SEALs needed a technique
                that worked reliably under extreme pressure. If it helps operators stay calm during combat, it can help you nail your
                next presentation.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Pre-presentation box breathing protocol</h2>
            <ol className="mt-4 space-y-4 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
                <div>
                  <strong className="text-card-foreground">Find a quiet spot (5-10 minutes before)</strong>
                  <p className="mt-1 text-sm">Bathroom stall, hallway, your car, or any private space.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
                <div>
                  <strong className="text-card-foreground">Stand tall or sit comfortably</strong>
                  <p className="mt-1 text-sm">Drop your shoulders, unclench your jaw, relax your hands.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
                <div>
                  <strong className="text-card-foreground">Inhale through your nose for 4 counts</strong>
                  <p className="mt-1 text-sm">Let your belly expand. Keep it quiet and controlled.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">4</span>
                <div>
                  <strong className="text-card-foreground">Hold for 4 counts</strong>
                  <p className="mt-1 text-sm">Stay relaxed. This shouldn&apos;t feel strained.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">5</span>
                <div>
                  <strong className="text-card-foreground">Exhale slowly for 4 counts</strong>
                  <p className="mt-1 text-sm">Through your nose or pursed lips. Let tension leave with the breath.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">6</span>
                <div>
                  <strong className="text-card-foreground">Hold empty for 4 counts, then repeat</strong>
                  <p className="mt-1 text-sm">Complete 4-6 cycles total. You should feel noticeably calmer.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">How long before a presentation should I do box breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start 5-10 minutes before your presentation for best results. Do 4-6 cycles (about 90 seconds) in a quiet spot.
                  If you feel nerves rising while waiting, do another quick set of 2-3 cycles. The effects last 15-30 minutes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Why do Navy SEALs use box breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Navy SEALs use box breathing because it reliably activates the parasympathetic nervous system within 60-90 seconds.
                  The structured 4-count rhythm gives the mind something to focus on while the slow pace physiologically lowers heart
                  rate and cortisol, exactly what you need before high-stakes situations.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Can I do box breathing right before I speak?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes! If you&apos;re being introduced or waiting to take the stage, do 2-3 silent cycles. Breathe through your nose,
                  count in your head, and keep your shoulders relaxed. No one will notice, and you&apos;ll feel noticeably calmer
                  when you start speaking.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">Related guides</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/for/public-speaking" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Public Speaking</p>
              <p className="mt-1 text-sm text-muted-foreground">Complete guide to breathing for presentations and speeches</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/breathe/box" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Box Breathing Guide</p>
              <p className="mt-1 text-sm text-muted-foreground">The complete guide to the Navy SEAL breathing technique</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/for/anxiety" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Anxiety Relief</p>
              <p className="mt-1 text-sm text-muted-foreground">Breathing techniques for anxiety in any situation</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
          </div>
        </section>

        <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Stop if dizzy or uncomfortable. Resume with shorter counts if needed.
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
