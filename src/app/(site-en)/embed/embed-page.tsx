import type { Metadata } from "next";

import { BREATHING_PATTERNS } from "@/components/resonance/constants";
import { breathingPageMap } from "@/data/breathing-pages";
import { LOCALES, type LocaleCode } from "@/i18n";
import type {
  EmbedContent,
  EmbedGeneratorLocaleCode,
  EmbedGeneratorLocaleOption,
} from "@/i18n/content/bespoke/embed/types";
import {
  EMBED_GENERATOR_SLUGS,
  toEmbedGeneratorLocale,
} from "@/i18n/content/bespoke/embed/types";
import type { NativeRouteRenderContext } from "@/i18n/render-context";
import { resolveNativeInternalHref } from "@/i18n/route-manifest";
import { createOgImagePath } from "@/lib/seo/og-image";

import { EmbedGenerator } from "./embed-generator";

const siteUrl = "https://deepbreathingexercises.com";
const sourceRoute = "/embed";
const ogImage = createOgImagePath("Free Breathing Widget", {
  subtitle: "Add an interactive breathing exercise to any website",
});

const localeOptionConfig: readonly {
  code: EmbedGeneratorLocaleCode;
  prefix: string;
}[] = LOCALES.map((locale) => ({
  code: toEmbedGeneratorLocale(locale.code),
  prefix: locale.routePrefix ? `/${locale.routePrefix}` : "",
}));

const footerConfig = [
  { href: "/breathe", label: "techniques" },
  { href: "/for", label: "guides" },
  { href: "/breathing-app", label: "app" },
  { href: "/about", label: "about" },
] as const;

export function createEmbedMetadataFromContent(
  content: EmbedContent,
  canonicalPath = sourceRoute,
): Metadata {
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  return {
    metadataBase: new URL(siteUrl),
    title: content.metadata.title,
    description: content.metadata.description,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: content.metadata.socialTitle,
      description: content.metadata.socialDescription,
      images: [
        {
          url: ogImage,
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
      images: [ogImage],
    },
  };
}

export function EmbedPage({
  content,
  renderContext,
}: {
  content: EmbedContent;
  renderContext?: NativeRouteRenderContext;
}) {
  const pageLocale: LocaleCode = renderContext?.locale ?? "en-US";
  const initialLocale = toEmbedGeneratorLocale(pageLocale);
  const href = (path: string) =>
    renderContext
      ? resolveNativeInternalHref(
          path,
          renderContext.locale,
          renderContext.linkMode,
        )
      : path;

  const patterns = EMBED_GENERATOR_SLUGS.map((slug) => {
    const page = breathingPageMap[slug];
    if (!page) throw new Error(`Missing current embed pattern: ${slug}`);
    return {
      slug,
      title: content.generator.patterns[slug].title,
      description: content.generator.patterns[slug].description,
      color: BREATHING_PATTERNS[page.mode].color,
    };
  });
  const localeOptions: readonly EmbedGeneratorLocaleOption[] =
    localeOptionConfig.map((option) => ({
      ...option,
      label: content.generator.localeLabels[option.code],
    }));
  const footerLinks = footerConfig.map((link) => ({
    href: href(link.href),
    label: content.generator.footer[link.label],
  }));
  return (
    <EmbedGenerator
      content={content.generator}
      footerLinks={footerLinks}
      initialLocale={initialLocale}
      localeOptions={localeOptions}
      pageLocale={pageLocale}
      patterns={patterns}
    />
  );
}
