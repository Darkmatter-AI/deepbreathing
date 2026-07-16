import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import sourceContent from "@/i18n/content/bespoke/rw03-app-pages/source/breathing-app.json";
import type {
  BreathingAppMessageId,
  BreathingAppContent,
} from "@/i18n/content/bespoke/rw03-app-pages/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/breathing-app";
const englishContent = sourceContent as BreathingAppContent;

export function createBreathingAppMetadataFromContent(
  content: BreathingAppContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  const ogImageUrl = createOgImagePath(content["metadata.imageAlt"]);
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
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: content["metadata.imageAlt"],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content["metadata.twitterTitle"],
      description: content["metadata.twitterDescription"],
      images: [ogImageUrl],
    },
  };
}

export function BreathingAppPage({
  content = englishContent,
  renderContext,
}: {
  content?: BreathingAppContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const copy = (messageId: BreathingAppMessageId) => content[messageId];
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
  const wordGap = renderContext?.locale === "ja-JP" ? "" : " ";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy("breadcrumb.home"),
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: copy("breadcrumb.current"),
        item: canonicalUrl,
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={[breadcrumbSchema]} />

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">
          {copy("hero.eyebrow")}
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          {copy("hero.title")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {copy("hero.intro")}
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {copy("starter.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy("starter.body")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={href("/")}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {copy("starter.primaryAction")}
            </Link>
            <Link
              href={href("/breathe")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
            >
              {copy("starter.secondaryAction")}
            </Link>
          </div>
        </div>

        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {copy("included.title")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{copy("included.items.0")}</li>
            <li>{copy("included.items.1")}</li>
            <li>{copy("included.items.2")}</li>
            <li>
              <Link
                href={href("/breathe/physiological-sigh")}
                className="text-primary hover:underline"
              >
                {copy("included.items.3.linkLabel")}
              </Link>
              {wordGap}
              {copy("included.items.3.suffix")}
            </li>
          </ul>
          <div className="mt-5">
            <Link
              href={href("/for")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {copy("included.action")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">
            {copy("features.items.0.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy("features.items.0.body")}
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">
            {copy("features.items.1.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy("features.items.1.body")}
          </p>
        </div>
        <div className="glow-card rounded-[32px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">
            {copy("features.items.2.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy("features.items.2.body")}
          </p>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {copy("popularTimers.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy("popularTimers.intro")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={href("/box-breathing-app")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {copy("popularTimers.links.0.label")}
          </Link>
          <Link
            href={href("/4-7-8-breathing-timer")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {copy("popularTimers.links.1.label")}
          </Link>
          <Link
            href={href("/coherent-breathing-app")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {copy("popularTimers.links.2.label")}
          </Link>
          <Link
            href={href("/2-minute-breathing-exercise")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {copy("popularTimers.links.3.label")}
          </Link>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {copy("goals.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy("goals.intro")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={href("/2-minute-breathing-exercise")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {copy("goals.links.0.label")}
          </Link>
          <Link
            href={href("/for/running")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {copy("goals.links.1.label")}
          </Link>
          <Link
            href={href("/breathe/tummo")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-card-foreground"
          >
            {copy("goals.links.2.label")}
          </Link>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {copy("visualizer.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy("visualizer.body")}
        </p>
        <div className="mt-4">
          <Link
            href={href("/breathing-visualizer")}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {copy("visualizer.action")}
          </Link>
        </div>
      </section>

      <section className="mt-12 glow-card rounded-[32px] border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {copy("install.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy("install.body")}
        </p>
        <div className="mt-4">
          <Link
            href={href("/privacy")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {copy("install.action")}
          </Link>
        </div>
      </section>
    </main>
  );
}
