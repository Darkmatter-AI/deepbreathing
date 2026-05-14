import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { breathingPageMap } from '@/data/breathing-pages';
import { BREATHING_PATTERNS } from '@/components/resonance/constants';
import { ModeName } from '@/components/resonance/types';
import { loadOgFonts } from '@/lib/og-fonts';
import { BREATHE_LABELS, isSupportedOgLocale, renderOgScene } from '@/lib/seo/og-scene';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const page = breathingPageMap[slug];

    const pattern = page
      ? BREATHING_PATTERNS[page.mode]
      : BREATHING_PATTERNS[ModeName.Box];

    const title = page?.hero.title || 'Interactive Breathing Visualizer';
    const subtitle = 'deepbreathingexercises.com';
    const color = pattern.color;

    const requestedLang = request.nextUrl.searchParams.get('lang')?.trim().toLowerCase();
    const locale = isSupportedOgLocale(requestedLang) ? requestedLang : 'en';

    return new ImageResponse(renderOgScene({ title, subtitle, color, locale }), {
      width: 1200,
      height: 630,
      fonts: await loadOgFonts(
        locale === 'ja' ? { jpSubset: BREATHE_LABELS.ja } : undefined,
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
