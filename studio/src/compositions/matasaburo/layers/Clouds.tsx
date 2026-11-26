import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
} from 'remotion';
import { EVENTS, PALETTE, SECTIONS } from '../constants';

interface CloudSpec {
  id: number;
  layer: 0 | 1 | 2; // 0 = far, 1 = mid, 2 = near
  baseX: number;
  y: number;
  width: number;
  height: number;
  seed: number;
}

const CLOUDS: CloudSpec[] = Array.from({ length: 18 }, (_, i) => {
  const layer = (i % 3) as 0 | 1 | 2;
  return {
    id: i,
    layer,
    baseX: random(`cloud-x-${i}`) * 2300 - 200,
    y: 45 + layer * 95 + random(`cloud-y-${i}`) * 140,
    width: (260 + random(`cloud-w-${i}`) * 240) * (0.75 + layer * 0.28),
    height: (90 + random(`cloud-h-${i}`) * 60) * (0.75 + layer * 0.25),
    seed: i,
  };
});

export const Clouds: React.FC = () => {
  const frame = useCurrentFrame();

  // Accumulate horizontal drift smoothly across speed regimes without jumps
  // Far layer slowest, near layer fastest; accelerated in S4 & S6a
  const baseSpeed =
    frame < SECTIONS.S3.start
      ? 0.45
      : frame < SECTIONS.S4.start
      ? 1.15
      : frame < SECTIONS.S5.start
      ? 2.2 // accelerated clouds in S4 pixel interlude
      : frame < SECTIONS.S6a.start
      ? 1.4
      : frame < SECTIONS.S6b.start
      ? 3.1 // storm gale
      : 1.2;

  const cloudColor = interpolateColors(
    frame,
    [
      0,
      SECTIONS.S3.end,
      SECTIONS.S4.start + 20,
      SECTIONS.S6a.end,
      EVENTS.SKY_CLEAR_FULL,
      SECTIONS.S7.start + 90,
    ],
    [
      PALETTE.cloudWhite,
      PALETTE.cloudWhite,
      '#7B8C9E',
      '#58697B',
      '#FFFDF9',
      '#FFD4AA',
    ]
  );

  // Parting clouds in S6b (clouds slide outward from center to reveal clear sky)
  const partAmount = interpolate(
    frame,
    [
      SECTIONS.S6b.start,
      EVENTS.SKY_CLEAR_FULL,
      SECTIONS.S6b.end - 30,
      SECTIONS.S7.start + 45,
    ],
    [0, 520, 460, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const cloudOpacity = interpolate(
    frame,
    [SECTIONS.S6b.start, EVENTS.SKY_CLEAR_FULL, SECTIONS.S7.start + 60, SECTIONS.S8.start],
    [0.92, 0.55, 0.72, 0.4],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const layerSpeedFactor = [0.45, 0.85, 1.4];
  const layerOpacity = [0.55, 0.75, 0.92];

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {CLOUDS.map((c) => {
        const speed = baseSpeed * layerSpeedFactor[c.layer];
        const span = 2400;
        const rawX = (c.baseX - frame * speed) % span;
        const wrappedX = rawX < -420 ? rawX + span : rawX;
        const partSign = c.id % 2 === 0 ? -1 : 1;
        const x = wrappedX + partSign * partAmount * (0.4 + c.layer * 0.35);

        return (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              left: x,
              top: c.y,
              width: c.width,
              height: c.height,
              opacity: cloudOpacity * layerOpacity[c.layer],
            }}
          >
            <svg
              width={c.width}
              height={c.height}
              viewBox="0 0 300 120"
              style={{ overflow: 'visible' }}
            >
              <ellipse cx="95" cy="74" rx="78" ry="34" fill={cloudColor} />
              <ellipse cx="165" cy="60" rx="86" ry="44" fill={cloudColor} />
              <ellipse cx="225" cy="78" rx="64" ry="30" fill={cloudColor} />
              <ellipse cx="145" cy="84" rx="115" ry="26" fill={cloudColor} />
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
