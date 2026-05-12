import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import React from 'react';
import { breathingPageMap } from '@/data/breathing-pages';
import { BREATHING_PATTERNS } from '@/components/resonance/constants';
import { ModeName } from '@/components/resonance/types';
import { loadInterFonts } from '@/lib/og-fonts';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const page = breathingPageMap[slug];

    // If no page found, use default values
    const pattern = page 
      ? BREATHING_PATTERNS[page.mode]
      : BREATHING_PATTERNS[ModeName.Box];
    
    const title = page?.hero.title || 'Interactive Breathing Visualizer';
    const color = pattern.color;

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

    // Satori (the renderer behind @vercel/og) is strict: every multi-child div
    // needs display:flex, every absolute child needs explicit dimensions, and
    // it rejects many CSS features (radial-gradient with positional args,
    // box-shadow with inset, filter:blur, textShadow, textTransform,
    // letterSpacing). Keeping this template intentionally simple — flex
    // columns, plain backgrounds, no absolute positioning — so it renders
    // reliably. Iterate visually only with features in the satori support list.
    const orbTitle = title.split(' ').slice(0, 3).join(' ').toUpperCase();
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
                fontSize: 48,
                fontWeight: 700,
                textAlign: 'center',
                padding: '0 40px',
                lineHeight: 1.15,
              }}
            >
              {orbTitle}
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
            Deep Breathing Exercises
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

