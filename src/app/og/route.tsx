import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { BREATHING_PATTERNS } from '@/components/resonance/constants';
import { ModeName } from '@/components/resonance/types';
import ogTranslations from '@/data/og-translations.json';
import { loadOgFonts } from '@/lib/og-fonts';
import { BREATHE_LABELS, normalizeOgLocale, renderOgScene } from '@/lib/seo/og-scene';

type LocaleMap = Record<string, Record<string, string>>;
const byTitle = (ogTranslations as { byTitle: LocaleMap }).byTitle;

export const runtime = 'edge';

const DEFAULT_TITLE = 'Deep Breathing Exercises';
const DEFAULT_SUBTITLE = 'deepbreathingexercises.com';
const DEFAULT_PATTERN = BREATHING_PATTERNS[ModeName.Box];

function isHexColor(value?: string | null): value is string {
  return Boolean(value && /^#?[0-9a-fA-F]{6}$/.test(value));
}

function normalizeHexColor(value: string) {
  return value.startsWith('#') ? value : `#${value}`;
}

function clampText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedTitle = searchParams.get('title')?.trim();
    const requestedSubtitle = searchParams.get('subtitle')?.trim();
    const requestedColor = searchParams.get('color')?.trim();

    const color = isHexColor(requestedColor) ? normalizeHexColor(requestedColor) : DEFAULT_PATTERN.color;
    const enTitle = requestedTitle || DEFAULT_TITLE;
    const subtitle = clampText(requestedSubtitle || DEFAULT_SUBTITLE, 56);
    const locale = normalizeOgLocale(searchParams.get('lang')) ?? 'en';

    // Phase 2: when a locale is set and we have a pre-baked translation for
    // this exact EN title, render the translated text as the bottom-of-image
    // title. Missing translation → fall back to the EN title (no regression).
    const localizedTitle =
      locale !== 'en' && byTitle[enTitle]?.[locale] ? byTitle[enTitle][locale] : enTitle;
    const title = clampText(localizedTitle, 72);

    return new ImageResponse(renderOgScene({ title, subtitle, color, locale }), {
      width: 1200,
      height: 630,
      fonts: await loadOgFonts(
        locale === 'ja'
          ? { jpSubset: `${BREATHE_LABELS.ja}${title}${subtitle}` }
          : undefined,
      ),
    });
  } catch (e: any) {
    console.error('OG Image generation error:', e);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
