import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { JsonLd } from "@/components/seo/json-ld";
import type {
  HolidayBreathingContent,
  HolidayRichTextToken,
} from "@/i18n/content/bespoke/holiday-breathing/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";
import { cn } from "@/lib/utils";

import { HolidayShareButton } from "./share-button";
import { HolidaySnowBackground } from "./snow-background";

const baseUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/holiday-breathing-exercises";
const faqLinkHref = "/breathe/physiological-sigh";

const holidayGuideConfig = [
  { href: "/for/holiday-stress", color: "#38bdf8" },
  { href: "/for/travel-anxiety", color: "#34d399" },
] as const;

const quickStartConfig = [
  { href: "/breathe/physiological-sigh?duration=60", color: "#38bdf8" },
  { href: "/breathe/box?duration=60", color: "#60a5fa" },
  { href: "/breathe/coherent?duration=120", color: "#94a3b8" },
  { href: "/breathe/4-7-8?duration=180", color: "#a78bfa" },
] as const;

const momentHrefs = [
  "/for/holiday-stress",
  "/breathe/physiological-sigh?duration=60",
  "/breathe/4-7-8?duration=180",
  "/for/travel-anxiety",
  "/breathe/physiological-sigh?duration=60",
] as const;

const dayPlanHrefs = [
  [
    "/breathe/coherent?duration=300",
    "/for/holiday-stress",
    "/breathe/physiological-sigh?duration=60",
    "/breathe/4-7-8?duration=180",
  ],
  [
    "/for/travel-anxiety",
    "/breathe/coherent?duration=120",
    "/breathe/physiological-sigh?duration=60",
    "/breathe/box?duration=60",
  ],
  [
    "/breathe/coherent?duration=300",
    "/for/holiday-stress",
    "/breathe/coherent?duration=120",
    "/breathe/4-7-8?duration=180",
  ],
] as const;

const relatedGuideHrefs = [
  "/for/anxiety",
  "/for/panic-attacks",
  "/for/sleep",
  "/breathe",
] as const;

const infoCardClass =
  "rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm";

export function createHolidayMetadataFromContent(
  content: HolidayBreathingContent,
  canonicalPath: string,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, baseUrl).toString();
  const ogImageUrl = createOgImagePath(content.metadata.imageTitle, {
    subtitle: content.metadata.imageSubtitle,
    color: "#38bdf8",
  });

  return {
    metadataBase: new URL(baseUrl),
    title: content.metadata.title,
    description: content.metadata.description,
    openGraph: {
      title: content.metadata.socialTitle,
      description: content.metadata.socialDescription,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: content.metadata.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.twitterTitle,
      description: content.metadata.twitterDescription,
      images: [ogImageUrl],
    },
    alternates: { canonical: canonicalUrl },
  };
}

function richTextToPlainText(parts: readonly HolidayRichTextToken[]) {
  return parts
    .map((part) => ("linkText" in part ? part.linkText : part.text))
    .join("");
}

function RichFaqAnswer({
  parts,
  linkHref,
}: {
  parts: readonly HolidayRichTextToken[];
  linkHref: string;
}) {
  return parts.map((part, index) =>
    "linkText" in part ? (
      <Link
        href={linkHref}
        className="text-sky-400 hover:underline"
        key={index}
      >
        {part.linkText}
      </Link>
    ) : (
      <Fragment key={index}>{part.text}</Fragment>
    ),
  );
}

export function HolidayBreathingPage({
  content,
  renderContext,
}: {
  content: HolidayBreathingContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const canonicalPath = renderContext?.canonicalPath ?? sourceRoute;
  const canonicalUrl = new URL(canonicalPath, baseUrl).toString();
  const href = (path: string) =>
    renderContext
      ? resolveNativeInternalHref(
          path,
          renderContext.locale,
          renderContext.linkMode,
        )
      : path;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.schema.articleHeadline,
    description: content.schema.articleDescription,
    author: {
      "@type": "Person",
      name: "Abi Abiassi",
      url: new URL(href("/about/abi"), baseUrl).toString(),
    },
    publisher: {
      "@type": "Organization",
      name: "Deep Breathing Exercises",
      url: baseUrl,
    },
    datePublished: "2025-12-19",
    dateModified: "2025-12-19",
    mainEntityOfPage: canonicalUrl,
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: richTextToPlainText(faq.answer.parts),
      },
    })),
  };
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: content.schema.howToName,
    description: content.schema.howToDescription,
    totalTime: "PT1M",
    step: content.schema.howToSteps.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.text,
    })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <JsonLd data={[articleSchema, faqSchema, howToSchema]} />

      <section className="relative min-h-[60vh] w-full overflow-hidden">
        <HolidaySnowBackground />

        <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-sky-400">
              {content.hero.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
              {content.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200 drop-shadow">
              {content.hero.intro}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={href("/for/holiday-stress")}
                className="inline-flex items-center rounded-full bg-sky-500 px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-sky-400 hover:scale-105 shadow-lg"
              >
                {content.hero.action}
              </Link>
              <HolidayShareButton
                url={canonicalUrl}
                title={content.hero.title}
                text={content.share.text}
                buttonText={content.share.buttonText}
                copiedText={content.share.copiedText}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.holidayGuides.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {content.holidayGuides.items.map((item, index) => {
              const config = holidayGuideConfig[index];
              return (
                <Link
                  key={item.title}
                  href={href(config.href)}
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
                    {content.holidayGuides.action}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.quickStart.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.quickStart.items.map((item, index) => {
              const config = quickStartConfig[index];
              return (
                <Link
                  key={item.title}
                  href={href(config.href)}
                  rel={
                    config.href.includes("duration=") ? "nofollow" : undefined
                  }
                  className="group rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
                >
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: config.color }}
                  >
                    {item.timing}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.description}
                  </p>
                  <span
                    className="mt-4 inline-flex text-sm font-medium transition-transform group-hover:translate-x-1"
                    style={{ color: config.color }}
                  >
                    {content.quickStart.action}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.moments.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.moments.items.map((moment, index) => {
              const momentHref = momentHrefs[index];
              return (
                <Link
                  key={moment.title}
                  href={href(momentHref)}
                  rel={
                    momentHref.includes("duration=") ? "nofollow" : undefined
                  }
                  className="group rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {moment.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {moment.description}
                  </p>
                  <p className="mt-3 text-xs text-sky-400">
                    {moment.technique}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.dayPlans.title}
          </h2>
          <div className="space-y-4">
            {content.dayPlans.items.map((plan, planIndex) => (
              <details
                key={plan.title}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm"
              >
                <summary className="cursor-pointer px-6 py-4 text-lg font-semibold text-white hover:text-sky-400">
                  {plan.title}
                </summary>
                <div className="border-t border-slate-700/50 px-6 py-4">
                  <div className="space-y-3">
                    {plan.steps.map((step, stepIndex) => {
                      const stepHref = dayPlanHrefs[planIndex][stepIndex];
                      return (
                        <Link
                          key={stepIndex}
                          href={href(stepHref)}
                          rel={
                            stepHref.includes("duration=")
                              ? "nofollow"
                              : undefined
                          }
                          className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-slate-700/30"
                        >
                          <span className="whitespace-nowrap text-sm font-medium text-sky-400">
                            {step.timing}
                          </span>
                          <span className="text-sm text-slate-300">
                            {step.action}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.whyItWorks.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.whyItWorks.items.map((item) => (
              <div key={item.title} className={cn(infoCardClass)}>
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.comfortTips.title}
          </h2>
          <div className={cn(infoCardClass)}>
            <ul className="space-y-2">
              {content.comfortTips.items.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.faq.title}
          </h2>
          <div className="space-y-3">
            {content.faq.items.map((faq) => (
              <details
                key={faq.question}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm"
              >
                <summary className="cursor-pointer px-6 py-4 text-base font-medium text-white hover:text-sky-400">
                  {faq.question}
                </summary>
                <p className="border-t border-slate-700/50 px-6 py-4 text-sm text-slate-300">
                  <RichFaqAnswer
                    parts={faq.answer.parts}
                    linkHref={href(faqLinkHref)}
                  />
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white">
            {content.relatedGuides.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.relatedGuides.items.map((guide, index) => (
              <Link
                href={href(relatedGuideHrefs[index])}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:bg-slate-800"
                key={guide.title}
              >
                <h3 className="font-semibold text-white">{guide.title}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-slate-500">{content.footer}</p>
      </footer>
    </main>
  );
}
