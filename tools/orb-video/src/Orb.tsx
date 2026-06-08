import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from "remotion";
import { Pattern, PATTERNS, phaseAt, borderRadiusAt, hueAt } from "./breathing";
import { particlesAt } from "./particles";
import { mix } from "./colors";
import { fontFamily } from "./font";

export type BreathProps = {
  patternKey: string;
  color: string;
  speed: number;
  audioSrc: string | null;
  labels: { Inhale: string; Hold: string; Exhale: string };
  theme: "light" | "dark";
  /**
   * Master loop length in seconds (an integer number of breath cycles). Used to
   * re-phase the morph/hue/ring periods and the particle field so frame
   * `loopFrames` is identical to frame 0 — i.e. the master is seam-safe and can
   * be stream-copied to longer durations without a teleport at the join.
   */
  loopSec: number;
};

export const defaultBreathProps: BreathProps = {
  patternKey: "box",
  color: "#e11d48",
  speed: 1,
  audioSrc: "site_audio.mp3",
  labels: { Inhale: "Inhale", Hold: "Hold", Exhale: "Exhale" },
  theme: "light",
  loopSec: 16,
};

export const Orb: React.FC<BreathProps> = ({ patternKey, color, speed, audioSrc, labels, theme, loopSec }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tMs = (frame / fps) * 1000;

  // Re-phase each hardcoded morph period so it completes a whole number of
  // cycles per master. `per` is always an exact integer divisor of loopMs, so
  // the MORPH/hue loops (already closed) land on their frame-0 state at the seam.
  const loopMs = loopSec * 1000;
  const loopFrames = Math.round(loopSec * fps);
  const per = (origMs: number) => loopMs / Math.max(1, Math.round(loopMs / origMs));
  const orbPeriod = per(16000);
  const glowPeriod = per(18000);
  const huePeriod = per(20000);
  const ringPeriod = per(30000);

  const pattern: Pattern = PATTERNS[patternKey] || PATTERNS.box;
  const { scale, label } = phaseAt(tMs, pattern, speed);
  const blobScale = 0.6 + scale * 0.4;
  const glowScale = 0.65 + scale * 0.5;

  const k = Math.min(width, height) / 1080; // resolution scale (1 at 1080p, 2 at 4K)
  const orbSize = Math.round(Math.min(width, height) * 0.36);
  const labelFont = Math.round(Math.min(width, height) * 0.033); // ~36px @1080 (text-4xl)

  // theme-derived vignette background
  const light = theme === "light";
  const CREAM = "#fdf8f2";
  const bgMid = light ? mix(color, CREAM, 0.92) : mix(color, "#000000", 0.83);
  const bgOuter = light ? CREAM : mix(color, "#000000", 0.88);
  const bg = light
    ? `radial-gradient(ellipse 80% 92% at 50% 47%, ${bgMid} 0%, ${bgOuter} 66%)`
    : `radial-gradient(ellipse 85% 96% at 50% 47%, ${bgMid} 0%, ${bgOuter} 100%)`;
  const glowOpacity = light ? 0.32 : 0.17;
  const ringOpacity = light ? 0.4 : 0.25;

  const specks = particlesAt(frame, width, height, fps, pattern, speed, loopFrames);

  return (
    <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}

      {specks.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x - p.size * k, top: p.y - p.size * k,
          width: p.size * 2 * k, height: p.size * 2 * k, borderRadius: "50%",
          background: color, opacity: p.alpha,
        }} />
      ))}

      <div style={{ position: "relative", width: orbSize, height: orbSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* organic, strongly vertical glow (taller than wide, not round) */}
        <span style={{
          position: "absolute", width: "122%", height: "208%",
          background: color, filter: `blur(${60 * k}px)`, opacity: glowOpacity,
          borderRadius: borderRadiusAt(tMs, glowPeriod),
          transform: `scale(${glowScale})`,
        }} />
        {/* ring line (organic, just outside the orb) */}
        <div style={{
          position: "absolute", inset: 0, border: `${2 * k}px solid ${color}`, opacity: ringOpacity,
          borderRadius: borderRadiusAt(tMs, ringPeriod), transform: "scale(1.09)",
        }} />
        {/* orb */}
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          background: color, boxShadow: `inset 0 0 ${40 * k}px ${color}55`,
          borderRadius: borderRadiusAt(tMs, orbPeriod),
          transform: `scale(${blobScale})`,
          filter: `hue-rotate(${hueAt(tMs, huePeriod)}deg)`,
        }} />
        {/* label — separate non-scaling layer */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{
            color: "white", opacity: 0.9, fontFamily,
            fontSize: labelFont, fontWeight: 700,
            letterSpacing: labelFont * 0.1, textTransform: "uppercase",
            textShadow: "0 1px 3px rgba(0,0,0,0.35)",
          }}>
            {labels[label as keyof typeof labels] ?? label}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
