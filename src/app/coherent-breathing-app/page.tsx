import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/coherent-breathing-app`;
const ogImageUrl = createOgImagePath("Coherent Breathing App, Free Browser Timer");

export const metadata: Metadata = {
  title: "Coherent Breathing App (Free, 2026): No Download, Start Instantly",
  description:
    "Free coherent breathing timer, train HRV with 5-6 breaths/min pacing. No download, no signup. Start your guided session now.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Coherent Breathing App: Free Browser Timer",
    description:
      "Free coherent breathing timer. No download, no signup. 5-6 breaths/min for HRV. Start instantly.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Coherent Breathing App, Free Browser Timer"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Coherent Breathing App: Free, No Download",
    description:
      "Free coherent breathing timer in your browser. No signup. Start HRV training instantly.",
    images: [ogImageUrl]
  }
};

export default function CoherentBreathingAppMoneyPage() {
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
        name: "Coherent Breathing App",
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
        name: "What is coherent breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Coherent breathing is a technique where you breathe at a specific pace (typically around 5-6 breaths per minute) with equal inhale and exhale durations. This rate, often called the resonance frequency, maximizes heart rate variability (HRV) and promotes optimal balance in the autonomic nervous system."
        }
      },
      {
        "@type": "Question",
        name: "What is HRV breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "HRV breathing refers to breathing techniques designed to increase heart rate variability, the variation in time between heartbeats. Higher HRV indicates a flexible, resilient nervous system and is associated with better stress resilience, cardiovascular health, and emotional regulation. Coherent breathing is one of the most effective HRV training methods."
        }
      },
      {
        "@type": "Question",
        name: "How often should I do coherent breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For optimal results, practice coherent breathing for 10-20 minutes daily. Research suggests that consistent daily practice produces the best improvements in HRV, stress resilience, and overall autonomic function. Even 5 minutes daily is beneficial, and some people do multiple short sessions throughout the day."
        }
      },
      {
        "@type": "Question",
        name: "What's the best breathing rate for HRV?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most people's resonance frequency falls between 4.5-6.5 breaths per minute, with 5.5 breaths per minute (about 5.5 seconds in, 5.5 seconds out) being common. Your individual resonance frequency is where your HRV amplitude is highest. Start with 5-6 breaths per minute and adjust based on what feels sustainable."
        }
      },
      {
        "@type": "Question",
        name: "Is coherent breathing better than box breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "They serve different purposes. Coherent breathing is optimized for HRV training, nervous system flexibility, and sustained practice sessions. Box breathing is better for acute stress management and focus. Coherent breathing has no holds, making it easier to sustain for 10+ minutes, while box breathing is typically done for shorter periods."
        }
      },
      {
        "@type": "Question",
        name: "Can coherent breathing help with anxiety?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, regular coherent breathing practice improves your baseline stress resilience and emotional regulation over time. While it's not typically used for acute anxiety relief (4-7-8 or box breathing are better for that), daily coherent breathing training strengthens your autonomic nervous system's ability to handle stress."
        }
      },
      {
        "@type": "Question",
        name: "Is it 'coherent' or 'coherence' breathing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Both terms refer to the same technique. 'Coherent breathing' is the most common name, describing the coherent state you achieve. 'Coherence breathing' or 'cardiac coherence breathing' emphasizes the heart-brain coherence that results from the practice. You may also see it called 'resonant frequency breathing' or 'HRV breathing.' All describe the same 5-6 breaths per minute technique."
        }
      }
    ]
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
        <p className="text-xs text-muted-foreground">Updated February 2026</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Coherent breathing app (HRV)</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A free coherent breathing timer for HRV-focused paced breathing. Use equal inhale/exhale around 5–6 breaths per
          minute (about 5–6 seconds in, 5–6 seconds out). No download and no signup.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Start the trainer</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Press Start and follow the animation. Keep breaths small and quiet. Adjust pacing to stay comfortable.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/breathe/coherent" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Open coherent breathing
            </Link>
            <Link href="/breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
              See the full app
            </Link>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Suggested settings</h2>
          <p className="mt-2 text-sm text-muted-foreground">Most people land in a range, treat the number as flexible.</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Starter: 5s in / 5s out (6 breaths/min)</li>
            <li>Common: 5.5s in / 5.5s out (~5.5 breaths/min)</li>
            <li>Gentler: 4.5s in / 4.5s out (~6.7 breaths/min)</li>
            <li>If dizzy/tingly: make breaths smaller and quieter, shorten the session, or slow down less</li>
          </ul>
          <div className="mt-5">
            <Link href="/breathe/coherent#how-to" className="text-sm font-semibold text-primary hover:underline">
              Step-by-step instructions →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">What is coherent breathing?</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>
              Coherent breathing is a paced breathing technique where you breathe at approximately 5-6 breaths per minute with
              equal inhale and exhale durations. This specific breathing rate (around 10-12 seconds per breath cycle) aligns your
              breathing with your cardiovascular rhythms, creating a state of &ldquo;coherence&rdquo; in your autonomic nervous system.
            </p>
            <p>
              The technique was developed by researchers studying heart rate variability (HRV) and the resonance frequency of
              the cardiovascular system. When you breathe at your resonance frequency (which for most people falls between 4.5-6.5
              breaths per minute), your heart rate variability reaches its maximum amplitude. This creates optimal conditions for
              nervous system flexibility and resilience.
            </p>
            <p>
              Unlike techniques with breath holds (like box breathing or 4-7-8), coherent breathing uses continuous, smooth
              breathing with no pauses. This makes it ideal for longer practice sessions of 10-20 minutes, which is where the
              most significant benefits emerge. The simplicity of the pattern (just equal in and out breathing) allows you to
              sustain the practice without strain or discomfort.
            </p>
            <p>
              Coherent breathing is also called &ldquo;resonant frequency breathing,&rdquo; &ldquo;HRV breathing,&rdquo; or &ldquo;0.1 Hz breathing&rdquo; (because
              6 breaths per minute equals a frequency of 0.1 Hz). It&apos;s widely used in biofeedback therapy, sports psychology, and
              stress management programs.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Benefits of coherent breathing</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>Coherent breathing offers several evidence-based benefits, particularly for autonomic nervous system health:</p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Increases heart rate variability (HRV):</strong> Regular practice
                  significantly improves HRV, a key marker of stress resilience, cardiovascular health, and nervous system
                  flexibility. Higher HRV is associated with better health outcomes across virtually all systems.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Improves stress resilience:</strong> By training your autonomic nervous
                  system to shift smoothly between activation and relaxation, coherent breathing builds your capacity to handle
                  stress without becoming overwhelmed.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Reduces anxiety and depression:</strong> Multiple studies have shown
                  that regular resonant frequency breathing can significantly reduce symptoms of anxiety and depression, often as
                  effectively as medication but without side effects.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Lowers blood pressure:</strong> Consistent practice has been shown to
                  reduce both systolic and diastolic blood pressure in people with hypertension, sometimes eliminating the need
                  for medication (under medical supervision).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Improves emotional regulation:</strong> By strengthening the connection
                  between your heart and brain (the &ldquo;heart-brain axis&rdquo;), coherent breathing enhances your ability to stay
                  emotionally balanced during challenging situations.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Enhances athletic recovery:</strong> Athletes use coherent breathing to
                  improve recovery between training sessions and competitions. Higher HRV is associated with better recovery and
                  readiness to perform.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Supports better sleep:</strong> Regular practice improves sleep quality
                  by balancing the autonomic nervous system and reducing nighttime arousal. Many practitioners report falling
                  asleep more easily and waking less during the night.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">How coherent breathing works</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>
              Coherent breathing works by synchronizing multiple physiological rhythms in your body: primarily your breathing,
              heart rate, and blood pressure. This synchronization occurs at what&apos;s called your &ldquo;resonance frequency,&rdquo; typically
              around 5-6 breaths per minute for most adults.
            </p>
            <p>
              When you breathe, your heart rate naturally speeds up slightly on the inhale and slows down on the exhale. This is
              called respiratory sinus arrhythmia (RSA), and it&apos;s a sign of healthy autonomic function. At your resonance
              frequency, this heart rate oscillation reaches its maximum amplitude. Your HRV is at its peak.
            </p>
            <p>
              This maximized HRV isn&apos;t just a number. It reflects optimal coordination between your sympathetic (activation) and
              parasympathetic (relaxation) nervous systems. Instead of one dominating the other or fighting for control, they
              work together in a balanced, flexible rhythm. Think of it like tuning an instrument: when you hit the right
              frequency, everything resonates together perfectly.
            </p>
            <p>
              The equal inhale and exhale pattern (unlike exhale-emphasis techniques like 4-7-8) creates a balanced stimulation
              of both branches of your autonomic nervous system. This balance is what trains nervous system flexibility over
              time. Research using HRV biofeedback has shown that regular practice at resonance frequency can literally rewire
              autonomic reflexes, making you more resilient to stress.
            </p>
            <p>
              The practice also stimulates your vagus nerve, the main nerve of the parasympathetic system, which runs from your
              brainstem through your chest and abdomen. A well-toned vagus nerve is associated with better emotional regulation,
              lower inflammation, improved digestion, and even better social connection.
            </p>
            <p>
              Perhaps most importantly, the training effect is cumulative. While a single session feels calming, the real magic
              happens with consistent daily practice. Studies show that 10-20 minutes daily for 4-8 weeks produces significant,
              measurable improvements in HRV and stress resilience that persist even when you&apos;re not actively practicing.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">When to practice coherent breathing</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>Coherent breathing is best used as a daily training practice rather than an acute intervention:</p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Daily HRV training:</strong> The primary use case. Practice 10-20
                  minutes daily to build long-term stress resilience and autonomic nervous system health. Morning is ideal for
                  many people as it sets a balanced tone for the day.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Before meditation:</strong> Use 5-10 minutes of coherent breathing as a
                  warm-up before meditation. The practice quiets mental chatter and makes it easier to settle into stillness.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Work breaks:</strong> Take 5-minute coherent breathing breaks between
                  tasks or meetings to reset your nervous system and maintain focus throughout the day.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Athletic recovery:</strong> Use coherent breathing after training or
                  competition to accelerate recovery. Athletes often track their HRV to monitor recovery status.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Evening wind-down:</strong> Practice 10-15 minutes in the evening to
                  transition from work mode to rest mode. This can improve sleep quality without being specifically a sleep
                  technique.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Chronic stress management:</strong> If you&apos;re dealing with ongoing
                  stress, anxiety, or burnout, coherent breathing is one of the most evidence-based practices for building
                  resilience over time.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">With HRV tracking:</strong> If you use an HRV tracking device or app,
                  you can practice coherent breathing while monitoring your HRV in real-time to find your personal resonance
                  frequency.
                </span>
              </li>
            </ul>
            <p className="mt-4">
              <strong className="text-card-foreground">Important note:</strong> Coherent breathing is a training practice that
              builds resilience over time. For acute stress or anxiety relief, techniques with exhale emphasis (like 4-7-8) or
              structured patterns (like box breathing) may be more immediately effective.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What is coherent breathing?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Coherent breathing is a technique where you breathe at a specific pace (typically around 5-6 breaths per
                minute) with equal inhale and exhale durations. This rate, often called the resonance frequency, maximizes heart
                rate variability (HRV) and promotes optimal balance in the autonomic nervous system.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What is HRV breathing?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                HRV breathing refers to breathing techniques designed to increase heart rate variability, the variation in time
                between heartbeats. Higher HRV indicates a flexible, resilient nervous system and is associated with better
                stress resilience, cardiovascular health, and emotional regulation. Coherent breathing is one of the most
                effective HRV training methods.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">How often should I do coherent breathing?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                For optimal results, practice coherent breathing for 10-20 minutes daily. Research suggests that consistent daily
                practice produces the best improvements in HRV, stress resilience, and overall autonomic function. Even 5 minutes
                daily is beneficial, and some people do multiple short sessions throughout the day.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">What&apos;s the best breathing rate for HRV?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Most people&apos;s resonance frequency falls between 4.5-6.5 breaths per minute, with 5.5 breaths per minute (about
                5.5 seconds in, 5.5 seconds out) being common. Your individual resonance frequency is where your HRV amplitude is
                highest. Start with 5-6 breaths per minute and adjust based on what feels sustainable.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                Is coherent breathing better than box breathing?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                They serve different purposes. Coherent breathing is optimized for HRV training, nervous system flexibility, and
                sustained practice sessions. Box breathing is better for acute stress management and focus. Coherent breathing
                has no holds, making it easier to sustain for 10+ minutes, while box breathing is typically done for shorter
                periods.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Can coherent breathing help with anxiety?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes, regular coherent breathing practice improves your baseline stress resilience and emotional regulation over
                time. While it&apos;s not typically used for acute anxiety relief (4-7-8 or box breathing are better for that), daily
                coherent breathing training strengthens your autonomic nervous system&apos;s ability to handle stress.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Is it &quot;coherent&quot; or &quot;coherence&quot; breathing?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Both terms refer to the same technique. &quot;Coherent breathing&quot; is the most common name, describing the coherent
                state you achieve. &quot;Coherence breathing&quot; or &quot;cardiac coherence breathing&quot; emphasizes the heart-brain coherence
                that results from the practice. You may also see it called &quot;resonant frequency breathing&quot; or &quot;HRV breathing.&quot;
                All describe the same 5-6 breaths per minute technique.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">HRV-focused</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Coherent breathing targets slow, equal pacing that often maximizes HRV during sessions.
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">No breath holds</h2>
          <p className="mt-2 text-sm text-muted-foreground">Equal inhale/exhale pacing with no holds, simple and sustainable.</p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Training-friendly</h2>
          <p className="mt-2 text-sm text-muted-foreground">Great for 5–10 minute daily sessions. Short sets also work between tasks.</p>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-8">
        <h2 className="text-2xl font-semibold text-card-foreground">Coherent breathing vs other techniques</h2>
        <p className="mt-2 text-sm text-muted-foreground">Compare breathing patterns to choose the right one for your goals.</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-left font-semibold text-card-foreground">Technique</th>
                <th className="py-3 text-left font-semibold text-card-foreground">Pattern</th>
                <th className="py-3 text-left font-semibold text-card-foreground">Best For</th>
                <th className="py-3 text-left font-semibold text-card-foreground">Duration</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50 bg-primary/5">
                <td className="py-3 font-medium text-card-foreground">Coherent</td>
                <td className="py-3">5.5s in / 5.5s out</td>
                <td className="py-3">HRV training, long-term resilience</td>
                <td className="py-3">10-20 min daily</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 font-medium text-card-foreground">Box</td>
                <td className="py-3">4-4-4-4</td>
                <td className="py-3">Acute stress, focus, structure</td>
                <td className="py-3">2-5 min as needed</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 font-medium text-card-foreground">4-7-8</td>
                <td className="py-3">4s in / 7s hold / 8s out</td>
                <td className="py-3">Sleep, relaxation, anxiety</td>
                <td className="py-3">3-4 cycles before bed</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-card-foreground">Physiological Sigh</td>
                <td className="py-3">Double inhale + long exhale</td>
                <td className="py-3">Instant stress relief, panic</td>
                <td className="py-3">1-3 breaths (30 sec)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <p className="text-sm uppercase tracking-widest text-primary">Explore more techniques</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/breathe/pursed-lip" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
            <p className="text-lg font-semibold text-card-foreground">Pursed Lip Breathing</p>
            <p className="mt-1 text-sm text-muted-foreground">Exhale-focused pacing to ease breathlessness and calm the body.</p>
            <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Practice →</span>
          </Link>
          <Link href="/breathe/belly" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
            <p className="text-lg font-semibold text-card-foreground">Belly Breathing</p>
            <p className="mt-1 text-sm text-muted-foreground">Foundational diaphragmatic breathing for beginners.</p>
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
        <h2 className="text-2xl font-semibold text-card-foreground">More breathing tools</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Want something structured, shorter, sleep-focused, or recovery-focused? Try these:
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/box-breathing-app" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            Box breathing app
          </Link>
          <Link href="/4-7-8-breathing-timer" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">
            4-7-8 timer
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
    </main>
  );
}
