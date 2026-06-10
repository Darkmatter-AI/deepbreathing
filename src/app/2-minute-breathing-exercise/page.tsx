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
const canonicalUrl = `${siteUrl}/2-minute-breathing-exercise`;
const ogImageUrl = createOgImagePath("2 Minute Breathing Exercise, Quick Reset");

export const metadata: Metadata = {
  title: "2 Minute Breathing Exercise: Quick Reset, No Download",
  description:
    "A free 2 minute breathing exercise for stress relief and focus. Box breathing or coherent breathing. Your choice. Start now in your browser.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "2 Minute Breathing Exercise: Quick Reset",
    description:
      "Follow a free 2 minute breathing exercise online with box breathing or coherent breathing. Start now in your browser.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "2 Minute Breathing Exercise, Quick Reset"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "2 Minute Breathing Exercise: Quick Reset",
    description:
      "Free guided 2 minute breathing exercise for stress relief and focus. Start online in seconds.",
    images: [ogImageUrl]
  }
};

export default function TwoMinuteBreathingExercisePage() {
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
        name: "2 Minute Breathing Exercise",
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
        name: "What's the best 2 minute breathing exercise?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For quick stress relief with structure, use box breathing: 8 cycles of 4-4-4-4 takes about 2 minutes. For a gentler, no-hold approach, try coherent breathing: 10-12 breaths at 5 seconds in, 5 seconds out. Both work well, box breathing is better for acute stress, coherent breathing for a softer reset."
        }
      },
      {
        "@type": "Question",
        name: "Is 2 minutes of deep breathing effective?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Two minutes is enough to shift your autonomic nervous system from sympathetic (stress) to parasympathetic (calm) dominance. Research shows measurable changes in heart rate variability, blood pressure, and subjective stress levels within 2 minutes of controlled breathing."
        }
      },
      {
        "@type": "Question",
        name: "When should I do a 2 minute breathing exercise?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Between meetings or tasks for a mental reset. Before important calls or presentations. After stressful interactions. During your commute (as a passenger). On a lunch break. Anytime you have 2 minutes and want to feel more centered."
        }
      },
      {
        "@type": "Question",
        name: "Should I use box breathing or coherent breathing for 2 minutes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use box breathing (with holds) when you need to actively calm down from stress or anxiety, the holds help interrupt racing thoughts. Use coherent breathing (no holds) when you want a gentler practice that's easier to sustain, or when breath holds feel uncomfortable. Both produce calming effects."
        }
      },
      {
        "@type": "Question",
        name: "Can I do 2 minute breathing exercises throughout the day?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. Multiple short sessions can be more effective than one long session for maintaining calm throughout a stressful day. Try 2-minute breathing breaks between meetings, after lunch, and before heading home. Consistency matters more than duration."
        }
      },
      {
        "@type": "Question",
        name: "What if I need more time?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For deeper relaxation or HRV training, try our 5-minute breathing exercise. For a quick interrupt when time is very short, the 1-minute exercise works well. The full breathing app lets you set any duration you want."
        }
      }
    ]
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Quick Breathing Exercise</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">2 minute breathing exercise</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A 2 minute breathing exercise that fits between meetings, tasks, or any moment you need to reset. Two minutes
          is enough to shift your nervous system from stress to calm. Choose box breathing or coherent breathing based
          on what you need.
        </p>
      </header>

      <div className="mt-8 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">Quick answer</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          A guided 2 minute breathing exercise gives you a fast reset: do 8 cycles of 4-4-4-4 (box breathing) or 10-12 slow
          breaths at 5 seconds in and 5 seconds out (coherent breathing). Two minutes is enough to slow your breath, calm the
          nervous system, and improve focus.
        </p>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Box breathing (structured)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            8 cycles of 4-4-4-4. The holds help interrupt racing thoughts. Best for acute stress.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/breathe/box?duration=120" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Start box breathing
            </Link>
            <ShareButton
              url={canonicalUrl}
              title="2 Minute Breathing Exercise"
              text="Try this 2-minute box breathing exercise, a quick reset that actually works."
              buttonText="Share this exercise"
              embedSlug="box"
            />
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Coherent breathing (gentle)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            10-12 breaths at 5s in, 5s out. No holds, easier to sustain. Best for a softer reset.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/breathe/coherent?duration=120" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Start coherent breathing
            </Link>
            <ShareButton
              url={canonicalUrl}
              title="2 Minute Breathing Exercise"
              text="Try this 2-minute coherent breathing exercise, a gentle reset that works."
              buttonText="Share this exercise"
              embedSlug="coherent"
            />
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Why 2 minutes works</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>
              Two minutes of controlled breathing is the sweet spot between a quick reset and a proper session. It&apos;s
              long enough for your body to register the shift. Your heart rate starts to drop, blood pressure decreases,
              and the stress hormone cortisol begins to clear.
            </p>
            <p>
              Research on heart rate variability (HRV) shows that significant changes in autonomic nervous system balance
              can occur within 90-120 seconds of slow breathing. You&apos;re not just feeling calmer. Your physiology is
              measurably different.
            </p>
            <p>
              The key is consistency: multiple 2-minute sessions throughout a stressful day can be more effective than
              one long session. Think of it as regular maintenance rather than emergency repair.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Best times for a 2 minute reset</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Between meetings:</strong> Clear the mental residue from
                  one conversation before entering the next.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Before important calls:</strong> Arrive to the conversation
                  centered rather than scattered.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Post-lunch reset:</strong> Combat the afternoon slump and
                  return to work focused.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">After difficult interactions:</strong> Process and release
                  before the stress compounds.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">End of workday transition:</strong> Create a mental boundary
                  between work and personal time.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What&apos;s the best 2 minute breathing exercise?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                For quick stress relief with structure, use box breathing: 8 cycles of 4-4-4-4 takes about 2 minutes.
                For a gentler, no-hold approach, try coherent breathing: 10-12 breaths at 5 seconds in, 5 seconds out.
                Both work well, box breathing is better for acute stress, coherent breathing for a softer reset.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Is 2 minutes of deep breathing effective?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes. Two minutes is enough to shift your autonomic nervous system from sympathetic (stress) to
                parasympathetic (calm) dominance. Research shows measurable changes in heart rate variability, blood
                pressure, and subjective stress levels within 2 minutes of controlled breathing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Should I use box breathing or coherent breathing?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use box breathing (with holds) when you need to actively calm down from stress or anxiety, the holds
                help interrupt racing thoughts. Use coherent breathing (no holds) when you want a gentler practice
                that&apos;s easier to sustain, or when breath holds feel uncomfortable. Both produce calming effects.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Can I do 2 minute exercises throughout the day?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Absolutely. Multiple short sessions can be more effective than one long session for maintaining calm
                throughout a stressful day. Try 2-minute breathing breaks between meetings, after lunch, and before
                heading home. Consistency matters more than duration.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What if I need more or less time?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                For deeper relaxation, try our{" "}
                <Link href="/5-minute-breathing-exercise" className="underline hover:text-foreground">5-minute exercise</Link>.
                For a quicker reset, the{" "}
                <Link href="/1-minute-breathing-exercise" className="underline hover:text-foreground">1-minute exercise</Link>{" "}
                works well. The{" "}
                <Link href="/breathing-app" className="underline hover:text-foreground">full app</Link> lets you
                customize any duration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">2 minutes flat</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Long enough for real physiological change, short enough to fit anywhere.
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Two options</h2>
          <p className="mt-2 text-sm text-muted-foreground">Box breathing for structure, coherent breathing for gentleness.</p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Stackable</h2>
          <p className="mt-2 text-sm text-muted-foreground">Multiple sessions per day keeps stress from accumulating.</p>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">More options</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Different time? Different goal? Try these:
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/1-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            1 minute exercise
          </Link>
          <Link href="/5-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            5 minute exercise
          </Link>
          <Link href="/4-7-8-breathing-timer" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            4-7-8 timer
          </Link>
          <Link href="/box-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Box breathing app
          </Link>
          <Link href="/for/anxiety" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            For anxiety
          </Link>
          <Link href="/for/running" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            For running recovery
          </Link>
          <Link href="/for/focus" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            For focus
          </Link>
          <Link href="/breathe" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Browse all techniques
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-[32px] bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-semibold text-card-foreground">Share with someone who needs a reset</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Know someone who could use a quick 2-minute breather? Send them this page.
        </p>
        <div className="mt-4 flex justify-center">
          <ShareButton
            url={canonicalUrl}
            title="2 Minute Breathing Exercise"
            text="Try this 2-minute breathing exercise. It's a quick reset that actually works."
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
