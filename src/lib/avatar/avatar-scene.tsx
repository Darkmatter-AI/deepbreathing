import React from 'react';
import { AvatarParams, blobPath } from './params';

// Satori-safe avatar scene (text-free, so no font loading).
//
// The blob silhouette is a sum-of-sines SVG <path> (the spike confirmed Satori
// renders inline <path> with cubic-bezier commands). Glow + ring are built from
// the SAME harmonics at larger radii as plain FILLED paths layered behind the orb
// — no stroke / no <filter> / no transform, so we stay inside Satori's proven
// feature set. Glow/ring/particles drop below 64px (invisible at favicon size).
export function renderAvatarScene(p: AvatarParams, size: number) {
  const detail = size >= 64;
  const box = Math.round(size * 0.74); // svg viewport; leaves room for the halo

  const orbPath = blobPath(p.harmonics, 33);
  const ringPath = blobPath(p.harmonics, 36);
  const glowPath = blobPath(p.harmonics, 40);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: p.bgTint,
        borderRadius: Math.round(size * 0.22),
      }}
    >
      {detail &&
        p.particles.map((pt, i) => {
          const d = (pt.r * 2 * size) / 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: (pt.cx / 100) * size - d / 2,
                top: (pt.cy / 100) * size - d / 2,
                width: d,
                height: d,
                borderRadius: '50%',
                background: p.fill,
                opacity: pt.alpha,
                display: 'flex',
              }}
            />
          );
        })}

      <svg width={box} height={box} viewBox="0 0 100 100">
        {detail && <path d={glowPath} fill={p.glow} opacity={0.3} />}
        {detail && <path d={ringPath} fill={p.ring} opacity={0.55} />}
        <path d={orbPath} fill={p.fill} />
      </svg>
    </div>
  );
}
