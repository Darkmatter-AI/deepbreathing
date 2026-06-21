import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/support`;
const ogImageUrl = createOgImagePath("Support");

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with Deep Breathing Exercises. Contact us with questions about the app, your account, or data deletion.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Support — Deep Breathing Exercises",
    description: "Get help with Deep Breathing Exercises.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Support"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Support — Deep Breathing Exercises",
    description: "Get help with Deep Breathing Exercises.",
    images: [ogImageUrl]
  }
};

export default function SupportPage() {
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
        name: "Support",
        item: canonicalUrl
      }
    ]
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbSchema} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Support</h1>
        <p className="text-lg text-muted-foreground">
          We are happy to help. Reach out with any questions about the app, your account, or your data.
        </p>
      </header>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Contact</h2>
          <p className="mt-3">
            Email us at{" "}
            <a
              href="mailto:support@deepbreathingexercises.com"
              className="font-semibold text-primary hover:underline"
            >
              support@deepbreathingexercises.com
            </a>{" "}
            and we will get back to you within one business day.
          </p>
          <p className="mt-3">
            You can also reach the team through{" "}
            <a
              href="https://darkmatter.is/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Darkmatter AI Labs
            </a>
            .
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Common questions</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-card-foreground">Do I need an account?</p>
              <p className="mt-1">
                No. The app works without an account. Sessions, stats, and settings are saved locally on your device.
                Create an account only if you want to sync your data across devices.
              </p>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">How do I delete my account?</p>
              <p className="mt-1">
                Email us at{" "}
                <a
                  href="mailto:support@deepbreathingexercises.com"
                  className="font-semibold text-primary hover:underline"
                >
                  support@deepbreathingexercises.com
                </a>{" "}
                with the subject line &ldquo;Delete my account&rdquo; and we will permanently remove your data within 30 days.
              </p>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Is my breathing data shared?</p>
              <p className="mt-1">
                No. Session data is stored on your device. If you create an account, session stats sync to our servers
                for cross-device continuity. We do not sell data. See our{" "}
                <Link href="/privacy" className="font-semibold text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                for full details.
              </p>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Why does the audio keep playing when I lock my screen?</p>
              <p className="mt-1">
                This is intentional. The app keeps audio cues playing so you can breathe eyes-closed with your phone in
                your pocket. You can mute audio in the app settings.
              </p>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Is this a medical app?</p>
              <p className="mt-1">
                No. Deep Breathing Exercises provides guided breathing sessions based on established techniques. It is
                not a medical device and does not diagnose, treat, or prevent any condition. Consult a healthcare
                provider before beginning a new breathing practice if you have a health condition.
              </p>
            </div>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Wim Hof breathing — safety note</h2>
          <p className="mt-3 text-sm">
            The Wim Hof breathing sequence involves intentional hyperventilation and breath retention. Do not practice
            breath retention in or near water. Stop if you feel dizzy or lightheaded. Consult a doctor before
            beginning if you have a cardiovascular condition, respiratory condition, or are pregnant.
          </p>
        </div>

        <div className="mt-4">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            Back to the visualizer →
          </Link>
        </div>
      </section>
    </main>
  );
}
