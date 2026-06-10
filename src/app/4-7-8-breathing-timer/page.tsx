import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { FadingHeroTitle } from "@/components/breathe/fading-hero-title";
import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/4-7-8-breathing-timer`;
const ogImageUrl = createOgImagePath("Free Online 4-7-8 Breathing Timer");

export const metadata: Metadata = {
  title: "4-7-8 Breathing Timer (Free Online) — Dr. Weil",
  description:
    "Use a free 4-7-8 breathing timer online. Follow Dr. Andrew Weil's 4-7-8 pattern for sleep and anxiety relief. No app, no signup.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "4-7-8 Breathing Timer (Free Online)",
    description:
      "Free 4-7-8 breathing timer online. Dr. Weil's sleep and anxiety breathing pattern with guided pacing in your browser.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Free Online 4-7-8 Breathing Timer"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "4-7-8 Breathing Timer (Free Online)",
    description:
      "Dr. Weil's 4-7-8 breathing timer. The 'natural tranquilizer' for sleep and anxiety. Free in your browser. Try tonight.",
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

export default function FourSevenEightBreathingTimerMoneyPage() {
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
        name: "4-7-8 Breathing Timer",
        item: canonicalUrl
      }
    ]
  };


  const siteOrganization = {
    "@type": "Organization",
    name: "Deep Breathing Exercises",
    url: siteUrl
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "4-7-8 Breathing Timer: Fall Asleep in 2 Minutes",
    description: "Dr. Weil's 4-7-8 breathing timer for sleep. The 'natural tranquilizer' technique: fall asleep faster, calm anxiety in minutes.",
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
    datePublished: "2025-11-17",
    dateModified: "2026-02-03",
    mainEntityOfPage: canonicalUrl
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Do 4-7-8 Breathing for Sleep",
    description: "Dr. Andrew Weil's 4-7-8 breathing technique to fall asleep faster and calm anxiety. Follow this step-by-step guide.",
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        name: "Get comfortable",
        text: "Sit or lie down in a comfortable position. Place the tip of your tongue against the ridge behind your upper front teeth.",
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: "Exhale completely",
        text: "Exhale completely through your mouth, making a whoosh sound.",
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: "Inhale for 4 counts",
        text: "Close your mouth and inhale quietly through your nose for a mental count of 4.",
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: "Hold for 7 counts",
        text: "Hold your breath for a count of 7. Keep your body relaxed.",
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: "Exhale for 8 counts",
        text: "Exhale completely through your mouth, making a whoosh sound, for a count of 8.",
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: "Repeat 4 cycles",
        text: "This completes one breath cycle. Repeat for a total of 4 cycles when starting out, working up to 8 cycles.",
        url: `${canonicalUrl}#how-to`
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is 4-7-8 breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "4-7-8 breathing is a breathing technique popularized by Dr. Andrew Weil that follows a specific pattern: inhale for 4 counts, hold for 7 counts, exhale for 8 counts. The extended exhale activates the parasympathetic nervous system, promoting relaxation and calm."
        }
      },
      {
        "@type": "Question",
        name: "Is 4-7-8 breathing good for sleep?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, 4-7-8 breathing is particularly effective for sleep. The long exhale helps activate the body's relaxation response, slowing heart rate and calming the nervous system. Many people use it as part of their bedtime routine to fall asleep faster."
        }
      },
      {
        "@type": "Question",
        name: "How many times should I do 4-7-8 breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Dr. Weil recommends starting with 4 breath cycles (about 1 minute) twice daily, then gradually increasing to 8 cycles as you get comfortable. For sleep, practice 4-8 cycles when you get into bed. Avoid doing more than 8 cycles in one sitting when you're just starting out."
        }
      },
      {
        "@type": "Question",
        name: "Can 4-7-8 breathing help with anxiety?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, 4-7-8 breathing can help reduce anxiety. The extended exhale and breath hold stimulate the vagus nerve, which triggers the relaxation response. Many people find it helpful during anxious moments or panic attacks."
        }
      },
      {
        "@type": "Question",
        name: "What if I can't hold my breath for 7 counts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If holding for 7 counts feels uncomfortable, modify the pattern while keeping the ratio similar. Try 2-3.5-4 or 3-5.25-6 (half or three-quarters of the original). The key is maintaining the exhale-emphasis pattern. Comfort should always come first. Never strain."
        }
      },
      {
        "@type": "Question",
        name: "When is the best time to do 4-7-8 breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "4-7-8 breathing works best when you need to calm down: before bed, during stressful moments, after a difficult day, or before anxiety-inducing situations. Many people use it at night for sleep, but it's also effective for managing daytime stress and nervous energy."
        }
      },
      {
        "@type": "Question",
        name: "Is it 4-7-8 or 7-8-4 breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The correct order is 4-7-8: inhale for 4 counts, hold for 7 counts, exhale for 8 counts. The numbers describe the sequence of the breath cycle. '7-8-4' is a common mix-up, but the technique starts with the 4-count inhale and ends with the 8-count exhale. The extended exhale is what activates the relaxation response."
        }
      },
      {
        "@type": "Question",
        name: "How many cycles of 4-7-8 breathing for sleep?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For sleep, do 4-8 cycles of 4-7-8 breathing when you get into bed. Each cycle takes about 15-20 seconds, so 4 cycles is roughly 1 minute and 8 cycles is about 2-3 minutes. Many people fall asleep before completing all cycles. Dr. Weil recommends starting with 4 cycles and gradually increasing to 8 as you get comfortable with the technique."
        }
      },
      {
        "@type": "Question",
        name: "Can I do 4-7-8 breathing lying down?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, 4-7-8 breathing works great lying down. In fact, that's the most common position for using it as a sleep aid. Lie on your back with your hands resting comfortably. The technique works in any position: sitting, lying down, or even standing. For sleep specifically, lying down allows you to transition directly into sleep without changing positions."
        }
      },
      {
        "@type": "Question",
        name: "Is 4-7-8 breathing the same as box breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, they're different techniques with different purposes. 4-7-8 has unequal phases (4-7-8) with an exhale-dominant pattern designed for relaxation and sleep. Box breathing has equal phases (4-4-4-4) designed for focus and alertness. Use 4-7-8 when you want to wind down; use box breathing when you need to stay sharp before a presentation or task."
        }
      }
    ]
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, howToSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance defaultMode={ModeName.Relax} className="min-h-screen" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">4-7-8 breathing timer (free online)</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              4-7-8 breathing is a calming pattern: inhale for 4, hold for 7, exhale for 8. This free timer (Dr. Andrew Weil&apos;s method)
              lets you follow the pacing instantly in your browser and adjust the counts if you need a gentler version.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">Last updated: February 3, 2026</p>
        <div className="mb-8 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Quick answer</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            4-7-8 breathing is a relaxation technique: inhale for 4 counts, hold for 7, exhale for 8. The long exhale activates the
            parasympathetic nervous system, helping with sleep and anxiety. Do 4-8 cycles at bedtime or anytime you need to calm down.
          </p>
        </div>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Start the timer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Press Start and breathe with the animation. You can adjust pacing, sound, and haptics.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/breathe/4-7-8" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Open 4-7-8 timer
              </Link>
              <Link href="/breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
                See the full app
              </Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">Best 4-7-8 Timer Settings</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose your goal and adjust the timer accordingly:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-card-foreground">For sleep:</strong> Classic 4-7-8, do 6-8 cycles in bed with lights off</li>
              <li><strong className="text-card-foreground">For anxiety:</strong> Gentler 4-4-6-8 (shorter hold), do 4-6 cycles</li>
              <li><strong className="text-card-foreground">For beginners:</strong> Start with 2-3-4 and work up to full counts</li>
              <li><strong className="text-card-foreground">If light-headed:</strong> Remove the hold entirely, use 4 in / 8 out</li>
            </ul>
            <div className="mt-5">
              <Link href="/breathe/4-7-8#how-to" className="text-sm font-semibold text-primary hover:underline">
                Step-by-step instructions →
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">What is 4-7-8 breathing?</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                4-7-8 breathing is a powerful relaxation technique developed and popularized by Dr. Andrew Weil, a Harvard-trained
                physician and pioneer in integrative medicine. The method follows a simple but specific pattern: inhale through
                your nose for 4 counts, hold your breath for 7 counts, then exhale completely through your mouth for 8 counts.
              </p>
              <p>
                What makes 4-7-8 breathing unique is its emphasis on the exhale. The 8-count exhale is twice as long as the
                inhale, creating an exhale-dominant pattern that actively engages the parasympathetic nervous system. Your body&apos;s
                built-in relaxation mechanism. This makes it particularly effective for sleep and anxiety relief.
              </p>
              <p>
                Dr. Weil calls 4-7-8 breathing a &ldquo;natural tranquilizer for the nervous system.&rdquo; Unlike pharmaceutical
                tranquilizers that can lose effectiveness over time, 4-7-8 breathing actually becomes more powerful with practice.
                The technique is based on pranayama, an ancient yogic practice of breath control, but adapted for modern use
                without any spiritual or cultural requirements. If you struggle with <Link href="/for/sleep" className="text-primary hover:underline">sleep</Link> or
                need help with <Link href="/for/anxiety" className="text-primary hover:underline">anxiety</Link>, 4-7-8 is one of the most effective breathing techniques available.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">4-7-8 vs Other Sleep Breathing Techniques</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                Each breathing technique has its strengths. Here&apos;s how 4-7-8 compares to other popular methods:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-semibold text-card-foreground">Technique</th>
                      <th className="py-3 text-left font-semibold text-card-foreground">Best For</th>
                      <th className="py-3 text-left font-semibold text-card-foreground">Pattern</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-3 font-medium text-card-foreground">4-7-8 Breathing</td>
                      <td className="py-3">Falling asleep, calming anxiety</td>
                      <td className="py-3">4 in, 7 hold, 8 out (exhale-dominant)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 font-medium text-card-foreground">Box Breathing</td>
                      <td className="py-3">Focus and alertness before tasks</td>
                      <td className="py-3">4 in, 4 hold, 4 out, 4 hold (equal phases)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 font-medium text-card-foreground">Coherent Breathing</td>
                      <td className="py-3">HRV training, long-term stress resilience</td>
                      <td className="py-3">5 in, 5 out (no hold, ~6 breaths/min)</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-card-foreground">Physiological Sigh</td>
                      <td className="py-3">Instant panic relief (1-3 breaths)</td>
                      <td className="py-3">Double inhale, long exhale</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                <strong className="text-card-foreground">Bottom line:</strong> Use 4-7-8 when you need to wind down for sleep or calm anxiety.
                The extended exhale is key. It activates your parasympathetic nervous system more powerfully than equal-phase techniques like box breathing.
                For instant relief in just 1-3 breaths, try the <Link href="/breathe/physiological-sigh" className="text-primary hover:underline">physiological sigh</Link>.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Benefits of 4-7-8 breathing</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>4-7-8 breathing offers several research-supported benefits, particularly for relaxation and sleep:</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Helps you fall asleep faster:</strong> The extended exhale and breath
                    hold trigger your body&apos;s natural sleep mechanisms. Many practitioners report falling asleep within minutes of
                    starting the technique.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Reduces anxiety and panic:</strong> The breath hold increases CO₂
                    levels slightly, which paradoxically calms anxiety and helps interrupt panic spirals. The counting also gives
                    your mind something to focus on besides anxious thoughts.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Lowers blood pressure:</strong> Regular practice has been shown to
                    reduce both systolic and diastolic blood pressure by activating the parasympathetic nervous system.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Reduces anger and frustration:</strong> The forced slow breathing
                    creates a pause between stimulus and response, giving you space to respond thoughtfully rather than react
                    emotionally.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Calms nervous energy:</strong> The technique is particularly useful
                    before public speaking, medical procedures, difficult conversations, or other anxiety-inducing events.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Helps with cravings:</strong> The breath hold and focus can help you
                    ride out cravings for food, nicotine, or other substances by creating a gap between urge and action.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">How 4-7-8 breathing works</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                4-7-8 breathing works through several interconnected physiological mechanisms. The most important is the
                activation of your vagus nerve, the main nerve of your parasympathetic nervous system. The vagus nerve runs from
                your brainstem down through your chest and abdomen, and it acts like a brake pedal for your stress response.
              </p>
              <p>
                The extended exhale (8 counts) is the key. When you exhale slowly and completely, you stimulate pressure receptors
                in your lungs and chest that signal the vagus nerve to activate. This triggers a cascade of calming effects:
                slowed heart rate, lowered blood pressure, relaxed muscles, and reduced cortisol (stress hormone) production.
              </p>
              <p>
                The 7-count breath hold also plays an important role. Holding your breath after inhaling allows oxygen to fully
                saturate your blood and reach your tissues. More importantly, the hold causes a slight buildup of carbon dioxide
                (CO₂) in your bloodstream. While we typically think of CO₂ as waste, moderate increases actually have a calming
                effect on the nervous system and improve oxygen delivery to your cells, a phenomenon called the Bohr effect.
              </p>
              <p>
                The counting itself provides a cognitive anchor. When you&apos;re anxious, stressed, or unable to sleep, your mind is
                usually racing with thoughts. The simple act of counting gives your conscious mind a single point of focus,
                interrupting rumination and worry patterns.
              </p>
              <p>
                Research has shown that techniques emphasizing longer exhales can shift your autonomic nervous system balance
                toward parasympathetic dominance, increase heart rate variability (a marker of resilience), and even influence
                brainwave patterns toward more relaxed alpha and theta states.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">When to use 4-7-8 breathing</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>4-7-8 breathing is most effective in situations where you need to activate your relaxation response:</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Before bed (insomnia relief):</strong> The most popular use case.
                    Practice 4-8 breath cycles when you get into bed. Many people report falling asleep before completing all
                    cycles.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">During anxiety or panic attacks:</strong> When you feel panic rising,
                    4-7-8 breathing can help break the cycle. The breath hold is particularly effective for calming acute anxiety.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">After a stressful day:</strong> Use 4-7-8 as a transition ritual when
                    you get home from work to help you leave the day&apos;s stress behind.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Before stressful events:</strong> Practice 4-8 cycles before job
                    interviews, presentations, medical procedures, difficult conversations, or any anxiety-inducing situation.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">When you wake up at night:</strong> If you wake up at 3 AM with racing
                    thoughts, 4-7-8 breathing can help you fall back asleep without reaching for your phone or medication.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">Managing anger:</strong> When you feel anger rising, excuse yourself
                    and practice a few cycles. The forced pause helps prevent reactive, regrettable responses.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">During cravings:</strong> When cravings hit (food, nicotine, etc.),
                    use 4 cycles to create space between the urge and the action.
                  </span>
                </li>
              </ul>
              <p className="mt-4">
                <strong className="text-card-foreground">Important note:</strong> While 4-7-8 is generally calming, some people
                find breath holds energizing or uncomfortable. If it doesn&apos;t feel right, try removing the hold or using a
                different technique like <Link href="/breathe/coherent" className="text-primary hover:underline">coherent breathing</Link> instead.
                For instant panic relief, the <Link href="/breathe/physiological-sigh" className="text-primary hover:underline">physiological sigh</Link> works
                in just 1-3 breaths.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">What is 4-7-8 breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  4-7-8 breathing is a breathing technique popularized by Dr. Andrew Weil that follows a specific pattern: inhale
                  for 4 counts, hold for 7 counts, exhale for 8 counts. The extended exhale activates the parasympathetic nervous
                  system, promoting relaxation and calm.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Is 4-7-8 breathing good for sleep?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, 4-7-8 breathing is particularly effective for sleep. The long exhale helps activate the body&apos;s relaxation
                  response, slowing heart rate and calming the nervous system. Many people use it as part of their bedtime routine
                  to fall asleep faster.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">How many times should I do 4-7-8 breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Dr. Weil recommends starting with 4 breath cycles (about 1 minute) twice daily, then gradually increasing to 8
                  cycles as you get comfortable. For sleep, practice 4-8 cycles when you get into bed. Avoid doing more than 8
                  cycles in one sitting when you&apos;re just starting out.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Can 4-7-8 breathing help with anxiety?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, 4-7-8 breathing can help reduce anxiety. The extended exhale and breath hold stimulate the vagus nerve,
                  which triggers the relaxation response. Many people find it helpful during anxious moments or panic attacks.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">What if I can&apos;t hold my breath for 7 counts?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  If holding for 7 counts feels uncomfortable, modify the pattern while keeping the ratio similar. Try 2-3.5-4 or
                  3-5.25-6 (half or three-quarters of the original). The key is maintaining the exhale-emphasis pattern. Comfort
                  should always come first, never strain.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">When is the best time to do 4-7-8 breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  4-7-8 breathing works best when you need to calm down: before bed, during stressful moments, after a difficult
                  day, or before anxiety-inducing situations. Many people use it at night for sleep, but it&apos;s also effective for
                  managing daytime stress and nervous energy.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Is it 4-7-8 or 7-8-4 breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The correct order is 4-7-8: inhale for 4 counts, hold for 7 counts, exhale for 8 counts. The numbers describe
                  the sequence of the breath cycle. &quot;7-8-4&quot; is a common mix-up, but the technique starts with the 4-count inhale
                  and ends with the 8-count exhale. The extended exhale is what activates the relaxation response.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">How many cycles of 4-7-8 breathing for sleep?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  For sleep, do 4-8 cycles of 4-7-8 breathing when you get into bed. Each cycle takes about 15-20 seconds, so 4
                  cycles is roughly 1 minute and 8 cycles is about 2-3 minutes. Many people fall asleep before completing all
                  cycles. Dr. Weil recommends starting with 4 cycles and gradually increasing to 8 as you get comfortable with the technique.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Can I do 4-7-8 breathing lying down?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, 4-7-8 breathing works great lying down. In fact, that&apos;s the most common position for using it as a sleep
                  aid. Lie on your back with your hands resting comfortably. The technique works in any position: sitting, lying
                  down, or even standing. For sleep specifically, lying down allows you to transition directly into sleep without
                  changing positions.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Is 4-7-8 breathing the same as box breathing?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No, they&apos;re different techniques with different purposes. 4-7-8 has unequal phases (4-7-8) with an exhale-dominant
                  pattern designed for relaxation and sleep. Box breathing has equal phases (4-4-4-4) designed for focus and alertness.
                  Use 4-7-8 when you want to wind down; use box breathing when you need to stay sharp before a presentation or task.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">Great for wind-down</h2>
            <p className="mt-2 text-sm text-muted-foreground">Exhale-emphasis often feels calming before bed or after stress.</p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">Adjustable</h2>
            <p className="mt-2 text-sm text-muted-foreground">Treat the counts as a starting point. Comfort comes first.</p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">No download</h2>
            <p className="mt-2 text-sm text-muted-foreground">Runs on mobile and desktop with nothing to install.</p>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">Use case guides</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/for/sleep" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Better Sleep</p>
              <p className="mt-1 text-sm text-muted-foreground">Fall asleep faster with the &apos;natural tranquilizer&apos; technique</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/for/anxiety" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Anxiety Relief</p>
              <p className="mt-1 text-sm text-muted-foreground">Calm anxious thoughts with exhale-focused breathing</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/for/high-blood-pressure" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Blood Pressure Support</p>
              <p className="mt-1 text-sm text-muted-foreground">Naturally support healthy blood pressure with slow breathing</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/for/running" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Running Recovery</p>
              <p className="mt-1 text-sm text-muted-foreground">Recover between efforts and stop side stitches with guided breathing</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">Explore more techniques</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/breathe/belly" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Belly Breathing</p>
              <p className="mt-1 text-sm text-muted-foreground">Foundational diaphragmatic breathing for beginners.</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Practice →</span>
            </Link>
            <Link href="/breathe/pursed-lip" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Pursed Lip Breathing</p>
              <p className="mt-1 text-sm text-muted-foreground">Exhale-focused pacing to ease breathlessness and calm the body.</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Practice →</span>
            </Link>
            <Link href="/breathe/ujjayi" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Ujjayi (Ocean Breath)</p>
              <p className="mt-1 text-sm text-muted-foreground">Yoga-friendly breath for steady focus and calm.</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Practice →</span>
            </Link>
            <Link href="/breathe/buteyko" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Buteyko Breathing</p>
              <p className="mt-1 text-sm text-muted-foreground">Light nasal breathing to reduce over-breathing.</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Practice →</span>
            </Link>
          </div>
        </section>

        <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">More breathing apps</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prefer a structured reset or HRV-focused pacing? Try box breathing or coherent breathing.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/box-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Box breathing app
            </Link>
            <Link href="/coherent-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              Coherent (HRV) breathing
            </Link>
            <Link href="/2-minute-breathing-exercise" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              2 minute breathing exercise
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
