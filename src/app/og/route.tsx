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
            background: `linear-gradient(135deg, ${colorRgba(0.1)} 0%, ${colorRgba(0.05)} 50%, ${colorRgba(0.1)} 100%)`,
            position: 'relative',
          }}
        >
          {/* Background particles effect - using fixed positions for edge runtime */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0.3,
            }}
          >
            {[
              { x: 100, y: 80, size: 3, opacity: 0.4 },
              { x: 300, y: 120, size: 2, opacity: 0.3 },
              { x: 500, y: 90, size: 4, opacity: 0.5 },
              { x: 700, y: 150, size: 2.5, opacity: 0.35 },
              { x: 900, y: 100, size: 3.5, opacity: 0.45 },
              { x: 1100, y: 130, size: 2, opacity: 0.3 },
              { x: 150, y: 300, size: 3, opacity: 0.4 },
              { x: 350, y: 350, size: 2.5, opacity: 0.35 },
              { x: 550, y: 320, size: 4, opacity: 0.5 },
              { x: 750, y: 380, size: 2, opacity: 0.3 },
              { x: 950, y: 340, size: 3.5, opacity: 0.45 },
              { x: 1150, y: 360, size: 2.5, opacity: 0.35 },
              { x: 200, y: 500, size: 3, opacity: 0.4 },
              { x: 400, y: 550, size: 2, opacity: 0.3 },
              { x: 600, y: 520, size: 4, opacity: 0.5 },
              { x: 800, y: 580, size: 2.5, opacity: 0.35 },
              { x: 1000, y: 540, size: 3.5, opacity: 0.45 },
              { x: 50, y: 250, size: 2, opacity: 0.3 },
              { x: 250, y: 450, size: 3, opacity: 0.4 },
              { x: 1050, y: 480, size: 2.5, opacity: 0.35 },
            ].map((particle, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: particle.x,
                  top: particle.y,
                  width: particle.size,
                  height: particle.size,
                  borderRadius: '50%',
                  background: color,
                  opacity: particle.opacity,
                }}
              />
            ))}
          </div>

          {/* Outer glow ring */}
          <div
            style={{
              position: 'absolute',
              width: 500,
              height: 500,
              borderRadius: '50%',
              border: `2px solid ${colorRgba(0.2)}`,
              transform: 'scale(1.1)',
            }}
          />

          {/* Main orb with gradient */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}DD 60%, ${color}AA 100%)`,
              boxShadow: `0 0 60px ${colorRgba(0.6)}, inset 0 0 40px ${colorRgba(0.7)}`,
              position: 'relative',
            }}
          >
            {/* Inner glow */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `radial-gradient(circle at 40% 40%, ${colorRgba(0.55)}, transparent 65%)`,
                filter: 'blur(40px)',
              }}
            />

            {/* Title text */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 42,
                fontWeight: 700,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                lineHeight: 1.1,
                padding: '0 40px',
                zIndex: 10,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {title}
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              display: 'flex',
              alignItems: 'center',
              color: color,
              fontSize: 24,
              fontWeight: 500,
              opacity: 0.9,
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
