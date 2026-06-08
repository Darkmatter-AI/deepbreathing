'use client';

import React, { useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { BreathingPhase } from '../types';

interface VisualizerProps {
  phase: BreathingPhase;
  progress: number;
  scale: number;
  color: string;
  label: string;
  instructions: string;
  isRunning: boolean;
  onClick: () => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ scale, color, label, instructions, isRunning, onClick }) => {
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
      animation: 'morph 30s ease-in-out infinite'
    }),
    [color]
  );

  return (
    <div className="group relative z-10 flex h-64 w-64 flex-col items-center justify-center sm:h-80 sm:w-80 md:h-96 md:w-96">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <span className="block rounded-full" aria-hidden style={glowStyle} />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 z-10 rounded-full border opacity-30 pointer-events-none"
        style={ringStyle}
      />

      {/* Interactive Orb */}
      <button
        onClick={onClick}
        className="absolute z-20 flex h-full w-full cursor-pointer items-center justify-center rounded-full outline-none hover:brightness-110 animate-blob animate-hue"
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
          <Play size={64} className="ml-2 fill-white text-white opacity-90 drop-shadow-md" />
        </div>

        {/* Text visuals */}
        <div
          className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${isRunning ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div className="flex flex-col items-center transition-opacity duration-300">
            <h2 className="text-4xl font-bold uppercase tracking-widest text-white opacity-90 drop-shadow-sm text-center px-4">
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
  );
};

export default Visualizer;
