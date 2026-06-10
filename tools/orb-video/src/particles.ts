import { Pattern, phaseAt } from "./breathing";

// Closed-form, exactly-periodic particle field.
//
// The previous port was a stateful integrator (smoothing + radial in/out +
// RNG respawns). That made position(frame) path-dependent, so looping a master
// teleported particles at the seam. Here every particle position is a pure
// function of `modFrame = frame mod loopFrames`, built from:
//   - a seeded static field (base x/y, size, alpha) so the look still matches,
//   - an integer-harmonic Lissajous drift (returns to its start after exactly
//     loopFrames), and
//   - a breath-coupled MULTIPLICATIVE radial contraction of the whole field
//     around center (inhale draws specks strongly inward, exhale gently pushes
//     them out). This mirrors the live web (ParticleBackground.tsx): radial
//     velocity -3.5 on inhale vs +1.2 on exhale — a strong pull-in, gentle
//     push-out asymmetry. The web's literal edge/center respawn turnover can't
//     loop seamlessly and is intentionally dropped; the synchronized in/out
//     pulse is the dominant, visible effect.
// Because loopSec is an integer number of breath cycles, scale(0) == scale at
// the seam and every oscillator argument is an integer multiple of 2π — so
// frame `loopFrames` is identical to frame 0. The radial factor depends only on
// the periodic `scale`, so it too is seam-safe. No accumulators, no per-frame RNG.

export type Speck = { x: number; y: number; size: number; alpha: number };

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;

// Static, loopSec-independent seeded field. Cached per resolution.
type Field = {
  baseX: number; baseY: number;
  hx: number; hy: number;   // integer drift harmonics -> periodic over loopFrames
  ax: number; ay: number;   // per-speck phase offsets
  amp: number;              // per-speck drift amplitude multiplier
  size: number; alpha: number;
}[];

const fields = new Map<string, Field>();

function makeField(w: number, h: number): Field {
  const rnd = mulberry32(1337);
  return Array.from({ length: 80 }, () => ({
    baseX: rnd() * w,
    baseY: rnd() * h,
    hx: 1 + Math.floor(rnd() * 2), // 1 or 2
    hy: 1 + Math.floor(rnd() * 2), // 1 or 2
    ax: rnd() * TAU,
    ay: rnd() * TAU,
    amp: 0.6 + rnd() * 0.8,
    size: rnd() * 3 + 1,
    alpha: Math.min(rnd() * 0.5 + 0.1, 0.6),
  }));
}

export function particlesAt(
  frame: number,
  w: number,
  h: number,
  fps: number,
  pattern: Pattern,
  speed: number,
  loopFrames: number,
): Speck[] {
  const key = `${w}x${h}`;
  let field = fields.get(key);
  if (!field) { field = makeField(w, h); fields.set(key, field); }

  const lf = Math.max(1, loopFrames);
  const modFrame = ((frame % lf) + lf) % lf;
  const phase = (TAU * modFrame) / lf;
  // breath scale from the wrapped frame -> exactly periodic over loopFrames
  const tMs = (modFrame / fps) * 1000;
  const { scale } = phaseAt(tMs, pattern, speed);

  const cx = w / 2, cy = h / 2;
  const minDim = Math.min(w, h);
  const DRIFT = minDim * 0.02;   // gentle Lissajous wander (the "float" feel)

  // Breath-coupled multiplicative radial contraction of the whole field around
  // center. `scale`: 0 (full exhale) .. 1 (full inhale). Strong pull-in on
  // inhale, gentle push-out on exhale — mirrors the web's -3.5 / +1.2 asymmetry.
  const PULL = 0.60;  // inhale draw-in strength (inhale factor -> 1-PULL = 0.40)
  const PUSH = 0.18;  // exhale push-out (gentler; exhale factor -> 1+PUSH = 1.18)
  const radialFactor = (1 + PUSH) - (PULL + PUSH) * scale;

  return field.map((p) => {
    // anchor = static base + integer-harmonic Lissajous drift (periodic over loopFrames)
    const anchorX = p.baseX + DRIFT * p.amp * Math.sin(p.hx * phase + p.ax);
    const anchorY = p.baseY + DRIFT * p.amp * Math.cos(p.hy * phase + p.ay);
    // scale the anchor's vector from center -> field contracts on inhale, expands on exhale
    return {
      x: cx + (anchorX - cx) * radialFactor,
      y: cy + (anchorY - cy) * radialFactor,
      size: p.size,
      alpha: p.alpha,
    };
  });
}
