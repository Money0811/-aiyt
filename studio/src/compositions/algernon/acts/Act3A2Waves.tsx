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
import { ACTS, ART_PATHS, CUES, FONT_JP, FONT_SANS, PALETTE } from '../constants';
import { FourPointStar, PapercraftArt, useSegmentOpacity } from '../PaperStage';

interface PetalSpec {
  id: number;
  startX: number;
  startY: number;
  driftX: number;
  fallDist: number;
  size: number;
  rotStart: number;
  rotSpeed: number;
  delay: number;
  period: number;
  color: string;
}

interface SandSpec {
  id: number;
  startX: number;
  startY: number;
  driftX: number;
  fallDist: number;
  size: number;
  delay: number;
  period: number;
  color: string;
  isStar: boolean;
}

interface FoamSpec {
  id: number;
  x: number;
  layer: number;
  arcHeight: number;
  size: number;
  speed: number;
  phase: number;
  isStar: boolean;
}

interface YawnSpeck {
  id: number;
  offsetX: number;
  offsetY: number;
  driftX: number;
  driftY: number;
  r: number;
  color: string;
  delay: number;
}

/**
 * Generates a smooth panoramic sinusoidal papercraft wave path spanning -100..2020.
 */
function buildWavePath(
  baseY: number,
  amp1: number,
  amp2: number,
  freq1: number,
  freq2: number,
  phase1: number,
  phase2: number
): string {
  const step = 48;
  const startX = -100;
  const endX = 2020;
  const pts: Array<{ x: number; y: number }> = [];

  for (let x = startX; x <= endX; x += step) {
    const y =
      baseY +
      Math.sin(x * freq1 + phase1) * amp1 +
      Math.sin(x * freq2 + phase2) * amp2;
    pts.push({ x, y });
  }

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)} L ${endX} 1220 L ${startX} 1220 Z`;
  return d;
}

/**
 * Act 3: A2 — Name Bookmark, Hands & Petals, 5-Layer Papercraft Waves, Seaside, and Yawn Cloud.
 * Global frames: ACTS.ACT3.start (2412) .. ACTS.ACT3.end (3491).
 */
export const Act3A2Waves: React.FC<{ pulse: number }> = ({ pulse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const actOpacity = useSegmentOpacity(frame, ACTS.ACT3.start, ACTS.ACT3.end, 20, 20);

  // Deterministic lavender paper petals trickling from fingertips (A2 Hands)
  const petals = React.useMemo<PetalSpec[]>(() => {
    const colors = [
      PALETTE.lavender,
      PALETTE.lavenderSoft,
      PALETTE.periwinkleLight,
      PALETTE.paperLight,
    ];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      startX: 460 + random(`a3-pet-x-${i}`) * 380,
      startY: 470 + random(`a3-pet-y-${i}`) * 130,
      driftX: -55 + random(`a3-pet-dx-${i}`) * 130,
      fallDist: 230 + random(`a3-pet-fd-${i}`) * 240,
      size: 10 + random(`a3-pet-sz-${i}`) * 14,
      rotStart: random(`a3-pet-r-${i}`) * 360,
      rotSpeed: (random(`a3-pet-rs-${i}`) - 0.5) * 2.4,
      delay: random(`a3-pet-dl-${i}`) * 90,
      period: 85 + random(`a3-pet-pd-${i}`) * 55,
      color: colors[i % colors.length],
    }));
  }, []);

  // Deterministic golden star-sand grains trickling from fingertips
  const sandGrains = React.useMemo<SandSpec[]>(() => {
    const colors = [PALETTE.starGold, PALETTE.starGoldSoft, PALETTE.starCyan, PALETTE.paperLight];
    return Array.from({ length: 34 }, (_, i) => ({
      id: i,
      startX: 480 + random(`a3-snd-x-${i}`) * 340,
      startY: 480 + random(`a3-snd-y-${i}`) * 140,
      driftX: -35 + random(`a3-snd-dx-${i}`) * 70,
      fallDist: 220 + random(`a3-snd-fd-${i}`) * 260,
      size: 2.2 + random(`a3-snd-sz-${i}`) * 4.2,
      delay: random(`a3-snd-dl-${i}`) * 80,
      period: 65 + random(`a3-snd-pd-${i}`) * 45,
      color: colors[i % colors.length],
      isStar: i % 3 === 0,
    }));
  }, []);

  // Deterministic foam crescents & starry sand flecks tossed by waves
  const foamSpecks = React.useMemo<FoamSpec[]>(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: 80 + random(`a3-fm-x-${i}`) * 1760,
      layer: Math.floor(random(`a3-fm-ly-${i}`) * 4),
      arcHeight: 24 + random(`a3-fm-ah-${i}`) * 52,
      size: 6 + random(`a3-fm-sz-${i}`) * 12,
      speed: 0.032 + random(`a3-fm-sp-${i}`) * 0.025,
      phase: random(`a3-fm-ph-${i}`) * Math.PI * 2,
      isStar: i % 4 === 0,
    }));
  }, []);

  // Deterministic distant horizon twinkling stars for A2 Seaside
  const horizonStars = React.useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: 560 + random(`a3-hs-x-${i}`) * 1220,
      y: 95 + random(`a3-hs-y-${i}`) * 320,
      size: 8 + random(`a3-hs-sz-${i}`) * 14,
      phase: random(`a3-hs-ph-${i}`) * Math.PI * 2,
      colorTop: i % 2 === 0 ? PALETTE.starCyan : PALETTE.starGoldSoft,
      colorBottom: i % 2 === 0 ? PALETTE.lavenderSoft : PALETTE.starGold,
    }));
  }, []);

  // Deterministic floating cream paper specks dissolving from the yawn bubble
  const yawnSpecks = React.useMemo<YawnSpeck[]>(() => {
    const colors = [PALETTE.cloudWhite, PALETTE.paperLight, PALETTE.paperWarm, PALETTE.starGoldSoft];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      offsetX: -120 + random(`a3-yn-ox-${i}`) * 240,
      offsetY: -70 + random(`a3-yn-oy-${i}`) * 140,
      driftX: 25 + random(`a3-yn-dx-${i}`) * 130,
      driftY: -55 - random(`a3-yn-dy-${i}`) * 135,
      r: 3 + random(`a3-yn-r-${i}`) * 7.5,
      color: colors[i % colors.length],
      delay: random(`a3-yn-dl-${i}`) * 34,
    }));
  }, []);

  if (actOpacity <= 0.001) return null;

  // =========================================================================
  // Beat 1: 2432..2667 (A2 Name) — Maze folds flat & handmade bookmark enters
  // =========================================================================
  const mazeFoldProgress = interpolate(frame, [ACTS.ACT3.start, CUES.A2_NAME + 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const mazeFoldOpacity = interpolate(frame, [ACTS.ACT3.start, CUES.A2_NAME + 20, CUES.A2_NAME + 56], [0.75, 0.55, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const nameOpacity = useSegmentOpacity(frame, CUES.A2_NAME - 8, CUES.A2_HANDS + 16, 20, 22);
  const bookmarkSpring = spring({
    frame: Math.max(0, frame - CUES.A2_NAME),
    fps,
    config: { damping: 16, stiffness: 68, mass: 1.1 },
  });
  const bookmarkY = interpolate(bookmarkSpring, [0, 1], [-180, 0]);
  const bookmarkSway = Math.sin((frame - CUES.A2_NAME) * 0.036) * 2.4;
  const bookmarkPulseScale = 1 + pulse * 0.012;

  // Stamped calligraphy ink reveal
  const stampHagemy = interpolate(frame, [CUES.A2_NAME + 28, CUES.A2_NAME + 64], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const stampAlgernon = interpolate(frame, [CUES.A2_NAME + 56, CUES.A2_NAME + 96], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const ribbonWave = Math.sin((frame - CUES.A2_NAME) * 0.048) * 14;

  // =========================================================================
  // Beat 2: 2667..2889 (A2 Hands) — ART_PATHS.handsPetals + petals & star-sand
  // =========================================================================
  const handsOpacity = useSegmentOpacity(frame, CUES.A2_HANDS - 12, CUES.A2_WAVES + 22, 24, 26);
  const handsEnter = interpolate(frame, [CUES.A2_HANDS - 12, CUES.A2_HANDS + 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const handsFloatY = Math.sin((frame - CUES.A2_HANDS) * 0.035) * 7;

  // =========================================================================
  // Beat 3: 2889..3491 (A2 Waves -> Seaside -> Yawn) — 5-Layer Papercraft Waves
  // =========================================================================
  const wavesActive = frame >= CUES.A2_WAVES - 16;
  const waveRise = interpolate(frame, [CUES.A2_WAVES - 14, CUES.A2_WAVES + 42], [440, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const waveLowerSeaside = interpolate(
    frame,
    [CUES.A2_SEASIDE - 12, CUES.A2_SEASIDE + 44],
    [0, 210],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );
  const waveLowerYawn = interpolate(
    frame,
    [CUES.A2_YAWN, ACTS.ACT3.end - 18],
    [0, 125],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );
  const totalWaveOffsetY = waveRise + waveLowerSeaside + waveLowerYawn;
  const waveOpacity = interpolate(frame, [CUES.A2_WAVES - 14, CUES.A2_WAVES + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Foam liveliness peaks during A2 Waves and calms during Seaside/Yawn
  const foamIntensity = interpolate(
    frame,
    [CUES.A2_WAVES + 6, CUES.A2_WAVES + 38, CUES.A2_SEASIDE + 18, CUES.A2_YAWN + 30],
    [0, 1, 0.42, 0.08],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const waveLayers = [
    {
      color: PALETTE.waveDeep,
      baseY: 560,
      amp1: 30,
      amp2: 14,
      freq1: 0.0046,
      freq2: 0.0092,
      speed1: 0.032,
      speed2: -0.02,
      bob: Math.sin(frame * 0.035) * 9 - pulse * 14,
      shadow: 'drop-shadow(0 -10px 18px rgba(49,57,107,0.16))',
    },
    {
      color: PALETTE.waveMid,
      baseY: 640,
      amp1: 28,
      amp2: 13,
      freq1: 0.0052,
      freq2: 0.0108,
      speed1: -0.038,
      speed2: 0.024,
      bob: Math.sin(frame * 0.041 + 1.1) * 10 - pulse * 16,
      shadow: 'drop-shadow(0 -9px 15px rgba(49,57,107,0.16))',
    },
    {
      color: PALETTE.periwinkle,
      baseY: 722,
      amp1: 25,
      amp2: 12,
      freq1: 0.0058,
      freq2: 0.0124,
      speed1: 0.045,
      speed2: -0.028,
      bob: Math.sin(frame * 0.046 + 2.2) * 9 - pulse * 15,
      shadow: 'drop-shadow(0 -8px 14px rgba(49,57,107,0.15))',
    },
    {
      color: PALETTE.waveLight,
      baseY: 808,
      amp1: 22,
      amp2: 10,
      freq1: 0.0066,
      freq2: 0.0138,
      speed1: -0.052,
      speed2: 0.032,
      bob: Math.sin(frame * 0.052 + 3.4) * 8 - pulse * 13,
      shadow: 'drop-shadow(0 -7px 12px rgba(49,57,107,0.13))',
    },
    {
      color: PALETTE.waveFoam,
      baseY: 896,
      amp1: 18,
      amp2: 9,
      freq1: 0.0074,
      freq2: 0.0155,
      speed1: 0.058,
      speed2: -0.035,
      bob: Math.sin(frame * 0.056 + 4.5) * 7 - pulse * 10,
      shadow: 'drop-shadow(0 -6px 10px rgba(90,103,184,0.14))',
    },
  ];

  // =========================================================================
  // Beat 4: 3129..3491 (A2 Seaside) — ART_PATHS.seaside + breeze + stars
  // =========================================================================
  const seasideOpacity = useSegmentOpacity(frame, CUES.A2_SEASIDE - 8, ACTS.ACT3.end, 26, 20);
  const seasideRise = interpolate(frame, [CUES.A2_SEASIDE - 8, CUES.A2_SEASIDE + 40], [52, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const seasideFloatY = Math.sin((frame - CUES.A2_SEASIDE) * 0.032) * 5;

  // =========================================================================
  // Beat 5: 3293..3491 (A2 Yawn) — Yawn cloud puff, dissolve & warm dusk shift
  // =========================================================================
  const yawnActive = frame >= CUES.A2_YAWN - 4;
  const yawnPuff = spring({
    frame: Math.max(0, frame - CUES.A2_YAWN),
    fps,
    config: { damping: 13, stiffness: 82, mass: 0.9 },
  });
  const yawnDissolve = interpolate(frame, [CUES.A2_YAWN + 72, CUES.A2_YAWN + 148], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const yawnCloudOpacity = interpolate(yawnDissolve, [0, 0.65, 1], [1, 0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const yawnCloudScale = yawnPuff * (1 + yawnDissolve * 0.16);

  const duskShift = interpolate(frame, [CUES.A2_YAWN, ACTS.ACT3.end], [0, 0.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ opacity: actOpacity }}>
      {/* Warm dusk transition lighting wash during A2 Yawn */}
      {duskShift > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 65% 38%, rgba(236,196,178,0.52) 0%, rgba(196,170,218,0.34) 55%, rgba(239,236,225,0) 100%)',
            opacity: duskShift,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ================================================================= */}
      {/* BEAT 1A: Previous Maze Folding Flat (2412..2488)                  */}
      {/* ================================================================= */}
      {mazeFoldOpacity > 0.005 && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, opacity: mazeFoldOpacity, pointerEvents: 'none' }}
        >
          {[0, 1, 2, 3, 4].map((idx) => {
            const panelScaleY = Math.max(0.02, 1 - mazeFoldProgress * (0.85 + idx * 0.04));
            const panelY = 240 + idx * 118 + mazeFoldProgress * (70 + idx * 14);
            const width = 920 - idx * 80;
            const x = 220 + idx * 46;
            const fill =
              idx % 3 === 0
                ? PALETTE.mazeWallTop
                : idx % 3 === 1
                  ? PALETTE.mazeWallLight
                  : PALETTE.mazeWall;
            return (
              <g
                key={idx}
                transform={`translate(${x}, ${panelY}) scale(1, ${panelScaleY.toFixed(3)})`}
                style={{ filter: 'drop-shadow(0 8px 14px rgba(46,43,62,0.08))' }}
              >
                <rect x={0} y={0} width={width} height={74} rx={8} fill={fill} />
              </g>
            );
          })}
        </svg>
      )}

      {/* ================================================================= */}
      {/* BEAT 1B: Handmade Papercraft Bookmark / Name Tag (2432..2667)     */}
      {/* ================================================================= */}
      {nameOpacity > 0.005 && (
        <AbsoluteFill style={{ opacity: nameOpacity, pointerEvents: 'none' }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">
            <defs>
              {/* Punched four-pointed star hole cutout mask */}
              <mask id="a3-bookmark-hole-mask">
                <rect x={-260} y={-340} width={520} height={680} fill="#FFFFFF" />
                <path
                  d="M 0 -226 Q 5 -195 36 -190 Q 5 -185 0 -154 Q -5 -185 -36 -190 Q -5 -195 0 -226 Z"
                  fill="#000000"
                />
              </mask>
              <linearGradient id="a3-ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.lavenderSoft} />
                <stop offset="55%" stopColor={PALETTE.lavender} />
                <stop offset="100%" stopColor={PALETTE.periwinkle} />
              </linearGradient>
            </defs>

            {/* Center-left placement leaves right side open for vertical lyrics */}
            <g
              transform={`translate(740, ${(545 + bookmarkY).toFixed(1)}) rotate(${bookmarkSway.toFixed(2)}) scale(${bookmarkPulseScale.toFixed(4)})`}
            >
              {/* Flowing lavender paper ribbon behind/through punched star hole */}
              <g style={{ filter: 'drop-shadow(0 6px 10px rgba(46,43,62,0.12))' }}>
                <path
                  d={`M -6 -196 C ${-48 - ribbonWave * 0.6} -288, ${-140 + ribbonWave * 0.5} -340, ${-215 + ribbonWave} -420 L ${-182 + ribbonWave} -434 C ${-115 + ribbonWave * 0.5} -356, ${-25 - ribbonWave * 0.5} -305, 14 -198 Z`}
                  fill={PALETTE.lavenderSoft}
                />
                <path
                  d={`M 6 -194 C ${56 + ribbonWave * 0.7} -292, ${142 - ribbonWave * 0.6} -336, ${210 - ribbonWave * 0.8} -430 L ${180 - ribbonWave * 0.8} -446 C ${118 - ribbonWave * 0.6} -352, ${32 + ribbonWave * 0.6} -310, -10 -196 Z`}
                  fill="url(#a3-ribbon-grad)"
                />
              </g>

              {/* Soft shadow backing plate for layered papercraft depth */}
              <g
                transform="translate(12, 16)"
                opacity={0.35}
                mask="url(#a3-bookmark-hole-mask)"
              >
                <path
                  d="M -140 -265 L 140 -265 L 190 -210 L 190 265 Q 190 282 173 282 L -173 282 Q -190 282 -190 265 L -190 -210 Z"
                  fill={PALETTE.paperDeepShadow}
                />
              </g>

              {/* Main handmade paper bookmark tag with punched four-pointed star hole */}
              <g
                mask="url(#a3-bookmark-hole-mask)"
                style={{ filter: 'drop-shadow(0 14px 24px rgba(46,43,62,0.12))' }}
              >
                <path
                  d="M -140 -265 L 140 -265 L 190 -210 L 190 265 Q 190 282 173 282 L -173 282 Q -190 282 -190 265 L -190 -210 Z"
                  fill={PALETTE.paperLight}
                />
                {/* Subtle warm inner paper mat */}
                <path
                  d="M -126 -244 L 126 -244 L 168 -198 L 168 248 Q 168 260 156 260 L -156 260 Q -168 260 -168 248 L -168 -198 Z"
                  fill={PALETTE.paperWarm}
                  opacity={0.55}
                />
                {/* Decorative top & bottom lavender paper band strips */}
                <rect x={-140} y={-124} width={280} height={3} rx={1.5} fill={PALETTE.paperShadow} />
                <rect x={-110} y={196} width={220} height={3} rx={1.5} fill={PALETTE.paperShadow} />
              </g>

              {/* Subtle gold-rim embossed highlight around punched star cutout */}
              <path
                d="M 0 -226 Q 5 -195 36 -190 Q 5 -185 0 -154 Q -5 -185 -36 -190 Q -5 -195 0 -226 Z"
                fill="none"
                stroke={PALETTE.paperDeepShadow}
                strokeWidth={2}
                opacity={0.55}
              />

              {/* Ribbon knot tucking over the top edge of the star hole */}
              <ellipse
                cx={0}
                cy={-224}
                rx={16}
                ry={9}
                fill={PALETTE.lavender}
                style={{ filter: 'drop-shadow(0 3px 5px rgba(46,43,62,0.15))' }}
              />

              {/* Stamped Calligraphy: 哈Gemi */}
              <g
                opacity={stampHagemy}
                transform={`translate(0, ${interpolate(stampHagemy, [0, 1], [10, 0]).toFixed(1)}) scale(${interpolate(stampHagemy, [0, 1], [1.05, 1]).toFixed(3)})`}
              >
                <text
                  x={0}
                  y={-6}
                  textAnchor="middle"
                  fill={PALETTE.inkDark}
                  style={{
                    fontFamily: FONT_JP,
                    fontSize: 66,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                  }}
                >
                  哈Gemi
                </text>
              </g>

              {/* Delicate divider star between names */}
              <FourPointStar
                x={0}
                y={46}
                size={15}
                rotation={frame * 0.4}
                opacity={stampAlgernon * 0.9}
                colorTop={PALETTE.starGoldSoft}
                colorBottom={PALETTE.lavenderSoft}
                goldRim={true}
              />

              {/* Stamped Calligraphy: Algernon */}
              <g
                opacity={stampAlgernon}
                transform={`translate(0, ${interpolate(stampAlgernon, [0, 1], [8, 0]).toFixed(1)})`}
              >
                <text
                  x={0}
                  y={118}
                  textAnchor="middle"
                  fill={PALETTE.inkMid}
                  style={{
                    fontFamily: FONT_JP,
                    fontSize: 42,
                    fontStyle: 'italic',
                    fontWeight: 500,
                    letterSpacing: '0.16em',
                  }}
                >
                  Algernon
                </text>
                <text
                  x={0}
                  y={168}
                  textAnchor="middle"
                  fill={PALETTE.inkSoft}
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 16,
                    letterSpacing: '0.32em',
                  }}
                >
                  NAME TAG
                </text>
              </g>
            </g>

            {/* Ambient floating tiny stars around bookmark */}
            <FourPointStar
              x={445}
              y={340 + Math.sin(frame * 0.04) * 10}
              size={18}
              rotation={frame * 0.6}
              opacity={0.75}
              colorTop={PALETTE.starCyan}
              colorBottom={PALETTE.lavender}
            />
            <FourPointStar
              x={1025}
              y={710 + Math.cos(frame * 0.036) * 12}
              size={14}
              rotation={-frame * 0.5}
              opacity={0.68}
              colorTop={PALETTE.starGoldSoft}
              colorBottom={PALETTE.starGold}
            />
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 2: A2 Hands — ART_PATHS.handsPetals + Petals & Star-Sand     */}
      {/* ================================================================= */}
      {handsOpacity > 0.005 && (
        <AbsoluteFill style={{ opacity: handsOpacity, pointerEvents: 'none' }}>
          {/* Center-left illustration (width 880, height 680) */}
          <div
            style={{
              position: 'absolute',
              left: 220,
              top: 195 + (1 - handsEnter) * 34 + handsFloatY,
              transform: `scale(${(0.97 + handsEnter * 0.03 + pulse * 0.014).toFixed(4)})`,
              transformOrigin: '50% 50%',
            }}
          >
            <PapercraftArt src={ART_PATHS.handsPetals} width={880} height={680} />
          </div>

          {/* Animated SVG lavender paper petals & golden star-sand trickling down */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* Lavender paper petals */}
            {petals.map((p) => {
              const localT = frame - CUES.A2_HANDS + p.delay;
              const cycle = ((localT % p.period) + p.period) % p.period;
              const prog = cycle / p.period;
              const px = p.startX + p.driftX * prog + Math.sin(prog * Math.PI * 3 + p.id) * 24;
              const py = p.startY + p.fallDist * prog;
              const alpha = interpolate(prog, [0, 0.14, 0.78, 1], [0, 0.92, 0.85, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const rot = p.rotStart + localT * p.rotSpeed;
              const flutterX = 0.65 + 0.35 * Math.cos(prog * Math.PI * 4 + p.id);

              return (
                <g
                  key={p.id}
                  transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${flutterX.toFixed(2)}, 1)`}
                  opacity={alpha}
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(46,43,62,0.10))' }}
                >
                  <path
                    d={`M 0 ${-p.size} C ${p.size * 0.75} ${-p.size * 0.3}, ${p.size * 0.65} ${p.size * 0.65}, 0 ${p.size} C ${-p.size * 0.65} ${p.size * 0.65}, ${-p.size * 0.75} ${-p.size * 0.3}, 0 ${-p.size} Z`}
                    fill={p.color}
                  />
                </g>
              );
            })}

            {/* Tiny golden star-sand grains */}
            {sandGrains.map((s) => {
              const localT = frame - CUES.A2_HANDS + s.delay;
              const cycle = ((localT % s.period) + s.period) % s.period;
              const prog = cycle / s.period;
              const sx = s.startX + s.driftX * prog + Math.sin(prog * Math.PI * 2.5 + s.id) * 10;
              const sy = s.startY + s.fallDist * prog;
              const twinkle = 0.55 + 0.45 * Math.sin(frame * 0.18 + s.id);
              const alpha =
                interpolate(prog, [0, 0.12, 0.8, 1], [0, 1, 0.9, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }) * twinkle;

              if (s.isStar) {
                const r = s.size * 1.4;
                return (
                  <path
                    key={s.id}
                    d={`M ${sx} ${sy - r} Q ${sx + r * 0.2} ${sy - r * 0.2} ${sx + r} ${sy} Q ${sx + r * 0.2} ${sy + r * 0.2} ${sx} ${sy + r} Q ${sx - r * 0.2} ${sy + r * 0.2} ${sx - r} ${sy} Q ${sx - r * 0.2} ${sy - r * 0.2} ${sx} ${sy - r} Z`}
                    fill={s.color}
                    opacity={alpha}
                  />
                );
              }
              return (
                <circle
                  key={s.id}
                  cx={sx}
                  cy={sy}
                  r={s.size}
                  fill={s.color}
                  opacity={alpha}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 4A: Distant Stars & Warm Breeze Ribbons (A2 Seaside)         */}
      {/* ================================================================= */}
      {seasideOpacity > 0.005 && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, opacity: seasideOpacity, pointerEvents: 'none' }}
        >
          {/* Distant twinkling four-pointed stars across upper-mid & right horizon */}
          {horizonStars.map((st) => {
            const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.08 + st.phase));
            return (
              <FourPointStar
                key={st.id}
                x={st.x}
                y={st.y}
                size={st.size}
                rotation={Math.sin(frame * 0.02 + st.phase) * 14}
                opacity={twinkle * 0.85}
                colorTop={st.colorTop}
                colorBottom={st.colorBottom}
                goldRim={st.size > 14}
                glow={0.25}
              />
            );
          })}

          {/* Warm breeze ribbons sweeping gently behind the seaside figure */}
          {[0, 1, 2].map((rIdx) => {
            const yBase = 290 + rIdx * 105;
            const waveShift = Math.sin(frame * 0.04 + rIdx * 1.7) * 26;
            const xSlide = ((frame - CUES.A2_SEASIDE) * (1.8 + rIdx * 0.5)) % 420;
            const ribbonColor =
              rIdx === 0
                ? PALETTE.paperLight
                : rIdx === 1
                  ? PALETTE.starGoldSoft
                  : PALETTE.lavenderSoft;
            return (
              <path
                key={rIdx}
                d={`M ${(640 - xSlide * 0.35).toFixed(1)} ${yBase} C ${920} ${(yBase - 42 + waveShift).toFixed(1)}, ${1280} ${(yBase + 38 - waveShift).toFixed(1)}, ${(1780 + xSlide * 0.25).toFixed(1)} ${(yBase - 18 + waveShift * 0.6).toFixed(1)}`}
                fill="none"
                stroke={ribbonColor}
                strokeWidth={14 - rIdx * 3}
                strokeLinecap="round"
                opacity={0.38 - rIdx * 0.06}
              />
            );
          })}
        </svg>
      )}

      {/* ================================================================= */}
      {/* BEAT 4B: ART_PATHS.seaside on right-center (3129..3491)           */}
      {/* ================================================================= */}
      {seasideOpacity > 0.005 && (
        <div
          style={{
            position: 'absolute',
            left: 930,
            top: 190 + seasideRise + seasideFloatY,
            opacity: seasideOpacity,
            transform: `scale(${(1 + pulse * 0.01).toFixed(4)})`,
            transformOrigin: '50% 60%',
            pointerEvents: 'none',
          }}
        >
          <PapercraftArt src={ART_PATHS.seaside} width={820} height={640} />
        </div>
      )}

      {/* ================================================================= */}
      {/* BEAT 3: Full-Width 5-Layer Papercraft Ocean Waves (2889..3491)    */}
      {/* ================================================================= */}
      {wavesActive && waveOpacity > 0.005 && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: waveOpacity,
            pointerEvents: 'none',
          }}
        >
          {waveLayers.map((layer, idx) => {
            const pathD = buildWavePath(
              layer.baseY + totalWaveOffsetY + layer.bob,
              layer.amp1,
              layer.amp2,
              layer.freq1,
              layer.freq2,
              frame * layer.speed1 + idx * 1.3,
              frame * layer.speed2 + idx * 2.1
            );
            return (
              <path
                key={idx}
                d={pathD}
                fill={layer.color}
                style={{ filter: layer.shadow }}
              />
            );
          })}

          {/* Tossed tiny white paper foam crescents & starry sand flecks */}
          {foamIntensity > 0.02 &&
            foamSpecks.map((fm) => {
              const t = (frame * fm.speed + fm.phase) % (Math.PI * 2);
              const arcProg = (Math.sin(t) + 1) * 0.5;
              const baseLayer = waveLayers[Math.min(fm.layer, waveLayers.length - 1)];
              const yPos =
                baseLayer.baseY +
                totalWaveOffsetY -
                arcProg * fm.arcHeight -
                12;
              const xPos = fm.x + Math.cos(t) * 28;
              const alpha = foamIntensity * Math.sin(arcProg * Math.PI) * 0.92;

              if (alpha <= 0.02 || yPos > 1100) return null;

              if (fm.isStar) {
                const r = fm.size * 0.65;
                return (
                  <path
                    key={fm.id}
                    d={`M ${xPos} ${yPos - r} Q ${xPos + r * 0.18} ${yPos - r * 0.18} ${xPos + r} ${yPos} Q ${xPos + r * 0.18} ${yPos + r * 0.18} ${xPos} ${yPos + r} Q ${xPos - r * 0.18} ${yPos + r * 0.18} ${xPos - r} ${yPos} Q ${xPos - r * 0.18} ${yPos - r * 0.18} ${xPos} ${yPos - r} Z`}
                    fill={PALETTE.starGoldSoft}
                    opacity={alpha}
                  />
                );
              }

              // Paper foam crescent
              return (
                <path
                  key={fm.id}
                  d={`M ${xPos - fm.size} ${yPos} Q ${xPos} ${yPos - fm.size * 0.95} ${xPos + fm.size} ${yPos} Q ${xPos} ${yPos - fm.size * 0.35} ${xPos - fm.size} ${yPos} Z`}
                  fill={PALETTE.waveFoam}
                  opacity={alpha}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(49,57,107,0.12))' }}
                />
              );
            })}
        </svg>
      )}

      {/* ================================================================= */}
      {/* BEAT 5: A2 Yawn — Soft Papercraft Cloud / Yawn Bubble + Specks    */}
      {/* ================================================================= */}
      {yawnActive && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* Main papercraft cloud / yawn bubble in upper-right sky */}
          {yawnCloudOpacity > 0.005 && (
            <g
              transform={`translate(1485, ${(225 - yawnDissolve * 24 + Math.sin(frame * 0.045) * 6).toFixed(1)}) scale(${yawnCloudScale.toFixed(3)})`}
              opacity={yawnCloudOpacity}
            >
              {/* Trailing small bubble puffs toward the seaside figure */}
              <circle
                cx={-148}
                cy={118}
                r={13}
                fill={PALETTE.paperLight}
                style={{ filter: 'drop-shadow(0 4px 8px rgba(46,43,62,0.09))' }}
              />
              <circle
                cx={-110}
                cy={82}
                r={21}
                fill={PALETTE.cloudWhite}
                style={{ filter: 'drop-shadow(0 5px 10px rgba(46,43,62,0.10))' }}
              />

              {/* Back warm-cream cloud layer */}
              <g
                transform="translate(8, 10)"
                style={{ filter: 'drop-shadow(0 12px 20px rgba(46,43,62,0.10))' }}
              >
                <circle cx={-72} cy={14} r={54} fill={PALETTE.paperWarm} />
                <circle cx={0} cy={-16} r={74} fill={PALETTE.paperWarm} />
                <circle cx={78} cy={12} r={58} fill={PALETTE.paperWarm} />
                <rect x={-76} y={6} width={156} height={60} rx={30} fill={PALETTE.paperWarm} />
              </g>

              {/* Front soft cloud-white paper layer */}
              <g style={{ filter: 'drop-shadow(0 8px 14px rgba(46,43,62,0.08))' }}>
                <circle cx={-74} cy={8} r={52} fill={PALETTE.cloudWhite} />
                <circle cx={-6} cy={-22} r={70} fill={PALETTE.cloudWhite} />
                <circle cx={72} cy={6} r={54} fill={PALETTE.cloudWhite} />
                <rect x={-78} y={2} width={152} height={58} rx={29} fill={PALETTE.cloudWhite} />
              </g>

              {/* Gentle sleep-yawn mini star sparkle inside bubble */}
              <FourPointStar
                x={26}
                y={-18}
                size={12}
                rotation={frame * 0.6}
                opacity={0.65}
                colorTop={PALETTE.starGoldSoft}
                colorBottom={PALETTE.lavenderSoft}
                goldRim={false}
              />
            </g>
          )}

          {/* Floating cream paper specks dissolving out of the yawn bubble */}
          {yawnDissolve > 0.01 &&
            yawnSpecks.map((sp) => {
              const localProg = interpolate(
                frame,
                [CUES.A2_YAWN + 68 + sp.delay, CUES.A2_YAWN + 168 + sp.delay],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
              );
              if (localProg <= 0 || localProg >= 1) return null;
              const sx = 1485 + sp.offsetX + sp.driftX * localProg;
              const sy = 225 + sp.offsetY + sp.driftY * localProg;
              const alpha = interpolate(localProg, [0, 0.25, 0.75, 1], [0, 0.9, 0.6, 0]);
              const scale = interpolate(localProg, [0, 0.3, 1], [0.5, 1, 0.35]);

              return (
                <circle
                  key={sp.id}
                  cx={sx}
                  cy={sy}
                  r={sp.r * scale}
                  fill={sp.color}
                  opacity={alpha}
                  style={{ filter: 'drop-shadow(0 3px 6px rgba(46,43,62,0.08))' }}
                />
              );
            })}
        </svg>
      )}
    </AbsoluteFill>
  );
};
