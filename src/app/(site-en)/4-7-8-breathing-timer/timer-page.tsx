import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { AppStorePromotion } from "@/components/app-store-promotion";
import { ModeName } from "@/components/resonance/types";
import { JsonLd } from "@/components/seo/json-ld";
import sourceContent from "@/i18n/content/bespoke/timer-4-7-8/source.json";
import type {
  TimerMessageId,
  TimerPageContent,
} from "@/i18n/content/bespoke/timer-4-7-8/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/4-7-8-breathing-timer";
const englishContent = sourceContent as TimerPageContent;

export function createTimerMetadataFromContent(
  content: TimerPageContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = new URL(
    createOgImagePath(content["metadata.socialTitle"]),
    siteUrl,
  ).toString();

  return {
    metadataBase: new URL(siteUrl),
    title: content["metadata.title"],
    description: content["metadata.description"],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: content["metadata.socialTitle"],
      description: content["metadata.socialDescription"],
      url: canonicalUrl,
      type: "website",
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: content["metadata.imageAlt"],
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: content["metadata.socialTitle"],
      description: content["metadata.twitterDescription"],
      images: [ogImageUrl],
    },
  };
}

// Lazy-load Resonance
const Resonance = dynamic(
  () => import("@/components/resonance/Resonance"),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden="true" className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    ),
  },
);

export function TimerPage({
  content = englishContent,
  renderContext,
}: {
  content?: TimerPageContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const copy = (messageId: TimerMessageId) => content[messageId];
  const canonicalPath = renderContext?.canonicalPath ?? sourceRoute;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const href = (path: string) => renderContext
    ? resolveNativeInternalHref(path, renderContext.locale, renderContext.linkMode)
    : path;
  const wordGap = renderContext?.locale === "ja-JP" ? "" : " ";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy("breadcrumb.home"),
        item: siteUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: copy("breadcrumb.current"),
        item: canonicalUrl
      }
    ]
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: copy("article.headline"),
    description: copy("article.description"),
    author: {
      "@type": "Person",
      name: "Abi Abiassi",
      url: new URL(href("/about/abi"), siteUrl).toString()
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
    name: copy("howTo.name"),
    description: copy("howTo.description"),
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        name: copy("howTo.steps.0.name"),
        text: copy("howTo.steps.0.text"),
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: copy("howTo.steps.1.name"),
        text: copy("howTo.steps.1.text"),
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: copy("howTo.steps.2.name"),
        text: copy("howTo.steps.2.text"),
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: copy("howTo.steps.3.name"),
        text: copy("howTo.steps.3.text"),
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: copy("howTo.steps.4.name"),
        text: copy("howTo.steps.4.text"),
        url: `${canonicalUrl}#how-to`
      },
      {
        "@type": "HowToStep",
        name: copy("howTo.steps.5.name"),
        text: copy("howTo.steps.5.text"),
        url: `${canonicalUrl}#how-to`
      }
    ]
  };

  const faqItems = Array.from({ length: 10 }, (_, index) => ({
    question: copy(`faq.items.${index}.question` as TimerMessageId),
    answer: copy(`faq.items.${index}.answer` as TimerMessageId),
  }));
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="bg-transparent">
      <JsonLd data={[breadcrumbSchema, articleSchema, howToSchema, faqSchema]} />

      <section className="relative isolate min-h-screen w-full text-foreground">
        <Resonance
          defaultMode={ModeName.Relax}
          className="min-h-screen"
          locale={renderContext?.locale}
          localizedRoutePaths={renderContext?.localizedRoutePaths}
          modeDisplayName={copy("breadcrumb.current")}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex w-full flex-col px-4 pb-20 sm:inset-y-0 sm:left-0 sm:max-w-xl sm:justify-center sm:px-6 sm:py-20 lg:px-8">
          <div className="pointer-events-auto space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">{copy("hero.eyebrow")}</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">{copy("hero.title")}</h1>
            <p className="max-w-xl text-lg text-muted-foreground">{copy("hero.intro")}</p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-t-[48px] bg-background/95 px-4 pb-16 pt-16 backdrop-blur-sm sm:px-6 lg:px-8">
        {!renderContext ? (
          <AppStorePromotion className="mb-12" variant="strip" />
        ) : null}

        <p className="mb-6 text-xs text-muted-foreground">{copy("updated")}</p>
        <div className="mb-8 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">{copy("quickAnswer.title")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{copy("quickAnswer.body")}</p>
        </div>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("start.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy("start.body")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={href("/breathe/4-7-8")} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">{copy("start.openTimer")}</Link>
              <Link href={href("/breathing-app")} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">{copy("start.fullApp")}</Link>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("settings.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy("settings.intro")}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-card-foreground">{copy("settings.sleep.label")}</strong>{wordGap}{copy("settings.sleep.body")}</li>
              <li><strong className="text-card-foreground">{copy("settings.anxiety.label")}</strong>{wordGap}{copy("settings.anxiety.body")}</li>
              <li><strong className="text-card-foreground">{copy("settings.beginners.label")}</strong>{wordGap}{copy("settings.beginners.body")}</li>
              <li><strong className="text-card-foreground">{copy("settings.lightHeaded.label")}</strong>{wordGap}{copy("settings.lightHeaded.body")}</li>
            </ul>
            <div className="mt-5">
              <Link href={href("/breathe/4-7-8#how-to")} className="text-sm font-semibold text-primary hover:underline">{copy("settings.instructions")}</Link>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("article.whatIs.title")}</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("article.whatIs.paragraph1")}</p>
              <p>{copy("article.whatIs.paragraph2")}</p>
              <p>{copy("article.whatIs.paragraph3.beforeSleep")}{wordGap}<Link href={href("/for/sleep")} className="text-primary hover:underline">{copy("article.whatIs.paragraph3.sleep")}</Link>{wordGap}{copy("article.whatIs.paragraph3.betweenLinks")}{wordGap}<Link href={href("/for/anxiety")} className="text-primary hover:underline">{copy("article.whatIs.paragraph3.anxiety")}</Link>{copy("article.whatIs.paragraph3.afterAnxiety")}</p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("article.comparison.title")}</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("article.comparison.intro")}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-semibold text-card-foreground">{copy("article.comparison.headers.technique")}</th>
                      <th className="py-3 text-left font-semibold text-card-foreground">{copy("article.comparison.headers.bestFor")}</th>
                      <th className="py-3 text-left font-semibold text-card-foreground">{copy("article.comparison.headers.pattern")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-3 font-medium text-card-foreground">{copy("article.comparison.rows.478.name")}</td>
                      <td className="py-3">{copy("article.comparison.rows.478.bestFor")}</td>
                      <td className="py-3">{copy("article.comparison.rows.478.pattern")}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 font-medium text-card-foreground">{copy("article.comparison.rows.box.name")}</td>
                      <td className="py-3">{copy("article.comparison.rows.box.bestFor")}</td>
                      <td className="py-3">{copy("article.comparison.rows.box.pattern")}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 font-medium text-card-foreground">{copy("article.comparison.rows.coherent.name")}</td>
                      <td className="py-3">{copy("article.comparison.rows.coherent.bestFor")}</td>
                      <td className="py-3">{copy("article.comparison.rows.coherent.pattern")}</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-card-foreground">{copy("article.comparison.rows.sigh.name")}</td>
                      <td className="py-3">{copy("article.comparison.rows.sigh.bestFor")}</td>
                      <td className="py-3">{copy("article.comparison.rows.sigh.pattern")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                <strong className="text-card-foreground">{copy("article.comparison.bottomLine.label")}</strong>{wordGap}{copy("article.comparison.bottomLine.beforeLink")}{wordGap}<Link href={href("/breathe/physiological-sigh")} className="text-primary hover:underline">{copy("article.comparison.bottomLine.link")}</Link>.
              </p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("article.benefits.title")}</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("article.benefits.intro")}</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.benefits.sleep.label")}</strong>{wordGap}{copy("article.benefits.sleep.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.benefits.anxiety.label")}</strong>{wordGap}{copy("article.benefits.anxiety.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.benefits.bloodPressure.label")}</strong>{wordGap}{copy("article.benefits.bloodPressure.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.benefits.anger.label")}</strong>{wordGap}{copy("article.benefits.anger.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.benefits.energy.label")}</strong>{wordGap}{copy("article.benefits.energy.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.benefits.cravings.label")}</strong>{wordGap}{copy("article.benefits.cravings.body")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("article.mechanism.title")}</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("article.mechanism.paragraph1")}</p>
              <p>{copy("article.mechanism.paragraph2")}</p>
              <p>{copy("article.mechanism.paragraph3")}</p>
              <p>{copy("article.mechanism.paragraph4")}</p>
              <p>{copy("article.mechanism.paragraph5")}</p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("article.whenToUse.title")}</h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>{copy("article.whenToUse.intro")}</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.whenToUse.bed.label")}</strong>{wordGap}{copy("article.whenToUse.bed.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.whenToUse.panic.label")}</strong>{wordGap}{copy("article.whenToUse.panic.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.whenToUse.stress.label")}</strong>{wordGap}{copy("article.whenToUse.stress.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.whenToUse.events.label")}</strong>{wordGap}{copy("article.whenToUse.events.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.whenToUse.night.label")}</strong>{wordGap}{copy("article.whenToUse.night.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.whenToUse.anger.label")}</strong>{wordGap}{copy("article.whenToUse.anger.body")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-card-foreground">{copy("article.whenToUse.cravings.label")}</strong>{wordGap}{copy("article.whenToUse.cravings.body")}</span>
                </li>
              </ul>
              <p className="mt-4">
                <strong className="text-card-foreground">{copy("article.whenToUse.note.label")}</strong>{wordGap}{copy("article.whenToUse.note.beforeCoherent")}{wordGap}<Link href={href("/breathe/coherent")} className="text-primary hover:underline">{copy("article.whenToUse.note.coherent")}</Link>{wordGap}{copy("article.whenToUse.note.betweenLinks")}{wordGap}<Link href={href("/breathe/physiological-sigh")} className="text-primary hover:underline">{copy("article.whenToUse.note.sigh")}</Link>{wordGap}{copy("article.whenToUse.note.afterSigh")}</p>
            </div>
          </div>

          <div className="glow-card rounded-[32px] border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-card-foreground">{copy("faq.title")}</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.0.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.0.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.1.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.1.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.2.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.2.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.3.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.3.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.4.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.4.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.5.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.5.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.6.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.6.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.7.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.7.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.8.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.8.answer")}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{copy("faq.items.9.question")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("faq.items.9.answer")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">{copy("features.windDown.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy("features.windDown.body")}</p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">{copy("features.adjustable.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy("features.adjustable.body")}</p>
          </div>
          <div className="glow-card rounded-[32px] border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-card-foreground">{copy("features.noDownload.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy("features.noDownload.body")}</p>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">{copy("useCases.title")}</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href={href("/for/sleep")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("useCases.sleep.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("useCases.sleep.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("useCases.learnMore")}</span>
            </Link>
            <Link href={href("/for/anxiety")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("useCases.anxiety.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("useCases.anxiety.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("useCases.learnMore")}</span>
            </Link>
            <Link href={href("/for/high-blood-pressure")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("useCases.bloodPressure.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("useCases.bloodPressure.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("useCases.learnMore")}</span>
            </Link>
            <Link href={href("/for/running")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("useCases.running.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("useCases.running.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("useCases.learnMore")}</span>
            </Link>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary">{copy("techniques.title")}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href={href("/breathe/belly")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("techniques.belly.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("techniques.belly.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("techniques.practice")}</span>
            </Link>
            <Link href={href("/breathe/pursed-lip")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("techniques.pursedLip.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("techniques.pursedLip.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("techniques.practice")}</span>
            </Link>
            <Link href={href("/breathe/ujjayi")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("techniques.ujjayi.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("techniques.ujjayi.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("techniques.practice")}</span>
            </Link>
            <Link href={href("/breathe/buteyko")} className="group glow-card rounded-[28px] border border-border bg-card p-5 transition hover:border-primary">
              <p className="text-lg font-semibold text-card-foreground">{copy("techniques.buteyko.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy("techniques.buteyko.body")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">{copy("techniques.practice")}</span>
            </Link>
          </div>
        </section>

        <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">{copy("moreApps.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy("moreApps.body")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={href("/box-breathing-app")} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">{copy("moreApps.box")}</Link>
            <Link href={href("/coherent-breathing-app")} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">{copy("moreApps.coherent")}</Link>
            <Link href={href("/2-minute-breathing-exercise")} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">{copy("moreApps.twoMinute")}</Link>
            <Link href={href("/breathe")} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground">{copy("moreApps.browse")}</Link>
          </div>
        </section>

        <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">{copy("footer.safety")}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href={href("/breathe")} className="underline underline-offset-2 transition-colors hover:text-foreground">{copy("footer.techniques")}</Link>
            <Link href={href("/for")} className="underline underline-offset-2 transition-colors hover:text-foreground">{copy("footer.guides")}</Link>
            <Link href={href("/breathing-app")} className="underline underline-offset-2 transition-colors hover:text-foreground">{copy("footer.app")}</Link>
            <Link href={href("/about")} className="underline underline-offset-2 transition-colors hover:text-foreground">{copy("footer.about")}</Link>
            <Link href={href("/about/abi")} className="underline underline-offset-2 transition-colors hover:text-foreground">{copy("footer.aboutAbi")}</Link>
            <Link href={href("/embed")} className="underline underline-offset-2 transition-colors hover:text-foreground">{copy("footer.embed")}</Link>
            <Link href={href("/privacy")} className="underline underline-offset-2 transition-colors hover:text-foreground">{copy("footer.privacy")}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
