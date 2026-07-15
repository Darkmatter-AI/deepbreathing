import Link from "next/link";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";
import { createOgImagePath } from "@/lib/seo/og-image";
import { HolidayShareButton } from "./share-button";

// Dynamic import for SnowBackground - loaded eagerly for faster render
const SnowBackground = dynamic(
  () => import("@/components/resonance/components/SnowBackground"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-slate-950" />
    )
  }
);

const baseUrl = "https://deepbreathingexercises.com";
const ogImageUrl = createOgImagePath("Holiday Breathing Exercises, Find Calm During the Season", {
  subtitle: "Quick resets for gatherings and travel stress",
  color: "#38bdf8",
});

export const metadata: Metadata = {
  title: "Holiday Breathing Exercises: Find Calm During the Season",
  description:
    "Holiday stress relief breathing exercises. Quick resets for gatherings, travel, and overwhelm. 60-second to 3-minute techniques that work. Free visualizer with snow effect.",
  openGraph: {
    title: "Holiday Breathing Exercises: Find Calm During the Season",
    description:
      "Quick breathing resets for holiday gatherings, travel stress, and seasonal overwhelm. 60-second techniques that actually work.",
    url: `${baseUrl}/holiday-breathing-exercises`,
    type: "article",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Holiday Breathing Exercises - Find calm during the season"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Holiday Breathing Exercises: Find Calm During the Season",
    description:
      "Quick breathing resets for holiday gatherings, travel stress, and seasonal overwhelm. Free visualizer.",
    images: [ogImageUrl]
  },
  alternates: {
    canonical: `${baseUrl}/holiday-breathing-exercises`,
  },
};

// Holiday-specific experiences (prioritized at top)
const holidayExperiences = [
  {
    title: "Holiday Stress Relief",
    description: "Handle family gatherings, social overwhelm, and tense moments with the physiological sigh",
    href: "/for/holiday-stress",
    timing: "30 seconds",
    color: "#38bdf8",
    featured: true,
  },
  {
    title: "Travel Anxiety",
    description: "Stay calm through flights, delays, crowds, and long journeys",
    href: "/for/travel-anxiety",
    timing: "5-10 minutes",
    color: "#34d399",
    featured: true,
  },
];

// Quick technique starters
const quickStarts = [
  {
    title: "Acute Stress Reset",
    description: "Instant relief when tensions rise: works in 1-3 breaths",
    href: "/breathe/physiological-sigh?duration=60",
    timing: "30 seconds",
    color: "#38bdf8",
  },
  {
    title: "Pre-Gathering Calm",
    description: "Center yourself before walking into the chaos",
    href: "/breathe/box?duration=60",
    timing: "1 minute",
    color: "#60a5fa",
  },
  {
    title: "Quiet Room Break",
    description: "Find your center during a bathroom or kitchen escape",
    href: "/breathe/coherent?duration=120",
    timing: "2 minutes",
    color: "#94a3b8",
  },
  {
    title: "Bedtime Wind-Down",
    description: "Decompress after an exhausting day of socializing",
    href: "/breathe/4-7-8?duration=180",
    timing: "3 minutes",
    color: "#a78bfa",
  },
];

const moments = [
  {
    title: "Before Gathering",
    description: "In your car, at the door, or while getting ready",
    technique: "Physiological sigh",
    href: "/for/holiday-stress",
  },
  {
    title: "During Gathering",
    description: "Bathroom break, kitchen helper, or quiet corner",
    technique: "Physiological sigh",
    href: "/breathe/physiological-sigh?duration=60",
  },
  {
    title: "After Gathering",
    description: "On the drive home or before bed",
    technique: "4-7-8 breathing",
    href: "/breathe/4-7-8?duration=180",
  },
  {
    title: "Travel Stress",
    description: "Airports, traffic, turbulence, or waiting rooms",
    technique: "Coherent breathing",
    href: "/for/travel-anxiety",
  },
  {
    title: "Acute Overwhelm",
    description: "Panic rising, need immediate relief",
    technique: "Physiological sigh",
    href: "/breathe/physiological-sigh?duration=60",
  },
];

const dayPlans = [
  {
    title: "Gathering Day",
    steps: [
      { timing: "Morning", action: "5 min coherent breathing while getting ready", href: "/breathe/coherent?duration=300" },
      { timing: "Pre-arrival", action: "3 physiological sighs in the car", href: "/for/holiday-stress" },
      { timing: "During", action: "Bathroom break sighs as needed", href: "/breathe/physiological-sigh?duration=60" },
      { timing: "Post-event", action: "3 min 4-7-8 breathing before bed", href: "/breathe/4-7-8?duration=180" },
    ],
  },
  {
    title: "Travel Day",
    steps: [
      { timing: "Pre-departure", action: "5 min coherent breathing", href: "/for/travel-anxiety" },
      { timing: "Delays", action: "2 min coherent breathing during waits", href: "/breathe/coherent?duration=120" },
      { timing: "In-flight", action: "Physiological sighs for turbulence", href: "/breathe/physiological-sigh?duration=60" },
      { timing: "Arrival", action: "60s box breathing reset", href: "/breathe/box?duration=60" },
    ],
  },
  {
    title: "Hosting Day",
    steps: [
      { timing: "Morning prep", action: "5 min coherent breathing", href: "/breathe/coherent?duration=300" },
      { timing: "Guest arrival", action: "3 quick sighs in the pantry", href: "/for/holiday-stress" },
      { timing: "Mid-event", action: "2 min coherent breathing break", href: "/breathe/coherent?duration=120" },
      { timing: "Post-cleanup", action: "3 min 4-7-8 before bed", href: "/breathe/4-7-8?duration=180" },
    ],
  },
];

const whyItWorks = [
  {
    title: "Exhale Emphasis",
    description: "Long exhales activate your parasympathetic nervous system: the 'rest and digest' mode that counters stress.",
  },
  {
    title: "Optimal Rate",
    description: "Breathing at 5-6 breaths per minute maximizes heart rate variability (HRV), your body's stress resilience marker.",
  },
  {
    title: "Attention Anchor",
    description: "Counting breath phases interrupts rumination and catastrophic thinking: you can't panic and count simultaneously.",
  },
];

const safetyTips = [
  "Find a quiet spot when possible, even 30 seconds alone helps",
  "Don't force deep breaths, smaller, smoother breaths work better",
  "Start with just 1 minute. That's often enough",
  "Skip breath holds if they feel uncomfortable",
  "If you feel dizzy or tingly, return to normal breathing",
];

const faqs = [
  {
    question: "I only have 30 seconds. Will this help?",
    answer:
      "Yes. The physiological sigh (double inhale + long exhale) works in just 1-3 breaths. It's specifically designed for acute stress relief when you can't step away.",
  },
  {
    question: "Can I do this at the dinner table without looking weird?",
    answer:
      "Absolutely. The physiological sigh can be disguised as a natural tired sigh, people sigh all the time. For longer techniques, excuse yourself briefly.",
  },
  {
    question: "What if I'm too stressed to focus on breathing?",
    answer:
      "Use the visual guide on your phone, watching the animation is easier than counting. Start with just one physiological sigh to take the edge off.",
  },
  {
    question: "Which technique is best for holiday stress?",
    answer:
      "Physiological sigh for acute moments (rising tension, panic). Coherent breathing for sustained calm (travel, long gatherings). 4-7-8 for bedtime after exhausting days.",
  },
  {
    question: "How is this different from just 'taking deep breaths'?",
    answer:
      "Random deep breaths often make anxiety worse by over-breathing. These techniques use specific rhythms that activate your parasympathetic nervous system.",
  },
  {
    question: "Will this help with holiday travel anxiety too?",
    answer:
      "Yes. Coherent breathing creates sustained calm that lasts for hours. See our travel anxiety guide for the complete protocol.",
  },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Holiday Breathing Exercises, Find Calm During the Season",
  description:
    "Holiday stress relief breathing exercises. Quick resets for gatherings, travel, and overwhelm.",
  author: {
    "@type": "Person",
    name: "Abi Abiassi",
    url: `${baseUrl}/about/abi`,
  },
  publisher: {
    "@type": "Organization",
    name: "Deep Breathing Exercises",
    url: baseUrl,
  },
  datePublished: "2025-12-19",
  dateModified: "2025-12-19",
  mainEntityOfPage: `${baseUrl}/holiday-breathing-exercises`,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Calm Holiday Stress with Breathing",
  description: "Use the physiological sigh technique to quickly calm holiday stress in 30 seconds.",
  totalTime: "PT1M",
  step: [
    {
      "@type": "HowToStep",
      name: "Notice the stress",
      text: "Recognize when you're tensing up: clenching jaw, tight shoulders, racing thoughts, or the urge to snap.",
    },
    {
      "@type": "HowToStep",
      name: "First inhale",
      text: "Breathe in deeply through your nose, filling your lungs about 80-90%. Let your belly expand.",
    },
    {
      "@type": "HowToStep",
      name: "Second inhale (top-up)",
      text: "Without exhaling, take a second, shorter sniff through your nose to fully inflate your lungs.",
    },
    {
      "@type": "HowToStep",
      name: "Long exhale",
      text: "Exhale slowly and completely through your mouth, making the exhale longer than both inhales combined.",
    },
    {
      "@type": "HowToStep",
      name: "Repeat if needed",
      text: "One sigh often provides immediate relief. Do 2-3 if you need a full reset.",
    },
  ],
};

const infoCardClass =
  "rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm";

// Links "The physiological sigh" only in the FAQ answer that Ahrefs identified
// (the one mentioning it can be disguised as a natural tired sigh).
function renderFaqAnswer(answer: string) {
  const TRIGGER = "The physiological sigh can be disguised";
  if (!answer.includes(TRIGGER)) return answer;
  const keyword = "The physiological sigh";
  const href = "/breathe/physiological-sigh";
  const idx = answer.indexOf(keyword);
  return (
    <>
      {answer.slice(0, idx)}
      <Link href={href} className="text-sky-400 hover:underline">
        {keyword}
      </Link>
      {answer.slice(idx + keyword.length)}
    </>
  );
}

export default function HolidayBreathingExercisesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <JsonLd data={[articleSchema, faqSchema, howToSchema]} />

      {/* Hero Section with Ambient Snow */}
      <section className="relative min-h-[60vh] w-full overflow-hidden">
        {/* Ambient Snow Background */}
        <SnowBackground tone="dark" />

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-sky-400">
              Seasonal Calm
            </p>
            <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
              Holiday Breathing Exercises
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200 drop-shadow">
              Find calm during the holiday season. Quick resets for gatherings, travel delays,
              and moments when you need to step away and breathe.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/for/holiday-stress"
                className="inline-flex items-center rounded-full bg-sky-500 px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-sky-400 hover:scale-105 shadow-lg"
              >
                30s Holiday Reset →
              </Link>
              <HolidayShareButton />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Holiday-Specific Guides (Priority) */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">Holiday Guides</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {holidayExperiences.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group relative rounded-3xl border-2 border-sky-500/30 bg-gradient-to-br from-slate-800 to-slate-900 p-6 transition-all hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <div className="absolute top-4 right-4 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-400">
                  {item.timing}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-slate-400">{item.description}</p>
                <span className="mt-4 inline-flex text-sm font-medium text-sky-400 transition-transform group-hover:translate-x-1">
                  Learn the technique →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Start Techniques */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">Quick Start</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickStarts.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                rel={item.href?.includes("duration=") ? "nofollow" : undefined}
                className="group rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
              >
                <p
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: item.color }}
                >
                  {item.timing}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                <span
                  className="mt-4 inline-flex text-sm font-medium transition-transform group-hover:translate-x-1"
                  style={{ color: item.color }}
                >
                  Start →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Choose Your Moment */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            Choose Your Moment
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moments.map((moment) => (
              <Link
                key={moment.title}
                href={moment.href}
                rel={moment.href?.includes("duration=") ? "nofollow" : undefined}
                className="group rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
              >
                <h3 className="text-lg font-semibold text-white">
                  {moment.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {moment.description}
                </p>
                <p className="mt-3 text-xs text-sky-400">{moment.technique}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Holiday Day Plans */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            Holiday Day Plans
          </h2>
          <div className="space-y-4">
            {dayPlans.map((plan) => (
              <details
                key={plan.title}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm"
              >
                <summary className="cursor-pointer px-6 py-4 text-lg font-semibold text-white hover:text-sky-400">
                  {plan.title}
                </summary>
                <div className="border-t border-slate-700/50 px-6 py-4">
                  <div className="space-y-3">
                    {plan.steps.map((step, idx) => (
                      <Link
                        key={idx}
                        href={step.href}
                        rel={step.href?.includes("duration=") ? "nofollow" : undefined}
                        className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-slate-700/30"
                      >
                        <span className="whitespace-nowrap text-sm font-medium text-sky-400">
                          {step.timing}
                        </span>
                        <span className="text-sm text-slate-300">
                          {step.action}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Why It Works */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">Why It Works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {whyItWorks.map((item) => (
              <div key={item.title} className={cn(infoCardClass)}>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Tips */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            Comfort Tips
          </h2>
          <div className={cn(infoCardClass)}>
            <ul className="space-y-2">
              {safetyTips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm"
              >
                <summary className="cursor-pointer px-6 py-4 text-base font-medium text-white hover:text-sky-400">
                  {faq.question}
                </summary>
                <p className="border-t border-slate-700/50 px-6 py-4 text-sm text-slate-300">
                  {renderFaqAnswer(faq.answer)}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Related Links */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            Related Guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/for/anxiety"
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
            >
              <h3 className="font-semibold text-white">Anxiety Relief</h3>
              <p className="mt-1 text-sm text-slate-400">
                Box breathing for general anxiety
              </p>
            </Link>
            <Link
              href="/for/panic-attacks"
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
            >
              <h3 className="font-semibold text-white">Panic Attacks</h3>
              <p className="mt-1 text-sm text-slate-400">
                Stop panic fast with physiological sigh
              </p>
            </Link>
            <Link
              href="/for/sleep"
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
            >
              <h3 className="font-semibold text-white">Better Sleep</h3>
              <p className="mt-1 text-sm text-slate-400">
                4-7-8 breathing for restful nights
              </p>
            </Link>
            <Link
              href="/breathe"
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
            >
              <h3 className="font-semibold text-white">All Techniques</h3>
              <p className="mt-1 text-sm text-slate-400">
                Explore all breathing methods
              </p>
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 py-8 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-slate-500">
          Stop if dizzy, tingly, or chest-tight. These are self-regulation tools, not medical treatment.
          If you have ongoing mental health concerns, please consult a professional.
        </p>
      </footer>
    </main>
  );
}
