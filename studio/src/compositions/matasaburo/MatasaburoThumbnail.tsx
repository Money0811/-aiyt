import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolateColors,
  random,
  staticFile,
} from 'remotion';
import { PALETTE } from './constants';

interface ThumbWindSpec {
  id: number;
  x1: number;
  y1: number;
  len: number;
  strokeWidth: number;
  opacity: number;
}

const WIND_STREAKS: ThumbWindSpec[] = Array.from({ length: 11 }, (_, i) => ({
  id: i,
  x1: -100 + random(`th-wx-${i}`) * 1150,
  y1: 120 + random(`th-wy-${i}`) * 640,
  len: 280 + random(`th-wl-${i}`) * 460,
  strokeWidth: 2.5 + random(`th-wt-${i}`) * 5.5,
  opacity: 0.35 + random(`th-wo-${i}`) * 0.35,
}));

interface ThumbLeafSpec {
  id: number;
  x: number;
  y: number;
  size: number;
  rot: number;
  color: string;
  isForeground: boolean;
}

// 12 leaves sweeping from left toward upper-right; foreground leaves strictly avoid the face zone
const LEAVES: ThumbLeafSpec[] = Array.from({ length: 12 }, (_, i) => {
  const t = i / 11;
  const color = interpolateColors(
    t,
    [0, 0.5, 1],
    [PALETTE.riceGreen, PALETTE.sunflowerYellow, PALETTE.autumnMapleRed]
  );

  let x = 80 + t * 1080 + (random(`th-lx-${i}`) - 0.5) * 180;
  let y = 590 - t * 470 + (random(`th-ly-${i}`) - 0.5) * 240;

  // Put 3 leaves in foreground for depth, ensuring none overlap character's face (x ~ 760..1160, y ~ 70..430)
  const isForeground = i === 1 || i === 4 || i === 10;
  if (isForeground && x > 730 && x < 1190 && y > 50 && y < 460) {
    if (i === 10) {
      x = 1185;
      y = 510;
    } else {
      x = 670;
      y = 540;
    }
  }

  return {
    id: i,
    x: Math.max(40, Math.min(1235, x)),
    y: Math.max(45, Math.min(675, y)),
    size: 1.05 + random(`th-ls-${i}`) * 0.85,
    rot: -25 + random(`th-lr-${i}`) * 140,
    color,
    isForeground,
  };
});

const renderLeafGroup = (leaf: ThumbLeafSpec) => (
  <g
    key={leaf.id}
    transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rot}) scale(${leaf.size})`}
    opacity={0.94}
  >
    <path
      d="M 0 -18 L 5 -7 L 17 -9 L 9 1 L 15 11 L 3 8 L 0 19 L -3 8 L -15 11 L -9 1 L -17 -9 L -5 -7 Z"
      fill={leaf.color}
      stroke="rgba(15, 24, 38, 0.35)"
      strokeWidth={1.2}
    />
  </g>
);

export const MatasaburoThumbnail: React.FC = () => {
  const bgLeaves = LEAVES.filter((l) => !l.isForeground);
  const fgLeaves = LEAVES.filter((l) => l.isForeground);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: PALETTE.stormDark }}>
      {/* 1. Diagonal gradient: Summer blue (top-left) -> Gale blue -> Storm dark (bottom-right) */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${PALETTE.summerSky} 0%, ${PALETTE.galeBlue} 48%, ${PALETTE.stormDark} 100%)`,
        }}
      />

      {/* Soft clouds in top-left sky */}
      <svg
        width={1280}
        height={720}
        viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <g opacity={0.42}>
          <ellipse cx="145" cy="98" rx="110" ry="42" fill={PALETTE.cloudWhite} />
          <ellipse cx="220" cy="84" rx="95" ry="50" fill={PALETTE.cloudWhite} />
          <ellipse cx="285" cy="105" rx="75" ry="34" fill={PALETTE.cloudWhite} />
        </g>
        <g opacity={0.32}>
          <ellipse cx="430" cy="148" rx="85" ry="32" fill={PALETTE.cloudWhite} />
          <ellipse cx="495" cy="138" rx="78" ry="38" fill={PALETTE.cloudWhite} />
        </g>
        <g opacity={0.25}>
          <ellipse cx="82" cy="238" rx="72" ry="28" fill={PALETTE.cloudWhite} />
          <ellipse cx="138" cy="230" rx="64" ry="32" fill={PALETTE.cloudWhite} />
        </g>
      </svg>

      {/* Diagonal wind streaks blowing from bottom-left to top-right */}
      <svg
        width={1280}
        height={720}
        viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {WIND_STREAKS.map((w) => {
          const dx = w.len * 0.92;
          const dy = -w.len * 0.34;
          return (
            <path
              key={w.id}
              d={`M ${w.x1} ${w.y1} Q ${w.x1 + dx * 0.5} ${
                w.y1 + dy * 0.5 - 14
              }, ${w.x1 + dx} ${w.y1 + dy}`}
              stroke="#FFFFFF"
              strokeWidth={w.strokeWidth}
              strokeLinecap="round"
              fill="none"
              opacity={w.opacity}
            />
          );
        })}
      </svg>

      {/* 3a. Background flying leaves */}
      <svg
        width={1280}
        height={720}
        viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {bgLeaves.map(renderLeafGroup)}
      </svg>

      {/* 2. Character on right side (~46% width, head ~30px from top, bottom extending past 720px) */}
      <div
        style={{
          position: 'absolute',
          right: 18,
          top: 8,
          width: 590,
          height: 790,
          transform: 'rotate(-4deg)',
          transformOrigin: 'center center',
          filter:
            'drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 16px 28px rgba(10, 18, 34, 0.58))',
          pointerEvents: 'none',
        }}
      >
        <Img
          src={staticFile('character/chibi_excited.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* 3b. Foreground flying leaves (none overlapping character's face) */}
      <svg
        width={1280}
        height={720}
        viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {fgLeaves.map(renderLeafGroup)}
      </svg>

      {/* 4. Title block (left 55%) */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 130,
          width: 660,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          pointerEvents: 'none',
        }}
      >
        {/* Artist subtitle: ヨルシカ */}
        <div
          style={{
            marginLeft: 18,
            marginBottom: 4,
            fontFamily: '"Noto Sans JP", "Yu Gothic", sans-serif',
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#FFFFFF',
            WebkitTextStroke: '6px #1B2A41',
            paintOrder: 'stroke fill',
            textShadow: '0 4px 14px rgba(10, 18, 34, 0.65)',
            transform: 'rotate(-4deg)',
          }}
        >
          ヨルシカ
        </div>

        {/* Main title with trailing wind streak behind it */}
        <div
          style={{
            position: 'relative',
            transform: 'rotate(-4deg)',
            transformOrigin: 'left center',
            marginTop: 4,
            marginBottom: 22,
          }}
        >
          {/* Trailing white wind streak passing behind title */}
          <svg
            width={780}
            height={180}
            viewBox="0 0 780 180"
            style={{
              position: 'absolute',
              left: -80,
              top: 32,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            <path
              d="M -20 112 Q 260 88, 760 44"
              stroke="rgba(255, 255, 255, 0.78)"
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 30 136 Q 310 118, 700 84"
              stroke="rgba(255, 255, 255, 0.48)"
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          <div
            style={{
              position: 'relative',
              fontFamily: '"Yu Mincho", "Noto Serif JP", serif',
              fontSize: 210,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '0.02em',
              color: '#FFFFFF',
              WebkitTextStroke: '10px #1B2A41',
              paintOrder: 'stroke fill',
              textShadow:
                '0 10px 26px rgba(10, 18, 34, 0.75), 0 0 28px rgba(27, 42, 65, 0.45)',
            }}
          >
            又三郎
          </div>
        </div>

        {/* Angled autumn maple red ribbon badge */}
        <div
          style={{
            marginLeft: 12,
            marginTop: 10,
            padding: '14px 36px',
            backgroundColor: PALETTE.autumnMapleRed,
            border: '4px solid #FFFFFF',
            borderRadius: 10,
            transform: 'rotate(-4deg) skewX(-10deg)',
            boxShadow: '0 10px 24px rgba(10, 18, 34, 0.55)',
          }}
        >
          <div
            style={{
              transform: 'skewX(10deg)',
              fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: '#FFFFFF',
              textShadow: '0 3px 8px rgba(20, 12, 10, 0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            哈Gemi 翻唱 COVER
          </div>
        </div>
      </div>

      {/* 5. Top-left MV badge */}
      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 42,
          padding: '8px 24px',
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          color: PALETTE.galeBlue,
          fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: '0.1em',
          boxShadow: '0 6px 18px rgba(10, 18, 34, 0.38)',
        }}
      >
        MV
      </div>

      {/* 6. Subtle vignette */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 56%, rgba(10, 16, 30, 0.45) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
