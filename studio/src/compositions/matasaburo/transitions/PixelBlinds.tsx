import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { PALETTE } from '../constants';

export interface PixelBlindsProps {
  startFrame: number;
  durationFrames?: number;
  columns?: number;
}

export const PixelBlinds: React.FC<PixelBlindsProps> = ({
  startFrame,
  durationFrames = 22,
  columns = 16,
}) => {
  const frame = useCurrentFrame();
  const dt = frame - startFrame;
  if (dt < 0 || dt > durationFrames) return null;

  const colWidth = 1920 / columns;
  const half = durationFrames / 2;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: columns }, (_, i) => {
        const stagger = (i / columns) * 6;
        // Close to full pixel slats, then open away to reveal pixel scene
        const slatRatio =
          dt < half
            ? interpolate(dt - stagger * 0.4, [0, half * 0.85], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : interpolate(dt - half - stagger * 0.4, [0, half * 0.85], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

        if (slatRatio <= 0.01) return null;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * colWidth,
              top: 0,
              width: Math.ceil(colWidth * slatRatio) + 1,
              height: 1080,
              backgroundColor:
                i % 2 === 0 ? PALETTE.stormLeadTop : PALETTE.stormLeadBlue,
              borderRight: '4px solid #8A9BAE',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
