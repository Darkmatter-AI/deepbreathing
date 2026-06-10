import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const ShareButton = dynamic(
  () => import("@/components/ui/share-button").then(mod => ({ default: mod.ShareButton })),
  { ssr: false }
);

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/5-minute-breathing-exercise`;
const ogImageUrl = createOgImagePath("5 Minute Breathing Exercise, Deep Relaxation");

export const metadata: Metadata = {
  title: "5 Minute Breathing Exercise: Deep Relaxation & HRV Training",
  description:
    "A free 5 minute breathing exercise for deep relaxation and HRV training. Coherent breathing at your resonance frequency. Start now, no download, no signup.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "5 Minute Breathing Exercise: Deep Relaxation",
    description:
      "A free 5 minute breathing exercise for deep relaxation and HRV training. Coherent breathing. No download needed.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "5 Minute Breathing Exercise, Deep Relaxation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "5 Minute Breathing Exercise: Deep Relaxation",
    description:
      "A free 5 minute breathing exercise for deep relaxation and HRV training. Coherent breathing.",
    images: [ogImageUrl]
  }
};

export default function FiveMinuteBreathingExercisePage() {
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
        name: "5 Minute Breathing Exercise",
        item: canonicalUrl
      }
    ]
  };


  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What's the best 5 minute breathing exercise?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Coherent breathing at 5-6 breaths per minute is ideal for 5-minute sessions. Breathe in for 5 seconds, out for 5 seconds, with no holds. This rate maximizes heart rate variability (HRV) and creates deep, sustainable relaxation. About 30 breath cycles fit in 5 minutes."
        }
      },
      {
        "@type": "Question",
        name: "What happens to your body in 5 minutes of breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "In 5 minutes of slow breathing: heart rate drops measurably, blood pressure decreases, cortisol (stress hormone) levels begin falling, heart rate variability increases, and brain waves shift toward relaxed alpha patterns. You'll also notice calmer thoughts and reduced muscle tension."
        }
      },
      {
        "@type": "Question",
        name: "Is 5 minutes of breathing enough for stress relief?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, 5 minutes is the minimum duration for meaningful stress relief and HRV training benefits. Research shows that 5 minutes of coherent breathing produces significant improvements in autonomic nervous system balance. For maximum benefit, aim for 10-20 minutes, but 5 minutes daily is better than longer sessions done inconsistently."
        }
      },
      {
        "@type": "Question",
        name: "When is the best time for a 5 minute breathing session?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Morning (sets a calm baseline for the day), before high-stakes situations (interviews, presentations, difficult conversations), post-workout (accelerates recovery), evening wind-down (improves sleep quality), or during lunch break (prevents afternoon stress accumulation)."
        }
      },
      {
        "@type": "Question",
        name: "Should I use coherent breathing or 4-7-8 for 5 minutes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Coherent breathing is better for 5-minute sessions because it's easier to sustain, no breath holds that can become tiring. 4-7-8 is more intense and works better for shorter sessions (1-2 minutes) or specifically for sleep. For general stress relief and HRV training, coherent breathing is the better choice."
        }
      },
      {
        "@type": "Question",
        name: "Can I do 5 minute breathing exercises daily?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely, daily practice is where the real benefits emerge. Research shows that consistent daily practice of coherent breathing produces cumulative improvements in baseline stress resilience, emotional regulation, and HRV that persist even when you're not actively practicing."
        }
      }
    ]
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Deep Breathing Exercise</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">5 minute breathing exercise</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Five minutes is where breathing exercises start to produce deep, lasting effects. Coherent breathing at
          5-6 breaths per minute maximizes your heart rate variability (HRV), reduces stress hormones, and creates
          measurable physiological calm.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Start now</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Coherent breathing: 5 seconds in, 5 seconds out, no holds. About 30 cycles in 5 minutes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/breathe/coherent?duration=300" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Start 5-minute session
            </Link>
            <ShareButton
              url={canonicalUrl}
              title="5 Minute Breathing Exercise"
              text="Try this 5-minute breathing exercise, great for deep relaxation and HRV training."
              buttonText="Share this exercise"
              embedSlug="coherent"
            />
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">The pattern</h2>
          <p className="mt-2 text-sm text-muted-foreground">Coherent breathing for HRV optimization.</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Inhale for 5 seconds (through nose)</li>
            <li>Exhale for 5 seconds (through nose or mouth)</li>
            <li>No holds, continuous flow</li>
            <li>6 breaths per minute = ~30 breaths in 5 minutes</li>
            <li>Adjust to 4-6 seconds if 5 feels too long/short</li>
          </ul>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">What happens in 5 minutes</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>
              Five minutes of coherent breathing produces measurable changes in your body and brain:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Heart rate variability increases:</strong> HRV (the
                  variation between heartbeats) rises significantly. Higher HRV indicates a more flexible, resilient
                  nervous system.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Stress hormones decrease:</strong> Cortisol and adrenaline
                  levels start falling within the first few minutes of slow breathing.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Blood pressure drops:</strong> The vagus nerve activation
                  causes blood vessels to relax and blood pressure to decrease.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Brain waves shift:</strong> Your brain moves toward alpha
                  wave patterns associated with calm alertness and creativity.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Muscle tension releases:</strong> As your nervous system
                  calms, chronic tension in shoulders, jaw, and back begins to release.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Why coherent breathing for 5 minutes</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>
              Coherent breathing (5-6 breaths per minute with equal inhale and exhale) is ideal for longer sessions
              because it&apos;s sustainable. Unlike techniques with breath holds, you can maintain coherent breathing
              for 5, 10, or even 20 minutes without fatigue or discomfort.
            </p>
            <p>
              This breathing rate, around 0.1 Hz, happens to match the natural resonance frequency of your cardiovascular
              system. When you breathe at this rate, your heart rate, blood pressure, and breathing rhythms synchronize,
              creating a state of &ldquo;coherence&rdquo; that maximizes the benefits of the practice.
            </p>
            <p>
              Five minutes is the minimum duration where HRV training effects become significant. While 1-2 minute
              exercises provide quick resets, 5+ minutes is where you start building lasting changes in your nervous
              system&apos;s baseline resilience.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Best times for 5 minute sessions</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Morning routine:</strong> Start your day with 5 minutes
                  of coherent breathing to set a calm, focused baseline before demands begin.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Pre-performance:</strong> Before important meetings,
                  presentations, or challenging conversations, 5 minutes to arrive centered.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Post-workout:</strong> After exercise, 5 minutes of
                  coherent breathing accelerates recovery and returns your nervous system to baseline.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Lunch break reset:</strong> Prevent afternoon stress
                  accumulation with a midday breathing break.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Evening wind-down:</strong> 5 minutes before bed improves
                  sleep quality by transitioning your nervous system to rest mode.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What&apos;s the best 5 minute breathing exercise?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Coherent breathing at 5-6 breaths per minute is ideal for 5-minute sessions. Breathe in for 5 seconds,
                out for 5 seconds, with no holds. This rate maximizes heart rate variability (HRV) and creates deep,
                sustainable relaxation. About 30 breath cycles fit in 5 minutes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What happens to your body in 5 minutes of breathing?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                In 5 minutes of slow breathing: heart rate drops measurably, blood pressure decreases, cortisol
                (stress hormone) levels begin falling, heart rate variability increases, and brain waves shift
                toward relaxed alpha patterns. You&apos;ll also notice calmer thoughts and reduced muscle tension.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Is 5 minutes of breathing enough for stress relief?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes, 5 minutes is the minimum duration for meaningful stress relief and HRV training benefits.
                Research shows that 5 minutes of coherent breathing produces significant improvements in autonomic
                nervous system balance. For maximum benefit, aim for 10-20 minutes, but 5 minutes daily is better
                than longer sessions done inconsistently.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Should I use coherent breathing or 4-7-8?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Coherent breathing is better for 5-minute sessions because it&apos;s easier to sustain, no breath holds
                that can become tiring. 4-7-8 is more intense and works better for shorter sessions (1-2 minutes)
                or specifically for sleep. For general stress relief and HRV training, coherent breathing is the
                better choice.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Can I do 5 minute breathing exercises daily?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Absolutely, daily practice is where the real benefits emerge. Research shows that consistent daily
                practice of coherent breathing produces cumulative improvements in baseline stress resilience,
                emotional regulation, and HRV that persist even when you&apos;re not actively practicing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What if I need shorter or longer sessions?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                For quick resets, try our{" "}
                <Link href="/1-minute-breathing-exercise" className="underline hover:text-foreground">1-minute</Link> or{" "}
                <Link href="/2-minute-breathing-exercise" className="underline hover:text-foreground">2-minute</Link>{" "}
                exercises. For deeper HRV training, extend to 10-20 minutes using the{" "}
                <Link href="/coherent-breathing-app" className="underline hover:text-foreground">coherent breathing app</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">HRV training</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            5 minutes at resonance frequency builds measurable stress resilience over time.
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Sustainable</h2>
          <p className="mt-2 text-sm text-muted-foreground">Coherent breathing with no holds, easy to maintain for 5+ minutes.</p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Daily practice</h2>
          <p className="mt-2 text-sm text-muted-foreground">5 minutes daily beats 30 minutes once a week.</p>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">More options</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Different time or goal? Try these:
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/1-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            1 minute exercise
          </Link>
          <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            2 minute exercise
          </Link>
          <Link href="/coherent-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            HRV breathing app
          </Link>
          <Link href="/for/focus" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            For focus
          </Link>
          <Link href="/for/sleep" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            For sleep
          </Link>
          <Link href="/breathe" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Browse all techniques
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-[32px] bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-semibold text-card-foreground">Share with someone who needs deep relaxation</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Know someone who could benefit from 5 minutes of calm? Send them this page.
        </p>
        <div className="mt-4 flex justify-center">
          <ShareButton
            url={canonicalUrl}
            title="5 Minute Breathing Exercise"
            text="Try this 5-minute breathing exercise. It's great for deep relaxation and HRV training."
            buttonText="Share this exercise"
          />
        </div>
      </section>

      <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Stop if dizzy, tingly, or chest-tight. Resume later with shorter, easier breaths.
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
          <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Privacy
          </Link>
        </div>
      </footer>
    </main>
  );
}
