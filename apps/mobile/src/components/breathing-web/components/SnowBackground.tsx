'use client';

import React, { useEffect, useRef } from 'react';
import { BreathingPhase } from '../types';

interface SnowBackgroundProps {
  tone?: 'light' | 'dark';
  speedMultiplier?: number;
  phase?: BreathingPhase;
}

class Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  sway: number;
  alpha: number;
  phase: number;

  constructor(w: number, h: number) {
    this.x = 0;
    this.y = 0;
    this.radius = 0;
    this.speed = 0;
    this.drift = 0;
    this.sway = 0;
    this.alpha = 0;
    this.phase = 0;
    this.reset(w, h, true);
  }

  reset(w: number, h: number, startInView: boolean) {
    this.radius = Math.random() * 3 + 1;  // Larger snowflakes (1-4px)
    this.x = Math.random() * w;
    this.y = startInView ? Math.random() * h : -this.radius - Math.random() * h * 0.2;
    this.speed = Math.random() * 25 + 18;
    this.drift = Math.random() * 12 - 6;
    this.sway = Math.random() * 0.6 + 0.2;
    this.alpha = Math.random() * 0.4 + 0.5;  // More opaque (0.5-0.9)
    this.phase = Math.random() * Math.PI * 2;
  }

  update(deltaSeconds: number, w: number, h: number, speedScale: number, driftScale: number) {
    this.phase += deltaSeconds * 0.8;
    this.y += this.speed * speedScale * deltaSeconds;
    this.x += (this.drift * driftScale + Math.sin(this.phase) * this.sway * 10 * driftScale) * deltaSeconds;

    if (this.y - this.radius > h) {
      this.reset(w, h, false);
    }

    if (this.x < -10) this.x = w + 10;
    if (this.x > w + 10) this.x = -10;
  }

  draw(ctx: CanvasRenderingContext2D, color: { r: number; g: number; b: number }) {
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

const SnowBackground: React.FC<SnowBackgroundProps> = ({ tone = 'light', speedMultiplier = 1, phase }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakes = useRef<Snowflake[]>([]);
  const toneRef = useRef(tone);
  const speedRef = useRef(speedMultiplier);
  const phaseRef = useRef<BreathingPhase | undefined>(phase);

  useEffect(() => {
    toneRef.current = tone;
  }, [tone]);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let displayWidth = 1;
    let displayHeight = 1;
    let animationFrameId: number;
    let lastTimestamp = 0;
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const initFlakes = () => {
      const isMobile = displayWidth < 768 || window.innerHeight < 768;
      const flakeCount = isMobile ? 80 : 140;
      flakes.current = Array.from({ length: flakeCount }, () => new Snowflake(displayWidth, displayHeight));
    };

    const resize = () => {
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
        initFlakes();
        lastTimestamp = 0;
      }, 100);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();

    const animate = (timestamp: number) => {
      const deltaSeconds = lastTimestamp
        ? Math.min(Math.max((timestamp - lastTimestamp) / 1000, 0), 0.05)
        : 0.016;
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const isDark = toneRef.current === 'dark';
      // Snow color: white for dark mode, soft blue-gray for light mode (visible on cream bg)
      const color = isDark
        ? { r: 255, g: 255, b: 255 }
        : { r: 140, g: 170, b: 200 };
      const baseSpeedScale = Math.min(Math.max(speedRef.current ?? 1, 0.6), 1.4);
      const currentPhase = phaseRef.current;

      // Breathing-responsive snow motion:
      // Inhale: snow falls normally (gravity)
      // Exhale: snow floats/drifts upward slightly (suspended, weightless)
      // Holds: gentle suspension
      // Idle: soft steady drift
      const phaseMotion = (() => {
        if (currentPhase === BreathingPhase.Inhale || currentPhase === BreathingPhase.Inhale2) {
          // Normal falling - snow comes down with breath
          return { vertical: 1, drift: 0.8 };
        }
        if (currentPhase === BreathingPhase.Exhale) {
          // Floating/suspended - snow drifts gently, barely falls (or rises slightly)
          return { vertical: -0.15, drift: 1.8 };
        }
        if (currentPhase === BreathingPhase.HoldIn || currentPhase === BreathingPhase.HoldOut) {
          // Suspended during holds - snow hangs in air
          return { vertical: 0.1, drift: 0.5 };
        }
        // Idle - gentle steady snowfall
        return { vertical: 0.5, drift: 0.6 };
      })();

      flakes.current.forEach((flake) => {
        flake.update(
          deltaSeconds,
          displayWidth,
          displayHeight,
          baseSpeedScale * phaseMotion.vertical,
          phaseMotion.drift
        );
        flake.draw(ctx, color);
      });

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
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full pointer-events-none opacity-70"
      style={{ willChange: 'transform' }}
    />
  );
};

export default SnowBackground;
