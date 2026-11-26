import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export interface FlashProps {
  startFrame: number;
  durationFrames?: number;
  variant?: 'white' | 'radialBlur' | 'lightBeam';
}

export const Flash: React.FC<FlashProps> = ({
  startFrame,
  durationFrames = 14,
  variant = 'white',
}) => {
  const frame = useCurrentFrame();
  const dt = frame - startFrame;
  if (dt < 0 || dt > durationFrames) return null;

  const opacity = interpolate(
    dt,
    [0, Math.min(2, durationFrames * 0.2), durationFrames],
    [0.95, 0.9, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const expand = interpolate(dt, [0, durationFrames], [0.75, 1.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundColor: '#FFFFFF',
          opacity: variant === 'lightBeam' ? opacity * 0.72 : opacity,
        }}
      />
      {(variant === 'radialBlur' || variant === 'lightBeam') && (
        <AbsoluteFill
          style={{
            opacity: opacity * 0.9,
            transform: `scale(${expand})`,
            background:
              variant === 'lightBeam'
                ? 'conic-gradient(from 0deg at 50% 42%, rgba(255,250,220,0.85) 0deg, transparent 18deg, rgba(255,255,255,0.75) 36deg, transparent 58deg, rgba(255,244,195,0.85) 86deg, transparent 120deg, rgba(255,255,255,0.75) 160deg, transparent 210deg, rgba(255,244,195,0.8) 260deg, transparent 310deg, rgba(255,255,255,0.75) 340deg, transparent 360deg)'
                : 'radial-gradient(circle at 50% 50%, transparent 18%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0.95) 95%)',
            filter: 'blur(8px)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
