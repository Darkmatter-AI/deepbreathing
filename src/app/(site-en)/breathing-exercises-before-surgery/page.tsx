import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/breathing-exercises-before-surgery`;
const ogImageUrl = createOgImagePath("Breathing Exercises Before Surgery, Calm Pre-Op Anxiety");

export const metadata: Metadata = {
  title: "Breathing Exercises Before Surgery: Calm Pre-Op Anxiety (Free Timer)",
  description:
    "Free breathing exercises for pre-surgery anxiety, box breathing calms nerves in 2 minutes. Used in hospitals worldwide. Prepare for your procedure calmly.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Breathing Exercises Before Surgery: Calm Pre-Op Anxiety",
    description:
      "Calm pre-surgery anxiety with breathing exercises used in hospitals worldwide. Free timer to prepare for your procedure.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Breathing Exercises Before Surgery, Calm Pre-Op Anxiety"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Breathing Exercises Before Surgery: Calm Pre-Op Anxiety",
    description:
      "Hospital-approved breathing exercises for pre-surgery nerves. Free timer. Use in the waiting room.",
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

export default function BreathingExercisesBeforeSurgeryPage() {
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
        name: "Breathing Exercises Before Surgery",
        item: canonicalUrl
      }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Breathing Exercises Before Surgery: Calm Pre-Op Anxiety",
    description: "Hospital-approved breathing exercises to calm pre-surgery anxiety. Box breathing helps you arrive at your procedure relaxed and prepared.",
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
        name: "What breathing exercises help before surgery?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Box breathing (4-4-4-4 pattern) is ideal before surgery because it calms anxiety without making you drowsy. Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Do 5-10 minutes in the waiting room or pre-op area. Many hospitals now teach this technique to patients before procedures."
        }
      },
      {
        "@type": "Question",
        name: "When should I start breathing exercises before surgery?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start practicing 2-3 days before your surgery so the technique feels natural. On surgery day, do 5-10 minutes of breathing exercises at home before leaving, then again in the waiting room. Continue until you're taken to pre-op. The calming effects last 15-30 minutes."
        }
      },
      {
        "@type": "Question",
        name: "Can I do breathing exercises in the pre-op room?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Tell your nurse you'd like to do some breathing exercises. They'll likely encourage it. You can practice while lying on the gurney or sitting in a chair. Keep it gentle and quiet. If you have an IV, keep that arm still and focus on belly breathing."
        }
      }
    ]
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance defaultMode={ModeName.Box} className="min-h-screen" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">PRE-SURGERY CALM</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Breathing Exercises Before Surgery</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Nervous about an upcoming procedure? These hospital-approved breathing exercises calm pre-op anxiety in
              2-5 minutes. Practice now, and use them in the waiting room on surgery day.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">Last updated: January 27, 2026</p>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Pre-surgery breathing timer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Box breathing calms anxiety without making you drowsy, perfect before a procedure.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/breathe/box" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Open box breathing timer
              </Link>
              <Link href="/breathe/physiological-sigh" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
                Quick calm (30 sec)
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Surgery day protocol</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-card-foreground">At home:</strong> 5-10 minutes before leaving</li>
              <li><strong className="text-card-foreground">Waiting room:</strong> 5-10 minutes while you wait</li>
              <li><strong className="text-card-foreground">Pre-op area:</strong> Gentle breathing until they&apos;re ready</li>
              <li><strong className="text-card-foreground">Pattern:</strong> Box breathing (4s inhale, 4s hold, 4s exhale, 4s hold)</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Why breathing exercises help before surgery</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                Pre-surgery anxiety is completely normal, studies show 60-80% of patients experience significant anxiety before
                procedures. Your nervous system perceives surgery as a threat, triggering the same fight-or-flight response
                that helped your ancestors survive dangerous situations.
              </p>
              <p>
                Breathing exercises work because they <strong className="text-card-foreground">directly counter this stress response</strong>.
                Slow, controlled breathing activates your parasympathetic nervous system (the &ldquo;rest and digest&rdquo; mode),
                which lowers heart rate, reduces blood pressure, and decreases stress hormones like cortisol and adrenaline.
              </p>
              <p>
                Research shows that patients who practice breathing exercises before surgery have lower anxiety scores, require
                less sedation, and report better overall experiences. Many hospitals now incorporate breathing techniques into
                their pre-operative protocols.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Pre-surgery breathing protocol</h2>
            <div className="mt-4 space-y-6">
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">2-3 days before surgery</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Practice box breathing for 5 minutes twice daily. This builds familiarity so the technique feels natural on surgery day.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">Surgery day morning</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Do 5-10 minutes of box breathing at home before leaving. Take your time getting ready, rushing increases anxiety.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">In the waiting room</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use the timer on your phone with headphones if you like, or simply count in your head. 5-10 minutes of quiet breathing
                  helps pass the time and keeps you calm.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">In pre-op</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tell your nurse you&apos;d like to do breathing exercises. They&apos;ll appreciate that you&apos;re managing your anxiety.
                  Continue gentle breathing until they&apos;re ready for you.
                </p>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Box breathing steps for surgery day</h2>
            <ol className="mt-4 space-y-4 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
                <div>
                  <strong className="text-card-foreground">Get comfortable</strong>
                  <p className="mt-1 text-sm">Sit in a chair or lie down. Drop your shoulders and unclench your jaw.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
                <div>
                  <strong className="text-card-foreground">Inhale slowly for 4 counts</strong>
                  <p className="mt-1 text-sm">Breathe through your nose. Let your belly expand gently.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
                <div>
                  <strong className="text-card-foreground">Hold for 4 counts</strong>
                  <p className="mt-1 text-sm">Stay relaxed. Don&apos;t tense up. If 4 counts feels long, try 3.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">4</span>
                <div>
                  <strong className="text-card-foreground">Exhale slowly for 4 counts</strong>
                  <p className="mt-1 text-sm">Through your nose or mouth. Let tension leave with your breath.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">5</span>
                <div>
                  <strong className="text-card-foreground">Hold empty for 4 counts</strong>
                  <p className="mt-1 text-sm">Pause before your next breath. Stay calm and relaxed.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">6</span>
                <div>
                  <strong className="text-card-foreground">Repeat for 5-10 minutes</strong>
                  <p className="mt-1 text-sm">Continue until you feel noticeably calmer. There&apos;s no rush.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">What breathing exercises help before surgery?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Box breathing (4-4-4-4 pattern) is ideal before surgery because it calms anxiety without making you drowsy.
                  Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Do 5-10 minutes in the waiting room or pre-op area.
                  Many hospitals now teach this technique to patients before procedures.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">When should I start breathing exercises before surgery?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start practicing 2-3 days before your surgery so the technique feels natural. On surgery day, do 5-10 minutes
                  at home before leaving, then again in the waiting room. Continue until you&apos;re taken to pre-op.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Can I do breathing exercises in the pre-op room?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes! Tell your nurse you&apos;d like to do some breathing exercises. They&apos;ll likely encourage it. You can practice
                  while lying on the gurney or sitting in a chair. Keep it gentle and quiet.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">Related guides</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/for/anxiety" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Anxiety Relief</p>
              <p className="mt-1 text-sm text-muted-foreground">Breathing techniques for anxiety in any situation</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/breathe/box" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Box Breathing Guide</p>
              <p className="mt-1 text-sm text-muted-foreground">The complete guide to the 4-4-4-4 technique</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/breathe/physiological-sigh" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Quick Calm (30 sec)</p>
              <p className="mt-1 text-sm text-muted-foreground">The fastest technique when nerves spike suddenly</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
          </div>
        </section>

        <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Always follow your healthcare team&apos;s pre-operative instructions. Breathing exercises complement but don&apos;t replace medical care.
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
