import { Pattern, phaseAt } from "./breathing";

// Deterministic port of ParticleBackground physics. The sim is stateful
// (smoothing + radial in/out + respawn), so we simulate sequentially from
// frame 0 with a seeded RNG and cache positions per frame. Each Remotion
// worker rebuilds the identical trajectory -> consistent output.

export type Speck = { x: number; y: number; size: number; alpha: number };

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = { x: number; y: number; sx: number; sy: number; size: number; alpha: number };

type Sim = {
  rnd: () => number;
  parts: P[];
  smoothedRadial: number;
  smoothedDrift: number;
  simFrame: number;
  cache: Speck[][];
  w: number; h: number; fps: number; pattern: Pattern; speed: number;
};

const SPEED_PER_SECOND = 60;
const sims = new Map<string, Sim>();

function makeSim(w: number, h: number, fps: number, pattern: Pattern, speed: number): Sim {
  const rnd = mulberry32(1337);
  const parts: P[] = Array.from({ length: 80 }, () => ({
    x: rnd() * w,
    y: rnd() * h,
    sx: rnd() * 0.5 - 0.25,
    sy: rnd() * 0.5 - 0.25,
    size: rnd() * 3 + 1,
    alpha: Math.min(rnd() * 0.5 + 0.1, 0.6),
  }));
  return { rnd, parts, smoothedRadial: 0, smoothedDrift: 0.2 * SPEED_PER_SECOND, simFrame: -1, cache: [], w, h, fps, pattern, speed };
}

function resetToEdge(p: P, s: Sim) {
  const edge = Math.floor(s.rnd() * 4);
  if (edge === 0) { p.x = s.rnd() * s.w; p.y = 0; }
  else if (edge === 1) { p.x = s.w; p.y = s.rnd() * s.h; }
  else if (edge === 2) { p.x = s.rnd() * s.w; p.y = s.h; }
  else { p.x = 0; p.y = s.rnd() * s.h; }
}
function resetToCenter(p: P, s: Sim) {
  const a = s.rnd() * Math.PI * 2;
  const r = s.rnd() * 50;
  p.x = s.w / 2 + Math.cos(a) * r;
  p.y = s.h / 2 + Math.sin(a) * r;
}

function step(s: Sim) {
  const dt = 1 / s.fps;
  const t = ((s.simFrame + 1) / s.fps) * 1000;
  const { label } = phaseAt(t, s.pattern, s.speed);
  let targetRadial = 0, targetDrift = 0.2 * SPEED_PER_SECOND;
  if (label === "Inhale") { targetRadial = -3.5 * SPEED_PER_SECOND; targetDrift = 0.5 * SPEED_PER_SECOND; }
  else if (label === "Exhale") { targetRadial = 1.2 * SPEED_PER_SECOND; targetDrift = 0.5 * SPEED_PER_SECOND; }
  else { targetRadial = 0; targetDrift = 0.6 * SPEED_PER_SECOND; } // Hold
  targetRadial *= s.speed;

  s.smoothedRadial += (targetRadial - s.smoothedRadial) * 0.05;
  s.smoothedDrift += (targetDrift - s.smoothedDrift) * 0.05;

  const cx = s.w / 2, cy = s.h / 2;
  const frame: Speck[] = [];
  for (const p of s.parts) {
    const dx = p.x - cx, dy = p.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.1) {
      const rs = s.smoothedRadial * dt;
      p.x += (dx / dist) * rs;
      p.y += (dy / dist) * rs;
    }
    const ds = s.smoothedDrift * dt;
    p.x += p.sx * ds;
    p.y += p.sy * ds;

    if (s.smoothedRadial < -1 && dist < 30) resetToEdge(p, s);
    else if (s.smoothedRadial > 1 && (p.x < 0 || p.x > s.w || p.y < 0 || p.y > s.h)) resetToCenter(p, s);
    else { if (p.x < 0) p.x = s.w; if (p.x > s.w) p.x = 0; if (p.y < 0) p.y = s.h; if (p.y > s.h) p.y = 0; }

    frame.push({ x: p.x, y: p.y, size: p.size, alpha: p.alpha });
  }
  s.simFrame++;
  s.cache[s.simFrame] = frame;
}

export function particlesAt(frame: number, w: number, h: number, fps: number, pattern: Pattern, speed: number): Speck[] {
  const key = `${w}x${h}@${fps}|${pattern.inhale},${pattern.holdIn},${pattern.exhale},${pattern.holdOut},${pattern.inhale2 || 0}|${speed}`;
  let s = sims.get(key);
  if (!s) { s = makeSim(w, h, fps, pattern, speed); sims.set(key, s); }
  while (s.simFrame < frame) step(s);
  return s.cache[frame];
}
