import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { SECTIONS } from '../constants';

interface StreakSpec {
  id: number;
  y: number;
  length: number;
  thickness: number;
  speedMul: number;
  phase: number;
  opacity: number;
}

const STREAKS: StreakSpec[] = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  y: 40 + random(`wind-y-${i}`) * 960,
  length: 140 + random(`wind-len-${i}`) * 360,
  thickness: 1.5 + random(`wind-th-${i}`) * 3.5,
  speedMul: 0.75 + random(`wind-spd-${i}`) * 0.7,
  phase: random(`wind-ph-${i}`) * 2400,
  opacity: 0.25 + random(`wind-op-${i}`) * 0.5,
}));

export interface WindStreaksProps {
  bassPulse: number;
}

export const WindStreaks: React.FC<WindStreaksProps> = ({ bassPulse }) => {
  const frame = useCurrentFrame();

  // Density & speed vary by storyboard section
  let activeCount = 10;
  let baseSpeed = 24;
  let globalOpacity = 0.35;

  if (frame < SECTIONS.S2.start) {
    activeCount = 8;
    baseSpeed = 18;
    globalOpacity = 0.28;
  } else if (frame < SECTIONS.S3.start) {
    activeCount = 12;
    baseSpeed = 24;
    globalOpacity = 0.38;
  } else if (frame < SECTIONS.S4.start) {
    // S3: 風線 ×3, speed linked to mix bass
    activeCount = 34;
    baseSpeed = 48 + bassPulse * 34;
    globalOpacity = 0.72 + bassPulse * 0.2;
  } else if (frame < SECTIONS.S5.start) {
    activeCount = 14;
    baseSpeed = 28;
    globalOpacity = 0.35;
  } else if (frame < SECTIONS.S6a.start) {
    activeCount = 18;
    baseSpeed = 34;
    globalOpacity = 0.45;
  } else if (frame < SECTIONS.S6b.start) {
    // S6a: highest density storm wind
    activeCount = 48;
    baseSpeed = 62 + bassPulse * 38;
    globalOpacity = 0.85;
  } else if (frame < SECTIONS.S7.start) {
    activeCount = 36;
    baseSpeed = 46 + bassPulse * 24;
    globalOpacity = 0.68;
  } else if (frame < SECTIONS.S8.start) {
    // S7: wind lines gradually fade out
    const t = interpolate(frame, [SECTIONS.S7.start, SECTIONS.S7.end], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    activeCount = Math.max(2, Math.round(20 * t));
    baseSpeed = 24 * (0.4 + 0.6 * t);
    globalOpacity = 0.45 * t;
  } else {
    activeCount = 0;
    globalOpacity = 0;
  }

  if (activeCount === 0 || globalOpacity <= 0.01) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, opacity: globalOpacity }}
      >
        {STREAKS.slice(0, activeCount).map((s) => {
          const span = 2500;
          const rawX = (s.phase - frame * baseSpeed * s.speedMul) % span;
          const x = rawX < -450 ? rawX + span : rawX;
          const curveDip = Math.sin(frame * 0.08 + s.id) * 14;

          return (
            <path
              key={s.id}
              d={`M ${x} ${s.y} Q ${x + s.length * 0.5} ${s.y + curveDip}, ${
                x + s.length
              } ${s.y - 4}`}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={s.thickness}
              strokeLinecap="round"
              fill="none"
              opacity={s.opacity}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
