import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { EVENTS } from '../constants';

const DODDODO_WINDOWS = [
  { start: EVENTS.DODDODO_1_START, end: EVENTS.DODDODO_1_END },
  { start: EVENTS.DODDODO_2_START, end: EVENTS.DODDODO_2_END },
] as const;

const DODDODO_CHARS = Array.from('どっどど　どどうど');

export const KineticDoddodo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Check if we are in the 179s full-screen「又三郎」emphasis moment
  if (
    frame >= EVENTS.MATASABURO_EMPHASIS_START &&
    frame <= EVENTS.MATASABURO_EMPHASIS_END
  ) {
    const dt = frame - EVENTS.MATASABURO_EMPHASIS_START;
    const total =
      EVENTS.MATASABURO_EMPHASIS_END - EVENTS.MATASABURO_EMPHASIS_START;
    const slam = spring({
      fps,
      frame: dt + 2,
      config: { damping: 14, stiffness: 160 },
    });
    const scale = interpolate(slam, [0, 1], [1.45, 1]);
    const opacity = interpolate(
      dt,
      [0, 6, total - 20, total],
      [0.75, 1, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const shakeX =
      dt < 14 ? (random(`mata-sx-${frame}`) - 0.5) * (14 - dt) * 1.4 : 0;
    const shakeY =
      dt < 14 ? (random(`mata-sy-${frame}`) - 0.5) * (14 - dt) * 1.4 : 0;

    return (
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at center, rgba(255, 250, 230, 0.25) 0%, rgba(15, 24, 38, 0.45) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            transform: `translate(${shakeX}px, ${shakeY}px) scale(${scale})`,
            fontFamily: '"Yu Mincho", "Noto Serif JP", serif',
            fontSize: 220,
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: '#FFFFFF',
            WebkitTextStroke: '6px rgba(27, 42, 65, 0.85)',
            paintOrder: 'stroke fill',
            textShadow:
              '0 12px 44px rgba(15, 24, 38, 0.85), 0 0 60px rgba(255, 210, 90, 0.55)',
          }}
        >
          又三郎
        </div>
      </AbsoluteFill>
    );
  }

  // Otherwise check the two どっどど　どどうど kinetic typography windows
  const activeWindow = DODDODO_WINDOWS.find(
    (w) => frame >= w.start && frame < w.end
  );
  if (!activeWindow) return null;

  const dt = frame - activeWindow.start;
  const duration = activeWindow.end - activeWindow.start;

  const containerFade = interpolate(
    dt,
    [duration - 14, duration],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtle global screen tremor synced with character impacts
  const impactShakeX = (random(`dod-gx-${frame}`) - 0.5) * 10;
  const impactShakeY = (random(`dod-gy-${frame}`) - 0.5) * 8;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: containerFade,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translate(${impactShakeX}px, ${impactShakeY}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: '"Yu Mincho", "Noto Serif JP", serif',
            fontSize: 180,
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '0.02em',
            WebkitTextStroke: '6px rgba(15, 24, 38, 0.85)',
            paintOrder: 'stroke fill',
            textShadow: '0 10px 36px rgba(15, 24, 38, 0.85)',
          }}
        >
          {DODDODO_CHARS.map((ch, idx) => {
            if (ch === '　') {
              return <span key={idx} style={{ width: 64 }} />;
            }
            const charStart = idx * 4;
            const charDt = dt - charStart;
            if (charDt < 0) {
              return (
                <span key={idx} style={{ opacity: 0 }}>
                  {ch}
                </span>
              );
            }

            const slamScale = interpolate(charDt, [0, 5], [2.4, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const charOp = interpolate(charDt, [0, 3], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const charJitter =
              charDt < 10
                ? (random(`dod-ch-${idx}-${frame}`) - 0.5) * (10 - charDt) * 2
                : 0;

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  opacity: charOp,
                  transform: `translateY(${charJitter}px) scale(${slamScale})`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 14,
            fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: '#FFD25A',
            opacity: interpolate(dt, [18, 30], [0, 0.92], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            WebkitTextStroke: '2.5px rgba(15, 24, 38, 0.8)',
            paintOrder: 'stroke fill',
            textShadow: '0 4px 16px rgba(10, 18, 30, 0.8)',
          }}
        >
          呼嚕嚕　呼呼嚕
        </div>
      </div>
    </AbsoluteFill>
  );
};
