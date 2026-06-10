import Link from "next/link";
import { Suspense } from "react";

import { BreathingVisualizer } from "@/components/breathing-visualizer";
import { FadingHeroTitle } from "@/components/breathe/fading-hero-title";
import { HomeHeroActions } from "@/components/home/home-hero-actions";
import { JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import { featuredBreathingPages, breathingPages } from "@/data/breathing-pages";
import { useCasePages } from "@/data/use-case-pages";
import { LanguageSwitcherFooter } from "@/components/language-switcher";

const baseUrl = "https://deepbreathingexercises.com";

const faqs = [
  {
    question: "How long should I practice?",
    answer: "Start with 60–120 s. If it's still easy and helpful, extend to 3–5 min. For HRV-focused training, 5–10 min most days."
  },
  {
    question: "When's the best time?",
    answer: "Before a meeting or workout, between blocks of deep work, or before bed. Use physiological sighs for urgent spikes of stress."
  },
  {
    question: "Can I change the timing?",
    answer: "Yes. That's the point. Use 3–8 s per phase. If holds feel uncomfortable, remove them and keep an even inhale/exhale."
  },
  {
    question: "What if I feel light-headed?",
    answer: "You're likely over-breathing. Make breaths smaller and quieter, shorten phases, or pause and breathe normally."
  },
  {
    question: "Is this medical treatment?",
    answer: "No. It's a self-regulation tool. If you have a cardiopulmonary condition, are pregnant, or have fainting history, avoid long holds and keep everything gentle."
  }
];

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Deep Breathing Exercises",
  url: baseUrl,
  description:
    "Guided breathing visualizer with adjustable pacing. Visual pacing that helps your body downshift, anytime, anywhere."
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
};

const practiceCues = [
  "Breathe nasal and quiet; feel low belly rise.",
  "Exhale ends softly. Don't squeeze empty.",
  "Shoulders stay down; jaw unclenched."
];

const durationGuidelines = [
  "Quick reset: 1–2 minutes (4–8 cycles).",
  "Deeper shift: 3–5 minutes.",
  "Training effect (HRV focus): 5–10 minutes at an easy, equal in/out pace."
];

const bestMoments = [
  "Before events",
  "Post-conflict",
  "Bedtime wind-down",
  "In-flight",
  "Holiday stress"
];

const whyItWorks = [
  "Slow breathing can increase vagally mediated HRV during sessions.",
  "Exhale-emphasized or 0.1 Hz pacing often feels calmer within minutes.",
  "Consistency matters; short daily sessions beat rare long ones."
];

const infoCardClass =
  "glow-card rounded-[36px] border border-border bg-card p-6 transition-colors duration-200";

export default function HomePage() {
  const heroHeader = (
    <div className="space-y-6">
      <FadingHeroTitle
        label="Free Breathing Visualizer"
        title="Deep Breathing Exercises"
        subtitle="Visual pacing that helps your body downshift. Calm on demand, anytime, anywhere."
        headingLevel={1}
      />
      <HomeHeroActions />
    </div>
  );

  return (
    <main className="bg-transparent pb-20">
      <JsonLd data={[websiteSchema, faqSchema]} />

      <section className="relative isolate z-20 w-full text-foreground min-h-screen">
        <Suspense fallback={<div className="min-h-screen w-full" aria-hidden="true" />}>
          <BreathingVisualizer className="min-h-screen" />
        </Suspense>
        {/* Mobile: absolute at bottom so orb fills full screen; fades when running */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 px-6 pb-20 sm:px-8 lg:hidden">
          <div className="pointer-events-auto">
            {heroHeader}
          </div>
        </div>
        {/* Desktop: left column overlay */}
        <div className="absolute inset-y-0 left-0 z-30 hidden w-full max-w-xl px-6 py-20 lg:flex lg:flex-col lg:justify-center">
          {heroHeader}
        </div>
      </section>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="text-center">
          <h2 className="text-3xl font-semibold text-card-foreground">Precision breathwork.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
            Press Start and follow the orb through inhale, pause, exhale, pause. The cadence is adjustable. Sessions are short. Effects are tangible.
          </p>
        </section>

        <section className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
          <div className="min-w-[85vw] snap-center glow-card rounded-[32px] border border-border bg-card p-6 sm:min-w-[400px] lg:min-w-0">
            <p className="text-sm uppercase tracking-wider text-primary">Calm by design</p>
            <p className="mt-3 text-muted-foreground">
              Slow, even breathing often increases vagally mediated HRV and lowers perceived stress during practice.
            </p>
          </div>
          <div className="min-w-[85vw] snap-center glow-card rounded-[32px] border border-border bg-card p-6 sm:min-w-[400px] lg:min-w-0">
            <p className="text-sm uppercase tracking-wider text-primary">Built for real life</p>
            <p className="mt-3 text-muted-foreground">
              Short sets (1–5 min) before meetings, between tasks, or at lights-out.
            </p>
          </div>
          <div className="min-w-[85vw] snap-center glow-card rounded-[32px] border border-border bg-card p-6 sm:min-w-[400px] lg:min-w-0">
            <p className="text-sm uppercase tracking-wider text-primary">Your pace</p>
            <p className="mt-3 text-muted-foreground">
              Choose 3–8 seconds per phase. Smaller, quieter breaths beat &quot;big&quot; breaths.
            </p>
          </div>
        </section>

        <section id="mode-picker" className="glow-card rounded-[48px] border border-border bg-card p-8">
          <div>
            <h2 className="text-3xl font-semibold text-card-foreground">Pick a mode</h2>
          </div>

          {/* Mobile: pill grid — all visible at once, no scrolling */}
          <div className="mt-4 flex flex-wrap gap-2 md:hidden">
            {featuredBreathingPages.map((page) => {
              const pattern = BREATHING_PATTERNS[page.mode];
              if (!pattern) return null;
              return (
                <Link
                  key={page.slug}
                  href={`/breathe/${page.slug}`}
                  className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                  style={{ borderColor: `${pattern.color}60`, color: pattern.color }}
                >
                  {pattern.name}
                </Link>
              );
            })}
            <Link
              href="/breathe"
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              All techniques →
            </Link>
          </div>

          {/* Desktop: card grid */}
          <div className="hidden md:mt-8 md:grid md:grid-cols-2 md:gap-4">
            {featuredBreathingPages.map((page) => {
              const pattern = BREATHING_PATTERNS[page.mode];
              if (!pattern) return null;
              return (
                <Link
                  key={page.slug}
                  href={`/breathe/${page.slug}`}
                  className="group relative rounded-3xl border bg-card p-6 transition-all hover:scale-[1.02]"
                  style={{ borderColor: `${pattern.color}40` }}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.3em] opacity-80" style={{ color: pattern.color }}>
                    /{page.slug}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-card-foreground">{pattern.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{pattern.description}</p>
                  <span
                    className="mt-6 inline-flex items-center text-sm font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: pattern.color }}
                  >
                    Start session →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr,2fr]">
          <article className={cn("glow-card glow-card-inward rounded-[52px] border border-border bg-card p-10 transition-colors duration-200")}>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Quick anchor</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-card-foreground sm:text-5xl">
              One minute to steady
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Sit tall. Shoulders soft. Tongue to the roof of your mouth. Inhale gently through the nose;
              exhale quietly through the nose or pursed lips.
            </p>
            <ul className="mt-6 space-y-3 text-base text-muted-foreground [&>li]:leading-relaxed">
              <li>• Keep it easy. If dizzy, shorten phases or pause.</li>
              <li>• Breathe nasal and quiet; feel the low belly rise.</li>
              <li>• Exhale ends softly. Don&apos;t squeeze empty.</li>
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              Dial in a smooth cadence, then keep breathing. Small, steady breaths trump deep gasps.
            </p>
          </article>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 no-scrollbar lg:grid lg:gap-6 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
            <div className="min-w-[85vw] snap-center grid gap-6 first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 lg:first:ml-0 lg:last:mr-0 sm:min-w-[400px] lg:min-w-0 sm:grid-cols-2">
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dial it in</p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">Smooth over deep</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Slide between 3–8 s per phase. Start small. Smooth &gt; deep. If holds feel edgy, skip them and
                  keep an even inhale/exhale.
                </p>
              </article>
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Practice cues</p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">What to notice</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {practiceCues.map((cue) => (
                    <li key={cue}>• {cue}</li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="min-w-[85vw] snap-center grid gap-6 sm:min-w-[400px] lg:min-w-0 sm:grid-cols-2">
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">How long?</p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">Match the moment</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {durationGuidelines.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/1-minute-breathing-exercise" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">1 min</Link>
                  <Link href="/2-minute-breathing-exercise" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">2 min</Link>
                  <Link href="/5-minute-breathing-exercise" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">5 min</Link>
                </div>
              </article>
              <article className={cn(infoCardClass)}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Best moments</p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">Slide in anytime</h3>
                <div className="mt-4 space-y-3 text-lg font-semibold text-card-foreground leading-relaxed">
                  {bestMoments.map((moment) => (
                    <p key={moment}>{moment}</p>
                  ))}
                </div>
              </article>
            </div>

            <div className="min-w-[85vw] snap-center first:ml-4 sm:first:ml-6 last:mr-4 sm:last:mr-6 lg:first:ml-0 lg:last:mr-0 sm:min-w-[400px] lg:min-w-0">
              <article className={cn(infoCardClass, "h-full")}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Why it works</p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">Calmer in minutes</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {whyItWorks.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="glow-card space-y-4 rounded-[40px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl bg-muted p-4">
                <summary className="cursor-pointer text-lg font-medium text-foreground">{faq.question}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="glow-card rounded-[40px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Where to go next</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Start with the page that matches your situation: a quick reset, an app-style timer, a running recovery guide, or an
            advanced meditation technique.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/box-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Box breathing app
            </Link>
            <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              2 minute reset
            </Link>
            <Link href="/for/running" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Breathing for running
            </Link>
            <Link href="/breathe/tummo" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Tummo breathing
            </Link>
          </div>
        </section>
      </div>
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-xs text-muted-foreground">
          Stop if dizzy, tingly, or chest-tight. Resume later with shorter, easier breaths. Skip prolonged holds during pregnancy or if advised by your clinician.
        </p>

        <div className="mb-8 grid gap-8 text-left sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Techniques</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {breathingPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/breathe/${page.slug}`} className="underline underline-offset-2 transition-colors hover:text-foreground">
                    {BREATHING_PATTERNS[page.mode]?.name || page.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Guides</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {useCasePages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/for/${page.slug}`} className="underline underline-offset-2 transition-colors hover:text-foreground">
                    {page.hero.title.replace("Breathing Exercises for ", "").replace("Breathing Exercises to ", "")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Timers</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/1-minute-breathing-exercise" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  1 Minute
                </Link>
              </li>
              <li>
                <Link href="/2-minute-breathing-exercise" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  2 Minutes
                </Link>
              </li>
              <li>
                <Link href="/5-minute-breathing-exercise" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  5 Minutes
                </Link>
              </li>
              <li>
                <Link href="/4-7-8-breathing-timer" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  4-7-8 Timer
                </Link>
              </li>
              <li>
                <Link href="/coherent-breathing-app" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Coherent Breathing App
                </Link>
              </li>
              <li>
                <Link href="/box-breathing-app" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Box Breathing App
                </Link>
              </li>
              <li>
                <Link href="/holiday-breathing-exercises" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Holiday Exercises
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Info</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/breathe" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  All Techniques
                </Link>
              </li>
              <li>
                <Link href="/for" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  All Guides
                </Link>
              </li>
              <li>
                <Link href="/breathing-app" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  App
                </Link>
              </li>
              <li>
                <Link href="/breathing-visualizer" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Breathing Visualizer
                </Link>
              </li>
              <li>
                <Link href="/embed" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Embed Widget
                </Link>
              </li>
              <li>
                <Link href="/about" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/about/abi" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  About Abi
                </Link>
              </li>
              <li>
                <Link href="/about/editorial-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Editorial Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Situations</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/breathing-exercises-before-surgery" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Before Surgery
                </Link>
              </li>
              <li>
                <Link href="/physiological-sigh-panic-attack" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Panic Attack
                </Link>
              </li>
              <li>
                <Link href="/breathing-exercises-for-labor" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Labor &amp; Birth
                </Link>
              </li>
              <li>
                <Link href="/4-7-8-breathing-for-insomnia" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Insomnia
                </Link>
              </li>
              <li>
                <Link href="/box-breathing-before-presentation" className="underline underline-offset-2 transition-colors hover:text-foreground">
                  Before a Presentation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Created by{" "}
          <a
            href="https://abiassi.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Abiassi
          </a>
          {" + "}
          <a
            href="https://darkmatter.is/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Darkmatter AI Labs
          </a>
        </p>
        <div className="mt-6">
          <LanguageSwitcherFooter />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <a
            href="/languages"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Available in Español, Português, Français, Deutsch, 日本語 →
          </a>
        </p>
      </footer>
    </main>
  );
}
