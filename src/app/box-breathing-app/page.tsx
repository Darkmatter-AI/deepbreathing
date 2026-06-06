import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { JsonLd } from "@/components/seo/json-ld";
import { ModeName } from "@/components/resonance/types";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/box-breathing-app`;
const ogImageUrl = createOgImagePath("Free Online Box Breathing Timer");

export const metadata: Metadata = {
  title: "Box Breathing App: Free Online 4-4-4-4 Timer",
  description:
    "Free box breathing app with a guided 4-4-4-4 timer. Use box breathing online for stress, focus, anxiety, and quick resets. No download or signup.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Box Breathing App: Free Online 4-4-4-4 Timer",
    description:
      "Free box breathing app with a guided 4-4-4-4 timer. Use it online for calm, focus, and quick resets.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Free Online Box Breathing Timer"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Box Breathing App: Free Online 4-4-4-4 Timer",
    description:
      "The Navy SEAL breathing technique for calm under pressure. Free 4-4-4-4 timer, no download. Try now.",
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

export default function BoxBreathingAppMoneyPage() {
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
        name: "Box Breathing App",
        item: canonicalUrl
      }
    ]
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Box Breathing App",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is box breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Box breathing is a breathing technique that follows a 4-4-4-4 pattern: inhale for 4 counts, hold for 4 counts, exhale for 4 counts, hold for 4 counts. Also known as square breathing or four-square breathing, it creates a balanced rhythm that can help reduce stress and improve focus."
        }
      },
      {
        "@type": "Question",
        name: "Is box breathing good for anxiety?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, box breathing is widely used for anxiety management. The equal intervals and breath holds activate the parasympathetic nervous system, which counteracts the fight-or-flight response. Many people report feeling calmer and more centered after just a few rounds."
        }
      },
      {
        "@type": "Question",
        name: "How long should I do box breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start with 2-3 minutes (about 6-9 breath cycles) and work up to 5-10 minutes as you get comfortable. For acute stress relief, even 1 minute can help. Daily practice of 5 minutes or more may provide the best long-term benefits."
        }
      },
      {
        "@type": "Question",
        name: "Can beginners do box breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, box breathing is beginner-friendly. If the 4-4-4-4 pattern feels challenging, start with 3-3-3-3 or even remove the holds entirely. The key is comfort. You should never feel breathless or strained."
        }
      },
      {
        "@type": "Question",
        name: "Is box breathing the same as tactical breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, tactical breathing and box breathing refer to the same technique. It's called tactical breathing when used by military personnel, law enforcement, and first responders to maintain calm and focus in high-stress situations."
        }
      },
      {
        "@type": "Question",
        name: "Should I do box breathing in the morning or evening?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Box breathing works well at any time. Use it in the morning to start your day focused, before important meetings or events, during stressful moments, or in the evening to decompress. Many people find it helpful right before bed, though some prefer techniques with longer exhales for sleep."
        }
      }
    ]
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, appSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance defaultMode={ModeName.Box} className="min-h-screen" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Box breathing app: free online 4-4-4-4 timer</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Box breathing app and timer for the 4-4-4-4 pattern you can use instantly in your browser. Follow the visual guide,
              adjust the counts, and start in seconds, no download and no signup.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mb-8 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Quick answer</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            This free box breathing app gives you a guided 4-4-4-4 timer in your browser. Follow inhale 4, hold 4, exhale 4,
            hold 4 for 1-3 minutes to calm stress, steady focus, and reset your breathing without downloading anything.
          </p>
        </div>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Start the timer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Press Start and breathe with the animation. You can change pacing, sound, and haptics.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/breathe/box" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Open box breathing
              </Link>
              <Link href="/breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
                See the full app
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Suggested settings</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use the classic pattern or adjust counts for comfort.</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Classic box: 4-4-4-4</li>
              <li>Beginner: 3-3-3-3</li>
              <li>No-hold option: keep an even inhale/exhale (e.g., 4 in / 4 out)</li>
              <li>If you feel light-headed: make breaths smaller and quieter, or slow down</li>
            </ul>
            <div className="mt-5">
              <Link href="/breathe/box#how-to" className="text-sm font-semibold text-primary hover:underline">
                Step-by-step instructions →
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">What is box breathing?</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                Box breathing is a structured breathing technique that follows a simple four-step pattern: inhale, hold, exhale,
                hold. Each phase lasts the same number of counts, typically 4 seconds each, creating a balanced &ldquo;box&rdquo; or &ldquo;square&rdquo;
                shape when visualized.
              </p>
              <p>
                Also known as square breathing or four-square breathing, this method is widely used by Navy SEALs, emergency
                responders, and athletes to maintain composure under pressure. The technique gained mainstream attention because of
                its effectiveness in high-stress situations, but it&apos;s equally valuable for everyday stress management.
              </p>
              <p>
                The classic pattern is 4-4-4-4 (inhale 4 seconds, hold 4 seconds, exhale 4 seconds, hold 4 seconds), but you can
                adjust the counts to match your comfort level. Beginners often start with 3-3-3-3, while more experienced
                practitioners might extend to 5-5-5-5 or longer.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Benefits of box breathing</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>Box breathing offers several science-backed benefits for both mental and physical well-being:</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Reduces stress and anxiety:</strong> The equal breath pattern
                    activates your parasympathetic nervous system, shifting your body from fight-or-flight mode to rest-and-digest
                    mode.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Improves focus and concentration:</strong> The structured counting
                    gives your mind a single point of focus, reducing mental clutter and improving attention span.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Lowers blood pressure:</strong> Regular practice has been shown to
                    reduce blood pressure and heart rate over time.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Helps manage pain:</strong> The breath holds and focused attention
                    can help modulate pain perception and build distress tolerance.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Improves emotional regulation:</strong> By giving you a tool to pause
                    and reset during emotional moments, box breathing helps create space between stimulus and response.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Supports better sleep:</strong> When practiced before bed, box
                    breathing can help quiet a racing mind and prepare your body for rest.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">How box breathing works</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                Box breathing works by engaging your autonomic nervous system, the unconscious system that controls functions like
                heart rate, digestion, and stress response. When you&apos;re anxious or stressed, your sympathetic nervous system
                (fight-or-flight) dominates. Box breathing activates the opposing parasympathetic nervous system (rest-and-digest).
              </p>
              <p>
                The breath holds are particularly important. When you hold your breath after inhaling, you increase oxygen
                saturation and allow your body to use oxygen more efficiently. The hold after exhaling triggers a mild buildup of
                CO₂, which actually helps calm your nervous system and improves oxygen delivery to tissues.
              </p>
              <p>
                Research has shown that slow, controlled breathing patterns like box breathing can reduce cortisol levels (the
                stress hormone), increase heart rate variability (a marker of nervous system flexibility), and improve prefrontal
                cortex function (the brain region responsible for decision-making and emotional control).
              </p>
              <p>
                The equal intervals create a sense of balance and predictability, which itself has a calming effect. Your brain
                likes patterns, and the regular 4-count rhythm gives it something stable to anchor to when everything else feels
                chaotic.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">When to use box breathing</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>Box breathing is versatile enough to use throughout your day. Here are the most effective times to practice:</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Before important meetings or presentations:</strong> Use 2-3 minutes
                    of box breathing to center yourself and reduce performance anxiety.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">During moments of acute stress:</strong> When you feel overwhelmed,
                    even 1 minute of box breathing can break the stress cycle and help you regain clarity.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">First thing in the morning:</strong> Start your day with 5 minutes to
                    set a calm, focused tone.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Before bed:</strong> Practice box breathing as part of your wind-down
                    routine to quiet your mind and prepare for sleep.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Mid-afternoon energy dip:</strong> Instead of reaching for caffeine,
                    try 3-5 minutes of box breathing to boost alertness and focus.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Before workouts:</strong> Use box breathing to get into a focused,
                    ready state before training.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">During medical procedures:</strong> Many people use box breathing to
                    stay calm during injections, dental work, or other uncomfortable medical situations.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">What is box breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Box breathing is a breathing technique that follows a 4-4-4-4 pattern: inhale for 4 counts, hold for 4 counts,
                  exhale for 4 counts, hold for 4 counts. Also known as square breathing or four-square breathing, it creates a
                  balanced rhythm that can help reduce stress and improve focus.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Is box breathing good for anxiety?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, box breathing is widely used for anxiety management. The equal intervals and breath holds activate the
                  parasympathetic nervous system, which counteracts the fight-or-flight response. Many people report feeling
                  calmer and more centered after just a few rounds.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">How long should I do box breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start with 2-3 minutes (about 6-9 breath cycles) and work up to 5-10 minutes as you get comfortable. For acute
                  stress relief, even 1 minute can help. Daily practice of 5 minutes or more may provide the best long-term
                  benefits.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Can beginners do box breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, box breathing is beginner-friendly. If the 4-4-4-4 pattern feels challenging, start with 3-3-3-3 or even
                  remove the holds entirely. The key is comfort. You should never feel breathless or strained.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Is box breathing the same as tactical breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, tactical breathing and box breathing refer to the same technique. It&apos;s called tactical breathing when used
                  by military personnel, law enforcement, and first responders to maintain calm and focus in high-stress
                  situations.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Should I do box breathing in the morning or evening?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Box breathing works well at any time. Use it in the morning to start your day focused, before important meetings
                  or events, during stressful moments, or in the evening to decompress. Many people find it helpful right before
                  bed, though some prefer techniques with longer exhales for sleep.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">No download</h2>
            <p className="mt-2 text-sm text-muted-foreground">Works on desktop and mobile. Start without installing anything.</p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">Adjustable pacing</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Shorten or remove holds if they feel uncomfortable, comfort beats intensity.
            </p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">Built for focus</h2>
            <p className="mt-2 text-sm text-muted-foreground">A simple rhythm you can use before meetings, workouts, or stressful moments.</p>
          </div>
        </section>

        <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">More breathing timers</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Looking for a different cadence? Try 4-7-8 for sleep or coherent breathing for HRV-focused training.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/4-7-8-breathing-timer" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              4-7-8 timer
            </Link>
            <Link href="/coherent-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Coherent (HRV) breathing
            </Link>
            <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              2 minute breathing exercise
            </Link>
            <Link href="/for/running" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Breathing for running
            </Link>
            <Link href="/breathe" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Browse techniques
            </Link>
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
      </div>
    </main>
  );
}
