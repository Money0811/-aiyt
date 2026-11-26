import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { EVENTS } from '../constants';

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();

  if (frame < EVENTS.TITLE_START || frame > EVENTS.TITLE_END) {
    return null;
  }

  const dt = frame - EVENTS.TITLE_START;
  const total = EVENTS.TITLE_END - EVENTS.TITLE_START;

  const opacity = interpolate(dt, [0, 24, total - 24, total], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const slideX = interpolate(dt, [0, 30, total - 24, total], [48, 0, 0, -64], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subOpacity = interpolate(dt, [10, 34, total - 24, total], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineScale = interpolate(dt, [8, 36], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translateX(${slideX}px)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: '"Yu Mincho", "Noto Serif JP", serif',
            fontSize: 136,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: '#FFFFFF',
            textShadow: '0 6px 28px rgba(20, 48, 82, 0.55)',
            WebkitTextStroke: '2px rgba(20, 48, 82, 0.35)',
            paintOrder: 'stroke fill',
          }}
        >
          又三郎
        </div>

        <div
          style={{
            width: 360,
            height: 2,
            marginTop: 18,
            marginBottom: 22,
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
            transform: `scaleX(${lineScale})`,
          }}
        />

        <div
          style={{
            opacity: subOpacity,
            fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: '0.1em',
            color: '#F4F7FA',
            textShadow: '0 3px 16px rgba(15, 36, 62, 0.6)',
          }}
        >
          ヨルシカ — Cover by 哈Gemi
        </div>
      </div>
    </AbsoluteFill>
  );
};
