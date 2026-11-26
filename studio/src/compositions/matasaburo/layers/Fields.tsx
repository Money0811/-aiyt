import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
} from 'remotion';
import { EVENTS, PALETTE, SECTIONS } from '../constants';

interface BladeSpec {
  x: number;
  h: number;
  layer: 0 | 1 | 2;
  phase: number;
}

const BLADES: BladeSpec[] = Array.from({ length: 120 }, (_, i) => {
  const layer = (i % 3) as 0 | 1 | 2;
  return {
    x: (i / 120) * 2040 - 60 + random(`blade-jx-${i}`) * 14,
    h: 55 + layer * 28 + random(`blade-h-${i}`) * 35,
    layer,
    phase: random(`blade-p-${i}`) * Math.PI * 2,
  };
});

export const Fields: React.FC = () => {
  const frame = useCurrentFrame();

  const farColor = interpolateColors(
    frame,
    [0, SECTIONS.S3.end, SECTIONS.S4.start + 30, SECTIONS.S6b.start, EVENTS.SKY_CLEAR_FULL, SECTIONS.S7.start + 90],
    ['#8FD48B', '#72BD70', '#4A635D', '#374B4A', '#80C473', '#C48A47']
  );

  const midColor = interpolateColors(
    frame,
    [0, SECTIONS.S3.end, SECTIONS.S4.start + 30, SECTIONS.S6b.start, EVENTS.SKY_CLEAR_FULL, SECTIONS.S7.start + 90],
    [PALETTE.riceGreen, '#5DAE5E', '#3A524D', '#2B3E3E', '#6BB35E', '#B37338']
  );

  const nearColor = interpolateColors(
    frame,
    [0, SECTIONS.S3.end, SECTIONS.S4.start + 30, SECTIONS.S6b.start, EVENTS.SKY_CLEAR_FULL, SECTIONS.S7.start + 90],
    [PALETTE.riceDark, '#438A47', '#2A3D39', '#1F2E2F', '#4E9448', PALETTE.deadLeafBrown]
  );

  // Wind intensity controls sway amplitude & speed
  const windStrength =
    frame < SECTIONS.S3.start
      ? 1.0
      : frame < SECTIONS.S4.start
      ? 2.2
      : frame < SECTIONS.S5.start
      ? 1.5
      : frame < SECTIONS.S6a.start
      ? 1.8
      : frame < SECTIONS.S6b.start
      ? 3.0
      : frame < SECTIONS.S7.start
      ? 2.1
      : interpolate(frame, [SECTIONS.S7.start, SECTIONS.S7.end], [1.6, 0.45], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const layerColors = [farColor, midColor, nearColor];
  const layerBaseY = [815, 885, 955];

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        {[0, 1, 2].map((layerIdx) => {
          const baseY = layerBaseY[layerIdx];
          const parallaxX = Math.sin(frame * 0.012 + layerIdx) * (8 + layerIdx * 6);
          const wave = Math.sin(frame * 0.04 * windStrength + layerIdx * 1.1) * 14;
          const d = `M -80 ${baseY} Q 480 ${baseY - 34 + wave}, 960 ${baseY - 12} T 2000 ${
            baseY - 8 - wave * 0.6
          } L 2000 1120 L -80 1120 Z`;

          return (
            <g key={layerIdx} transform={`translate(${parallaxX}, 0)`}>
              <path d={d} fill={layerColors[layerIdx]} />
              {BLADES.filter((b) => b.layer === layerIdx).map((b, idx) => {
                const sway =
                  Math.sin(frame * 0.09 * windStrength + b.phase + b.x * 0.005) *
                    (8 * windStrength) -
                  6 * windStrength;
                const y0 = baseY + 18;
                return (
                  <path
                    key={idx}
                    d={`M ${b.x} ${y0} Q ${b.x + sway * 0.4} ${y0 - b.h * 0.55}, ${
                      b.x + sway
                    } ${y0 - b.h}`}
                    stroke={layerColors[layerIdx]}
                    strokeWidth={3 + layerIdx * 1.2}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
