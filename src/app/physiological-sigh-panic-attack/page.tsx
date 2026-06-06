import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/physiological-sigh-panic-attack`;
const ogImageUrl = createOgImagePath("Breathing Technique for Panic Attack. Stop Panic in 30 Seconds");

export const metadata: Metadata = {
  title: "Breathing Technique for Panic Attack: Stop Panic in 30 Seconds (Free Timer)",
  description:
    "Free panic attack breathing timer, the physiological sigh stops panic in just 1-3 breaths (30 seconds). Stanford-tested technique. Use it right now.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Breathing Technique for Panic Attack: Stop Panic in 30 Seconds",
    description:
      "The fastest breathing technique to stop a panic attack. Just 1-3 breaths (30 seconds). Stanford-tested. Free timer.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Breathing Technique for Panic Attack. Stop Panic in 30 Seconds"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Stop Panic Attack in 30 Seconds: Physiological Sigh",
    description:
      "Stanford's fastest breathing technique for panic attacks. Just 1-3 breaths. Free timer. Use now.",
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

export default function PhysiologicalSighPanicAttackPage() {
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
        name: "Physiological Sigh for Panic Attack",
        item: canonicalUrl
      }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Breathing Technique for Panic Attack: Stop Panic in 30 Seconds",
    description: "The physiological sigh is the fastest way to stop a panic attack: just 1-3 breaths. Stanford-tested technique from Dr. Andrew Huberman.",
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
        name: "What is the best breathing technique for a panic attack?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The physiological sigh is the fastest breathing technique for panic attacks. It works in just 1-3 breaths (about 30 seconds). The pattern is: two quick inhales through your nose (the second is a short 'top-up'), then one long, slow exhale through your mouth. This immediately activates your vagus nerve and interrupts the panic response."
        }
      },
      {
        "@type": "Question",
        name: "Why does the physiological sigh work for panic attacks?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "During a panic attack, your lung alveoli collapse and your nervous system is in overdrive. The double inhale reinflates these collapsed air sacs, improving oxygen exchange. The long exhale stimulates the vagus nerve, which activates your parasympathetic 'calm down' system. This two-step mechanism interrupts panic faster than any other breathing technique."
        }
      },
      {
        "@type": "Question",
        name: "How many physiological sighs should I do during a panic attack?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start with 1-3 sighs (about 30 seconds). Most people feel relief after just one or two. If you're still panicking, do another 3-5 sighs. You can't overdo it. This is your body's natural stress-relief mechanism. Keep going until you feel your heart rate slow and your body relax."
        }
      }
    ]
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance defaultMode={ModeName.Sigh} className="min-h-screen" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">PANIC ATTACK RELIEF</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Breathing Technique for Panic Attack</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Panic attack happening right now? The physiological sigh is the fastest way to stop it, just 1-3 breaths.
              Two quick inhales through your nose, then one long exhale. Press Start and follow the animation.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        <p className="mb-6 text-xs text-muted-foreground">Last updated: January 27, 2026</p>

        {/* Emergency instructions box - highly visible */}
        <section className="mb-8 rounded-[32px] border-2 border-primary bg-primary/5 p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">If you&apos;re panicking right now:</h2>
          <ol className="mt-4 space-y-3 text-lg">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span><strong>Inhale through your nose</strong> (fill your lungs)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span><strong>Inhale again</strong> (short &ldquo;top-up&rdquo; breath to fill completely)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span><strong>Exhale slowly through your mouth</strong> (let it all out, as long as comfortable)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span><strong>Repeat 1-3 times</strong> until you feel calmer</span>
            </li>
          </ol>
          <div className="mt-6">
            <Link href="/breathe/physiological-sigh" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground">
              Open guided timer →
            </Link>
          </div>
        </section>

        <section className="space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Why the physiological sigh is the fastest panic relief</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                During a panic attack, your body is in full fight-or-flight mode. Your heart races, you can&apos;t catch your breath,
                and everything feels out of control. Most breathing techniques take minutes to work, but when you&apos;re panicking,
                you need relief <em>now</em>.
              </p>
              <p>
                The physiological sigh works in seconds because it targets the <strong className="text-card-foreground">two physical
                changes</strong> happening in your body during panic:
              </p>
              <ul className="space-y-2 pl-4">
                <li><strong className="text-card-foreground">Collapsed lung tissue:</strong> The double inhale reinflates your
                lung alveoli, restoring normal oxygen exchange and removing the &ldquo;can&apos;t breathe&rdquo; sensation.</li>
                <li><strong className="text-card-foreground">Overactive nervous system:</strong> The long exhale stimulates your
                vagus nerve, which acts like a brake pedal for your fight-or-flight response.</li>
              </ul>
              <p>
                Dr. Andrew Huberman at Stanford brought this technique to public attention after research showed it outperforms
                even meditation for rapid stress relief. It&apos;s your body&apos;s own built-in panic button. You just need to trigger it deliberately.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Step-by-step panic attack protocol</h2>
            <ol className="mt-4 space-y-4 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
                <div>
                  <strong className="text-card-foreground">Stop what you&apos;re doing</strong>
                  <p className="mt-1 text-sm">If possible, sit down. If not, that&apos;s okay. This works standing or even walking.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
                <div>
                  <strong className="text-card-foreground">First inhale through your nose</strong>
                  <p className="mt-1 text-sm">Fill your lungs about 80-90% full. Let your belly expand.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
                <div>
                  <strong className="text-card-foreground">Second inhale (the &ldquo;top-up&rdquo;)</strong>
                  <p className="mt-1 text-sm">Without exhaling, take another short sniff to completely fill your lungs.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">4</span>
                <div>
                  <strong className="text-card-foreground">Long, slow exhale through your mouth</strong>
                  <p className="mt-1 text-sm">Let all the air out slowly, aim for 6-10 seconds. This is where the calming happens.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">5</span>
                <div>
                  <strong className="text-card-foreground">Repeat 1-3 times</strong>
                  <p className="mt-1 text-sm">Most people feel relief after 1-2 sighs. Keep going if needed. You can&apos;t overdo it.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">What is the best breathing technique for a panic attack?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The physiological sigh is the fastest breathing technique for panic attacks. It works in just 1-3 breaths (about 30 seconds).
                  The pattern is: two quick inhales through your nose (the second is a short &ldquo;top-up&rdquo;), then one long,
                  slow exhale through your mouth. This immediately activates your vagus nerve and interrupts the panic response.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Why does the physiological sigh work for panic attacks?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  During a panic attack, your lung alveoli collapse and your nervous system is in overdrive. The double inhale
                  reinflates these collapsed air sacs, improving oxygen exchange. The long exhale stimulates the vagus nerve,
                  which activates your parasympathetic &ldquo;calm down&rdquo; system. This two-step mechanism interrupts panic faster
                  than any other breathing technique.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">How many physiological sighs should I do during a panic attack?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start with 1-3 sighs (about 30 seconds). Most people feel relief after just one or two. If you&apos;re still panicking,
                  do another 3-5 sighs. You can&apos;t overdo it. This is your body&apos;s natural stress-relief mechanism. Keep going
                  until you feel your heart rate slow and your body relax.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">Related guides</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/for/panic-attacks" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Panic Attack Guide</p>
              <p className="mt-1 text-sm text-muted-foreground">Complete guide to breathing for panic attacks</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/breathe/physiological-sigh" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Physiological Sigh</p>
              <p className="mt-1 text-sm text-muted-foreground">The complete guide to the double-inhale technique</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
            <Link href="/for/anxiety" className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">Anxiety Relief</p>
              <p className="mt-1 text-sm text-muted-foreground">Breathing techniques for everyday anxiety</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">Learn more →</span>
            </Link>
          </div>
        </section>

        <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            If panic attacks happen frequently or interfere with daily life, please consult a healthcare provider.
            This technique helps manage symptoms but is not a substitute for professional care.
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
