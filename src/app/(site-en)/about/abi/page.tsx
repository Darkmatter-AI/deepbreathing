import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const canonicalUrl = `${siteUrl}/about/abi`;
const ogImageUrl = createOgImagePath("About Abi Abiassi");
const headshotUrl = `${siteUrl}/abi.jpg`;

export const metadata: Metadata = {
  title: "About Abi Abiassi, Founder of Deep Breathing Exercises",
  description:
    "Abi Abiassi built Deep Breathing Exercises as a free visualizer for breathing techniques he uses daily. Photographer, founder, breathwork practitioner.",
  alternates: {
    canonical: canonicalUrl
  },
  authors: [{ name: "Abi Abiassi", url: canonicalUrl }],
  openGraph: {
    title: "About Abi Abiassi, Founder of Deep Breathing Exercises",
    description:
      "Built this site as a free visualizer for the breathing techniques I use daily. Photographer, founder.",
    url: canonicalUrl,
    type: "profile",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "About Abi Abiassi"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "About Abi Abiassi",
    description:
      "Built this site as a free visualizer for the breathing techniques I use daily.",
    creator: "@abiassi_",
    images: [ogImageUrl]
  }
};

export default function AbiAboutPage() {
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
        name: "Abi Abiassi",
        item: canonicalUrl
      }
    ]
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${canonicalUrl}#person`,
    name: "Abi Abiassi",
    url: canonicalUrl,
    image: headshotUrl,
    jobTitle: "Founder, Deep Breathing Exercises",
    description:
      "Founder of Deep Breathing Exercises. Photographer. Built the site as a free visualizer for the breathing techniques he uses daily.",
    knowsAbout: [
      "Breathing exercises",
      "Breathwork",
      "Pranayama",
      "Box breathing",
      "4-7-8 breathing",
      "Coherent breathing",
      "Physiological sigh",
      "Wim Hof Method",
      "Stress regulation"
    ],
    sameAs: [
      "https://abiassi.com",
      "https://www.linkedin.com/in/abiabiassi/",
      "https://x.com/abiassi_"
    ],
    worksFor: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: siteUrl
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, personSchema]} />

      <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Image
          src="/abi.jpg"
          alt="Abi Abiassi"
          width={128}
          height={128}
          priority
          className="h-32 w-32 flex-shrink-0 rounded-full border border-border object-cover shadow-md"
        />
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-primary">DEEP BREATHING EXERCISES</p>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">About Abi</h1>
          <p className="text-lg text-muted-foreground">
            Founder. Photographer. Built this site for the breathing techniques I use every day.
          </p>
        </div>
      </header>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <p>
            I grew up in a family of meditation practitioners. It wasn&apos;t until later in life that I
            started being more intentional about breathwork. Once I did, I realized how useful these
            practices were on a day-to-day basis. They&apos;ve been invaluable in furthering my
            photography work too.
          </p>
          <p className="mt-4">
            I started researching and structuring them for myself, and figured a visualizer to guide
            you through any of them would be more useful than wading through endless YouTube videos
            and not-so-clear websites.
          </p>
          <p className="mt-4">
            Hope this site is as useful to you as it has been to me.
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Find me elsewhere</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="https://abiassi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                abiassi.com (my personal site, separate from this project) →
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/in/abiabiassi/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                LinkedIn →
              </a>
            </li>
            <li>
              <a
                href="https://x.com/abiassi_"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                X / Twitter (@abiassi_) →
              </a>
            </li>
          </ul>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Methodology</h2>
          <p className="mt-3 text-sm">
            Every technique on the site goes through the same research pass, in this order.
          </p>
          <ol className="mt-6 space-y-5 text-sm">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
              <div>
                <strong className="text-card-foreground">Pick what to cover.</strong> The
                techniques people actually search for and practice. Box, 4-7-8, coherent breathing,
                the physiological sigh, Wim Hof, the pranayama variants, the COPD-rooted ones like
                pursed-lip and Buteyko. Plus the use cases they show up against: anxiety, sleep,
                focus, blood pressure.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
              <div>
                <strong className="text-card-foreground">Source the lineage.</strong> Who actually
                came up with this. Mark Divine for box. Andrew Weil for 4-7-8. Wim Hof for WHM.
                Konstantin Buteyko for his method. For the older yoga practices, the earliest text
                we can point to (the 15th-century <em>Hatha Yoga Pradipika</em> for Nadi Shodhana
                and Kapalabhati). Where there&apos;s no single originator (pursed-lip, belly), say so.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
              <div>
                <strong className="text-card-foreground">Find the research.</strong> PubMed, DOI
                registries, Cochrane. Systematic reviews and RCTs beat single studies. Mechanism
                work, especially mouse studies, gets called out as such so it doesn&apos;t get
                mistaken for clinical evidence.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">4</span>
              <div>
                <strong className="text-card-foreground">Verify everything.</strong> Every citation
                URL gets fetched and confirmed before it ships. Where a study is paywalled, the
                link goes to the free PubMed Central version.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">5</span>
              <div>
                <strong className="text-card-foreground">Match language to evidence.</strong> Strong
                evidence gets stated directly. Smaller studies get a &ldquo;research suggests.&rdquo;
                Weak, contested, or null findings get said out loud. The Wim Hof Method works no
                better than slow breathing for mood. Ujjayi&apos;s throat constriction doesn&apos;t
                actually outperform plain slow breathing on baroreflex.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">6</span>
              <div>
                <strong className="text-card-foreground">Place sources where you can use them.</strong>
                {" "}One to three peer-reviewed links per page, hyperlinked on the specific claim. No
                numbered footnotes. No end-of-article reference lists. Click a phrase, land on the
                study.
              </div>
            </li>
          </ol>
          <p className="mt-6 text-sm">
            I&apos;m not a clinician. If you have a medical condition, please talk to your doctor
            before adopting a new breathing practice.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/about/editorial-policy" className="font-semibold text-primary hover:underline">
              Read the full editorial policy →
            </Link>
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">Get in touch</h2>
          <p className="mt-3 text-sm">
            Found an error? Have a feature request? Send me a note at{" "}
            <a href="mailto:hi@abiassi.com" className="text-primary hover:underline">
              hi@abiassi.com
            </a>
            . It goes straight to me.
          </p>
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/about" className="underline underline-offset-2 transition-colors hover:text-foreground">
          About
        </Link>
        <Link href="/about/editorial-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
          Editorial policy
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
