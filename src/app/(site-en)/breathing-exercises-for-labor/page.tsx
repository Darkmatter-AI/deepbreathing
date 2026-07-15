import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/breathing-exercises-for-labor`;
const ogImageUrl = createOgImagePath("Breathing Exercises for Labor, Manage Contractions Naturally");

export const metadata: Metadata = {
  title: "Breathing Exercises for Labor: Manage Contractions Naturally (Free Timer)",
  description:
    "Free breathing timer for labor and childbirth, slow breathing helps manage contractions and stay calm. Practice before your due date. Midwife-approved techniques.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Breathing Exercises for Labor: Manage Contractions Naturally",
    description:
      "Midwife-approved breathing techniques for labor. Slow breathing helps manage contractions and stay calm. Free timer to practice now.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Breathing Exercises for Labor, Manage Contractions Naturally"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Breathing Exercises for Labor: Manage Contractions Naturally",
    description:
      "Midwife-approved breathing for labor. Manage contractions and stay calm. Free timer. Practice now.",
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

export default function BreathingExercisesForLaborPage() {
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
        name: "Breathing Exercises for Labor",
        item: canonicalUrl
      }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Breathing Exercises for Labor: Manage Contractions Naturally",
    description: "Midwife-approved breathing techniques for labor and childbirth. Slow breathing helps manage contractions and promotes calm.",
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
        name: "What is the best breathing technique for labor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Slow, deep breathing (4-6 seconds in, 6-8 seconds out) is the most effective technique for labor. The extended exhale activates your parasympathetic nervous system, promoting relaxation and helping your body work with contractions rather than against them. Many midwives recommend breathing in through the nose and out through the mouth during contractions."
        }
      },
      {
        "@type": "Question",
        name: "When should I start practicing breathing for labor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start practicing at least 4-6 weeks before your due date. Practice for 5-10 minutes daily so the breathing pattern becomes automatic. This way, when labor begins, you won't have to think about the technique. Your body will know what to do."
        }
      },
      {
        "@type": "Question",
        name: "How do I breathe through contractions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "As a contraction begins, start slow breathing: inhale through your nose for 4-6 seconds, then exhale slowly through your mouth for 6-8 seconds. Focus on making your exhale longer than your inhale. Continue this pattern throughout the contraction. Between contractions, return to normal breathing and rest."
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
            <p className="text-xs uppercase tracking-[0.35em] text-primary">LABOR & CHILDBIRTH</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Breathing Exercises for Labor</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Slow breathing helps your body work with contractions, not against them. Practice these midwife-approved
              techniques before your due date so they become second nature during labor.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">Last updated: January 27, 2026</p>

        {/* Important disclaimer */}
        <section className="mb-8 rounded-2xl border-l-4 border-amber-500 bg-amber-500/10 p-6">
          <p className="font-medium text-amber-700 dark:text-amber-400">Important</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This guide is for educational purposes. Always follow your healthcare provider&apos;s or midwife&apos;s guidance
            for your specific situation. Every labor is different, and your care team knows your needs best.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Practice breathing now</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Slow exhale-focused breathing is ideal for labor. Practice daily so it becomes automatic.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/breathe/4-7-8" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Practice slow breathing
              </Link>
              <Link href="/for/pregnancy" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
                Pregnancy breathing guide
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Labor breathing pattern</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-card-foreground">Inhale:</strong> Through your nose, 4-6 seconds</li>
              <li><strong className="text-card-foreground">Exhale:</strong> Through your mouth, 6-8 seconds (longer than inhale)</li>
              <li><strong className="text-card-foreground">During contractions:</strong> Maintain this pattern throughout</li>
              <li><strong className="text-card-foreground">Between contractions:</strong> Return to normal breathing, rest</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Why breathing matters during labor</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                During labor, your body is working incredibly hard. Contractions are intense, and your natural response
                might be to tense up, hold your breath, or breathe rapidly. But this actually makes labor harder, tension
                works against your body&apos;s natural processes.
              </p>
              <p>
                Slow, controlled breathing does the opposite. It <strong className="text-card-foreground">activates your
                parasympathetic nervous system</strong>, which relaxes your muscles, lowers stress hormones, and helps
                your body work with contractions rather than against them. The extended exhale is particularly important. It
                triggers your vagus nerve, promoting calm and reducing pain perception.
              </p>
              <p>
                Research shows that women who use breathing techniques during labor report lower pain scores, feel more
                in control, and often have shorter labors. Breathing also gives your mind something to focus on, which
                helps manage anxiety and stay present.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Breathing techniques for each stage</h2>
            <div className="mt-4 space-y-6">
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">Early labor (contractions 5+ minutes apart)</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use slow, relaxed breathing: inhale through your nose for 4 seconds, exhale through your mouth for 6-8 seconds.
                  Between contractions, breathe normally and rest. This stage can last hours, conserve your energy.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">Active labor (contractions 3-5 minutes apart)</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Continue slow breathing during contractions. As intensity increases, you may naturally want to vocalize
                  on the exhale (moaning or humming). This is normal and helps. Keep your jaw relaxed and shoulders down.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">Transition (strongest contractions)</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This is the most intense phase but also the shortest. Focus on one breath at a time. Your partner or
                  doula can breathe with you to help you stay in rhythm. Short &ldquo;pant-pant-blow&rdquo; patterns may
                  help if you feel the urge to push before you&apos;re ready.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-semibold text-card-foreground">Pushing stage</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Follow your midwife&apos;s or doctor&apos;s guidance. Many recommend exhaling while pushing rather than
                  holding your breath. Between pushes, take a few slow, deep breaths to recover.
                </p>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">How to practice before labor</h2>
            <ol className="mt-4 space-y-4 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
                <div>
                  <strong className="text-card-foreground">Start 4-6 weeks before your due date</strong>
                  <p className="mt-1 text-sm">Practice for 5-10 minutes daily so the pattern becomes automatic.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
                <div>
                  <strong className="text-card-foreground">Find a comfortable position</strong>
                  <p className="mt-1 text-sm">Sit, lie on your side, or use a birthing ball, whatever feels good.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
                <div>
                  <strong className="text-card-foreground">Inhale through your nose for 4-6 seconds</strong>
                  <p className="mt-1 text-sm">Let your belly expand gently. Don&apos;t force it, keep it comfortable.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">4</span>
                <div>
                  <strong className="text-card-foreground">Exhale through your mouth for 6-8 seconds</strong>
                  <p className="mt-1 text-sm">Make the exhale longer than the inhale. You can make a soft &ldquo;haaaa&rdquo; sound.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">5</span>
                <div>
                  <strong className="text-card-foreground">Repeat for 5-10 minutes</strong>
                  <p className="mt-1 text-sm">Continue until the breathing feels natural. Practice with your partner if possible.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">What is the best breathing technique for labor?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Slow, deep breathing (4-6 seconds in, 6-8 seconds out) is the most effective technique for labor.
                  The extended exhale activates your parasympathetic nervous system, promoting relaxation and helping
                  your body work with contractions rather than against them.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">When should I start practicing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start practicing at least 4-6 weeks before your due date. Practice for 5-10 minutes daily so the
                  breathing pattern becomes automatic. When labor begins, you won&apos;t have to think about the
                  technique. Your body will know what to do.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">How do I breathe through contractions?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  As a contraction begins, start slow breathing: inhale through your nose for 4-6 seconds, then exhale
                  slowly through your mouth for 6-8 seconds. Focus on making your exhale longer than your inhale.
                  Continue throughout the contraction. Between contractions, return to normal breathing and rest.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">Related guides</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/for/pregnancy" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Pregnancy Breathing</p>
              <p className="mt-1 text-sm text-muted-foreground">Breathing exercises for all stages of pregnancy</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/breathe/4-7-8" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">4-7-8 Breathing</p>
              <p className="mt-1 text-sm text-muted-foreground">Exhale-focused breathing for relaxation</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/for/anxiety" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Anxiety Relief</p>
              <p className="mt-1 text-sm text-muted-foreground">Stay calm during stressful moments</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
          </div>
        </section>

        <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            This guide is for educational purposes only. Always follow your midwife&apos;s or healthcare provider&apos;s
            guidance for your specific labor and delivery.
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
