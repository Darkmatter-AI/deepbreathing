// Per-user blob avatar generator — the single source of truth.
//
// seedToAvatarParams(seed, version) is a PURE function. The same (seed, version)
// always yields the same AvatarParams, on the Vercel edge (V8) and in Node
// (Remotion) alike, because every emitted color is quantized to a fixed grid
// before the OKLCH->sRGB matrix runs (see oklchToHex). All visual channels are
// derived from INDEPENDENT sub-streams so a collision in one channel does not
// correlate with another.
//
// Design notes live in docs/research/per-user-blob-avatars.md.

// --- hashing -------------------------------------------------------------

// xmur3: string -> seeded 32-bit generator with GOOD avalanche. We do NOT
// reuse og-scene's djb2 here: djb2 has weak avalanche, so sequential re-roll
// seeds (seed#1, seed#2, ...) would produce near-identical avatars — the exact
// opposite of what a re-roll button is for.
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

// mulberry32: same PRNG already used across the codebase (og-scene, particles).
export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- OKLCH -> sRGB hex (gamut-clamped, quantized) ------------------------

// Björn Ottosson's OKLab -> linear sRGB.
function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut([r, g, b]: [number, number, number]): boolean {
  const e = 1e-4;
  return r >= -e && r <= 1 + e && g >= -e && g <= 1 + e && b >= -e && b <= 1 + e;
}

function gammaEncode(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function toHex2(v: number): string {
  return Math.round(v * 255)
    .toString(16)
    .padStart(2, '0');
}

// Convert OKLCH -> hex. Quantizes L/C/H to a fixed grid first (so cross-runtime
// float drift can never flip the emitted byte), then reduces chroma until the
// color is inside the sRGB gamut (a FIXED chroma clips at some hues and renders
// muddy — the clamp is what keeps every avatar "always pleasing").
export function oklchToHex(Lin: number, Cin: number, Hin: number): string {
  const L = Math.round(Lin * 255) / 255;
  let C = Math.round(Cin * 255) / 255;
  const H = Math.round(((Hin % 360) + 360) % 360); // 1-degree grid
  const hr = (H * Math.PI) / 180;
  const ca = Math.cos(hr);
  const sa = Math.sin(hr);

  let rgb = oklabToLinearSrgb(L, C * ca, C * sa);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToLinearSrgb(L, mid * ca, mid * sa))) lo = mid;
      else hi = mid;
    }
    C = lo;
    rgb = oklabToLinearSrgb(L, C * ca, C * sa);
  }
  return `#${toHex2(gammaEncode(rgb[0]))}${toHex2(gammaEncode(rgb[1]))}${toHex2(gammaEncode(rgb[2]))}`;
}

// --- silhouette ----------------------------------------------------------

// Sample an 8-value CSS border-radius inside the measured brand band [30,70],
// enforcing "opposite corners sum to ~100" so the blob stays convex/balanced
// and never pinches. This is the ONE shape language the live CSS orb, Satori,
// and Remotion all render natively — so it is the silhouette DNA, not a
// Satori workaround.
function sampleBorderRadius(rng: () => number): string {
  const h0 = 30 + rng() * 40;
  const h1 = 30 + rng() * 40;
  const v0 = 30 + rng() * 40;
  const v1 = 30 + rng() * 40;
  const r = (n: number) => Math.round(n);
  return `${r(h0)}% ${r(h1)}% ${r(100 - h0)}% ${r(100 - h1)}% / ${r(v0)}% ${r(v1)}% ${r(100 - v0)}% ${r(100 - v1)}%`;
}

// --- particles -----------------------------------------------------------

export interface AvatarParticle {
  cx: number; // 0..100, percent of tile
  cy: number; // 0..100
  r: number; // radius, percent of tile
  alpha: number;
}

// Constellation in a 0..100 unit square that avoids the central blob. Richness
// only — invisible below ~64px, so renderers drop these at small sizes.
function generateParticles(rng: () => number): AvatarParticle[] {
  const out: AvatarParticle[] = [];
  const target = 14;
  let attempts = 0;
  while (out.length < target && attempts < 400) {
    attempts++;
    const cx = rng() * 100;
    const cy = rng() * 100;
    if (Math.hypot(cx - 50, cy - 50) < 38) continue; // keep clear of the orb
    out.push({ cx, cy, r: 0.7 + rng() * 1.6, alpha: 0.16 + rng() * 0.26 });
  }
  return out;
}

// --- public API ----------------------------------------------------------

export const AVATAR_VERSION = 1;

export interface BlobHarmonic {
  k: number; // angular frequency (number of lobes-ish)
  amp: number; // amplitude
  phase: number; // radians
}

export interface AvatarParams {
  version: number;
  seed: string;
  fill: string; // hex — the orb body
  glow: string; // hex — lighter derivative for the soft glow
  ring: string; // hex — deeper derivative for the orbit ring
  bgTint: string; // hex — brand cream tile background
  // SHAPE (primary identity channel): sum-of-sines harmonics -> SVG path. Far more
  // silhouette variety than border-radius. Build the path with blobPath(harmonics, R).
  harmonics: BlobHarmonic[];
  borderRadius: string; // 8-value CSS string — kept for the live CSS orb surface
  morph: string[]; // border-radius keyframes the live blob tweens through
  particles: AvatarParticle[];
  hueDrift: number; // deg, for the live hue-rotate accent
}

// The brand's warm cream background (globals.css `--background: 32 72% 97%`,
// same CREAM the orb-video uses). Every avatar tile uses this ONE color so the
// set reads as cohesive and the blob — especially reds/darks — pops against a
// neutral ground instead of a same-hue wash.
const BRAND_CREAM = '#fdf8f2';

const TAU = Math.PI * 2;

// The brand colors in OKLCH (de-duplicated to 9 families — dropped the near-identical
// emerald/sky twins for an even spread). Color = pick one + TIGHT jitter, so every
// avatar is recognizably a brand color and per-user uniqueness comes from SHAPE, not
// color. Reds 18°/27° (#e11d48 / #dc2626) are 2 of 9 → ~22% of avatars.
const BRAND_COLORS = [
  { L: 0.586, C: 0.222, H: 18 }, // #e11d48 rose
  { L: 0.577, C: 0.215, H: 27 }, // #dc2626 red
  { L: 0.646, C: 0.194, H: 41 }, // #ea580c hot orange
  { L: 0.769, C: 0.165, H: 70 }, // #f59e0b amber
  { L: 0.596, C: 0.127, H: 163 }, // #059669 emerald
  { L: 0.609, C: 0.111, H: 222 }, // #0891b2 cyan
  { L: 0.685, C: 0.148, H: 237 }, // #0ea5e9 sky
  { L: 0.511, C: 0.23, H: 277 }, // #4f46e5 indigo
  { L: 0.606, C: 0.219, H: 293 }, // #8b5cf6 violet
];

// Sum-of-sines polar-radius blob -> smooth closed SVG path string (viewBox 0..100).
// r(θ) = R·(1 + Σ aₖ·sin(kθ+φₖ)). As long as the radius stays positive the curve is
// a simple (non-self-intersecting) closed loop, so this is always an organic blob —
// just far more varied than the 8-value border-radius. The spike confirmed Satori
// renders an inline <path> with cubic-bezier (C) commands.
export function blobPath(harmonics: BlobHarmonic[], R = 33, cx = 50, cy = 50, n = 72): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    let r = 1;
    for (const h of harmonics) r += h.amp * Math.sin(h.k * t + h.phase);
    pts.push([cx + R * r * Math.cos(t), cy + R * r * Math.sin(t)]);
  }
  // Closed Catmull-Rom -> cubic beziers for a smooth outline.
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const m = pts.length;
  let d = `M ${r2(pts[0][0])} ${r2(pts[0][1])} `;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % m];
    const p3 = pts[(i + 2) % m];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(p2[0])} ${r2(p2[1])} `;
  }
  return d + 'Z';
}

export function seedToAvatarParams(seed: string, version = AVATAR_VERSION): AvatarParams {
  const root = xmur3(`${seed}:v${version}`);
  const rngColor = mulberry32(root());
  const rngShape = mulberry32(root());
  const rngParticles = mulberry32(root());
  const rngAccent = mulberry32(root());

  // Color: pick a brand family + TIGHT jitter (hue ±4°, L ±0.025). Low color
  // variation on purpose — every avatar is recognizably a brand color; per-user
  // uniqueness comes from SHAPE. Reds guaranteed (2 of 9 families). Quantize L to
  // the /255 grid so the emitted hex is cross-runtime deterministic.
  const base = BRAND_COLORS[Math.floor(rngColor() * BRAND_COLORS.length)];
  const H = base.H + (rngColor() - 0.5) * 8;
  const L = Math.round(Math.max(0.42, Math.min(0.85, base.L + (rngColor() - 0.5) * 0.05)) * 255) / 255;
  const C = base.C;

  const fill = oklchToHex(L, C, H);
  const glow = oklchToHex(Math.min(L + 0.12, 0.92), C * 0.7, H);
  const ring = oklchToHex(Math.max(L - 0.08, 0.34), C, H);
  const bgTint = BRAND_CREAM;

  // SHAPE — the primary identity channel, kept ROUND. Sum-of-sines harmonics with a
  // small amplitude budget and fast (1/k) decay, so the radius stays near R: gentle
  // organic asymmetry, never spiky or lobed. Low k only (2-4) avoids fine wobble.
  const harmonics: BlobHarmonic[] = [];
  let budget = 0.2;
  for (const k of [2, 3, 4]) {
    const amp = Math.min(budget, (0.12 / k) * (0.4 + rngShape() * 1.1));
    budget -= amp;
    harmonics.push({ k, amp, phase: rngShape() * TAU });
  }

  const borderRadius = sampleBorderRadius(rngShape);
  const morph = [
    borderRadius,
    sampleBorderRadius(rngShape),
    sampleBorderRadius(rngShape),
    sampleBorderRadius(rngShape),
  ];

  return {
    version,
    seed,
    fill,
    glow,
    ring,
    bgTint,
    harmonics,
    borderRadius,
    morph,
    particles: generateParticles(rngParticles),
    hueDrift: 18 + rngAccent() * 22,
  };
}
