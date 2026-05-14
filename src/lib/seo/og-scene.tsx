import React from 'react';

// Renders the OG hero scene shared by /og and /og/[slug].
//
// Brand goal: evoke the Resonance visualizer — warm peach background, a soft
// halo, a thin orbit ring, and an organic blob orb with a light-to-color
// gradient (pearl effect). The live app uses inset box-shadow, filter:blur,
// and animated border-radius for the orb; satori rejects all of those, so we
// fake the same feel with radial-gradient + non-inset box-shadow + a static
// asymmetric borderRadius.
//
// Satori constraints to remember when editing:
// - every multi-child div needs display:flex
// - every absolutely-positioned child needs explicit width + height
// - no `inset` box-shadow, no filter:blur, no textShadow, no textTransform,
//   no letterSpacing (use .toUpperCase() instead, omit letter-spacing)
// - radial-gradient(circle, ...) works; radial-gradient(circle at X Y, ...)
//   has historically been rejected — keep gradients positional-arg-free

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 225, g: 29, b: 72 };
}

// Hand-picked blob shapes — first four are pulled straight from
// tailwind.config.ts `morph` keyframes (the same shapes the live site
// animates through). The next four are extra variations in the same style.
// Each page picks one deterministically from its title, so /og/box and
// /og/4-7-8 always render with their own distinct silhouette but the
// homepage stays stable across renders.
const BLOB_SHAPES = [
  '60% 40% 30% 70% / 60% 30% 70% 40%',
  '45% 55% 50% 50% / 55% 45% 55% 45%',
  '30% 60% 70% 40% / 50% 60% 30% 60%',
  '45% 55% 40% 60% / 40% 60% 40% 60%',
  '65% 35% 50% 50% / 40% 60% 40% 60%',
  '40% 60% 65% 35% / 60% 45% 55% 40%',
  '55% 45% 35% 65% / 55% 35% 65% 45%',
  '50% 50% 65% 35% / 35% 55% 45% 65%',
];

function pickBlobShape(seed: string) {
  // djb2 — stable across runtimes, fine for deterministic variety.
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0;
  }
  return BLOB_SHAPES[hash % BLOB_SHAPES.length];
}

export function renderOgScene({
  title,
  color,
}: {
  title: string;
  subtitle?: string;
  color: string;
}) {
  const rgb = hexToRgb(color);
  const rgba = (a: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

  // Background is constant across patterns so the brand feel stays cohesive
  // even as the orb color shifts per breathing technique.
  const bgGradient = 'linear-gradient(135deg, #fef7f3 0%, #fde2d8 60%, #fbd5cc 100%)';

  const blobBorderRadius = pickBlobShape(title);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgGradient,
        fontFamily: 'Inter',
      }}
    >
      {/* Soft halo behind orb */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          left: 290,
          width: 620,
          height: 620,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rgba(0.34)} 0%, ${rgba(0.1)} 50%, ${rgba(0)} 78%)`,
          display: 'flex',
        }}
      />

      {/* Thin orbit ring — matches blob shape so it reads as an orbit */}
      <div
        style={{
          position: 'absolute',
          top: 55,
          left: 370,
          width: 460,
          height: 460,
          borderRadius: blobBorderRadius,
          border: `2px solid ${rgba(0.22)}`,
          display: 'flex',
        }}
      />

      {/* Main orb — amorphous blob, solid color (matches live site) */}
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 405,
          width: 390,
          height: 390,
          borderRadius: blobBorderRadius,
          background: color,
          boxShadow: `0 24px 80px ${rgba(0.28)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 52,
            fontWeight: 700,
            opacity: 0.95,
            display: 'flex',
          }}
        >
          BREATHE
        </div>
      </div>

      {/* Decorative dots for "particle" feel */}
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 230,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: rgba(0.45),
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 430,
          left: 300,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: rgba(0.35),
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 170,
          left: 930,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: rgba(0.4),
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 390,
          left: 980,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: rgba(0.5),
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 460,
          left: 195,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: rgba(0.4),
          display: 'flex',
        }}
      />

      {/* Title below orb */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 80px',
        }}
      >
        <div
          style={{
            color: rgba(0.92),
            fontSize: 38,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.15,
            display: 'flex',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
