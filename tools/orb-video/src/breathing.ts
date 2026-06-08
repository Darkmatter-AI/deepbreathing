// Pure ports of the breathing-orb math from Resonance.tsx / Visualizer.tsx,
// rewritten as deterministic functions of time (no refs, no CSS animations) so
// Remotion can render them frame-accurately.

export type Pattern = { inhale: number; holdIn: number; exhale: number; holdOut: number; inhale2?: number };

export const PATTERNS: Record<string, Pattern> = {
  box: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  relax: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  coherent: { inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0 },
  sigh: { inhale: 2.5, inhale2: 1.5, holdIn: 0, exhale: 6, holdOut: 1 },
  belly: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
};

// scale 0..1 + phase label. Mirrors the `animate` state machine.
export function phaseAt(tMs: number, p: Pattern, speed = 1) {
  const inh = p.inhale * speed * 1000;
  const inh2 = (p.inhale2 || 0) * speed * 1000;
  const hin = p.holdIn * speed * 1000;
  const exh = p.exhale * speed * 1000;
  const hout = p.holdOut * speed * 1000;
  const cycle = inh + inh2 + hin + exh + hout;
  let c = ((tMs % cycle) + cycle) % cycle;
  const maxInhale1 = inh2 > 0 ? 0.75 : 1;
  if (c < inh) return { scale: (c / inh) * maxInhale1, label: "Inhale" };
  c -= inh;
  if (inh2 > 0) { if (c < inh2) return { scale: 0.75 + (c / inh2) * 0.25, label: "Inhale" }; c -= inh2; }
  if (c < hin) return { scale: 1, label: "Hold" };
  c -= hin;
  if (c < exh) return { scale: 1 - c / exh, label: "Exhale" };
  return { scale: 0, label: "Hold" };
}

// --- Organic blob border-radius (tailwind `morph` keyframes), frame-driven ---
const MORPH = [
  [60, 40, 30, 70, 60, 30, 70, 40],
  [45, 55, 50, 50, 55, 45, 55, 45],
  [30, 60, 70, 40, 50, 60, 30, 60],
  [45, 55, 40, 60, 40, 60, 40, 60],
  [60, 40, 30, 70, 60, 30, 70, 40],
];
export function borderRadiusAt(tMs: number, periodMs: number) {
  const prog = (((tMs % periodMs) + periodMs) % periodMs) / periodMs; // 0..1
  const seg = Math.min(Math.floor(prog * 4), 3);
  const f = prog * 4 - seg;
  const a = MORPH[seg], b = MORPH[seg + 1];
  const v = a.map((n, i) => n + (b[i] - n) * f);
  return `${v[0]}% ${v[1]}% ${v[2]}% ${v[3]}% / ${v[4]}% ${v[5]}% ${v[6]}% ${v[7]}%`;
}

// hue-rotate keyframe: 0 -> 30deg -> 0 over period
export function hueAt(tMs: number, periodMs: number) {
  const prog = (((tMs % periodMs) + periodMs) % periodMs) / periodMs;
  return (prog < 0.5 ? prog * 2 : (1 - prog) * 2) * 30;
}

// --- Deterministic particle field (port of ParticleBackground, 80 specks) ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Speck = { x0: number; y0: number; vx: number; vy: number; size: number; alpha: number };
export function makeParticles(n: number, w: number, h: number, seed = 1337): Speck[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => ({
    x0: rnd() * w,
    y0: rnd() * h,
    vx: (rnd() * 0.5 - 0.25) * 12, // px/sec (driftSpeed base ~12)
    vy: (rnd() * 0.5 - 0.25) * 12,
    size: rnd() * 3 + 1,
    alpha: Math.min(rnd() * 0.5 + 0.1, 0.6),
  }));
}
