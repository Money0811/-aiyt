import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from 'remotion';
import { ACTS, ART_PATHS, CUES, FONT_JP, PALETTE } from '../constants';
import { FourPointStar, PapercraftArt, useSegmentOpacity } from '../PaperStage';

interface ShardData {
  id: number;
  /** Center position in the intact mosaic (around 960, 520) */
  homeX: number;
  homeY: number;
  /** Drifted floating position during Break / Smile / Live */
  driftX: number;
  driftY: number;
  /** Outward resting position during Bridge Live stillness */
  liveX: number;
  liveY: number;
  /** Local polygon points string */
  points: string;
  color: string;
  rotationSpeed: number;
  initialRot: number;
  driftPhase: number;
  nearCenter: boolean;
}

const SHARD_COLORS = [
  PALETTE.paperShadow,
  PALETTE.periwinkleLight,
  PALETTE.lavenderSoft,
  PALETTE.paperLight,
] as const;

/** Build a crisp lineless papercraft gear SVG path centered at (0, 0). */
function buildGearPath(
  outerR: number,
  rootR: number,
  teeth: number
): string {
  const parts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.32;
    const a3 = a0 + step * 0.62;
    const a4 = a0 + step * 0.76;

    const p0x = Math.cos(a0) * rootR;
    const p0y = Math.sin(a0) * rootR;
    const p1x = Math.cos(a1) * rootR;
    const p1y = Math.sin(a1) * rootR;
    const p2x = Math.cos(a2) * outerR;
    const p2y = Math.sin(a2) * outerR;
    const p3x = Math.cos(a3) * outerR;
    const p3y = Math.sin(a3) * outerR;
    const p4x = Math.cos(a4) * rootR;
    const p4y = Math.sin(a4) * rootR;

    parts.push(
      `${i === 0 ? 'M' : 'L'} ${p0x.toFixed(1)} ${p0y.toFixed(1)} ` +
        `L ${p1x.toFixed(1)} ${p1y.toFixed(1)} ` +
        `L ${p2x.toFixed(1)} ${p2y.toFixed(1)} ` +
        `L ${p3x.toFixed(1)} ${p3y.toFixed(1)} ` +
        `L ${p4x.toFixed(1)} ${p4y.toFixed(1)}`
    );
  }
  return `${parts.join(' ')} Z`;
}

/** Build a clean SVG arc path from startDeg to endDeg. */
function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const rad1 = ((startDeg - 90) * Math.PI) / 180;
  const rad2 = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + Math.cos(rad1) * r;
  const y1 = cy + Math.sin(rad1) * r;
  const x2 = cx + Math.cos(rad2) * r;
  const y2 = cy + Math.sin(rad2) * r;
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export const Act5BridgeInterlude: React.FC<{ pulse: number }> = ({ pulse }) => {
  const frame = useCurrentFrame();
  const actOpacity = useSegmentOpacity(
    frame,
    ACTS.ACT5.start,
    ACTS.ACT5.end,
    20,
    20
  );

  // Deterministic 28 polygonal paper shards arranged initially as a 7x4 geometric mosaic
  const shards = React.useMemo<ShardData[]>(() => {
    const cols = 7;
    const rows = 4;
    const cellW = 104;
    const cellH = 104;
    const originX = 960 - ((cols - 1) * cellW) / 2;
    const originY = 520 - ((rows - 1) * cellH) / 2;

    return Array.from({ length: 28 }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const homeX = originX + col * cellW;
      const homeY = originY + row * cellH;

      // Angle away from center for natural radial fracture
      const dx = homeX - 960 + (random(`sh-jx-${i}`) - 0.5) * 40;
      const dy = homeY - 520 + (random(`sh-jy-${i}`) - 0.5) * 40;
      const angle = Math.atan2(dy, dx);
      const dist = 260 + random(`sh-dist-${i}`) * 340;
      const driftX = Math.max(110, Math.min(1810, 960 + Math.cos(angle) * (dist * 1.45)));
      const driftY = Math.max(95, Math.min(985, 520 + Math.sin(angle) * (dist * 0.92)));

      // Slightly wider ring for Bridge Live so center stays serene for lyric
      const liveDist = dist + 140;
      const liveX = Math.max(90, Math.min(1830, 960 + Math.cos(angle) * (liveDist * 1.55)));
      const liveY = Math.max(85, Math.min(995, 520 + Math.sin(angle) * (liveDist * 0.98)));

      // Generate a crisp 3-to-5 vertex polygonal paper shard
      const sides = 3 + Math.floor(random(`sh-sides-${i}`) * 3);
      const baseR = 34 + random(`sh-rad-${i}`) * 24;
      const pts: string[] = [];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + random(`sh-pa-${i}-${s}`) * 0.45;
        const r = baseR * (0.72 + random(`sh-pr-${i}-${s}`) * 0.48);
        pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
      }

      return {
        id: i,
        homeX,
        homeY,
        driftX,
        driftY,
        liveX,
        liveY,
        points: pts.join(' '),
        color: SHARD_COLORS[i % SHARD_COLORS.length],
        rotationSpeed: (random(`sh-rs-${i}`) - 0.5) * 1.15,
        initialRot: (random(`sh-ir-${i}`) - 0.5) * 28,
        driftPhase: random(`sh-ph-${i}`) * Math.PI * 2,
        nearCenter: dist < 440,
      };
    });
  }, []);

  // Deterministic star dust particles for Interlude Phase 3 (gears -> shoes)
  const dustParticles = React.useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => {
      const a = random(`dust-a-${i}`) * Math.PI * 2;
      const r = 40 + random(`dust-r-${i}`) * 270;
      return {
        id: i,
        startX: 960 + Math.cos(a) * r,
        startY: 510 + Math.sin(a) * r,
        // Gather around the pair of shoes at bottom-center (960, 730)
        endX: 960 + (random(`dust-ex-${i}`) - 0.5) * 240,
        endY: 730 + (random(`dust-ey-${i}`) - 0.5) * 90,
        size: 5 + random(`dust-s-${i}`) * 8,
        delay: random(`dust-d-${i}`) * 22,
        isStar: i % 3 === 0,
        color:
          i % 3 === 0
            ? PALETTE.starGold
            : i % 3 === 1
            ? PALETTE.periwinkleLight
            : PALETTE.lavenderSoft,
      };
    });
  }, []);

  // Precompute gear SVG paths
  const gearPaths = React.useMemo(
    () => ({
      large: buildGearPath(156, 134, 16),
      medium: buildGearPath(114, 95, 12),
      small: buildGearPath(78, 62, 8),
    }),
    []
  );

  if (actOpacity <= 0.001) return null;

  // =========================================================================
  // Beat 1..3: Bridge Break (4456..4674), Smile (4674..4921), Live (4921..5021)
  // =========================================================================
  const frameOuterOpacity = interpolate(
    frame,
    [CUES.BRIDGE_BREAK, CUES.BRIDGE_BREAK + 22, 4565, 4635],
    [0, 1, 0.85, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const creaseOpacity = interpolate(
    frame,
    [4478, 4528, 4575],
    [0, 0.72, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // 0 = intact mosaic, 1 = drifted floating shards
  const fractureProgress = interpolate(
    frame,
    [4524, 4660],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // 0 = Smile perimeter, 1 = Live wider serene pause
  const liveSpreadProgress = interpolate(
    frame,
    [CUES.BRIDGE_LIVE - 10, CUES.BRIDGE_LIVE + 36],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Stillness factor during Bridge Live (slows ambient bobbing)
  const stillnessDamp = interpolate(
    frame,
    [CUES.BRIDGE_LIVE - 6, CUES.BRIDGE_LIVE + 24, CUES.INTERLUDE_START - 6, CUES.INTERLUDE_START + 12],
    [1, 0.14, 0.14, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Sweep shards into the crane at Interlude Phase 1 (5021..5072)
  const sweepToCrane = interpolate(
    frame,
    [CUES.INTERLUDE_START, CUES.INTERLUDE_START + 48],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  const shardsOpacity = interpolate(
    frame,
    [CUES.BRIDGE_BREAK - 10, CUES.BRIDGE_BREAK + 16, CUES.INTERLUDE_START + 34, CUES.INTERLUDE_START + 54],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Warm lantern glow during Bridge Smile (4674..4921)
  const lanternGlow = interpolate(
    frame,
    [CUES.BRIDGE_SMILE - 10, CUES.BRIDGE_SMILE + 34, CUES.BRIDGE_LIVE - 8, CUES.BRIDGE_LIVE + 28],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ART_PATHS.smile envelope
  const smileOpacity = interpolate(
    frame,
    [CUES.BRIDGE_SMILE, CUES.BRIDGE_SMILE + 34, CUES.BRIDGE_LIVE - 4, CUES.BRIDGE_LIVE + 34],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const smileScale = interpolate(
    frame,
    [CUES.BRIDGE_SMILE, CUES.BRIDGE_SMILE + 40, CUES.BRIDGE_LIVE, CUES.BRIDGE_LIVE + 36],
    [0.95, 1, 1, 0.94],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // Bridge Live single glowing star beneath center (y: 670)
  const liveStarOpacity = interpolate(
    frame,
    [CUES.BRIDGE_LIVE + 4, CUES.BRIDGE_LIVE + 26, CUES.INTERLUDE_START - 4, CUES.INTERLUDE_START + 18],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // =========================================================================
  // Beat 4: C-melody MG Showcase (CUES.INTERLUDE_START..ACTS.ACT5.end)
  // =========================================================================
  const p1Start = CUES.INTERLUDE_START;
  const p2Start = p1Start + 160;
  const p3Start = p1Start + 320;

  // Phase 1: Origami Paper Crane
  const craneT = interpolate(
    frame,
    [p1Start + 18, p2Start + 6],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.sin),
    }
  );
  const craneOpacity = interpolate(
    frame,
    [p1Start + 14, p1Start + 42, p2Start - 14, p2Start + 12],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const craneX = interpolate(craneT, [0, 1], [340, 1520]);
  const craneY = 580 - Math.sin(craneT * Math.PI) * 210 - craneT * 110;
  const craneTilt = interpolate(craneT, [0, 0.5, 1], [-14, -4, 10]);
  const wingFlap = Math.sin((frame - p1Start) * 0.22);
  const upperWingY = -88 + wingFlap * 48;
  const lowerWingY = -56 + wingFlap * 36;

  // Phase 2: 3 Interlocking Papercraft Clockwork Gears & Dial Arcs
  const gearsOpacity = interpolate(
    frame,
    [p2Start - 2, p2Start + 26, p3Start - 16, p3Start + 12],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const gearsScale = interpolate(
    frame,
    [p2Start - 2, p2Start + 32, p3Start - 16, p3Start + 12],
    [0.84, 1, 1, 0.92],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const gearBaseAngle = (frame - p2Start) * 1.1; // degrees

  // Phase 3: Star Dust -> Little Star-Accented Shoes
  const dustVisible = frame >= p3Start - 12 && frame <= ACTS.ACT5.end - 12;

  const shoesOpacity = interpolate(
    frame,
    [p3Start + 32, p3Start + 64, ACTS.ACT5.end - 18, ACTS.ACT5.end],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const shoesScale = interpolate(
    frame,
    [p3Start + 32, p3Start + 70],
    [0.88, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.2)),
    }
  );

  // Crane gathering target for shards at start of Interlude
  const craneGatherX = 460;
  const craneGatherY = 550;

  return (
    <AbsoluteFill style={{ opacity: actOpacity }}>
      {/* Warm Dual Crimson-Pink & Golden-Amber Paper-Lantern Glow (Bridge Smile) */}
      {lanternGlow > 0.005 && (
        <AbsoluteFill
          style={{
            opacity: lanternGlow * (0.92 + pulse * 0.08),
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 960 - 440,
              top: 510 - 440,
              width: 880,
              height: 880,
              borderRadius: '50%',
              background: `radial-gradient(circle at 46% 48%, rgba(232,99,130,0.22) 0%, rgba(244,198,94,0.26) 44%, rgba(252,227,158,0.08) 70%, rgba(239,236,225,0) 100%)`,
              transform: `scale(${1 + pulse * 0.035})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 960 - 300,
              top: 510 - 300,
              width: 600,
              height: 600,
              borderRadius: '50%',
              background: `radial-gradient(circle at 55% 52%, rgba(244,198,94,0.28) 0%, rgba(232,99,130,0.12) 55%, rgba(239,236,225,0) 100%)`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Bridge Smile Portrait (ART_PATHS.smile, 680x680) */}
      {smileOpacity > 0.005 && (
        <div
          style={{
            position: 'absolute',
            left: 960 - 340,
            top: 510 - 340,
            opacity: smileOpacity,
            transform: `scale(${smileScale + pulse * 0.008})`,
            transformOrigin: 'center center',
            filter: 'drop-shadow(0 14px 26px rgba(232,99,130,0.12))',
          }}
        >
          <PapercraftArt
            src={ART_PATHS.smile}
            width={680}
            height={680}
            feather
            multiply
          />
        </div>
      )}

      {/* Main Papercraft SVG Stage */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <filter id="act5-paper-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#2E2B3E" floodOpacity="0.11" />
          </filter>
          <filter id="act5-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2E2B3E" floodOpacity="0.09" />
          </filter>
        </defs>

        {/* ---------------------------------------------------------------
            BEAT 1: Crisp Layered Papercraft Geometric Frame & Fold Creases
           --------------------------------------------------------------- */}
        {frameOuterOpacity > 0.005 && (
          <g opacity={frameOuterOpacity} filter="url(#act5-paper-shadow)">
            {/* Outer shadowbox frame */}
            <rect
              x={556}
              y={276}
              width={808}
              height={488}
              rx={16}
              fill={PALETTE.paperShadow}
            />
            <rect
              x={574}
              y={294}
              width={772}
              height={452}
              rx={10}
              fill={PALETTE.paperLight}
            />
            {/* Subtle fold crease facets appearing before fracture */}
            {creaseOpacity > 0.005 && (
              <g opacity={creaseOpacity}>
                <polygon
                  points="574,294 960,520 574,746"
                  fill={PALETTE.paperShadow}
                  opacity={0.28}
                />
                <polygon
                  points="1346,294 960,520 1346,746"
                  fill={PALETTE.periwinkleLight}
                  opacity={0.18}
                />
                <polygon
                  points="574,294 1346,294 960,520"
                  fill={PALETTE.paperLight}
                  opacity={0.35}
                />
              </g>
            )}
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 1..3: 28 Weightless Floating Polygonal Paper Shards
           --------------------------------------------------------------- */}
        {shardsOpacity > 0.005 && (
          <g opacity={shardsOpacity}>
            {shards.map((sh) => {
              // Interpolate Home -> Drift -> Live -> Crane gather
              const baseX = interpolate(fractureProgress, [0, 1], [sh.homeX, sh.driftX]);
              const baseY = interpolate(fractureProgress, [0, 1], [sh.homeY, sh.driftY]);
              const spreadX = interpolate(liveSpreadProgress, [0, 1], [baseX, sh.liveX]);
              const spreadY = interpolate(liveSpreadProgress, [0, 1], [baseY, sh.liveY]);
              const finalX = interpolate(sweepToCrane, [0, 1], [spreadX, craneGatherX]);
              const finalY = interpolate(sweepToCrane, [0, 1], [spreadY, craneGatherY]);

              const floatBobX =
                Math.sin(frame * 0.025 + sh.driftPhase) * 14 * fractureProgress * stillnessDamp * (1 - sweepToCrane);
              const floatBobY =
                Math.cos(frame * 0.02 + sh.driftPhase) * 12 * fractureProgress * stillnessDamp * (1 - sweepToCrane);

              const rot =
                sh.initialRot * fractureProgress +
                (frame - CUES.BRIDGE_BREAK) * sh.rotationSpeed * fractureProgress * (0.3 + 0.7 * stillnessDamp) +
                sweepToCrane * 95;

              const scale = interpolate(sweepToCrane, [0, 0.7, 1], [1, 0.82, 0.32]);
              const goldEdgeOpacity = sh.nearCenter ? lanternGlow * 0.65 : lanternGlow * 0.22;

              return (
                <g
                  key={sh.id}
                  transform={`translate(${(finalX + floatBobX).toFixed(1)}, ${(finalY + floatBobY).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(3)})`}
                  filter="url(#act5-soft-shadow)"
                >
                  <polygon points={sh.points} fill={sh.color} />
                  {/* Subtle inner paper highlight facet */}
                  <polygon
                    points={sh.points}
                    fill={PALETTE.paperLight}
                    opacity={0.18}
                    transform="scale(0.68) translate(-3, -3)"
                  />
                  {/* Warm golden-amber lantern rim tint during Bridge Smile */}
                  {goldEdgeOpacity > 0.01 && (
                    <polygon
                      points={sh.points}
                      fill="none"
                      stroke={PALETTE.starGold}
                      strokeWidth={2.5}
                      opacity={goldEdgeOpacity}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 3: Bridge Live — One Gently Pulsing FourPointStar (y: 670)
           --------------------------------------------------------------- */}
        {liveStarOpacity > 0.005 && (
          <g opacity={liveStarOpacity}>
            <circle
              cx={960}
              cy={670}
              r={44 + pulse * 10}
              fill={PALETTE.starGoldSoft}
              opacity={0.22 + pulse * 0.12}
            />
            <circle
              cx={960}
              cy={670}
              r={28 + pulse * 5}
              fill={PALETTE.paperLight}
              opacity={0.55}
            />
            <FourPointStar
              x={960}
              y={670}
              size={24 + pulse * 4}
              rotation={Math.sin(frame * 0.04) * 6}
              colorTop={PALETTE.starGoldSoft}
              colorBottom={PALETTE.lavenderSoft}
              glow={0.65 + pulse * 0.35}
            />
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 4 / PHASE 1: Origami Paper Crane Gliding Left -> Right (5021..5150)
           --------------------------------------------------------------- */}
        {craneOpacity > 0.005 && (
          <g opacity={craneOpacity}>
            {/* Delicate paper trail sparkles behind the crane */}
            {[0, 1, 2, 3, 4].map((idx) => {
              const trailT = Math.max(0, craneT - (idx + 1) * 0.055);
              const tx = interpolate(trailT, [0, 1], [340, 1520]);
              const ty = 580 - Math.sin(trailT * Math.PI) * 210 - trailT * 110 + Math.sin(frame * 0.12 + idx) * 8;
              return (
                <FourPointStar
                  key={idx}
                  x={tx}
                  y={ty}
                  size={10 - idx * 1.4}
                  opacity={Math.max(0.15, 0.75 - idx * 0.14)}
                  colorTop={PALETTE.starGoldSoft}
                  colorBottom={PALETTE.periwinkleLight}
                  goldRim={false}
                />
              );
            })}

            {/* Multi-facet lineless origami paper crane */}
            <g
              transform={`translate(${craneX.toFixed(1)}, ${craneY.toFixed(1)}) rotate(${craneTilt.toFixed(1)}) scale(1.18)`}
              filter="url(#act5-paper-shadow)"
            >
              {/* Back wing */}
              <polygon
                points={`-26,-6 18,-14 -8,${lowerWingY.toFixed(1)}`}
                fill={PALETTE.lavenderSoft}
              />
              {/* Tail facet */}
              <polygon
                points="-34,6 -92,-38 -52,18"
                fill={PALETTE.periwinkleLight}
              />
              <polygon
                points="-34,6 -52,18 -14,22"
                fill={PALETTE.paperShadow}
              />
              {/* Body center diamond */}
              <polygon
                points="-36,6 10,-16 42,4 -14,22"
                fill={PALETTE.paperLight}
              />
              <polygon
                points="10,-16 42,4 -14,22"
                fill={PALETTE.paperWarm}
              />
              {/* Neck & head */}
              <polygon
                points="32,-2 78,-42 52,8"
                fill={PALETTE.periwinkleLight}
              />
              <polygon
                points="78,-42 104,-30 72,-24"
                fill={PALETTE.starGoldSoft}
              />
              {/* Front wing (articulated) */}
              <polygon
                points={`-18,4 28,-8 -14,${upperWingY.toFixed(1)}`}
                fill={PALETTE.paperLight}
              />
              <polygon
                points={`-18,4 6,-2 -14,${upperWingY.toFixed(1)}`}
                fill={PALETTE.paperShadow}
                opacity={0.45}
              />
            </g>
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 4 / PHASE 2: 3 Interlocking Clockwork Gears & Dial Arcs (5150..5280)
           --------------------------------------------------------------- */}
        {gearsOpacity > 0.005 && (
          <g
            opacity={gearsOpacity}
            transform={`translate(960, 520) scale(${gearsScale.toFixed(3)}) translate(-960, -520)`}
          >
            {/* Minimalist Roman-numeral dial arcs */}
            <g opacity={0.85}>
              <path
                d={buildArcPath(960, 520, 315, -55, 65)}
                fill="none"
                stroke={PALETTE.paperShadow}
                strokeWidth={14}
                strokeLinecap="round"
              />
              <path
                d={buildArcPath(960, 520, 315, 115, 235)}
                fill="none"
                stroke={PALETTE.periwinkleLight}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.55}
              />
              <path
                d={buildArcPath(960, 520, 286, 20, 145)}
                fill="none"
                stroke={PALETTE.starGoldSoft}
                strokeWidth={6}
                strokeLinecap="round"
              />
              {/* Roman numerals */}
              {[
                { label: 'XII', x: 960, y: 184 },
                { label: 'III', x: 1300, y: 528 },
                { label: 'VI', x: 960, y: 868 },
                { label: 'IX', x: 620, y: 528 },
              ].map((num) => (
                <text
                  key={num.label}
                  x={num.x}
                  y={num.y}
                  textAnchor="middle"
                  fill={PALETTE.inkSoft}
                  fontFamily={FONT_JP}
                  fontSize={24}
                  letterSpacing="0.14em"
                >
                  {num.label}
                </text>
              ))}
            </g>

            {/* Gear 1: Large cream papercraft gear (16 teeth, clockwise) */}
            <g
              transform={`translate(875, 515) rotate(${gearBaseAngle.toFixed(1)})`}
              filter="url(#act5-paper-shadow)"
            >
              <path d={gearPaths.large} fill={PALETTE.mazeWall} />
              <circle cx={0} cy={0} r={96} fill={PALETTE.paperLight} />
              <circle cx={0} cy={0} r={54} fill={PALETTE.paperBase} />
              <circle cx={0} cy={0} r={22} fill={PALETTE.starGoldSoft} />
            </g>

            {/* Gear 2: Medium periwinkle gear (12 teeth, counter-clockwise, meshed) */}
            <g
              transform={`translate(1118, 468) rotate(${(-gearBaseAngle * (16 / 12) + 14).toFixed(1)})`}
              filter="url(#act5-paper-shadow)"
            >
              <path d={gearPaths.medium} fill={PALETTE.periwinkleLight} />
              <circle cx={0} cy={0} r={66} fill={PALETTE.paperLight} />
              <circle cx={0} cy={0} r={32} fill={PALETTE.lavenderSoft} />
              <circle cx={0} cy={0} r={12} fill={PALETTE.paperBase} />
            </g>

            {/* Gear 3: Small golden gear (8 teeth, clockwise, meshed) */}
            <g
              transform={`translate(1042, 652) rotate(${(gearBaseAngle * 2 + 8).toFixed(1)})`}
              filter="url(#act5-paper-shadow)"
            >
              <path d={gearPaths.small} fill={PALETTE.starGold} />
              <circle cx={0} cy={0} r={42} fill={PALETTE.starGoldSoft} />
              <circle cx={0} cy={0} r={18} fill={PALETTE.paperBase} />
            </g>
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 4 / PHASE 3: Sparkling Star Dust -> Little Star-Accented Shoes (5280..5392)
           --------------------------------------------------------------- */}
        {dustVisible && (
          <g>
            {dustParticles.map((p) => {
              const localT = interpolate(
                frame,
                [p3Start - 8 + p.delay * 0.5, p3Start + 54 + p.delay * 0.4],
                [0, 1],
                {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.inOut(Easing.cubic),
                }
              );
              const px = interpolate(localT, [0, 1], [p.startX, p.endX]);
              const py =
                interpolate(localT, [0, 1], [p.startY, p.endY]) -
                Math.sin(localT * Math.PI) * 55;
              const pOpacity = interpolate(
                localT,
                [0, 0.18, 0.78, 1],
                [0, 0.92, 0.8, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              if (pOpacity <= 0.01) return null;
              return p.isStar ? (
                <FourPointStar
                  key={p.id}
                  x={px}
                  y={py}
                  size={p.size}
                  opacity={pOpacity}
                  colorTop={PALETTE.starGoldSoft}
                  colorBottom={p.color}
                  goldRim={false}
                />
              ) : (
                <circle
                  key={p.id}
                  cx={px}
                  cy={py}
                  r={p.size * 0.42}
                  fill={p.color}
                  opacity={pOpacity}
                />
              );
            })}
          </g>
        )}

        {/* Minimalist papercraft silhouette of little star-accented shoes at bottom-center */}
        {shoesOpacity > 0.005 && (
          <g
            opacity={shoesOpacity}
            transform={`translate(960, 730) scale(${shoesScale.toFixed(3)})`}
            filter="url(#act5-paper-shadow)"
          >
            {/* Grounded soft paper shadow */}
            <ellipse cx={0} cy={42} rx={138} ry={16} fill={PALETTE.paperShadow} opacity={0.75} />

            {/* Left little shoe */}
            <g transform="translate(-58, 0) rotate(-4)">
              {/* Minimalist sock cuff */}
              <path
                d="M -22,-32 L 18,-32 L 22,-4 L -24,-4 Z"
                fill={PALETTE.paperLight}
              />
              {/* Shoe body */}
              <path
                d="M -28,-6 C -30,18 -24,30 -4,30 L 38,30 C 52,30 56,18 46,8 C 34,-2 16,-4 -2,-6 Z"
                fill={PALETTE.navy}
              />
              {/* Subtle highlight facet */}
              <path
                d="M -10,16 L 36,16 C 42,16 44,22 36,24 L -6,24 Z"
                fill={PALETTE.navySoft}
                opacity={0.55}
              />
              {/* Strap */}
              <rect x={-16} y={-2} width={36} height={7} rx={3.5} fill={PALETTE.navySoft} />
              {/* Star clasp */}
              <FourPointStar
                x={6}
                y={2}
                size={9}
                colorTop={PALETTE.starGoldSoft}
                colorBottom={PALETTE.starGold}
                goldRim={false}
                glow={0.5 + pulse * 0.3}
              />
            </g>

            {/* Right little shoe */}
            <g transform="translate(58, 4) rotate(5)">
              <path
                d="M -18,-32 L 22,-32 L 24,-4 L -22,-4 Z"
                fill={PALETTE.paperLight}
              />
              <path
                d="M -24,-6 C -26,18 -20,30 0,30 L 42,30 C 56,30 60,18 50,8 C 38,-2 20,-4 2,-6 Z"
                fill={PALETTE.navy}
              />
              <path
                d="M -6,16 L 40,16 C 46,16 48,22 40,24 L -2,24 Z"
                fill={PALETTE.navySoft}
                opacity={0.55}
              />
              <rect x={-12} y={-2} width={36} height={7} rx={3.5} fill={PALETTE.navySoft} />
              <FourPointStar
                x={10}
                y={2}
                size={9}
                colorTop={PALETTE.starGoldSoft}
                colorBottom={PALETTE.starGold}
                goldRim={false}
                glow={0.5 + pulse * 0.3}
              />
            </g>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
