import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

export interface WindWipeProps {
  startFrame: number;
  durationFrames?: number;
  direction?: 'ltr' | 'rtl';
  color?: string;
}

export const WindWipe: React.FC<WindWipeProps> = ({
  startFrame,
  durationFrames = 24,
  direction = 'ltr',
  color = 'rgba(244, 247, 250, 0.92)',
}) => {
  const frame = useCurrentFrame();
  const dt = frame - startFrame;
  if (dt < 0 || dt > durationFrames) return null;

  const progress = interpolate(dt, [0, durationFrames], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leadX =
    direction === 'ltr'
      ? interpolate(progress, [0, 1], [-520, 2320])
      : interpolate(progress, [0, 1], [2320, -520]);

  const fade = interpolate(
    dt,
    [0, durationFrames * 0.25, durationFrames * 0.75, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const dirSign = direction === 'ltr' ? 1 : -1;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden', opacity: fade }}>
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: leadX - 280,
          width: 560,
          height: 1320,
          transform: `skewX(${dirSign * -14}deg)`,
          background: `linear-gradient(${
            direction === 'ltr' ? '90deg' : '270deg'
          }, transparent 0%, ${color} 45%, rgba(255,255,255,0.98) 55%, transparent 100%)`,
          filter: 'blur(6px)',
        }}
      />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        {[140, 290, 440, 610, 770, 920].map((y, idx) => {
          const sx = leadX - dirSign * (idx * 65);
          const len = 320 + (idx % 3) * 140;
          return (
            <line
              key={idx}
              x1={sx - dirSign * len * 0.5}
              y1={y}
              x2={sx + dirSign * len * 0.5}
              y2={y - 12}
              stroke="#FFFFFF"
              strokeWidth={4 + (idx % 2) * 3}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
