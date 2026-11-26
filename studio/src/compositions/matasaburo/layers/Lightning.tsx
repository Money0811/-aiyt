import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EVENTS } from '../constants';

const LIGHTNING_STRIKES = [
  { startFrame: EVENTS.LIGHTNING_1, x: 520, variant: 0 },
  { startFrame: EVENTS.LIGHTNING_2, x: 1380, variant: 1 },
] as const;

export const Lightning: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <>
      {LIGHTNING_STRIKES.map((strike) => {
        const dt = frame - strike.startFrame;
        if (dt < 0 || dt > 16) return null;

        // Sharp double-flicker white flash + bolt visibility
        const flashOpacity = interpolate(
          dt,
          [0, 2, 4, 6, 12],
          [0.9, 0.25, 0.72, 0.15, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const boltOpacity = interpolate(dt, [0, 3, 12], [1, 0.9, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const pathD =
          strike.variant === 0
            ? `M ${strike.x} 0 L ${strike.x - 45} 180 L ${strike.x + 25} 210 L ${
                strike.x - 70
              } 440 L ${strike.x + 15} 470 L ${strike.x - 95} 780`
            : `M ${strike.x} 0 L ${strike.x + 50} 160 L ${strike.x - 20} 195 L ${
                strike.x + 65
              } 420 L ${strike.x - 10} 455 L ${strike.x + 80} 760`;

        return (
          <React.Fragment key={strike.startFrame}>
            <AbsoluteFill
              style={{
                backgroundColor: '#FFFFFF',
                opacity: flashOpacity,
                pointerEvents: 'none',
              }}
            />
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
              <svg
                width={1920}
                height={1080}
                viewBox="0 0 1920 1080"
                style={{ opacity: boltOpacity }}
              >
                <path
                  d={pathD}
                  stroke="#FFFFFF"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{
                    filter: 'drop-shadow(0 0 18px rgba(180, 225, 255, 0.95))',
                  }}
                />
              </svg>
            </AbsoluteFill>
          </React.Fragment>
        );
      })}
    </>
  );
};
