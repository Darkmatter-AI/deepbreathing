import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { ModeName } from "@/components/resonance/types";
import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import { breathingPages } from "@/data/breathing-pages";

import dynamic from "next/dynamic";
import { createOgImagePath } from "@/lib/seo/og-image";

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

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/breathing-visualizer`;
const ogImageUrl = createOgImagePath("Free Online Breathing Visualizer, 10 Techniques, No Download");

export const metadata: Metadata = {
  title: "Free Online Breathing Visualizer (2026): 10 Techniques, No Download",
  description:
    "Free breathing visualizer with 10 guided techniques: box breathing, 4-7-8, physiological sigh, and more. Adjustable pacing, no download, no signup. Start now.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Free Online Breathing Visualizer: 10 Techniques, No Download",
    description:
      "Free breathing visualizer with 10 guided techniques. Adjustable pacing, works on any device. No download, no signup.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Free Online Breathing Visualizer, 10 Techniques, No Download"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Breathing Visualizer: 10 Techniques",
    description:
      "Free breathing visualizer with 10 guided techniques: box breathing, 4-7-8, physiological sigh, and more. Start now.",
    images: [ogImageUrl]
  }
};

const faqs = [
  {
    question: "Is this breathing visualizer really free?",
    answer:
      "Yes, completely free: no account, no download, no hidden costs. Open the page and start breathing. The tool runs in your browser on any device."
  },
  {
    question: "What breathing technique should I start with?",
    answer:
      "Box breathing (4-4-4-4) is the best starting point. It's simple, beginner-friendly, and effective for both stress and focus. Once comfortable, try 4-7-8 for sleep or coherent breathing for HRV training."
  },
  {
    question: "How long should I use a breathing visualizer?",
    answer:
      "Start with 1-2 minutes for a quick reset. For deeper effects, practice 3-5 minutes. HRV-focused training benefits from 5-10 minutes daily. Even 60 seconds of guided breathing can lower perceived stress."
  },
  {
    question: "Can I use this on my phone?",
    answer:
      "Yes. The visualizer is fully responsive and works on phones, tablets, and desktops. You can add it to your home screen for an app-like experience, no App Store download needed."
  },
  {
    question: "How does a breathing visualizer help with anxiety?",
    answer:
      "Visual pacing gives your mind a single focus point, interrupting anxious thought loops. Following the animation slows your breathing rate, which activates the parasympathetic nervous system and reduces the fight-or-flight response within minutes."
  },
  {
    question: "Do breathing visualizers actually work?",
    answer:
      "Yes. Research shows that slow, paced breathing increases heart rate variability (HRV) and reduces cortisol. A visual guide helps you maintain the correct rhythm without counting, making the practice easier to sustain and more effective than unguided breathing."
  }
];

const benefits = [
  {
    title: "Visual pacing reduces cognitive load",
    description: "Follow the animation instead of counting in your head. The visual guide keeps your rhythm steady so you can focus on relaxing."
  },
  {
    title: "10 science-backed techniques",
    description: "Box breathing, 4-7-8, physiological sigh, coherent breathing, Wim Hof, and more: each with adjustable timing."
  },
  {
    title: "Adjustable speed and timing",
    description: "Slide between 3-8 seconds per phase. Start small and comfortable. If holds feel edgy, remove them entirely."
  },
  {
    title: "No download, no signup",
    description: "Open the page and start. No app to install, no account to create, no permissions to grant. Works instantly."
  },
  {
    title: "Works on any device",
    description: "Desktop, tablet, or phone. Add to your home screen for an app-like experience without the App Store."
  },
  {
    title: "Optional audio + haptic cues",
    description: "Turn on sound or vibration feedback for eyes-free practice. Or keep it silent: your choice."
  }
];

function formatTiming(pattern: typeof BREATHING_PATTERNS[ModeName]) {
  const parts: string[] = [];
  parts.push(String(pattern.inhale));
  if ('inhale2' in pattern && pattern.inhale2) parts.push(String(pattern.inhale2));
  parts.push(String(pattern.holdIn));
  parts.push(String(pattern.exhale));
  parts.push(String(pattern.holdOut));
  return parts.join("-");
}

export default function BreathingVisualizerPage() {
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
        name: "Breathing Visualizer",
        item: canonicalUrl
      }
    ]
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

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to use a breathing visualizer",
    description: "Start a guided breathing session in three steps.",
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Choose a technique",
        text: "Pick from 10 breathing patterns: box breathing, 4-7-8, physiological sigh, coherent breathing, and more. Each suits a different goal."
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Follow the visual guide",
        text: "Press Start and breathe with the animation. Inhale as it expands, exhale as it contracts. No counting needed."
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Adjust to your comfort",
        text: "Use the speed slider to change pacing. If holds feel uncomfortable, switch to a no-hold pattern. Start with 1-2 minutes and extend as you like."
      }
    ]
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, faqSchema, howToSchema]} />

      {/* Hero with full-screen visualizer */}
      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance defaultMode={ModeName.Box} className="min-h-screen" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">BREATHING VISUALIZER</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Online Breathing Visualizer</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              A free interactive breathing visualizer with 10 guided techniques. Follow the visual pacer to calm your
              nervous system: no download, no signup, works on any device.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/breathe/box" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Start session
              </Link>
              <a href="#techniques" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground">
                Pick a technique
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">

        {/* Voice search / Quick answer */}
        <div className="mb-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">What is a breathing visualizer?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            A breathing visualizer is an interactive tool that guides your breathing with animation.
            You follow an expanding and contracting shape, inhaling as it grows, exhaling as it
            shrinks. The visual pacing replaces manual counting, helps you maintain a steady rhythm,
            and activates your parasympathetic nervous system for calm, focus, or sleep.
          </p>
        </div>

        {/* Why use a breathing visualizer, 2×3 grid */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-card-foreground text-center mb-8">Why use a breathing visualizer</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="glow-card rounded-[32px] border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-card-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 10 Techniques grid */}
        <section id="techniques" className="mb-12">
          <h2 className="text-3xl font-semibold text-card-foreground text-center mb-8">10 breathing techniques</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {breathingPages.map((page) => {
              const pattern = BREATHING_PATTERNS[page.mode];
              if (!pattern) return null;

              return (
                <Link
                  key={page.slug}
                  href={`/breathe/${page.slug}`}
                  className="group glow-card rounded-[32px] border bg-card p-6 transition-all hover:scale-[1.02]"
                  style={{ borderColor: `${pattern.color}40` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: pattern.color }}
                    />
                    <h3 className="text-lg font-semibold text-card-foreground">{pattern.name}</h3>
                    <span className="ml-auto text-xs font-mono text-muted-foreground">
                      {formatTiming(pattern)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{pattern.description}</p>
                  <span
                    className="mt-3 inline-flex items-center text-sm font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: pattern.color }}
                  >
                    Start session →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12 glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">How it works</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary">Step 1</p>
              <h3 className="mt-2 text-lg font-semibold text-card-foreground">Choose a technique</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick from 10 breathing patterns: box breathing, 4-7-8, physiological sigh, coherent breathing,
                and more. Each suits a different goal.
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-primary">Step 2</p>
              <h3 className="mt-2 text-lg font-semibold text-card-foreground">Follow the visual guide</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Press Start and breathe with the animation. Inhale as it expands, exhale as it contracts.
                No counting needed.
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-primary">Step 3</p>
              <h3 className="mt-2 text-lg font-semibold text-card-foreground">Adjust to your comfort</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the speed slider to change pacing. If holds feel uncomfortable, switch to a no-hold pattern.
                Start with 1-2 minutes and extend as you like.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12 glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-semibold text-card-foreground">{faq.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* More tools */}
        <section className="mb-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">More breathing tools</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Looking for a specific timer? Try one of these dedicated breathing tools.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/box-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Box breathing app
            </Link>
            <Link href="/4-7-8-breathing-timer" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              4-7-8 breathing timer
            </Link>
            <Link href="/coherent-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Coherent breathing app
            </Link>
            <Link href="/breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              All breathing apps
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="rounded-[32px] border border-border bg-card p-6 text-center">
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
