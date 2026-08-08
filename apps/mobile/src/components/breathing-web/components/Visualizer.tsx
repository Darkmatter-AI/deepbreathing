'use client';

import React, { useMemo } from 'react';
import { Pause } from 'lucide-react';
import { BreathingPhase } from '../types';

// Play triangle matching the desktop site's lucide 0.471 `Play` polygon
// (points "6 3 20 12 6 21 6 3"), with a SMALL corner radius (stroke round
// join at strokeWidth 2 → ~1 unit ≈ 2.7px at 64px). lucide-react 1.x replaced
// the icon with a 2-unit-radius path, which reads as a blobby triangle on the
// mobile orb — the "triangle radius" regression. Kept as raw SVG so a future
// lucide bump can't silently re-round it.
const PlayTriangle: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <polygon
      points="6 3 20 12 6 21 6 3"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </svg>
);

interface VisualizerProps {
  phase: BreathingPhase;
  progress: number;
  scale: number;
  color: string;
  label: string;
  instructions: string;
  isRunning: boolean;
  onClick: () => void;
  /** Applied to the draggable ball assembly (orb + glow + content).
   *  Also the particle field's anchor rect. */
  dragRef?: React.RefObject<HTMLDivElement | null>;
  /** Applied to the outer ring's own layer, which the host translates to
   *  slowly chase the ball (lagging follower). */
  ringRef?: React.RefObject<HTMLDivElement | null>;
  /** Session wall-clock progress 0..1 — drives the dot travelling the ring.
   *  When null the dot is hidden (open-ended session / not running). */
  sessionProgress?: number | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ scale, color, label, instructions, isRunning, onClick, dragRef, ringRef, sessionProgress }) => {
  const blobScale = 0.6 + scale * 0.4;
  const glowScale = 0.65 + scale * 0.5;

  const orbStyle = useMemo(
    () => ({
      backgroundColor: color,
      boxShadow: `inset 0 0 40px ${color}55`
    }),
    [color]
  );

  const orbTransformStyle = {
    transform: `scale(${blobScale})`,
    animation: 'morph 16s ease-in-out infinite, hue-rotate 20s linear infinite'
  };

  const glowStyle = useMemo(
    () => ({
      backgroundColor: color,
      filter: 'blur(50px)',
      transform: `scale(${glowScale})`,
      width: '180%',
      height: '180%',
      borderRadius: '50%',
      opacity: 0.32,
      willChange: 'transform, opacity'
    }),
    [color, glowScale]
  );

  const ringStyle = useMemo(
    () => ({
      borderColor: `${color}55`,
      transform: 'scale(1.08)',
    }),
    [color]
  );

  // Session-progress dot: rides the ring clockwise from 12 o'clock.
  // Placed inside the scaled ring-border div so it stays on the border edge.
  // Hidden when sessionProgress is null (open-ended / not running).
  const showDot = sessionProgress != null;
  const dotAngle = (sessionProgress ?? 0) * 2 * Math.PI;
  const dotStyle = useMemo(
    () => ({
      left: `calc(50% + ${50 * Math.sin(dotAngle)}% - 3px)`,
      top: `calc(50% - ${50 * Math.cos(dotAngle)}% - 3px)`,
      width: '6px',
      height: '6px',
      backgroundColor: color,
      boxShadow: `0 0 7px ${color}, 0 0 16px ${color}44`,
      opacity: showDot ? 0.7 : 0,
      transition: 'opacity 300ms',
    }),
    [color, dotAngle, showDot],
  );

  return (
    <div className="group relative z-10 flex h-64 w-64 flex-col items-center justify-center sm:h-80 sm:w-80 md:h-96 md:w-96">
      {/* Outer ring — a lagging follower: the host slowly eases this layer
          toward the ball's offset while it is pulled, then drifts it back
          home at a slower pace than the ball itself. */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 will-change-transform"
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute inset-0 rounded-full border opacity-30"
          style={ringStyle}
        >
          {/* Session-progress dot — travels clockwise along the ring border.
              Hidden for open-ended (no-duration) sessions. */}
          <span data-session-dot aria-hidden className="absolute rounded-full will-change-[left,top]" style={dotStyle} />
        </div>
      </div>

      {/* Draggable ball assembly: glow + orb + overlay content move together.
          pointer-events-none so the ring/background still get touches; the
          orb button re-enables them for itself. */}
      <div
        ref={dragRef}
        className="absolute inset-0 z-20 pointer-events-none will-change-transform"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <span className="block rounded-full" aria-hidden style={glowStyle} />
        </div>

        {/* Interactive Orb */}
        <button
          onClick={onClick}
          className="pointer-events-auto absolute z-20 flex h-full w-full cursor-pointer items-center justify-center rounded-full outline-none hover:brightness-110 animate-blob animate-hue"
          style={{ ...orbStyle, ...orbTransformStyle }}
          aria-label={isRunning ? 'Pause Session' : 'Start Session'}
        />

        {/* Overlay Content (Not Scaled) */}
        <div className="pointer-events-none absolute z-30 flex h-full w-full flex-col items-center justify-center">
        {/* Play Icon */}
        <div
          className={`absolute flex items-center justify-center transition-all duration-500 ${!isRunning ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
        >
          <PlayTriangle size={64} className="ml-2 fill-white text-white opacity-90 drop-shadow-md" />
        </div>

        {/* Text visuals */}
        <div
          className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${isRunning ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div className="flex flex-col items-center transition-opacity duration-300">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-widest text-white opacity-90 drop-shadow-sm text-center px-4">
              {label}
            </h2>
            {instructions && (
              <p className="mt-2 text-lg font-medium text-white/80 drop-shadow-sm text-center max-w-[200px] leading-tight opacity-75">
                {instructions}
              </p>
            )}
            {/* Tap-to-pause hint: subtle on mobile (always visible at low opacity),
                brightens on hover for desktop. Addresses UX-BACKLOG P0 #1 — users
                were abandoning because the orb had no visual cue it's clickable. */}
            <div className="mt-4 flex items-center gap-1.5 text-white opacity-60 group-hover:opacity-95 transition-opacity">
              <Pause size={14} className="fill-current" />
              <span className="text-xs uppercase tracking-wider">Tap to pause</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Visualizer;
