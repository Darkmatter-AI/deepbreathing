import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import React from 'react';
import { BREATHING_PATTERNS } from '@/components/resonance/constants';
import { ModeName } from '@/components/resonance/types';
import { loadInterFonts } from '@/lib/og-fonts';
import { renderOgScene } from '@/lib/seo/og-scene';

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
    const title = clampText(requestedTitle || DEFAULT_TITLE, 72);
    const subtitle = clampText(requestedSubtitle || DEFAULT_SUBTITLE, 56);

    return new ImageResponse(renderOgScene({ title, subtitle, color }), {
      width: 1200,
      height: 630,
      fonts: await loadInterFonts(),
    });
  } catch (e: any) {
    console.error('OG Image generation error:', e);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
