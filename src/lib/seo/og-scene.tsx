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

// djb2 — stable across runtimes, fine for deterministic variety.
function djb2(seed: string) {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickBlobShape(seed: string) {
  return BLOB_SHAPES[djb2(seed) % BLOB_SHAPES.length];
}

// Seeded RNG so the same title always produces the same particle layout —
// each page gets its own constellation, but it stays stable across renders.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Particle = { top: number; left: number; size: number; a: number };

function generateParticles(seed: number): Particle[] {
  const rng = mulberry32(seed);
  const particles: Particle[] = [];

  // Reject particles inside the orb's bounding box (the blob shape lives
  // roughly inside this rect; corners stay free because the shape curves in).
  const orb = { x0: 430, y0: 100, x1: 770, y1: 440 };
  // Stay above the title strip — title wraps up to ~90px tall and sits
  // 56px from the bottom edge, so leave a buffer above its top line.
  const yMax = 470;

  function gen(sizeMin: number, sizeMax: number, alphaMin: number, alphaMax: number): Particle {
    for (let attempts = 0; attempts < 50; attempts++) {
      const left = Math.floor(rng() * 1160) + 20;
      const top = Math.floor(rng() * (yMax - 20)) + 20;
      if (left >= orb.x0 && left <= orb.x1 && top >= orb.y0 && top <= orb.y1) continue;
      const size = Math.floor(rng() * (sizeMax - sizeMin + 1)) + sizeMin;
      const a = alphaMin + rng() * (alphaMax - alphaMin);
      return { top, left, size, a };
    }
    // Fallback: place at top-left if rejection sampling somehow fails.
    return { top: 30, left: 30, size: sizeMin, a: alphaMin };
  }

  // 6 larger "anchor" particles for visual rhythm.
  for (let i = 0; i < 6; i++) particles.push(gen(16, 22, 0.32, 0.5));
  // 50 small/medium — 80% small (3-7px), 20% medium (8-13px).
  for (let i = 0; i < 50; i++) {
    if (rng() < 0.8) particles.push(gen(3, 7, 0.22, 0.45));
    else particles.push(gen(8, 13, 0.28, 0.48));
  }
  return particles;
}

// Phase 1 of OG translation: only the focal "BREATHE" label in the orb is
// localized. og:title/og:description are translated by the mass-translate
// proxy and shown by social platforms *above* the image, so the bottom-of-image
// title stays English for now — it's deliberately small/secondary.
export const BREATHE_LABELS: Record<string, string> = {
  en: "BREATHE",
  es: "RESPIRA",
  pt: "RESPIRA",
  fr: "RESPIRE",
  de: "ATME",
  ja: "呼吸",
};

// Accepts both bare codes (`es`, `pt`) and locale-region codes (`es-es`,
// `pt-br`, `ja-jp`) — mass-translate emits the region form for some
// locales. Returns the base locale if supported, else null.
export function normalizeOgLocale(value: unknown): keyof typeof BREATHE_LABELS | null {
  if (typeof value !== "string") return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return base in BREATHE_LABELS ? (base as keyof typeof BREATHE_LABELS) : null;
}

export function renderOgScene({
  title,
  color,
  locale = "en",
}: {
  title: string;
  subtitle?: string;
  color: string;
  locale?: string;
}) {
  const rgb = hexToRgb(color);
  const rgba = (a: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

  // Match the live Resonance experience: when a session is running, the page
  // background fades to `${themeColor}1a` — the pattern color at ~10% alpha
  // over the white app background. Pre-blend that here so each technique's
  // OG carries its own ambient wash (rose for box, indigo for 4-7-8, etc.).
  const TINT_ALPHA = 0.1;
  const blend = (c: number) => Math.round(c * TINT_ALPHA + 255 * (1 - TINT_ALPHA));
  const bgColor = `rgb(${blend(rgb.r)}, ${blend(rgb.g)}, ${blend(rgb.b)})`;

  const seed = djb2(title);
  const blobBorderRadius = BLOB_SHAPES[seed % BLOB_SHAPES.length];
  const particles = generateParticles(seed);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        fontFamily: 'Inter',
      }}
    >
      {/* Soft halo behind orb. Centered on (600, 280); shrunk to match the
          smaller orb so the glow doesn't dominate. */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: 320,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rgba(0.34)} 0%, ${rgba(0.1)} 50%, ${rgba(0)} 78%)`,
          display: 'flex',
        }}
      />

      {/* Thin orbit ring — matches blob shape so it reads as an orbit */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 390,
          width: 420,
          height: 420,
          borderRadius: blobBorderRadius,
          border: `2px solid ${rgba(0.22)}`,
          display: 'flex',
        }}
      />

      {/* Main orb — amorphous blob, solid color (matches live site).
          340x340 leaves more vertical breathing room for the title (up to
          3 wrapped lines) without colliding with the orb's drop shadow. */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 430,
          width: 340,
          height: 340,
          borderRadius: blobBorderRadius,
          background: color,
          boxShadow: `0 22px 70px ${rgba(0.26)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 46,
            fontWeight: 700,
            opacity: 0.95,
            display: 'flex',
            // Inter has no CJK glyphs — satori falls back to Noto Sans JP
            // for ja locales when it's been loaded into the font list.
            fontFamily: 'Inter, "Noto Sans JP"',
          }}
        >
          {BREATHE_LABELS[locale] ?? BREATHE_LABELS.en}
        </div>
      </div>

      {/* Decorative particles. Positions and sizes are seeded from the
          title hash so every page gets its own constellation that stays
          stable across renders. Mix of small (3-7px), medium (8-13px), and
          larger "anchor" dots (16-22px) for visual rhythm. */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: rgba(p.a),
            display: 'flex',
          }}
        />
      ))}

      {/* Title below orb. Wider side margins (120px each) keep long
          translated titles from clipping at the edge on platforms that
          render the image with extra inset (Twitter mobile, iMessage). */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 120px',
        }}
      >
        <div
          style={{
            color: rgba(0.92),
            fontSize: 36,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.2,
            display: 'flex',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
