import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ACTS, ART_PATHS, CUES, PALETTE } from '../constants';
import { FourPointStar, PapercraftArt, useSegmentOpacity } from '../PaperStage';

interface BokehCircle {
  id: number;
  x: number;
  startY: number;
  driftX: number;
  r: number;
  speed: number;
  phase: number;
  color: string;
  maxOpacity: number;
}

interface FoliageCluster {
  id: number;
  x: number;
  y: number;
  r: number;
  shape: 'circle' | 'teardrop';
  rot: number;
  color: string;
  bloomDelay: number;
  thinDelay: number;
  swayPhase: number;
}

interface SunlightOval {
  id: number;
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot: number;
  driftY: number;
  phase: number;
  color: string;
}

interface SheddingItem {
  id: number;
  startX: number;
  startY: number;
  driftX: number;
  fallY: number;
  size: number;
  delay: number;
  duration: number;
  rotStart: number;
  rotSpeed: number;
  color: string;
  kind: 'card' | 'star';
}

/**
 * Act 4: Chorus 2 — Serene Dusk Sleep, Grand Pop-Up Papercraft Tree,
 * Dappled Tree Shade, Shedding Memory Cards (Forget), and Ghostly Embossed Motifs.
 * Global frames: ACTS.ACT4.start (3451) .. ACTS.ACT4.end (4476).
 */
export const Act4Chorus2Tree: React.FC<{ pulse: number }> = ({ pulse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const actOpacity = useSegmentOpacity(frame, ACTS.ACT4.start, ACTS.ACT4.end, 20, 20);

  // Warm golden-lavender bokeh paper circles drifting lazily upward
  const bokehCircles = React.useMemo<BokehCircle[]>(() => {
    const colors = [
      PALETTE.starGoldSoft,
      PALETTE.lavenderSoft,
      PALETTE.paperWarm,
      PALETTE.periwinkleLight,
    ];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 120 + random(`a4-bk-x-${i}`) * 1680,
      startY: 220 + random(`a4-bk-y-${i}`) * 960,
      driftX: -28 + random(`a4-bk-dx-${i}`) * 56,
      r: 14 + random(`a4-bk-r-${i}`) * 34,
      speed: 0.45 + random(`a4-bk-sp-${i}`) * 0.65,
      phase: random(`a4-bk-ph-${i}`) * Math.PI * 2,
      color: colors[i % colors.length],
      maxOpacity: 0.18 + random(`a4-bk-op-${i}`) * 0.24,
    }));
  }, []);

  // 24 lush layered circular/teardrop paper foliage clusters for the grand pop-up tree
  const foliageClusters = React.useMemo<FoliageCluster[]>(() => {
    const layout: Array<{ x: number; y: number; r: number; color: string; shape: 'circle' | 'teardrop'; rot: number }> = [
      // Back canopy layer (wider, deeper tones)
      { x: 645, y: 395, r: 92, color: PALETTE.treeLeaf1, shape: 'circle', rot: -15 },
      { x: 1275, y: 390, r: 94, color: PALETTE.treeLeaf1, shape: 'circle', rot: 14 },
      { x: 750, y: 265, r: 98, color: PALETTE.treeLeaf2, shape: 'circle', rot: -8 },
      { x: 1170, y: 260, r: 100, color: PALETTE.treeLeaf4, shape: 'circle', rot: 10 },
      { x: 960, y: 205, r: 112, color: PALETTE.treeLeaf1, shape: 'circle', rot: 0 },
      { x: 565, y: 465, r: 72, color: PALETTE.treeLeaf4, shape: 'teardrop', rot: -38 },
      { x: 1355, y: 460, r: 74, color: PALETTE.treeLeaf2, shape: 'teardrop', rot: 36 },

      // Mid canopy layer (lush layered papercraft volume)
      { x: 700, y: 430, r: 84, color: PALETTE.treeLeaf4, shape: 'circle', rot: -12 },
      { x: 1220, y: 425, r: 86, color: PALETTE.treeLeaf3, shape: 'circle', rot: 12 },
      { x: 830, y: 325, r: 92, color: PALETTE.treeLeaf3, shape: 'circle', rot: -6 },
      { x: 1090, y: 320, r: 94, color: PALETTE.treeLeaf2, shape: 'circle', rot: 8 },
      { x: 960, y: 295, r: 96, color: PALETTE.treeLeaf4, shape: 'circle', rot: 0 },
      { x: 620, y: 330, r: 74, color: PALETTE.treeLeaf3, shape: 'teardrop', rot: -26 },
      { x: 1300, y: 325, r: 74, color: PALETTE.treeLeaf4, shape: 'teardrop', rot: 28 },
      { x: 865, y: 195, r: 76, color: PALETTE.treeLeaf3, shape: 'teardrop', rot: -16 },
      { x: 1055, y: 192, r: 78, color: PALETTE.treeLeaf2, shape: 'teardrop', rot: 16 },

      // Front highlight clusters (lighter cream & warm gold accents)
      { x: 775, y: 390, r: 68, color: PALETTE.paperLight, shape: 'circle', rot: -10 },
      { x: 1145, y: 388, r: 70, color: PALETTE.treeLeaf4, shape: 'circle', rot: 10 },
      { x: 960, y: 375, r: 78, color: PALETTE.treeLeaf2, shape: 'circle', rot: 0 },
      { x: 895, y: 265, r: 64, color: PALETTE.paperLight, shape: 'teardrop', rot: -14 },
      { x: 1030, y: 268, r: 66, color: PALETTE.treeLeaf3, shape: 'teardrop', rot: 18 },
      { x: 690, y: 350, r: 56, color: PALETTE.treeLeaf2, shape: 'teardrop', rot: -22 },
      { x: 1230, y: 350, r: 58, color: PALETTE.paperLight, shape: 'teardrop', rot: 24 },
      { x: 960, y: 155, r: 62, color: PALETTE.paperLight, shape: 'teardrop', rot: 0 },
    ];

    return layout.map((item, i) => ({
      id: i,
      ...item,
      bloomDelay: 74 + Math.floor(i * 4.2),
      thinDelay: Math.floor(random(`a4-th-${i}`) * 230),
      swayPhase: random(`a4-sw-${i}`) * Math.PI * 2,
    }));
  }, []);

  // Dappled sunlight paper ovals filtering through the canopy (Tree Shade)
  const sunlightOvals = React.useMemo<SunlightOval[]>(() => {
    const colors = [PALETTE.paperLight, PALETTE.starGoldSoft, PALETTE.breadGlow];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: 610 + random(`a4-sun-x-${i}`) * 700,
      y: 350 + random(`a4-sun-y-${i}`) * 410,
      rx: 18 + random(`a4-sun-rx-${i}`) * 30,
      ry: 8 + random(`a4-sun-ry-${i}`) * 14,
      rot: -18 + random(`a4-sun-rt-${i}`) * 36,
      driftY: 18 + random(`a4-sun-dy-${i}`) * 28,
      phase: random(`a4-sun-ph-${i}`) * Math.PI * 2,
      color: colors[i % colors.length],
    }));
  }, []);

  // 36 shedding blank memory paper cards & tiny four-pointed star leaves (Forget)
  const sheddingItems = React.useMemo<SheddingItem[]>(() => {
    const cardColors = [
      PALETTE.paperLight,
      PALETTE.treeLeaf4,
      PALETTE.treeLeaf2,
      PALETTE.treeLeaf3,
      PALETTE.paperWarm,
    ];
    const starColors = [
      PALETTE.starGold,
      PALETTE.treeLeaf3,
      PALETTE.lavenderSoft,
      PALETTE.periwinkleLight,
    ];
    return Array.from({ length: 36 }, (_, i) => {
      const kind: 'card' | 'star' = i % 3 === 0 ? 'star' : 'card';
      return {
        id: i,
        startX: 600 + random(`a4-sh-x-${i}`) * 720,
        startY: 190 + random(`a4-sh-y-${i}`) * 290,
        driftX: 160 + random(`a4-sh-dx-${i}`) * 300,
        fallY: 260 + random(`a4-sh-fy-${i}`) * 360,
        size: kind === 'card' ? 14 + random(`a4-sh-sz-${i}`) * 14 : 8 + random(`a4-sh-sz-${i}`) * 9,
        delay: random(`a4-sh-dl-${i}`) * 185,
        duration: 95 + random(`a4-sh-du-${i}`) * 65,
        rotStart: random(`a4-sh-rs-${i}`) * 360,
        rotSpeed: (random(`a4-sh-rp-${i}`) - 0.5) * 2.6,
        color:
          kind === 'card'
            ? cardColors[i % cardColors.length]
            : starColors[i % starColors.length],
        kind,
      };
    });
  }, []);

  if (actOpacity <= 0.001) return null;

  // =========================================================================
  // Beat 1: 3471..3703 (Chorus 2 Sleep) — Dusk lightbox + sleeping figure
  // =========================================================================
  const sleepBreathingScale = 1.0 + Math.sin(frame * 0.04) * 0.012;
  const sleepOpacity = interpolate(
    frame,
    [CUES.CHORUS2_SLEEP - 16, CUES.CHORUS2_SLEEP + 20, CUES.CHORUS2_TREE, CUES.CHORUS2_SHADE, CUES.CHORUS2_FORGET, CUES.CHORUS2_FORGET + 95],
    [0, 1, 0.96, 0.44, 0.36, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Smoothly glides sleeping figure from center-left (during Sleep) to resting under tree shade
  const sleepReposition = interpolate(
    frame,
    [CUES.CHORUS2_TREE + 10, CUES.CHORUS2_SHADE - 10],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );
  const sleepLeft = interpolate(sleepReposition, [0, 1], [160, 510]);
  const sleepTop = interpolate(sleepReposition, [0, 1], [200, 385]);
  const sleepScale = interpolate(sleepReposition, [0, 1], [1, 0.68]) * sleepBreathingScale;

  const bokehGlobalOpacity = interpolate(
    frame,
    [CUES.CHORUS2_SLEEP - 16, CUES.CHORUS2_SLEEP + 26, CUES.CHORUS2_TREE + 40, CUES.CHORUS2_FORGET],
    [0, 1, 0.52, 0.2],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // =========================================================================
  // Beat 2: 3703..3928 (Chorus 2 Tree) — Pop-up slit, trunk, branches, canopy
  // =========================================================================
  const treeActive = frame >= CUES.CHORUS2_TREE - 6;
  const slitWidth = interpolate(
    frame,
    [CUES.CHORUS2_TREE - 4, CUES.CHORUS2_TREE + 24],
    [0, 380],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const slitOpacity = interpolate(
    frame,
    [CUES.CHORUS2_TREE - 4, CUES.CHORUS2_TREE + 16, Math.min(CUES.CHORUS2_MEMORIES + 60, ACTS.ACT4.end - 30), ACTS.ACT4.end],
    [0, 0.85, 0.55, 0.15],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const trunkGrow = interpolate(
    frame,
    [CUES.CHORUS2_TREE + 8, CUES.CHORUS2_TREE + 78],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const branchGrow = interpolate(
    frame,
    [CUES.CHORUS2_TREE + 52, CUES.CHORUS2_TREE + 112],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Overall tree fade softening slightly as memories dissolve at very end
  const treeFadeEnd = interpolate(
    frame,
    [CUES.CHORUS2_MEMORIES + 60, ACTS.ACT4.end - 12],
    [1, 0.38],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // =========================================================================
  // Beat 3: 3928..4028 (Tree Shade) — Dappled sunlight paper ovals
  // =========================================================================
  const shadeOpacity = useSegmentOpacity(
    frame,
    CUES.CHORUS2_SHADE - 10,
    CUES.CHORUS2_FORGET + 55,
    24,
    38
  );

  // =========================================================================
  // Beat 4: 4028..4211 (Forget) — Shedding cards & star leaves
  // =========================================================================
  const forgetActive = frame >= CUES.CHORUS2_FORGET - 4;

  // =========================================================================
  // Beat 5: 4211..4476 (Memories Fade) — Ghostly white embossed silhouettes
  // =========================================================================
  const memoriesActive = frame >= CUES.CHORUS2_MEMORIES - 8;
  const paleCreamWash = interpolate(
    frame,
    [CUES.CHORUS2_MEMORIES, ACTS.ACT4.end - 10],
    [0, 0.42],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
  );

  const ghostMotifs = [
    { id: 'bread', x: 370, baseY: 660, delay: 0, rise: 195, scale: 1.05 },
    { id: 'wave', x: 660, baseY: 720, delay: 28, rise: 180, scale: 1.0 },
    { id: 'cloud', x: 1265, baseY: 640, delay: 16, rise: 205, scale: 1.08 },
    { id: 'footprint', x: 1535, baseY: 705, delay: 44, rise: 190, scale: 0.98 },
  ] as const;

  const slitY = 852;

  return (
    <AbsoluteFill style={{ opacity: actOpacity }}>
      {/* Warm dusk lightbox ambient glow */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 36% 48%, rgba(252,227,158,0.34) 0%, rgba(215,178,248,0.22) 48%, rgba(239,236,225,0) 80%)',
          opacity: interpolate(
            frame,
            [CUES.CHORUS2_SLEEP, CUES.CHORUS2_TREE, CUES.CHORUS2_MEMORIES],
            [0.85, 0.62, 0.25],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          ),
          pointerEvents: 'none',
        }}
      />

      {/* ================================================================= */}
      {/* BEAT 1A: Warm Golden-Lavender Bokeh Paper Circles                 */}
      {/* ================================================================= */}
      {bokehGlobalOpacity > 0.005 && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, opacity: bokehGlobalOpacity, pointerEvents: 'none' }}
        >
          {bokehCircles.map((b) => {
            const elapsed = frame - ACTS.ACT4.start;
            const rawY = b.startY - elapsed * b.speed;
            const y = (((rawY + 120) % 1260) + 1260) % 1260 - 120;
            const x = b.x + Math.sin(elapsed * 0.02 + b.phase) * 26 + b.driftX * 0.3;
            const edgeFade = interpolate(y, [-80, 120, 920, 1100], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <circle
                key={b.id}
                cx={x}
                cy={y}
                r={b.r * (1 + pulse * 0.05)}
                fill={b.color}
                opacity={b.maxOpacity * edgeFade}
                style={{ filter: 'drop-shadow(0 4px 10px rgba(46,43,62,0.06))' }}
              />
            );
          })}
        </svg>
      )}

      {/* ================================================================= */}
      {/* BEAT 1B: ART_PATHS.sleeping (width 900, height 680)               */}
      {/* ================================================================= */}
      {sleepOpacity > 0.005 && (
        <div
          style={{
            position: 'absolute',
            left: sleepLeft,
            top: sleepTop,
            opacity: sleepOpacity,
            transform: `scale(${sleepScale.toFixed(4)})`,
            transformOrigin: '50% 50%',
            pointerEvents: 'none',
          }}
        >
          <PapercraftArt src={ART_PATHS.sleeping} width={900} height={680} />
        </div>
      )}

      {/* ================================================================= */}
      {/* BEAT 2: Grand Multi-Layered Pop-Up Papercraft Tree (3703..4476)   */}
      {/* ================================================================= */}
      {treeActive && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <defs>
            {/* Pop-up book slit clip: everything emerges cleanly above y = slitY */}
            <clipPath id="a4-popup-slit-clip">
              <rect x={0} y={0} width={1920} height={slitY} />
            </clipPath>
          </defs>

          {/* Clean horizontal paper slit in the lower-center */}
          {slitOpacity > 0.005 && (
            <g opacity={slitOpacity}>
              <ellipse
                cx={960}
                cy={slitY + 3}
                rx={slitWidth * 0.5}
                ry={5}
                fill={PALETTE.paperDeepShadow}
                opacity={0.7}
              />
              <rect
                x={960 - slitWidth * 0.5}
                y={slitY - 1.5}
                width={slitWidth}
                height={3.5}
                rx={1.75}
                fill={PALETTE.inkSoft}
                opacity={0.45}
              />
            </g>
          )}

          {/* Pop-up Tree Group clipped at the horizontal paper slit */}
          <g clipPath="url(#a4-popup-slit-clip)" opacity={treeFadeEnd}>
            {/* Trunk emerging from the slit */}
            <g
              transform={`translate(960, ${slitY}) scale(1, ${trunkGrow.toFixed(4)})`}
              style={{ filter: 'drop-shadow(0 10px 18px rgba(46,43,62,0.12))' }}
            >
              {/* Main trunk silhouette */}
              <path
                d="M -46 6 C -34 -95, -26 -220, -22 -365 L 22 -365 C 26 -220, 34 -95, 46 6 Z"
                fill={PALETTE.treeTrunk}
              />
              {/* Subtle warm inner paper highlight strip */}
              <path
                d="M -10 6 C -8 -105, -6 -225, -4 -355 L 8 -355 C 10 -225, 13 -105, 16 6 Z"
                fill="#8E7B73"
                opacity={0.45}
              />
            </g>

            {/* Curved branches unfurling from upper trunk */}
            {branchGrow > 0.01 && (
              <g
                transform={`translate(960, ${slitY - 315})`}
                style={{ filter: 'drop-shadow(0 6px 10px rgba(46,43,62,0.10))' }}
              >
                {/* Left primary branch */}
                <g transform={`scale(${branchGrow.toFixed(3)})`}>
                  <path
                    d="M -8 24 C -85 -10, -165 -35, -245 -105 C -235 -114, -226 -116, -216 -110 C -145 -52, -75 -30, -4 -2 Z"
                    fill={PALETTE.treeTrunk}
                  />
                  {/* Right primary branch */}
                  <path
                    d="M 8 20 C 88 -16, 168 -42, 248 -108 C 238 -118, 228 -118, 218 -112 C 146 -56, 76 -34, 4 -4 Z"
                    fill={PALETTE.treeTrunk}
                  />
                  {/* Upper-left secondary branch */}
                  <path
                    d="M -6 -28 C -58 -85, -110 -138, -148 -205 C -138 -212, -130 -210, -124 -202 C -88 -142, -42 -96, 2 -48 Z"
                    fill={PALETTE.treeTrunk}
                  />
                  {/* Upper-right secondary branch */}
                  <path
                    d="M 6 -30 C 60 -86, 114 -140, 152 -206 C 142 -214, 134 -212, 128 -204 C 92 -144, 46 -98, -2 -50 Z"
                    fill={PALETTE.treeTrunk}
                  />
                  {/* Lower-left graceful bough */}
                  <path
                    d="M -14 58 C -102 48, -185 36, -285 -18 C -278 -28, -270 -30, -262 -25 C -172 20, -96 30, -12 36 Z"
                    fill={PALETTE.treeTrunk}
                  />
                  {/* Lower-right graceful bough */}
                  <path
                    d="M 14 54 C 106 44, 190 32, 290 -20 C 282 -30, 274 -32, 266 -26 C 176 18, 100 28, 12 32 Z"
                    fill={PALETTE.treeTrunk}
                  />
                </g>
              </g>
            )}

            {/* 24 Layered circular & teardrop paper foliage clusters */}
            {foliageClusters.map((c) => {
              const bloomStart = CUES.CHORUS2_TREE + c.bloomDelay;
              if (frame < bloomStart) return null;

              const bloomScale = spring({
                frame: frame - bloomStart,
                fps,
                config: { damping: 14, stiffness: 86, mass: 0.9 },
              });

              // Gradually thin out leaves during Forget & Memories Fade
              const thinProgress = interpolate(
                frame,
                [CUES.CHORUS2_FORGET + c.thinDelay, CUES.CHORUS2_FORGET + c.thinDelay + 125],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
              );
              const keepCore = c.id % 4 === 0 ? 0.42 : 0.08;
              const clusterOpacity = interpolate(thinProgress, [0, 1], [0.96, keepCore]);
              const clusterScale =
                bloomScale *
                interpolate(thinProgress, [0, 1], [1, c.id % 4 === 0 ? 0.84 : 0.65]) *
                (1 + pulse * 0.018);

              const swayDeg = c.rot + Math.sin(frame * 0.03 + c.swayPhase) * 2.8;
              const clusterFill =
                thinProgress > 0.01
                  ? interpolateColors(thinProgress, [0, 1], [c.color, PALETTE.paperWarm])
                  : c.color;

              return (
                <g
                  key={c.id}
                  transform={`translate(${c.x}, ${c.y}) rotate(${swayDeg.toFixed(2)}) scale(${clusterScale.toFixed(3)})`}
                  opacity={clusterOpacity}
                  style={{ filter: 'drop-shadow(0 8px 14px rgba(46,43,62,0.11))' }}
                >
                  {c.shape === 'circle' ? (
                    <circle cx={0} cy={0} r={c.r} fill={clusterFill} />
                  ) : (
                    <path
                      d={`M 0 ${-c.r * 1.15} C ${c.r * 0.92} ${-c.r * 0.25}, ${c.r * 0.82} ${c.r * 0.78}, 0 ${c.r} C ${-c.r * 0.82} ${c.r * 0.78}, ${-c.r * 0.92} ${-c.r * 0.25}, 0 ${-c.r * 1.15} Z`}
                      fill={clusterFill}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* ================================================================= */}
      {/* BEAT 3: Tree Shade — Dappled Sunlight Paper Ovals (3928..4028)    */}
      {/* ================================================================= */}
      {shadeOpacity > 0.005 && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, opacity: shadeOpacity, pointerEvents: 'none' }}
        >
          {/* Soft diagonal paper sunlight shafts filtering through canopy */}
          <polygon
            points="720,260 880,260 760,860 560,860"
            fill={PALETTE.starGoldSoft}
            opacity={0.14}
          />
          <polygon
            points="930,240 1090,240 1020,860 830,860"
            fill={PALETTE.paperLight}
            opacity={0.18}
          />
          <polygon
            points="1110,270 1240,270 1320,860 1160,860"
            fill={PALETTE.starGoldSoft}
            opacity={0.12}
          />

          {/* Dappled sunlight paper ovals drifting gently downward */}
          {sunlightOvals.map((ov) => {
            const floatT = (frame - CUES.CHORUS2_SHADE) * 0.035;
            const oy = ov.y + Math.sin(floatT + ov.phase) * ov.driftY * 0.5;
            const ox = ov.x + Math.cos(floatT * 0.8 + ov.phase) * 14;
            const twinkle = 0.42 + 0.36 * Math.sin(frame * 0.06 + ov.phase);

            return (
              <ellipse
                key={ov.id}
                cx={ox}
                cy={oy}
                rx={ov.rx}
                ry={ov.ry}
                transform={`rotate(${ov.rot} ${ox.toFixed(1)} ${oy.toFixed(1)})`}
                fill={ov.color}
                opacity={twinkle}
              />
            );
          })}
        </svg>
      )}

      {/* ================================================================= */}
      {/* BEAT 4: Forget — 36 Shedding Memory Cards & Four-Point Star Leaves*/}
      {/* ================================================================= */}
      {forgetActive && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {sheddingItems.map((item) => {
            const startFrame = CUES.CHORUS2_FORGET + item.delay;
            if (frame < startFrame) return null;

            const prog = (frame - startFrame) / item.duration;
            if (prog > 1.02) return null;

            const clampedProg = Math.min(1, prog);
            const easedFall = Easing.inOut(Easing.quad)(clampedProg);
            const x =
              item.startX +
              item.driftX * easedFall +
              Math.sin(clampedProg * Math.PI * 3.5 + item.id) * 28;
            const y = item.startY + item.fallY * clampedProg;
            const rot = item.rotStart + (frame - startFrame) * item.rotSpeed;
            const flutter = 0.55 + 0.45 * Math.cos(clampedProg * Math.PI * 4.2 + item.id);

            // Desaturate into warm #EFECE1 paper backdrop & fade smoothly
            const fillColor = interpolateColors(
              clampedProg,
              [0, 0.55, 1],
              [item.color, PALETTE.paperWarm, PALETTE.paperBase]
            );
            const alpha = interpolate(clampedProg, [0, 0.12, 0.68, 1], [0, 0.92, 0.65, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            if (item.kind === 'star') {
              const r = item.size;
              return (
                <g
                  key={item.id}
                  transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}
                  opacity={alpha}
                >
                  <path
                    d={`M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`}
                    fill={fillColor}
                    style={{ filter: 'drop-shadow(0 3px 5px rgba(46,43,62,0.08))' }}
                  />
                </g>
              );
            }

            // Blank memory paper card
            const w = item.size * 1.45;
            const h = item.size;
            return (
              <g
                key={item.id}
                transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${flutter.toFixed(2)}, 1)`}
                opacity={alpha}
                style={{ filter: 'drop-shadow(0 4px 7px rgba(46,43,62,0.09))' }}
              >
                <rect x={-w * 0.5} y={-h * 0.5} width={w} height={h} rx={3} fill={fillColor} />
                <rect
                  x={-w * 0.34}
                  y={-h * 0.12}
                  width={w * 0.68}
                  height={2}
                  rx={1}
                  fill={PALETTE.paperBase}
                  opacity={0.65}
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* ================================================================= */}
      {/* BEAT 5: Memories Fade — Ghostly White Embossed Motifs (4211..4476)*/}
      {/* ================================================================= */}
      {memoriesActive && (
        <>
          {/* Soft pale-cream dissolving light wash */}
          <AbsoluteFill
            style={{
              background:
                'radial-gradient(ellipse at 50% 42%, rgba(247,244,234,0.75) 0%, rgba(239,236,225,0.28) 65%, rgba(239,236,225,0) 100%)',
              opacity: paleCreamWash,
              pointerEvents: 'none',
            }}
          />

          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {ghostMotifs.map((m, idx) => {
              const startF = CUES.CHORUS2_MEMORIES + m.delay;
              const prog = interpolate(frame, [startF, startF + 215], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.quad),
              });
              if (prog <= 0 || prog >= 1) return null;

              const gy = m.baseY - prog * m.rise;
              const gx = m.x + Math.sin(prog * Math.PI * 2 + idx) * 18;
              const alpha = interpolate(prog, [0, 0.22, 0.68, 1], [0, 0.82, 0.55, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const scale = m.scale * interpolate(prog, [0, 0.5, 1], [0.92, 1.02, 1.1]);
              const embossFilter =
                'drop-shadow(0 -2px 3px rgba(255,255,255,0.85)) drop-shadow(0 8px 14px rgba(176,166,144,0.24))';

              return (
                <g
                  key={m.id}
                  transform={`translate(${gx.toFixed(1)}, ${gy.toFixed(1)}) scale(${scale.toFixed(3)})`}
                  opacity={alpha}
                  style={{ filter: embossFilter }}
                >
                  {m.id === 'bread' && (
                    <>
                      {/* Small artisan loaf of bread silhouette */}
                      <path
                        d="M -68 18 C -70 -26, -34 -46, 0 -46 C 34 -46, 70 -26, 68 18 C 68 32, 54 36, 40 36 L -40 36 C -54 36, -68 32, -68 18 Z"
                        fill={PALETTE.paperLight}
                      />
                      {/* Embossed diagonal bread score marks */}
                      <path
                        d="M -30 -26 Q -18 -14 -8 -24 M -4 -30 Q 8 -18 18 -28 M 22 -24 Q 34 -12 42 -20"
                        fill="none"
                        stroke={PALETTE.paperShadow}
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        opacity={0.55}
                      />
                    </>
                  )}

                  {m.id === 'wave' && (
                    <>
                      {/* Tiny curling wave crest silhouette */}
                      <path
                        d="M -78 22 C -46 14, -28 -36, 12 -36 C 42 -36, 58 -14, 46 6 C 38 18, 22 14, 24 2 C 26 -8, 12 -14, 2 -6 C -14 8, -4 26, 74 22 L 74 36 L -78 36 Z"
                        fill={PALETTE.paperLight}
                      />
                    </>
                  )}

                  {m.id === 'cloud' && (
                    <>
                      {/* Puffy embossed paper cloud silhouette */}
                      <circle cx={-44} cy={6} r={32} fill={PALETTE.paperLight} />
                      <circle cx={-4} cy={-14} r={44} fill={PALETTE.paperLight} />
                      <circle cx={44} cy={6} r={34} fill={PALETTE.paperLight} />
                      <rect x={-46} y={4} width={92} height={34} rx={17} fill={PALETTE.paperLight} />
                    </>
                  )}

                  {m.id === 'footprint' && (
                    <>
                      {/* Delicate bare footprint silhouette */}
                      <path
                        d="M -14 48 C -26 46, -30 28, -22 10 C -16 -4, -28 -18, -20 -34 C -12 -46, 12 -44, 18 -26 C 24 -8, 10 8, 12 26 C 14 42, 0 50, -14 48 Z"
                        fill={PALETTE.paperLight}
                      />
                      <circle cx={-22} cy={-48} r={7.5} fill={PALETTE.paperLight} />
                      <circle cx={-7} cy={-55} r={6.2} fill={PALETTE.paperLight} />
                      <circle cx={6} cy={-53} r={5.4} fill={PALETTE.paperLight} />
                      <circle cx={17} cy={-46} r={4.6} fill={PALETTE.paperLight} />
                      <circle cx={25} cy={-36} r={3.8} fill={PALETTE.paperLight} />
                    </>
                  )}
                </g>
              );
            })}

            {/* Subtle dissolving pale stars */}
            <FourPointStar
              x={540}
              y={320 - paleCreamWash * 40}
              size={14}
              rotation={frame * 0.35}
              opacity={paleCreamWash * 1.2}
              colorTop={PALETTE.paperLight}
              colorBottom={PALETTE.starGoldSoft}
              goldRim={false}
            />
            <FourPointStar
              x={1380}
              y={290 - paleCreamWash * 45}
              size={16}
              rotation={-frame * 0.3}
              opacity={paleCreamWash * 1.15}
              colorTop={PALETTE.paperLight}
              colorBottom={PALETTE.lavenderSoft}
              goldRim={false}
            />
          </svg>
        </>
      )}
    </AbsoluteFill>
  );
};
