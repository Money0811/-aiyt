import React from 'react';
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from 'remotion';
import { CUES, PALETTE } from './constants';

/**
 * Global speckled cotton-paper backdrop matching the reference illustration (#EFECE1).
 * Subtly shifts paper warmth across acts while keeping a cohesive storybook canvas.
 */
export const PaperBackdrop: React.FC = () => {
  const frame = useCurrentFrame();

  // Gentle tint overlay opacity per mood phase
  const skyTint = interpolate(
    frame,
    [CUES.A1_SKY_WIND - 20, CUES.A1_SKY_WIND + 30, CUES.A1_BAREFOOT, CUES.CHORUS1_START],
    [0, 0.32, 0.2, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const warmBreadTint = interpolate(
    frame,
    [CUES.CHORUS1_START, CUES.CHORUS1_BREAD + 30, CUES.CHORUS1_END],
    [0, 0.38, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const waveTint = interpolate(
    frame,
    [CUES.A2_WAVES - 20, CUES.A2_WAVES + 30, CUES.A2_END],
    [0, 0.3, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const duskTint = interpolate(
    frame,
    [CUES.CHORUS2_SLEEP - 20, CUES.CHORUS2_TREE + 30, CUES.BRIDGE_BREAK, CUES.BRIDGE_SMILE],
    [0, 0.42, 0.35, 0.12],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const dawnTint = interpolate(
    frame,
    [CUES.A3_VIVID, CUES.FINALE_WALK, CUES.OUTRO_START],
    [0, 0.35, 0.15],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtle deterministic paper speckles (matching reference speckled cream paper)
  const speckles = React.useMemo(() => {
    return Array.from({ length: 140 }, (_, i) => ({
      x: random(`sp-x-${i}`) * 1920,
      y: random(`sp-y-${i}`) * 1080,
      r: 0.7 + random(`sp-r-${i}`) * 1.4,
      opacity: 0.08 + random(`sp-o-${i}`) * 0.14,
      color: i % 3 === 0 ? '#B5AC96' : i % 3 === 1 ? '#C7BEA7' : '#A9A091',
    }));
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.paperBase }}>
      {/* Soft mood wash layers */}
      {skyTint > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 55% 35%, rgba(188,205,245,0.45) 0%, rgba(239,236,225,0) 75%)',
            opacity: skyTint,
          }}
        />
      )}
      {warmBreadTint > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(246,210,148,0.45) 0%, rgba(239,236,225,0) 75%)',
            opacity: warmBreadTint,
          }}
        />
      )}
      {waveTint > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(239,236,225,0) 20%, rgba(138,148,225,0.28) 100%)',
            opacity: waveTint,
          }}
        />
      )}
      {duskTint > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(206,184,224,0.34) 0%, rgba(226,204,186,0.32) 60%, rgba(239,236,225,0) 100%)',
            opacity: duskTint,
          }}
        />
      )}
      {dawnTint > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 62% 45%, rgba(252,226,158,0.42) 0%, rgba(239,236,225,0) 72%)',
            opacity: dawnTint,
          }}
        />
      )}

      {/* Fine cotton-paper speckles */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {speckles.map((s, idx) => (
          <circle
            key={idx}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.color}
            opacity={s.opacity}
          />
        ))}
      </svg>

      {/* Subtle warm vignette around paper edges */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 64%, rgba(168,154,126,0.14) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Hagemy's signature four-pointed prism star in flat lineless papercraft style.
 */
export const FourPointStar: React.FC<{
  size?: number;
  x?: number;
  y?: number;
  rotation?: number;
  opacity?: number;
  colorTop?: string;
  colorBottom?: string;
  goldRim?: boolean;
  glow?: number;
}> = ({
  size = 64,
  x = 0,
  y = 0,
  rotation = 0,
  opacity = 1,
  colorTop = PALETTE.starCyan,
  colorBottom = PALETTE.lavender,
  goldRim = true,
  glow = 0,
}) => {
  const gradId = React.useId();
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={opacity}
      style={{
        filter:
          glow > 0
            ? `drop-shadow(0 0 ${10 + glow * 14}px rgba(244,198,94,${0.45 + glow * 0.35})) drop-shadow(0 5px 8px rgba(46,43,62,0.12))`
            : 'drop-shadow(0 5px 8px rgba(46,43,62,0.12))',
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorTop} />
          <stop offset="52%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={colorBottom} />
        </linearGradient>
      </defs>
      <path
        d={`M 0 ${-size} Q ${size * 0.14} ${-size * 0.14} ${size} 0 Q ${size * 0.14} ${size * 0.14} 0 ${size} Q ${-size * 0.14} ${size * 0.14} ${-size} 0 Q ${-size * 0.14} ${-size * 0.14} 0 ${-size} Z`}
        fill={`url(#${gradId})`}
        stroke={goldRim ? PALETTE.starGold : 'none'}
        strokeWidth={goldRim ? Math.max(1.5, size * 0.045) : 0}
      />
    </g>
  );
};

/**
 * Displays a transparent-cutout lineless papercraft illustration with a
 * soft handcrafted paper shadow onto the cream paper stage.
 */
export const PapercraftArt: React.FC<{
  src: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  feather?: boolean;
  multiply?: boolean;
  scale?: number;
}> = ({
  src,
  width,
  height,
  style,
  scale = 1,
}) => {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'visible',
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          filter: 'drop-shadow(0 10px 18px rgba(46,43,62,0.12))',
        }}
      />
    </div>
  );
};

/**
 * Utility: smooth fade-in / fade-out envelope for an act or sub-scene.
 */
export function useSegmentOpacity(
  frame: number,
  start: number,
  end: number,
  fadeIn: number = 18,
  fadeOut: number = 18
): number {
  if (frame < start || frame > end) return 0;
  const inAlpha =
    fadeIn > 0
      ? interpolate(frame, [start, start + fadeIn], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const outAlpha =
    fadeOut > 0
      ? interpolate(frame, [end - fadeOut, end], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  return Math.min(inAlpha, outAlpha);
}
