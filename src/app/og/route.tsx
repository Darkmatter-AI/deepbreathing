import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import React from 'react';
import { BREATHING_PATTERNS } from '@/components/resonance/constants';
import { ModeName } from '@/components/resonance/types';
import { loadInterFonts } from '@/lib/og-fonts';

export const runtime = 'edge';

const DEFAULT_TITLE = 'Interactive Breathing Visualizer';
const DEFAULT_SUBTITLE = 'Deep Breathing Exercises';
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

    // Default to Box Breathing styling
    const color = isHexColor(requestedColor) ? normalizeHexColor(requestedColor) : DEFAULT_PATTERN.color;
    const title = clampText(requestedTitle || DEFAULT_TITLE, 72);
    const subtitle = clampText(requestedSubtitle || DEFAULT_SUBTITLE, 56);

    // Convert hex to RGB for use in gradients
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 225, g: 29, b: 72 }; // Default to rose
    };

    const rgb = hexToRgb(color);
    const colorRgba = (alpha: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

    // Same simplification as /og/[slug] — satori-friendly subset only.
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${colorRgba(0.18)} 0%, ${colorRgba(0.08)} 100%)`,
            fontFamily: 'Inter',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 420,
              height: 420,
              borderRadius: 210,
              background: color,
              marginBottom: 48,
            }}
          >
            <div
              style={{
                display: 'flex',
                color: 'white',
                fontSize: 42,
                fontWeight: 700,
                textAlign: 'center',
                padding: '0 40px',
                lineHeight: 1.15,
              }}
            >
              {title.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              color: color,
              fontSize: 28,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: await loadInterFonts(),
      }
    );
  } catch (e: any) {
    console.error('OG Image generation error:', e);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
