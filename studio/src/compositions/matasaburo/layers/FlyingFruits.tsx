import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { EVENTS } from '../constants';

interface FruitSpec {
  id: number;
  kind: 'walnut' | 'karin';
  delay: number;
  y: number;
  speed: number;
  scale: number;
  rotSpeed: number;
  arcAmp: number;
}

const FRUITS: FruitSpec[] = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  kind: i % 2 === 0 ? 'walnut' : 'karin',
  delay: Math.floor(random(`fruit-d-${i}`) * 240),
  y: 120 + random(`fruit-y-${i}`) * 740,
  speed: 24 + random(`fruit-spd-${i}`) * 18,
  scale: 0.75 + random(`fruit-sc-${i}`) * 0.75,
  rotSpeed: (random(`fruit-r-${i}`) - 0.5) * 18,
  arcAmp: 35 + random(`fruit-arc-${i}`) * 55,
}));

export const FlyingFruits: React.FC = () => {
  const frame = useCurrentFrame();

  if (frame < EVENTS.FRUITS_START || frame > EVENTS.FRUITS_END) {
    return null;
  }

  const localFrame = frame - EVENTS.FRUITS_START;
  const globalFade = interpolate(
    frame,
    [EVENTS.FRUITS_START, EVENTS.FRUITS_START + 15, EVENTS.FRUITS_END - 20, EVENTS.FRUITS_END],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{ pointerEvents: 'none', overflow: 'hidden', opacity: globalFade }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        {FRUITS.map((f) => {
          const t = localFrame - f.delay;
          if (t < 0) return null;

          const x = 2020 - (t * f.speed) % 2300;
          const y = f.y + Math.sin(t * 0.11 + f.id) * f.arcAmp - t * 0.45;
          const rot = t * f.rotSpeed;

          return (
            <g
              key={f.id}
              transform={`translate(${x}, ${y}) rotate(${rot}) scale(${f.scale})`}
            >
              {f.kind === 'walnut' ? (
                // 青い胡桃 (green walnut)
                <g>
                  <ellipse cx="0" cy="0" rx="26" ry="30" fill="#5EA84F" />
                  <ellipse cx="-7" cy="-8" rx="9" ry="12" fill="#8CD47E" opacity="0.65" />
                  <path
                    d="M 0 -30 L 3 -40"
                    stroke="#3C6E31"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                // 酸っぱいかりん (yellow-green sour quince)
                <g>
                  <path
                    d="M 0 -34 C 24 -30, 32 -4, 24 22 C 16 36, -16 36, -24 22 C -32 -4, -24 -30, 0 -34 Z"
                    fill="#D4CE52"
                  />
                  <ellipse cx="-8" cy="-10" rx="8" ry="14" fill="#F2EE9D" opacity="0.55" />
                  <path
                    d="M 0 -34 C 4 -42, 10 -44, 14 -40"
                    stroke="#6B5428"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
