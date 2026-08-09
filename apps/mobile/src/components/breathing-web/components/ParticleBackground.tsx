'use client';

import React, { useEffect, useRef, type RefObject } from 'react';
import { BreathingPhase } from '../types';

interface ParticleProps {
  phase: BreathingPhase;
  color: string;
  /** Overall pace — particles breathe with the session's single speed. */
  speedMultiplier: number;
  /** The orb wrapper element. Its live bounding rect (including the drag
   *  offset) is the "ball" anchor particles react to. */
  orbRef?: RefObject<HTMLDivElement | null>;
  /** Landing-ripple trigger: the host sets {t: timestamp} when the ball
   *  settles home; the field emits one soft outward wave, then clears it. */
  rippleRef?: RefObject<{ t: number } | null>;
}

interface PointerState {
  active: boolean;
  x: number;
  y: number;
  px: number;
  py: number;
  /** Smoothed pointer velocity (px/s). */
  vx: number;
  vy: number;
  /** 0..1 decaying ripple energy from a press. */
  pressBurst: number;
  /** 0..1 decaying swirl energy from drag/scroll. */
  swirl: number;
  /** Last pointermove timestamp (ms) for velocity math. */
  lastMoveTs: number;
}

const INFLUENCE_RADIUS = 190;      // px — how far a pointer touch reaches
const PRESS_PUSH = 1400;           // px/s — outward push on press (visible pop)
const SWIRL_PEAK = 1900;           // px/s — tangential speed at full drag speed
const ORB_PULL_RADIUS = 175;       // px — particles near the ball follow it
const ORB_WAKE = 0.85;             // how much of the ball's motion rubs off
// Residual wake after release: ball still carries a soft trail of particles
// along its spring path. Weaker than active pull; dies with ball speed.
// Wake-only (no attraction) — safe against the under-orb pile-up bug.
const ORB_RESIDUAL_SPEED = 45;     // px/s — min ball speed to keep residual wake
const ORB_RESIDUAL_WAKE = 0.48;    // peak residual transfer (vs ORB_WAKE)
// Landing ripple — one soft ring expanding from the orb's home position.
// Kicked up after a design review: the wave was too weak to read against
// the ambient particle motion.
const RIPPLE_R0 = 30;              // px — start radius
const RIPPLE_SPEED = 240;          // px/s — wave expansion
const RIPPLE_BAND = 120;           // px — wave thickness
const RIPPLE_LIFE = 0.9;           // s — wave lifetime
const RIPPLE_AMP = 1500;           // px/s² — outward kick strength
// NOTE: no attraction term on purpose. Pulling particles TOWARD the ball's
// center rakes them into a clump under the orb; a pure velocity wake sweeps
// them along the drag direction and lets the field re-settle naturally.

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  // Impulse velocity from interactions — decays each frame.
  vx: number;
  vy: number;
  // 0..1 interaction "heat" — brightens the particle near a touch.
  heat: number;

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 0.5 - 0.25;
    this.speedY = Math.random() * 0.5 - 0.25;
    this.alpha = Math.random() * 0.5 + 0.1;
    this.vx = 0;
    this.vy = 0;
    this.heat = 0;
  }

  resetToEdge(w: number, h: number) {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { this.x = Math.random() * w; this.y = 0; }
    else if (edge === 1) { this.x = w; this.y = Math.random() * h; }
    else if (edge === 2) { this.x = Math.random() * w; this.y = h; }
    else { this.x = 0; this.y = Math.random() * h; }
    this.alpha = 0;
  }

  resetToCenter(w: number, centerY: number) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 50;
    this.x = w / 2 + Math.cos(angle) * radius;
    this.y = centerY + Math.sin(angle) * radius;
    this.alpha = 0;
  }

  update(
    radialSpeed: number,
    driftSpeed: number,
    deltaTime: number,
    w: number,
    h: number,
    centerY: number,
    pointer: PointerState,
    orb: { x: number; y: number; vx: number; vy: number } | null,
    reducedMotion: boolean,
  ) {
    const dt = deltaTime;
    if (this.alpha < 0.5) this.alpha += 0.01;

    const cx = w / 2;
    const cy = centerY;
    const dx = this.x - cx;
    const dy = this.y - cy;
    const dist = Math.hypot(dx, dy);

    // Breathing motion (inward/outward with the phase).
    if (dist > 0.1) {
      const uX = dx / dist;
      const uY = dy / dist;
      this.x += uX * radialSpeed * dt;
      this.y += uY * radialSpeed * dt;
    }

    // Ambient drift.
    this.x += this.speedX * driftSpeed * dt;
    this.y += this.speedY * driftSpeed * dt;

    // --- Interaction field -------------------------------------------------
    if (!reducedMotion && pointer.active) {
      const pdx = this.x - pointer.x;
      const pdy = this.y - pointer.y;
      const pdist = Math.hypot(pdx, pdy);

      if (pdist < INFLUENCE_RADIUS && pdist > 0.001) {
        const ux = pdx / pdist;
        const uy = pdy / pdist;
        const falloff = 1 - pdist / INFLUENCE_RADIUS;
        this.heat = Math.max(this.heat, falloff);

        // Press ripple: push particles outward while the finger is down.
        if (pointer.pressBurst > 0) {
          this.vx += ux * PRESS_PUSH * pointer.pressBurst * falloff * dt;
          this.vy += uy * PRESS_PUSH * pointer.pressBurst * falloff * dt;
        }

        // Drag/scroll swirl: tangential vortex around the pointer, stronger
        // with faster movement. Direction follows the drag vector.
        if (pointer.swirl > 0) {
          const speed = Math.min(Math.hypot(pointer.vx, pointer.vy), 1400);
          const tangent = { x: -uy, y: ux };
          const sign = pointer.vx >= 0 ? 1 : -1;
          const tangential = (speed / 1400) * SWIRL_PEAK;
          this.vx += tangent.x * tangential * pointer.swirl * falloff * dt * sign;
          this.vy += tangent.y * tangential * pointer.swirl * falloff * dt * sign;
        }
      } else {
        this.heat = Math.max(0, this.heat - 0.02);
      }
    }

    // The ball's particle coupling. Active pull while the finger is near the
    // ball; after release a softer residual wake rides the spring velocity so
    // the return path still feels alive. Wake-only (no center attraction) —
    // that is what previously piled particles under the orb. Disabled under
    // prefers-reduced-motion.
    if (!reducedMotion && orb != null) {
      const orbSpeed = Math.hypot(orb.vx, orb.vy);
      const pullingBall =
        pointer.active &&
        Math.hypot(pointer.x - orb.x, pointer.y - orb.y) < ORB_PULL_RADIUS;
      // Residual: finger up, ball still moving on its return spring.
      const residualWake = !pointer.active && orbSpeed > ORB_RESIDUAL_SPEED;
      if (pullingBall || residualWake) {
        const obdx = this.x - orb.x;
        const obdy = this.y - orb.y;
        const obdist = Math.hypot(obdx, obdy);
        if (obdist < ORB_PULL_RADIUS && obdist > 0.001) {
          const falloff = 1 - obdist / ORB_PULL_RADIUS;
          const wake = pullingBall
            ? ORB_WAKE
            : ORB_RESIDUAL_WAKE * Math.min(1, orbSpeed / 420);
          // Wake only: particles near the moving ball are pushed along its
          // motion vector (stronger closer to the ball) — no center-pull.
          this.vx += orb.vx * wake * falloff * dt;
          this.vy += orb.vy * wake * falloff * dt;
          if (residualWake) {
            // Soft heat so the return trail reads without a bright flash.
            this.heat = Math.max(this.heat, falloff * 0.25);
          }
        }
      } else if (!pointer.active) {
        // Gentle keep-out: when the ball is still, particles near it slowly
        // drift outward so the field can never pile up under the orb.
        const obdx = this.x - orb.x;
        const obdy = this.y - orb.y;
        const obdist = Math.hypot(obdx, obdy);
        if (obdist < ORB_PULL_RADIUS && obdist > 0.001) {
          const k = 1 - obdist / ORB_PULL_RADIUS;
          this.vx += (obdx / obdist) * 70 * k * dt;
          this.vy += (obdy / obdist) * 70 * k * dt;
        }
      }
    }

    // Apply + decay impulse velocity (exponential: ~4/s).
    const decay = Math.max(0, 1 - 4 * dt);
    this.vx *= decay;
    this.vy *= decay;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // --- Boundary & respawn (unchanged breathing logic) ---
    if (radialSpeed < -1 && dist < 30) {
      this.resetToEdge(w, h);
    } else if (radialSpeed > 1 && (this.x < 0 || this.x > w || this.y < 0 || this.y > h)) {
      this.resetToCenter(w, centerY);
    } else {
      if (this.x < 0) this.x = w;
      if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h;
      if (this.y > h) this.y = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, colorHex: string) {
    const a = Math.min(this.alpha + this.heat * 0.45, 0.92);
    ctx.fillStyle = colorHex + Math.floor(a * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + this.heat * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

const ParticleBackground: React.FC<ParticleProps> = ({ phase, color, speedMultiplier, orbRef, rippleRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const smoothedRadialSpeedRef = useRef<number>(0);
  const smoothedDriftSpeedRef = useRef<number>(0.2 * 60);
  const pointerRef = useRef<PointerState>({
    active: false,
    x: 0, y: 0, px: 0, py: 0,
    vx: 0, vy: 0,
    pressBurst: 0,
    swirl: 0,
    lastMoveTs: 0,
  });

  const phaseRef = useRef(phase);
  const prevPhaseRef = useRef(phase);
  const colorRef = useRef(color);
  const speedMultiplierRef = useRef(speedMultiplier);
  const orbRefRef = useRef(orbRef);
  const orbStateRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0 });
  const rippleRefRef = useRef(rippleRef);
  const reducedMotionRef = useRef(false);
  const idlePausedRef = useRef(false);
  const lastActivityTimeRef = useRef(Date.now());
  const animFrameIdRef = useRef<number | null>(null);
  const animateRef = useRef<((timestamp: number) => void) | null>(null);

  useEffect(() => {
    const colorChanged = colorRef.current !== color;
    phaseRef.current = phase;
    colorRef.current = color;
    speedMultiplierRef.current = speedMultiplier;
    orbRefRef.current = orbRef;
    rippleRefRef.current = rippleRef;

    // Wake the field when something needs a redraw: a phase leaving Idle,
    // or a mode change recoloring the particles. Mode changes come from the
    // native sheet — no pointer event reaches the webview — so the loop may
    // be idle-paused, and the new color would stay invisible until the next
    // touch (the "color only changes on click" bug).
    if ((phase !== BreathingPhase.Idle || colorChanged) && idlePausedRef.current) {
      idlePausedRef.current = false;
      lastActivityTimeRef.current = Date.now();
      if (animateRef.current) {
        animFrameIdRef.current = requestAnimationFrame(animateRef.current);
      }
    } else if (colorChanged) {
      // Loop is already running — keep it alive so the recolor renders and
      // the field doesn't immediately re-pause.
      lastActivityTimeRef.current = Date.now();
    }
  }, [phase, color, speedMultiplier, orbRef, rippleRef]);

  // Detect prefers-reduced-motion (iOS accessibility setting).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      // Reflect on the canvas element for test assertions.
      const canvas = canvasRef.current;
      if (canvas) {
        if (e.matches) canvas.setAttribute('data-reduced-motion', 'true');
        else canvas.removeAttribute('data-reduced-motion');
      }
    };
    mq.addEventListener('change', onChange);
    // Set initial attribute.
    if (mq.matches && canvasRef.current) {
      canvasRef.current.setAttribute('data-reduced-motion', 'true');
    }
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let displayWidth = rect.width || window.innerWidth;
    let displayHeight = rect.height || window.innerHeight;

    const initParticles = () => {
      const isMobile = displayWidth < 768 || window.innerHeight < 768;
      const baseCount = isMobile ? 50 : 80;
      const particleCount = reducedMotionRef.current ? Math.floor(baseCount / 2) : baseCount;
      particles.current = Array.from({ length: particleCount }, () => new Particle(displayWidth, displayHeight));
    };

    let animationFrameId: number;
    let lastTimestamp = 0;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resize = () => {
      lastActivityTimeRef.current = Date.now();
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        displayWidth = rect.width || window.innerWidth;
        displayHeight = rect.height || window.innerHeight;

        const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
        if (displayWidth === 0) displayWidth = 1;
        if (displayHeight === 0) displayHeight = 1;

        canvas.width = displayWidth * ratio;
        canvas.height = displayHeight * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        initParticles();
        lastTimestamp = 0;
        // Resume rAF if paused (orientation change, etc.).
        if (idlePausedRef.current) {
          idlePausedRef.current = false;
          animationFrameId = requestAnimationFrame(animate);
          animFrameIdRef.current = animationFrameId;
        }
      }, 100);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();

    // --- Interaction listeners (window-level: canvas stays pointer-events
    //     none so the orb/chips keep their taps, but every touch on the
    //     background still reaches the particle field). ----------------------
    const toLocal = (e: PointerEvent | WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      lastActivityTimeRef.current = Date.now();
      if (idlePausedRef.current) {
        idlePausedRef.current = false;
        lastTimestamp = 0;
        animationFrameId = requestAnimationFrame(animate);
        animFrameIdRef.current = animationFrameId;
        return; // Don't process this event as interaction if reduced motion
      }
      if (reducedMotionRef.current) return; // No interaction field in reduced motion
      const p = toLocal(e);
      const state = pointerRef.current;
      state.active = true;
      state.x = state.px = p.x;
      state.y = state.py = p.y;
      state.vx = 0;
      state.vy = 0;
      state.pressBurst = 1;
      state.swirl = 0;
      state.lastMoveTs = e.timeStamp;
    };

    const onPointerMove = (e: PointerEvent) => {
      lastActivityTimeRef.current = Date.now();
      if (idlePausedRef.current) {
        idlePausedRef.current = false;
        lastTimestamp = 0;
        animationFrameId = requestAnimationFrame(animate);
        animFrameIdRef.current = animationFrameId;
      }
      const state = pointerRef.current;
      if (!state.active || reducedMotionRef.current) return;
      const p = toLocal(e);
      state.px = state.x;
      state.py = state.y;
      state.x = p.x;
      state.y = p.y;
      // 1-frame velocity in px/s, smoothed.
      const dt = Math.max((e.timeStamp - state.lastMoveTs) / 1000, 0.001);
      state.lastMoveTs = e.timeStamp;
      const rawVx = (state.x - state.px) / dt;
      const rawVy = (state.y - state.py) / dt;
      state.vx = state.vx * 0.6 + rawVx * 0.4;
      state.vy = state.vy * 0.6 + rawVy * 0.4;
      state.swirl = Math.min(1, state.swirl + 0.35);
      // Press ripple fades once the finger starts moving (it's a drag now).
      state.pressBurst = Math.max(0, state.pressBurst - 0.35);
    };

    const onPointerUp = () => {
      lastActivityTimeRef.current = Date.now();
      const state = pointerRef.current;
      state.active = false;
      state.pressBurst = 0;
      state.swirl = 0;
    };

    const onWheel = (e: WheelEvent) => {
      lastActivityTimeRef.current = Date.now();
      if (idlePausedRef.current) {
        idlePausedRef.current = false;
        lastTimestamp = 0;
        animationFrameId = requestAnimationFrame(animate);
        animFrameIdRef.current = animationFrameId;
      }
      if (reducedMotionRef.current) return; // No interaction in reduced motion
      const p = toLocal(e);
      const state = pointerRef.current;
      state.x = state.px = p.x;
      state.y = state.py = p.y;
      state.vx = Math.sign(e.deltaX || e.deltaY) * Math.min(Math.abs(e.deltaX || e.deltaY) * 2, 1200);
      state.vy = 0;
      state.swirl = Math.min(1, state.swirl + 0.5);
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });

    const animate = (timestamp: number) => {
      if (!canvas || !ctx) return;

      const deltaSeconds = lastTimestamp
        ? Math.min(Math.max((timestamp - lastTimestamp) / 1000, 0), 0.05)
        : 0.016;
      lastTimestamp = timestamp;


      ctx.save();
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const currentPhase = phaseRef.current;
      const currentColor = colorRef.current;
      const currentMultiplier = speedMultiplierRef.current;

      // Session ended (breathing phase -> Idle): settle the field back into a
      // calm, spread float in one gentle pass. Idle keeps radial motion at 0,
      // so without this the particles would stay piled where the inhale left
      // them (the "stuck under the orb" look).
      if (prevPhaseRef.current !== BreathingPhase.Idle && currentPhase === BreathingPhase.Idle) {
        particles.current.forEach(p => {
          p.x = Math.random() * displayWidth;
          p.y = Math.random() * displayHeight;
          p.vx = 0;
          p.vy = 0;
          p.heat = 0;
          p.alpha = Math.max(p.alpha, 0.35); // soft fade so the re-scatter isn't a hard pop
        });
      }
      prevPhaseRef.current = currentPhase;

      const SPEED_PER_SECOND = 60;
      let targetRadialSpeed = 0;
      let targetDriftSpeed = 0.2 * SPEED_PER_SECOND;

      if (currentPhase === BreathingPhase.Inhale) {
        targetRadialSpeed = -3.5 * SPEED_PER_SECOND;
        targetDriftSpeed = 0.5 * SPEED_PER_SECOND;
      } else if (currentPhase === BreathingPhase.Exhale) {
        targetRadialSpeed = 1.2 * SPEED_PER_SECOND;
        targetDriftSpeed = 0.5 * SPEED_PER_SECOND;
      } else if (currentPhase === BreathingPhase.HoldIn || currentPhase === BreathingPhase.HoldOut) {
        targetRadialSpeed = 0;
        targetDriftSpeed = 0.6 * SPEED_PER_SECOND;
      } else {
        // Idle: pure float — gentle random drift only, exactly like the
        // original. (The post-session pile is handled by a one-time settle
        // re-scatter on the phase transition, not by pushing outward.)
        targetRadialSpeed = 0;
        targetDriftSpeed = 0.3 * SPEED_PER_SECOND;
      }

      targetRadialSpeed *= currentMultiplier;

      smoothedRadialSpeedRef.current += (targetRadialSpeed - smoothedRadialSpeedRef.current) * 0.05;
      smoothedDriftSpeedRef.current += (targetDriftSpeed - smoothedDriftSpeedRef.current) * 0.05;

      const centerY = displayHeight / 2 - (
        displayWidth < 640 ? Math.min(72, displayHeight * 0.085) : 0
      );

      // Orb anchor from the live wrapper rect (follows drag + spring-back).
      let orb: { x: number; y: number; vx: number; vy: number } | null = null;
      const orbEl = orbRefRef.current?.current;
      if (orbEl) {
        const r = orbEl.getBoundingClientRect();
        const ox = r.left + r.width / 2;
        const oy = r.top + r.height / 2;
        const s = orbStateRef.current;
        orb = { x: ox, y: oy, vx: (ox - s.lastX) / Math.max(deltaSeconds, 0.001), vy: (oy - s.lastY) / Math.max(deltaSeconds, 0.001) };
        s.lastX = ox;
        s.lastY = oy;
      } else {
        orb = { x: displayWidth / 2, y: centerY, vx: 0, vy: 0 };
      }

      // Landing ripple: one soft ring expanding from the orb's home when the
      // ball settles. Read once per frame, cleared when it expires.
      let ripple: { x: number; y: number; age: number } | null = null;
      const rippleReq = rippleRefRef.current;
      if (rippleReq?.current && orb && !reducedMotionRef.current) {
        const age = (timestamp - rippleReq.current.t) / 1000;
        if (age < RIPPLE_LIFE) {
          ripple = { x: orb.x, y: orb.y, age };
        } else {
          rippleReq.current = null;
        }
      }

      particles.current.forEach(p => {
        p.update(smoothedRadialSpeedRef.current, smoothedDriftSpeedRef.current, deltaSeconds, displayWidth, displayHeight, centerY, pointerRef.current, orb, reducedMotionRef.current);
        if (ripple) {
          const rx = p.x - ripple.x;
          const ry = p.y - ripple.y;
          const rd = Math.hypot(rx, ry);
          const ring = RIPPLE_R0 + RIPPLE_SPEED * ripple.age;
          const band = 1 - Math.min(Math.abs(rd - ring) / RIPPLE_BAND, 1);
          if (band > 0 && rd > 0.001) {
            const kick = RIPPLE_AMP * band * (1 - ripple.age / RIPPLE_LIFE);
            p.vx += (rx / rd) * kick * deltaSeconds;
            p.vy += (ry / rd) * kick * deltaSeconds;
            p.heat = Math.max(p.heat, band * 0.85);
          }
        }
        p.draw(ctx, currentColor);
      });

      ctx.restore();

      // Idle pause: stop rAF when Idle with no activity for ~4s (battery).
      if (phaseRef.current === BreathingPhase.Idle && Date.now() - lastActivityTimeRef.current > 4000) {
        idlePausedRef.current = true;
        return; // Leave last frame drawn, don't schedule next frame.
      }

      animationFrameId = requestAnimationFrame(animate);
      animFrameIdRef.current = animationFrameId;
    };

    animateRef.current = animate;
    animationFrameId = requestAnimationFrame(animate);
    animFrameIdRef.current = animationFrameId;

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000 opacity-70"
      style={{ willChange: 'transform', touchAction: 'none' }}
    />
  );
};

export default ParticleBackground;
