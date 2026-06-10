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
const canonicalUrl = `${siteUrl}/1-minute-breathing-exercise`;
const ogImageUrl = createOgImagePath("1 Minute Breathing Exercise, Quick Calm");

export const metadata: Metadata = {
  title: "1 Minute Breathing Exercise: Quick Calm, No App Needed",
  description:
    "A free 1 minute breathing exercise you can do anywhere. Box breathing (4-4-4-4) for instant stress relief. Start now, no download, no signup.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "1 Minute Breathing Exercise: Quick Calm",
    description:
      "A free 1 minute breathing exercise for instant stress relief. Box breathing you can do anywhere. No download needed.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "1 Minute Breathing Exercise, Quick Calm"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "1 Minute Breathing Exercise: Quick Calm",
    description:
      "A free 1 minute breathing exercise for instant stress relief. Box breathing you can do anywhere.",
    images: [ogImageUrl]
  }
};

export default function OneMinuteBreathingExercisePage() {
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
        name: "1 Minute Breathing Exercise",
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
        name: "Can you really calm down in 1 minute?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Research shows that even 60 seconds of slow, controlled breathing can activate the parasympathetic nervous system and reduce heart rate. You won't reach deep relaxation, but you can interrupt stress and regain composure, often enough to handle the next moment better."
        }
      },
      {
        "@type": "Question",
        name: "What breathing pattern works best for 1 minute?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Box breathing (4-4-4-4) fits perfectly: inhale 4 seconds, hold 4 seconds, exhale 4 seconds, hold 4 seconds. Four cycles take about 64 seconds. It's simple, easy to remember, and used by Navy SEALs for quick stress management."
        }
      },
      {
        "@type": "Question",
        name: "When should I use a 1 minute breathing exercise?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Before meetings, presentations, or difficult conversations. After receiving stressful news. When you feel anger or frustration rising. In a bathroom stall when you need a quick reset. Anytime you have 60 seconds and need to shift your state."
        }
      },
      {
        "@type": "Question",
        name: "Is 1 minute of breathing enough to help anxiety?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "One minute won't eliminate anxiety, but it can take the edge off and prevent escalation. Think of it as a circuit breaker. It stops the stress spiral so you can think more clearly. For deeper anxiety relief, longer sessions (5-10 minutes) work better."
        }
      },
      {
        "@type": "Question",
        name: "Can I do this at my desk without anyone noticing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. Breathe through your nose, keep your body relaxed, and count silently. No one will know you're doing it. You can even keep your eyes open and pretend to read something on your screen."
        }
      },
      {
        "@type": "Question",
        name: "What if I want a longer session?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Try our 2-minute or 5-minute breathing exercises for deeper relaxation. Or use the full breathing app to customize your session length and choose different techniques like 4-7-8 or coherent breathing."
        }
      }
    ]
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Quick Breathing Exercise</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">1 minute breathing exercise</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A quick breathing exercise you can do anywhere, no app download needed. Four cycles of box breathing (4-4-4-4)
          take about 60 seconds and can help you reset before a meeting, calm nerves, or regain focus.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Start now</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Press Start and follow the animation. Four cycles of box breathing take about 1 minute.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/breathe/box?duration=60" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Start 1-minute session
            </Link>
            <ShareButton
              url={canonicalUrl}
              title="1 Minute Breathing Exercise"
              text="Try this 1-minute breathing exercise. It's the fastest way to calm down."
              buttonText="Share this exercise"
              embedSlug="box"
            />
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">The pattern</h2>
          <p className="mt-2 text-sm text-muted-foreground">Box breathing: 4 seconds per phase, 4 cycles total.</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Inhale for 4 seconds</li>
            <li>Hold for 4 seconds</li>
            <li>Exhale for 4 seconds</li>
            <li>Hold for 4 seconds</li>
            <li>Repeat 4 times (~64 seconds)</li>
          </ul>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">How it works</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>
              One minute of controlled breathing is enough to activate your parasympathetic nervous system, the
              &ldquo;rest and digest&rdquo; mode that counteracts stress. The equal phases of box breathing create a
              rhythmic pattern that interrupts racing thoughts and gives your nervous system a clear signal to calm down.
            </p>
            <p>
              The breath holds are what make this technique so effective for quick resets. Holding your breath briefly
              allows CO₂ to build up slightly, which paradoxically signals safety to your brain. You wouldn&apos;t hold your
              breath if you were actually in danger. This interrupts the fight-or-flight response.
            </p>
            <p>
              You won&apos;t achieve deep relaxation in 60 seconds, but that&apos;s not the goal. Think of this as a circuit
              breaker: it stops the stress spiral, brings your heart rate down a few beats, and clears enough mental
              space for you to respond thoughtfully rather than react.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">When to use it</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Before meetings:</strong> Step away for 60 seconds to
                  clear your head and enter the room composed.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">After stressful news:</strong> Before you react or
                  respond, take 4 breath cycles to process.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Rising frustration:</strong> When you feel anger
                  building, a 1-minute pause can prevent regrettable responses.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Between tasks:</strong> Use it as a transition ritual
                  to clear mental residue before starting something new.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Quick bathroom reset:</strong> When you need to
                  disappear for a moment and come back centered.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Can you really calm down in 1 minute?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes. Research shows that even 60 seconds of slow, controlled breathing can activate the parasympathetic
                nervous system and reduce heart rate. You won&apos;t reach deep relaxation, but you can interrupt stress
                and regain composure, often enough to handle the next moment better.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What breathing pattern works best for 1 minute?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Box breathing (4-4-4-4) fits perfectly: inhale 4 seconds, hold 4 seconds, exhale 4 seconds, hold 4
                seconds. Four cycles take about 64 seconds. It&apos;s simple, easy to remember, and used by Navy SEALs
                for quick stress management.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">When should I use a 1 minute breathing exercise?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Before meetings, presentations, or difficult conversations. After receiving stressful news. When you
                feel anger or frustration rising. In a bathroom stall when you need a quick reset. Anytime you have
                60 seconds and need to shift your state.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Is 1 minute of breathing enough to help anxiety?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                One minute won&apos;t eliminate anxiety, but it can take the edge off and prevent escalation. Think of it
                as a circuit breaker. It stops the stress spiral so you can think more clearly. For deeper anxiety
                relief, longer sessions (5-10 minutes) work better.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Can I do this at my desk without anyone noticing?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Absolutely. Breathe through your nose, keep your body relaxed, and count silently. No one will know
                you&apos;re doing it. You can even keep your eyes open and pretend to read something on your screen.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What if I want a longer session?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try our <Link href="/2-minute-breathing-exercise" className="underline hover:text-foreground">2-minute</Link> or{" "}
                <Link href="/5-minute-breathing-exercise" className="underline hover:text-foreground">5-minute</Link> breathing
                exercises for deeper relaxation. Or use the{" "}
                <Link href="/breathing-app" className="underline hover:text-foreground">full breathing app</Link> to customize
                your session length.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">60 seconds</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quick enough to do before any meeting or moment that matters.
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Navy SEAL method</h2>
          <p className="mt-2 text-sm text-muted-foreground">Box breathing is used by special forces for stress control under pressure.</p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">No download</h2>
          <p className="mt-2 text-sm text-muted-foreground">Runs instantly in your browser on any device.</p>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">More options</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Need a longer session or different technique? Try these:
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            2 minute exercise
          </Link>
          <Link href="/5-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            5 minute exercise
          </Link>
          <Link href="/for/public-speaking" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Before a presentation
          </Link>
          <Link href="/for/anxiety" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            For anxiety
          </Link>
          <Link href="/breathe" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Browse all techniques
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-[32px] bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-semibold text-card-foreground">Share with someone who needs a quick reset</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Know someone who could use a 1-minute breather? Send them this page.
        </p>
        <div className="mt-4 flex justify-center">
          <ShareButton
            url={canonicalUrl}
            title="1 Minute Breathing Exercise"
            text="Try this 1-minute breathing exercise. It's the fastest way to calm down."
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
