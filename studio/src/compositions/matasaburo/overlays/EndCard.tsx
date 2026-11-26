import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from 'remotion';
import { END_CARD_LINES, EVENTS, PALETTE, SECTIONS } from '../constants';

const END_LEAVES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: 160 + random(`ec-lx-${i}`) * 1600,
  y: random(`ec-ly-${i}`) * 900,
  speedY: 1.4 + random(`ec-lvy-${i}`) * 1.4,
  driftX: -0.9 - random(`ec-lvx-${i}`) * 0.8,
  rot: random(`ec-lr-${i}`) * 360,
  scale: 0.7 + random(`ec-ls-${i}`) * 0.7,
}));

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();

  if (frame < SECTIONS.S8.start) {
    return null;
  }

  const dt = frame - SECTIONS.S8.start;

  // 0.8 s (24f) crossfade entry from S7
  const entryOpacity = interpolate(dt, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Final 30f fade to black
  const fadeToBlack = interpolate(
    frame,
    [EVENTS.END_CARD_FADE_BLACK_START, SECTIONS.S8.end],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ opacity: entryOpacity, pointerEvents: 'none' }}>
      {/* Autumn sunset orange backdrop with subtle lavender horizon */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${PALETTE.autumnSunsetTop} 0%, ${PALETTE.autumnSunsetOrange} 62%, ${PALETTE.autumnLavender} 100%)`,
        }}
      />

      {/* Slowly drifting autumn leaves */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, opacity: 0.68 }}
      >
        {END_LEAVES.map((leaf) => {
          const x = ((leaf.x + dt * leaf.driftX + Math.sin(dt * 0.05 + leaf.id) * 28) + 2100) % 2100 - 90;
          const y = (leaf.y + dt * leaf.speedY) % 1160 - 40;
          const rot = leaf.rot + dt * 1.6;
          return (
            <g
              key={leaf.id}
              transform={`translate(${x}, ${y}) rotate(${rot}) scale(${leaf.scale})`}
            >
              <path
                d="M 0 -16 L 4 -6 L 15 -8 L 8 1 L 14 10 L 3 7 L 0 17 L -3 7 L -14 10 L -8 1 L -15 -8 L -4 -6 Z"
                fill={
                  leaf.id % 2 === 0
                    ? PALETTE.autumnMapleRed
                    : PALETTE.deadLeafBrown
                }
              />
            </g>
          );
        })}
      </svg>

      {/* EndCard typography: staggered bottom-to-top fade-in, 6f apart */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
            padding: '56px 88px',
            borderRadius: 24,
            backgroundColor: 'rgba(46, 26, 18, 0.24)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 20px 60px rgba(46, 26, 18, 0.28)',
          }}
        >
          {END_CARD_LINES.map((line, idx) => {
            const lineStart = 8 + idx * 6;
            const p = interpolate(dt - lineStart, [0, 18], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const ty = interpolate(p, [0, 1], [28, 0]);
            const isTitle = idx === 0;
            const isLicense = idx === END_CARD_LINES.length - 1;

            return (
              <div
                key={idx}
                style={{
                  opacity: p,
                  transform: `translateY(${ty}px)`,
                  fontFamily: isTitle
                    ? '"Yu Mincho", "Noto Serif JP", serif'
                    : '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
                  fontSize: isTitle ? 84 : isLicense ? 28 : 38,
                  fontWeight: isTitle ? 700 : 500,
                  letterSpacing: isTitle ? '0.18em' : '0.08em',
                  color: isLicense ? '#F5EAE0' : '#FFFFFF',
                  textShadow: '0 3px 16px rgba(40, 20, 10, 0.55)',
                  marginBottom: isTitle ? 8 : 0,
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Final 30f fade out to black */}
      {fadeToBlack > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: '#000000',
            opacity: fadeToBlack,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
