import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/privacy`;
const ogImageUrl = createOgImagePath("Privacy Policy");

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Deep Breathing Exercises, including optional accounts, practice sync, analytics, and deletion.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Privacy Policy",
    description:
      "Privacy policy for Deep Breathing Exercises.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Privacy Policy"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    description: "Privacy policy for Deep Breathing Exercises.",
    images: [ogImageUrl]
  }
};

export default function PrivacyPage() {
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
        name: "Privacy",
        item: canonicalUrl
      }
    ]
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbSchema} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Privacy</h1>
        <p className="text-lg text-muted-foreground">
          Breathing works without an account. If you choose to sign in, we use your data only to provide and improve the service.
        </p>
        <p className="text-sm text-muted-foreground">Last updated July 11, 2026.</p>
      </header>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">What we collect</h2>
          <p className="mt-3">
            Guests can practice without giving us a name or email. The app and website collect basic usage events such as
            session starts, ends, duration, breathing mode, and platform. The mobile app uses a random per-install analytics
            identifier. It does not use the advertising identifier and does not request tracking permission.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Optional accounts and sync</h2>
          <p className="mt-3">
            If you sign in with Apple or Google, we receive the account identifier, email address, and any name the provider
            shares. We store your breathing session history, totals, streak days, and settings so they can sync between the
            website and your phone. Practice recorded while signed out stays on your device until you choose to sign in.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">How we use and share data</h2>
          <p className="mt-3">
            We use this information for app functionality, account support, analytics, performance monitoring, and bug fixes.
            Service providers help us run authentication, email, analytics, hosting, and database storage. We do not sell
            personal information or use breathing data for advertising.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Your choices and deletion</h2>
          <p className="mt-3">
            You may use the core breathing experience as a guest. Signed-in users can open the account menu and choose
            &ldquo;Delete account.&rdquo; After confirmation, we permanently delete the account and synced practice data. Local
            data can be removed by deleting the app or clearing site data in your browser.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Device features</h2>
          <p className="mt-3">
            Audio and haptics are generated or played on your device. We do not use the microphone, HealthKit, precise
            location, contacts, photos, or the advertising identifier.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Third-party links</h2>
          <p className="mt-3">
            Some pages link to external research or resources. Those sites have their own privacy policies.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Contact</h2>
          <p className="mt-3">
            If you have questions about privacy, you can reach the creators via:
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <a
                href="https://abiassi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Abiassi
              </a>
            </p>
            <p>
              <a
                href="https://darkmatter.is/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Darkmatter AI Labs
              </a>
            </p>
          </div>
          <div className="mt-4">
            <Link href="/" className="text-sm font-semibold text-primary hover:underline">
              Back to the visualizer →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
