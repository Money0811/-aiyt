import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { SECTIONS } from '../constants';

interface DropSpec {
  id: number;
  x: number;
  y: number;
  len: number;
  speed: number;
  opacity: number;
}

const DROPS: DropSpec[] = Array.from({ length: 140 }, (_, i) => ({
  id: i,
  x: random(`rain-x-${i}`) * 2200 - 140,
  y: random(`rain-y-${i}`) * 1200,
  len: 32 + random(`rain-len-${i}`) * 44,
  speed: 38 + random(`rain-spd-${i}`) * 26,
  opacity: 0.25 + random(`rain-op-${i}`) * 0.45,
}));

export const Rain: React.FC = () => {
  const frame = useCurrentFrame();

  // Rain falls during S5 (A2) and S6a (storm), fading out early in S6b
  const opacity = interpolate(
    frame,
    [
      SECTIONS.S5.start,
      SECTIONS.S5.start + 30,
      SECTIONS.S6b.start,
      SECTIONS.S6b.start + 90,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (opacity <= 0.01) return null;

  const isHeavy = frame >= SECTIONS.S6a.start;
  const activeCount = isHeavy ? 140 : 95;
  const slant = isHeavy ? -16 : -11; // slanting wind-driven rain

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden', opacity }}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        {DROPS.slice(0, activeCount).map((d) => {
          const spanX = 2200;
          const spanY = 1200;
          const rawX = (d.x + frame * slant * 0.85) % spanX;
          const x = rawX < -150 ? rawX + spanX : rawX;
          const y = (d.y + frame * d.speed) % spanY;

          return (
            <line
              key={d.id}
              x1={x}
              y1={y}
              x2={x + slant}
              y2={y + d.len}
              stroke="rgba(220, 236, 255, 0.85)"
              strokeWidth={isHeavy ? 2.2 : 1.6}
              strokeLinecap="round"
              opacity={d.opacity}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
