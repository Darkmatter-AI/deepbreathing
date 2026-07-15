import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/about/editorial-policy`;
const ogImageUrl = createOgImagePath("Our Editorial Policy");

export const metadata: Metadata = {
  title: "Editorial Policy | Deep Breathing Exercises",
  description:
    "How we research, write, and update our breathing-technique guides. Lineage attribution, peer-reviewed citations, honest framing, and what we don't claim.",
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: "Our Editorial Policy",
    description:
      "How we research, write, and update our breathing-technique guides. Lineage attribution, peer-reviewed citations, and honest framing.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Our Editorial Policy"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Editorial Policy",
    description:
      "How we research, write, and update our breathing-technique guides.",
    images: [ogImageUrl]
  }
};

export default function EditorialPolicyPage() {
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
        name: "About",
        item: `${siteUrl}/about`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Editorial Policy",
        item: canonicalUrl
      }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Our Editorial Policy",
    description:
      "How we research, write, and update our breathing-technique guides. Lineage attribution, peer-reviewed citations, honest framing.",
    author: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: siteUrl
    },
    publisher: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: siteUrl
    },
    datePublished: "2026-01-27",
    dateModified: "2026-05-06",
    mainEntityOfPage: canonicalUrl
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, articleSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">ABOUT</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Editorial Policy</h1>
        <p className="text-lg text-muted-foreground">
          How we research, write, and update our breathing-technique guides.
        </p>
        <p className="text-xs text-muted-foreground">Last updated: May 6, 2026</p>
      </header>

      <section className="mt-10 space-y-8 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">What this site is</h2>
          <p className="mt-4">
            Deep Breathing Exercises is a free interactive visualizer for breathing techniques,
            built by{" "}
            <Link href="/about/abi" className="text-primary hover:underline">
              Abi Abiassi
            </Link>
            {" "}as a way to practice the techniques he uses daily. It is a wellness and breathwork
            product, not a medical site. We&apos;re not clinicians. Nothing here is a diagnosis or
            a treatment plan.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">How we attribute techniques</h2>
          <div className="mt-4 space-y-3">
            <p>
              Each technique page names the originator, popularizer, or tradition the technique comes
              from. Mark Divine for box breathing. Dr. Andrew Weil for 4-7-8. Wim Hof for the Wim
              Hof Method. The Hatha Yoga tradition for Nadi Shodhana and Kapalabhati. When the
              technique has no single originator (pursed-lip, belly breathing), we say so.
            </p>
            <p>
              Where popular framing oversimplifies (e.g., box breathing is older than its Navy SEAL
              association), we surface the longer lineage rather than repeat the legend.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">How we cite research</h2>
          <div className="mt-4 space-y-4">
            <p>
              Where a claim is strong, we link to it. We use a light-touch hyperlink style: one to
              three peer-reviewed citations per page, anchored on the specific phrase the research
              supports. We don&apos;t use dense numbered footnotes or end-of-article reference lists.
            </p>
            <p>Sources we prioritize, in order:</p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Systematic reviews and meta-analyses</strong>{" "}
                  from journals indexed in PubMed (Cochrane, Frontiers, JAMA, Nature, Science).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Randomized controlled trials</strong>{" "}
                  with adequate sample size and active controls.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Mechanism studies</strong> that explain
                  why a technique works physiologically, clearly labeled when from animal models.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-card-foreground">Practitioner sources</strong> (the
                  originator&apos;s own writing) for attribution, not as evidence of efficacy.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">How we frame claims</h2>
          <div className="mt-4 space-y-4">
            <p>
              We try to match the strength of the language to the strength of the evidence. If a
              meta-analysis supports a claim, we say so. If only a single small RCT supports it,
              we hedge with &ldquo;research suggests&rdquo; or &ldquo;may help.&rdquo;
            </p>
            <p>
              Some popular claims about breathwork don&apos;t hold up under scrutiny. Where the
              evidence is weak or contested, we say that too, even when the technique itself is
              widely promoted.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">What we don&apos;t do</h2>
          <div className="mt-4 space-y-4">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>We don&apos;t provide medical diagnoses or treatment recommendations.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>We don&apos;t claim breathing techniques cure diseases or replace medical treatment.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>We don&apos;t fake credentials or display a &ldquo;medically reviewed by&rdquo; line we can&apos;t back up.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted-foreground">✗</span>
                <span>We don&apos;t overstate research findings or present preliminary studies as established fact.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Updates and corrections</h2>
          <div className="mt-4 space-y-4">
            <p>
              Every technique page shows a &ldquo;Last updated&rdquo; date. We re-review pages when
              new research lands or when readers flag a problem. If you spot an error, please send
              a note to{" "}
              <a href="mailto:hi@abiassi.com" className="text-primary hover:underline">
                hi@abiassi.com
              </a>
              . Corrections go straight to Abi.
            </p>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Who built this</h2>
          <div className="mt-4 space-y-4">
            <p>
              Deep Breathing Exercises is created by{" "}
              <Link href="/about/abi" className="text-primary hover:underline">
                Abi Abiassi
              </Link>
              {" "}with{" "}
              <a
                href="https://darkmatter.is/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Darkmatter AI Labs
              </a>
              .
            </p>
            <p className="text-sm">
              We&apos;re not medical professionals. This site is for educational purposes and should
              complement professional healthcare advice, not replace it.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/about" className="underline underline-offset-2 transition-colors hover:text-foreground">
          About
        </Link>
        <Link href="/about/abi" className="underline underline-offset-2 transition-colors hover:text-foreground">
          About Abi
        </Link>
        <Link href="/breathe" className="underline underline-offset-2 transition-colors hover:text-foreground">
          Techniques
        </Link>
        <Link href="/for" className="underline underline-offset-2 transition-colors hover:text-foreground">
          Guides
        </Link>
        <Link href="/embed" className="underline underline-offset-2 transition-colors hover:text-foreground">
          Embed
        </Link>
        <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-foreground">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
