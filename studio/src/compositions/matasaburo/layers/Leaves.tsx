import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { PALETTE, SECTIONS } from '../constants';

interface LeafSpec {
  id: number;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  size: number;
  rotSpeed: number;
  phase: number;
}

const LEAVES: LeafSpec[] = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  startX: random(`leaf-x-${i}`) * 2100,
  startY: random(`leaf-y-${i}`) * 1150,
  vx: 10 + random(`leaf-vx-${i}`) * 16,
  vy: -2 + random(`leaf-vy-${i}`) * 7,
  size: 16 + random(`leaf-sz-${i}`) * 20,
  rotSpeed: (random(`leaf-rs-${i}`) - 0.5) * 14,
  phase: random(`leaf-ph-${i}`) * Math.PI * 2,
}));

export const Leaves: React.FC = () => {
  const frame = useCurrentFrame();

  let mode: 'none' | 'summer_gale' | 'maple_swirl' | 'last_leaf' | 'end_drift' =
    'none';
  let count = 0;

  if (frame >= SECTIONS.S3.start && frame < SECTIONS.S4.start) {
    mode = 'summer_gale';
    count = 16;
  } else if (frame >= SECTIONS.S6a.start && frame < SECTIONS.S6b.start) {
    mode = 'summer_gale';
    count = 20;
  } else if (frame >= SECTIONS.S6b.start && frame < SECTIONS.S7.start) {
    mode = 'maple_swirl';
    count = 42;
  } else if (frame >= SECTIONS.S7.start && frame < SECTIONS.S8.start) {
    mode = 'last_leaf';
    count = 1;
  } else if (frame >= SECTIONS.S8.start) {
    mode = 'end_drift';
    count = 8;
  }

  if (mode === 'none' || count === 0) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        {mode === 'last_leaf' ? (
          (() => {
            // Single final autumn leaf drifting slowly down across S7
            const t = frame - SECTIONS.S7.start;
            const y = interpolate(t, [0, 560], [120, 1020], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const x = 1150 - t * 0.45 + Math.sin(t * 0.045) * 70;
            const rot = Math.sin(t * 0.06) * 35 + t * 0.3;
            const op = interpolate(t, [500, 580], [0.95, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <g transform={`translate(${x}, ${y}) rotate(${rot})`} opacity={op}>
                <path
                  d="M 0 -18 C 12 -10, 16 6, 0 20 C -16 6, -12 -10, 0 -18 Z"
                  fill={PALETTE.autumnMapleRed}
                />
                <path
                  d="M 0 -16 L 0 24"
                  stroke={PALETTE.deadLeafBrown}
                  strokeWidth={2}
                />
              </g>
            );
          })()
        ) : (
          LEAVES.slice(0, count).map((leaf) => {
            const isMaple = mode === 'maple_swirl' || mode === 'end_drift';
            const speedScale =
              mode === 'end_drift' ? 0.25 : mode === 'maple_swirl' ? 1.2 : 1.0;

            const spanX = 2200;
            const spanY = 1200;
            const rawX =
              (leaf.startX - frame * leaf.vx * speedScale) % spanX;
            const x = rawX < -120 ? rawX + spanX : rawX;

            const dy =
              mode === 'maple_swirl'
                ? -frame * (3 + (leaf.id % 4)) // swirling upward
                : frame * Math.abs(leaf.vy) * (mode === 'end_drift' ? 0.5 : 0.7);
            const rawY =
              (leaf.startY + dy + Math.sin(frame * 0.08 + leaf.phase) * 35) %
              spanY;
            const y = rawY < -80 ? rawY + spanY : rawY;

            const rot = frame * leaf.rotSpeed;
            const color = isMaple
              ? leaf.id % 3 === 0
                ? PALETTE.autumnSunsetOrange
                : PALETTE.autumnMapleRed
              : leaf.id % 2 === 0
              ? PALETTE.riceGreen
              : PALETTE.sunflowerYellow;

            return (
              <g
                key={leaf.id}
                transform={`translate(${x}, ${y}) rotate(${rot}) scale(${
                  leaf.size / 22
                })`}
                opacity={mode === 'end_drift' ? 0.65 : 0.88}
              >
                {isMaple ? (
                  <path
                    d="M 0 -16 L 4 -6 L 15 -8 L 8 1 L 14 10 L 3 7 L 0 17 L -3 7 L -14 10 L -8 1 L -15 -8 L -4 -6 Z"
                    fill={color}
                  />
                ) : (
                  <path
                    d="M 0 -14 C 9 -8, 12 4, 0 15 C -12 4, -9 -8, 0 -14 Z"
                    fill={color}
                  />
                )}
              </g>
            );
          })
        )}
      </svg>
    </AbsoluteFill>
  );
};
