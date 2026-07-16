'use client';

import React, { useEffect, useRef } from 'react';
import { BreathingPhase } from '../types';

export interface ParticleTuning {
  density?: number;
  driftIntensity?: number;
  flow?: number;
  gravityOffsetY?: number;
  smoothing?: number;
  velocity?: number;
}

interface ParticleProps {
  phase: BreathingPhase;
  color: string;
  speedMultiplier: number;
  tuning?: ParticleTuning;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = Math.random() * 3 + 1;
    // Base random drift velocity
    this.speedX = Math.random() * 0.5 - 0.25;
    this.speedY = Math.random() * 0.5 - 0.25;
    this.alpha = Math.random() * 0.5 + 0.1;
  }

  // Reset particle to a random position on the screen edges
  resetToEdge(w: number, h: number) {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    if (edge === 0) { this.x = Math.random() * w; this.y = 0; }
    else if (edge === 1) { this.x = w; this.y = Math.random() * h; }
    else if (edge === 2) { this.x = Math.random() * w; this.y = h; }
    else { this.x = 0; this.y = Math.random() * h; }
    this.alpha = 0; // Fade in
  }

  // Reset particle to a random position near the center
  resetToCenter(w: number, h: number, centerY = h / 2) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 50; // Start slightly off-center
    this.x = w / 2 + Math.cos(angle) * radius;
    this.y = centerY + Math.sin(angle) * radius;
    this.alpha = 0; // Fade in
  }

  update(
    radialSpeed: number,
    driftSpeed: number,
    deltaTime: number,
    w: number,
    h: number,
    gravityOffsetY = 0,
  ) {
    // Fade in effect if alpha was reset
    if (this.alpha < 0.5) this.alpha += 0.01;

    const cx = w / 2;
    const cy = h / 2 + h * clamp(gravityOffsetY, -0.5, 0.5);
    const dx = this.x - cx;
    const dy = this.y - cy;
    const dist = Math.hypot(dx, dy);

    // Apply Radial Velocity (Inward/Outward)
    if (dist > 0.1) {
      const uX = dx / dist;
      const uY = dy / dist;
      const radialStep = radialSpeed * deltaTime;
      this.x += uX * radialStep;
      this.y += uY * radialStep;
    }

    // Apply Drift Velocity (Random noise)
    const driftStep = driftSpeed * deltaTime;
    this.x += this.speedX * driftStep;
    this.y += this.speedY * driftStep;

    // --- Boundary & Respawn Logic ---

    // Case 1: Strong Inhale (Sucking in)
    // If particle gets too close to center, respawn at edge
    if (radialSpeed < -1 && dist < 30) {
      this.resetToEdge(w, h);
    }
    // Case 2: Strong Exhale (Blowing out)
    // If particle goes off screen, respawn near center
    else if (radialSpeed > 1 && (this.x < 0 || this.x > w || this.y < 0 || this.y > h)) {
      this.resetToCenter(w, h, cy);
    }
    // Case 3: Idle/Hold (Drift)
    // Standard screen wrapping
    else {
      if (this.x < 0) this.x = w;
      if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h;
      if (this.y > h) this.y = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, colorHex: string) {
    ctx.fillStyle = colorHex + Math.floor(Math.min(this.alpha, 0.6) * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const ParticleBackground: React.FC<ParticleProps> = ({ phase, color, speedMultiplier, tuning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  // Two speed factors: Radial (In/Out) and Drift (Random Chaos)
  const smoothedRadialSpeedRef = useRef<number>(0);
  const smoothedDriftSpeedRef = useRef<number>(0.2 * 60);

  // Refs to hold latest props for the animation loop
  const phaseRef = useRef(phase);
  const colorRef = useRef(color);
  const speedMultiplierRef = useRef(speedMultiplier);
  const tuningRef = useRef<ParticleTuning | undefined>(tuning);

  const density = tuning?.density;
  const driftIntensity = tuning?.driftIntensity;
  const flow = tuning?.flow;
  const gravityOffsetY = tuning?.gravityOffsetY;
  const smoothing = tuning?.smoothing;
  const velocity = tuning?.velocity;

  useEffect(() => {
    phaseRef.current = phase;
    colorRef.current = color;
    speedMultiplierRef.current = speedMultiplier;
    tuningRef.current = { density, driftIntensity, flow, gravityOffsetY, smoothing, velocity };
  }, [color, density, driftIntensity, flow, gravityOffsetY, phase, smoothing, speedMultiplier, velocity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let displayWidth = rect.width || window.innerWidth;
    let displayHeight = rect.height || window.innerHeight;

    const getTargetParticleCount = () => {
      // Reduce particle count on mobile for better performance
      const isMobile = displayWidth < 768 || window.innerHeight < 768;
      const configuredDensity = tuningRef.current?.density;
      return configuredDensity === undefined
        ? (isMobile ? 50 : 80)
        : Math.round(20 + clamp(configuredDensity, 0, 1) * (isMobile ? 70 : 100));
    };

    const syncParticleCount = () => {
      const targetCount = getTargetParticleCount();
      if (particles.current.length > targetCount) {
        particles.current.length = targetCount;
      }
      while (particles.current.length < targetCount) {
        particles.current.push(new Particle(displayWidth, displayHeight));
      }
    };

    const initParticles = () => {
      particles.current = [];
      syncParticleCount();
    };

    let animationFrameId: number;
    let lastTimestamp = 0;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resize = () => {
      // Debounce resize to prevent jitter on mobile
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        displayWidth = rect.width || window.innerWidth;
        displayHeight = rect.height || window.innerHeight;

        // Cap devicePixelRatio at 2 for better mobile performance
        const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

        // Ensure we don't set 0 dimensions
        if (displayWidth === 0) displayWidth = 1;
        if (displayHeight === 0) displayHeight = 1;

        canvas.width = displayWidth * ratio;
        canvas.height = displayHeight * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        initParticles();
        lastTimestamp = 0;
      }, 100);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();

    const animate = (timestamp: number) => {
      if (!canvas || !ctx) return;

      // Use a more stable delta time calculation for mobile
      const deltaSeconds = lastTimestamp
        ? Math.min(Math.max((timestamp - lastTimestamp) / 1000, 0), 0.05)
        : 0.016;
      lastTimestamp = timestamp;

      // Use save/restore for better performance on mobile
      ctx.save();
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const currentPhase = phaseRef.current;
      const currentColor = colorRef.current;
      const currentMultiplier = speedMultiplierRef.current;
      const currentTuning = tuningRef.current;

      syncParticleCount();

      // Determine target speeds based on phase
      const SPEED_PER_SECOND = 60;
      let targetRadialSpeed = 0;
      let targetDriftSpeed = 0.2 * SPEED_PER_SECOND;

      if (currentPhase === BreathingPhase.Inhale) {
        // Inhale: Particles move Inward (negative radial speed)
        targetRadialSpeed = -3.5 * SPEED_PER_SECOND;
        targetDriftSpeed = 0.5 * SPEED_PER_SECOND; // Slightly more chaos
      } else if (currentPhase === BreathingPhase.Exhale) {
        // Exhale: Particles move Outward (positive radial speed)
        // Reduced from 3.5 to 1.2 (approx 1/3) for gentler exhale
        targetRadialSpeed = 1.2 * SPEED_PER_SECOND;
        targetDriftSpeed = 0.5 * SPEED_PER_SECOND;
      } else if (currentPhase === BreathingPhase.HoldIn || currentPhase === BreathingPhase.HoldOut) {
        // Hold: Suspended
        targetRadialSpeed = 0;
        // Increased from 0.1 to 0.6 so they float/drift more noticeably in space
        targetDriftSpeed = 0.6 * SPEED_PER_SECOND;
      } else {
        // Idle
        targetRadialSpeed = 0;
        targetDriftSpeed = 0.3 * SPEED_PER_SECOND;
      }

      if (currentTuning?.flow !== undefined) {
        const configuredFlow = clamp(currentTuning.flow, -1, 1);
        const directionalBase = configuredFlow < 0 ? 3.5 : 1.2;
        targetRadialSpeed = configuredFlow * directionalBase * SPEED_PER_SECOND;
      }

      if (currentTuning?.driftIntensity !== undefined) {
        targetDriftSpeed *= clamp(currentTuning.driftIntensity, 0, 2);
      }

      // Apply user speed multiplier to the intensity
      targetRadialSpeed *= currentMultiplier * clamp(currentTuning?.velocity ?? 1, 0, 2);

      // Smoothly interpolate (Lerp) current values towards targets
      // Using 0.05 for a smooth, heavy feel
      const smoothingFactor = currentTuning?.smoothing === undefined
        ? 0.05
        : 0.14 - clamp(currentTuning.smoothing, 0, 1) * 0.12;
      smoothedRadialSpeedRef.current += (targetRadialSpeed - smoothedRadialSpeedRef.current) * smoothingFactor;
      smoothedDriftSpeedRef.current += (targetDriftSpeed - smoothedDriftSpeedRef.current) * smoothingFactor;

      // Batch drawing operations for better mobile performance
      particles.current.forEach(p => {
        p.update(
          smoothedRadialSpeedRef.current,
          smoothedDriftSpeedRef.current,
          deltaSeconds,
          displayWidth,
          displayHeight,
          currentTuning?.gravityOffsetY,
        );
        p.draw(ctx, currentColor);
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000 opacity-70"
      style={{ willChange: 'transform' }}
    />
  );
};

export default ParticleBackground;
