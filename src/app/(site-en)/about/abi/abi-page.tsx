import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import type { AbiPageContent } from "@/i18n/content/bespoke/trust-pages/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/about/abi";
const headshotUrl = `${siteUrl}/abi.jpg`;
const personJobTitle = "Founder, Deep Breathing Exercises";
const personDescription =
  "Founder of Deep Breathing Exercises. Photographer. Built the site as a free visualizer for the breathing techniques he uses daily.";
const personKnowsAbout = [
  "Breathing exercises",
  "Breathwork",
  "Pranayama",
  "Box breathing",
  "4-7-8 breathing",
  "Coherent breathing",
  "Physiological sigh",
  "Wim Hof Method",
  "Stress regulation",
] as const;
const personSameAs = [
  "https://abiassi.com",
  "https://www.linkedin.com/in/abiabiassi/",
  "https://x.com/abiassi_",
] as const;

export function createAbiMetadataFromContent(
  content: AbiPageContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = createOgImagePath(content.metadata.twitterTitle);

  return {
    metadataBase: new URL(siteUrl),
    title: content.metadata.title,
    description: content.metadata.description,
    alternates: {
      canonical: canonicalUrl,
    },
    authors: [{ name: "Abi Abiassi", url: canonicalUrl }],
    openGraph: {
      title: content.metadata.socialTitle,
      description: content.metadata.socialDescription,
      url: canonicalUrl,
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: content.metadata.twitterTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.twitterTitle,
      description: content.metadata.twitterDescription,
      creator: "@abiassi_",
      images: [ogImageUrl],
    },
  };
}

export function AbiPage({
  content,
  renderContext,
}: {
  content: AbiPageContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const canonicalPath = renderContext?.canonicalPath ?? sourceRoute;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const href = (path: string) =>
    renderContext
      ? resolveNativeInternalHref(
          path,
          renderContext.locale,
          renderContext.linkMode,
        )
      : path;
  const absoluteInternalHref = (path: string) =>
    new URL(href(path), siteUrl).toString();
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: content.footer.about,
        item: absoluteInternalHref("/about"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: content.hero.imageAlt,
        item: canonicalUrl,
      },
    ],
  };
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${canonicalUrl}#person`,
    name: "Abi Abiassi",
    url: canonicalUrl,
    image: headshotUrl,
    jobTitle: personJobTitle,
    description: personDescription,
    knowsAbout: personKnowsAbout,
    sameAs: personSameAs,
    worksFor: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: siteUrl,
    },
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema, personSchema]} />

      <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Image
          src="/abi.jpg"
          alt={content.hero.imageAlt}
          width={128}
          height={128}
          priority
          className="h-32 w-32 flex-shrink-0 rounded-full border border-border object-cover shadow-md"
        />
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-primary">
            {content.hero.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
            {content.hero.title}
          </h1>
          <p className="text-lg text-muted-foreground">{content.hero.intro}</p>
        </div>
      </header>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <p>{content.story.family}</p>
          <p className="mt-4">{content.story.visualizer}</p>
          <p className="mt-4">{content.story.hope}</p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.elsewhere.title}
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="https://abiassi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {content.elsewhere.personalSite}
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/in/abiabiassi/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {content.elsewhere.linkedin}
              </a>
            </li>
            <li>
              <a
                href="https://x.com/abiassi_"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {content.elsewhere.twitter}
              </a>
            </li>
          </ul>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.methodology.title}
          </h2>
          <p className="mt-3 text-sm">{content.methodology.intro}</p>
          <ol className="mt-6 space-y-5 text-sm">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                1
              </span>
              <div>
                <strong className="text-card-foreground">
                  {content.methodology.steps.coverage.title}
                </strong>{" "}
                {content.methodology.steps.coverage.body}
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                2
              </span>
              <div>
                <strong className="text-card-foreground">
                  {content.methodology.steps.lineage.title}
                </strong>{" "}
                {content.methodology.steps.lineage.beforeBook}{" "}
                <em>{content.methodology.steps.lineage.bookTitle}</em>{" "}
                {content.methodology.steps.lineage.afterBook}
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                3
              </span>
              <div>
                <strong className="text-card-foreground">
                  {content.methodology.steps.research.title}
                </strong>{" "}
                {content.methodology.steps.research.body}
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                4
              </span>
              <div>
                <strong className="text-card-foreground">
                  {content.methodology.steps.verification.title}
                </strong>{" "}
                {content.methodology.steps.verification.body}
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                5
              </span>
              <div>
                <strong className="text-card-foreground">
                  {content.methodology.steps.evidence.title}
                </strong>{" "}
                {content.methodology.steps.evidence.body}
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                6
              </span>
              <div>
                <strong className="text-card-foreground">
                  {content.methodology.steps.sources.title}
                </strong>{" "}
                {content.methodology.steps.sources.body}
              </div>
            </li>
          </ol>
          <p className="mt-6 text-sm">{content.methodology.disclaimer}</p>
          <p className="mt-3 text-sm">
            <Link
              href={href("/about/editorial-policy")}
              className="font-semibold text-primary hover:underline"
            >
              {content.methodology.policyLink}
            </Link>
          </p>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {content.contact.title}
          </h2>
          <p className="mt-3 text-sm">
            {content.contact.beforeEmail}{" "}
            <a
              href="mailto:hi@abiassi.com"
              className="text-primary hover:underline"
            >
              {content.contact.email}
            </a>
            {content.contact.afterEmail}
          </p>
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link
          href={href("/about")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.about}
        </Link>
        <Link
          href={href("/about/editorial-policy")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.editorialPolicy}
        </Link>
        <Link
          href={href("/breathe")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.techniques}
        </Link>
        <Link
          href={href("/for")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.guides}
        </Link>
        <Link
          href={href("/embed")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.embed}
        </Link>
        <Link
          href={href("/privacy")}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {content.footer.privacy}
        </Link>
      </footer>
    </main>
  );
}
