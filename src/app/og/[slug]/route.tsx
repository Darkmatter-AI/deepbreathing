import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { breathingPageMap } from '@/data/breathing-pages';
import { BREATHING_PATTERNS } from '@/components/resonance/constants';
import { ModeName } from '@/components/resonance/types';
import ogTranslations from '@/data/og-translations.json';
import { loadOgFonts } from '@/lib/og-fonts';
import { BREATHE_LABELS, normalizeOgLocale, renderOgScene } from '@/lib/seo/og-scene';

type LocaleMap = Record<string, Record<string, string>>;
const bySlug = (ogTranslations as { bySlug: LocaleMap }).bySlug;

function clampText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = breathingPageMap[slug];

    const pattern = page
      ? BREATHING_PATTERNS[page.mode]
      : BREATHING_PATTERNS[ModeName.Box];

    const enTitle = page?.hero.title || 'Interactive Breathing Visualizer';
    const subtitle = 'deepbreathingexercises.com';
    const color = pattern.color;

    const locale = normalizeOgLocale(request.nextUrl.searchParams.get('lang')) ?? 'en';

    // Phase 2: prefer pre-baked translation when a locale is set and we have
    // one for this slug. Missing translation → falls back to the EN hero title.
    const localizedTitle =
      locale !== 'en' && bySlug[slug]?.[locale] ? bySlug[slug][locale] : enTitle;
    const title = clampText(localizedTitle, 72);

    return new ImageResponse(renderOgScene({ title, subtitle, color, locale }), {
      width: 1200,
      height: 630,
      fonts: await loadOgFonts(
        locale === 'ja'
          ? { jpSubset: `${BREATHE_LABELS.ja}${title}${subtitle}` }
          : undefined,
      ),
      // Keep OG images out of the index without robots-blocking them
      // (Twitterbot honors robots.txt and would drop card images).
      headers: { 'X-Robots-Tag': 'noindex' },
    });
  } catch (e: any) {
    console.error('OG Image generation error:', e);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
