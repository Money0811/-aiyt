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
import {
  ACTS,
  ART_PATHS,
  CUES,
  END_CARD_LINES,
  FONT_JP,
  FONT_ZH,
  PALETTE,
} from '../constants';
import { FourPointStar, PapercraftArt, useSegmentOpacity } from '../PaperStage';

interface MazeWall {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  foldDirX: number;
  foldDirY: number;
  shade: string;
}

/** Reusable layered SVG papercraft illustration of Hagemy's navy star-accented shoe + white ruffled sock */
const HagemyShoe: React.FC<{
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  flipX?: boolean;
  starGlow?: number;
}> = ({ x, y, rotation = 0, scale = 1, flipX = false, starGlow = 0.4 }) => (
  <g
    transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${rotation.toFixed(1)}) scale(${flipX ? -scale : scale}, ${scale})`}
  >
    {/* White ruffled sock */}
    <path
      d="M -42,-128 L 36,-128 L 40,-34 L -46,-34 Z"
      fill={PALETTE.paperLight}
    />
    {/* Layered paper sock shadow */}
    <path
      d="M -42,-128 L -14,-128 L -18,-34 L -46,-34 Z"
      fill={PALETTE.paperShadow}
      opacity={0.35}
    />
    {/* Scalloped lace ruffle trim at top of sock */}
    {[-36, -18, 0, 18, 34].map((rx, idx) => (
      <circle
        key={idx}
        cx={rx}
        cy={-128}
        r={11}
        fill={idx % 2 === 0 ? PALETTE.paperLight : PALETTE.cloudWhite}
      />
    ))}
    {/* Subtle periwinkle ribbon stripe on sock */}
    <rect
      x={-43}
      y={-110}
      width={80}
      height={7}
      rx={3.5}
      fill={PALETTE.periwinkleLight}
      opacity={0.45}
    />

    {/* Cream sole layer */}
    <path
      d="M -54,18 L 88,18 C 102,18 106,30 92,34 L -48,34 C -60,34 -62,22 -54,18 Z"
      fill={PALETTE.paperWarm}
    />
    {/* Dark navy Mary-Jane shoe body */}
    <path
      d="M -52,-36 C -58,-4 -54,24 -28,24 L 82,24 C 108,24 112,-2 90,-18 C 68,-34 38,-32 18,-20 C 4,-12 -14,-24 -22,-36 Z"
      fill={PALETTE.navy}
    />
    {/* Soft sculpted highlight facet on toe box */}
    <path
      d="M 18,-12 C 42,-20 74,-16 88,-2 C 94,4 88,12 72,12 L 16,12 Z"
      fill={PALETTE.navySoft}
      opacity={0.55}
    />
    {/* Shoe ankle strap */}
    <path
      d="M -38,-22 L 26,-16 C 32,-15 32,-3 24,-3 L -38,-9 Z"
      fill={PALETTE.navySoft}
    />
    {/* Golden FourPointStar buckle clasp */}
    <FourPointStar
      x={14}
      y={-10}
      size={15}
      colorTop={PALETTE.starGoldSoft}
      colorBottom={PALETTE.starGold}
      goldRim={false}
      glow={starGlow}
    />
  </g>
);

export const Act6A3StepsFinale: React.FC<{ pulse: number }> = ({ pulse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const actOpacity = useSegmentOpacity(
    frame,
    ACTS.ACT6.start,
    ACTS.ACT6.end,
    20,
    0
  );

  // Deterministic clock tick dust offsets (12 ticks)
  const clockTicks = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const deg = i * 30;
      return {
        index: i,
        deg,
        driftX: 70 + random(`ck-dx-${i}`) * 110,
        driftY: -50 - random(`ck-dy-${i}`) * 95,
        rot: (random(`ck-r-${i}`) - 0.5) * 90,
      };
    });
  }, []);

  // Sweeping S-curve footpath footsteps (bottom-left -> upper-right)
  const footpathSteps = React.useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const t = i / 17;
      const x = 210 + t * 1470;
      const y = 890 - t * 650 + Math.sin(t * Math.PI * 1.65) * 95;
      const isLeft = i % 2 === 0;
      // Tangent angle approximation
      const nextT = Math.min(1, t + 0.04);
      const nx = 210 + nextT * 1470;
      const ny = 890 - nextT * 650 + Math.sin(nextT * Math.PI * 1.65) * 95;
      const angle = (Math.atan2(ny - y, nx - x) * 180) / Math.PI;
      const perpOffset = isLeft ? -16 : 16;
      const rad = ((angle + 90) * Math.PI) / 180;
      return {
        id: i,
        x: x + Math.cos(rad) * perpOffset,
        y: y + Math.sin(rad) * perpOffset,
        angle,
        isLeft,
        hasStar: i % 2 === 1,
      };
    });
  }, []);

  // Top-down papercraft maze walls (callback to Chorus 1, unfolding at 6859..7046)
  const mazeWalls = React.useMemo<MazeWall[]>(() => {
    const raw: Array<[number, number, number, number, string]> = [
      // Outer perimeter blocks
      [280, 140, 1360, 46, PALETTE.mazeWall],
      [280, 880, 1360, 46, PALETTE.mazeWall],
      [280, 140, 46, 786, PALETTE.mazeWall],
      [1594, 140, 46, 560, PALETTE.mazeWall],
      // Inner maze corridors leaving a clear winding dawn path
      [460, 186, 42, 420, PALETTE.mazeWallLight],
      [460, 564, 340, 42, PALETTE.mazeWall],
      [680, 310, 42, 296, PALETTE.mazeWallLight],
      [680, 310, 420, 42, PALETTE.mazeWall],
      [900, 490, 42, 390, PALETTE.mazeWallLight],
      [900, 490, 340, 42, PALETTE.mazeWall],
      [1200, 260, 42, 272, PALETTE.mazeWallLight],
      [1140, 680, 340, 42, PALETTE.mazeWall],
      [1400, 340, 42, 382, PALETTE.mazeWallLight],
    ];
    return raw.map(([x, y, w, h, shade], id) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const dx = cx - 960;
      const dy = cy - 530;
      const len = Math.hypot(dx, dy) || 1;
      return {
        id,
        x,
        y,
        w,
        h,
        foldDirX: (dx / len) * 520,
        foldDirY: (dy / len) * 340,
        shade,
      };
    });
  }, []);

  // Pale faded memory petals (tiny leaf, tiny wave) drifting across Finale maze
  const memoryPetals = React.useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      startX: 180 + random(`mp-x-${i}`) * 1560,
      startY: 120 + random(`mp-y-${i}`) * 780,
      speedX: 0.55 + random(`mp-sx-${i}`) * 0.6,
      speedY: -0.25 + (random(`mp-sy-${i}`) - 0.5) * 0.45,
      phase: random(`mp-p-${i}`) * Math.PI * 2,
      isWave: i % 3 === 0,
      scale: 0.7 + random(`mp-sc-${i}`) * 0.65,
      color:
        i % 3 === 0
          ? PALETTE.waveLight
          : i % 3 === 1
          ? PALETTE.treeLeaf1
          : PALETTE.treeLeaf2,
    }));
  }, []);

  // Ascending stars from the glowing archway light-door (7046..7455)
  const archStars = React.useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      offsetX: (random(`as-x-${i}`) - 0.5) * 210,
      speed: 0.9 + random(`as-sp-${i}`) * 1.3,
      phase: random(`as-ph-${i}`) * 160,
      size: 6 + random(`as-sz-${i}`) * 9,
    }));
  }, []);

  if (actOpacity <= 0.001) return null;

  // =========================================================================
  // Beat 1: A3 Time (5372..5599) — Minimalist embossed cream clock face
  // =========================================================================
  const clockOpacity = interpolate(
    frame,
    [CUES.A3_TIME - 14, CUES.A3_TIME + 24, CUES.A3_SHOES - 12, CUES.A3_SHOES + 18],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const clockScale = interpolate(
    frame,
    [CUES.A3_TIME - 14, CUES.A3_TIME + 32],
    [0.9, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );
  // Hand sweeps from 0deg (12 o'clock) to 330deg across A3 Time
  const handAngle = interpolate(
    frame,
    [CUES.A3_TIME, CUES.A3_SHOES],
    [-25, 345],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // =========================================================================
  // Beat 2 & 3: A3 Shoes (5599..5822) & A3 Steps (5822..6061)
  // =========================================================================
  const shoesSceneOpacity = interpolate(
    frame,
    [CUES.A3_SHOES - 4, CUES.A3_SHOES + 24, CUES.A3_FOOTPRINTS - 10, CUES.A3_FOOTPRINTS + 24],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const leftStepEnter = spring({
    frame: Math.max(0, frame - CUES.A3_SHOES),
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const rightStepEnter = spring({
    frame: Math.max(0, frame - (CUES.A3_SHOES + 22)),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Shift smoothly from center-left (760) to center (960) when Steps beat begins
  const shoesGroupX = interpolate(
    frame,
    [CUES.A3_STEPS - 16, CUES.A3_STEPS + 28],
    [760, 960],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );
  const shoesPullBackScale = interpolate(
    frame,
    [CUES.A3_FOOTPRINTS - 16, CUES.A3_FOOTPRINTS + 24],
    [1, 0.72],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );

  // Joyful light-footed tapping rhythm during A3 Steps (5822..6061)
  const stepsActive = interpolate(
    frame,
    [CUES.A3_STEPS - 4, CUES.A3_STEPS + 14, CUES.A3_FOOTPRINTS - 12, CUES.A3_FOOTPRINTS + 8],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const beatCycle = (frame - CUES.A3_STEPS) * 0.26;
  const leftHop = Math.max(0, Math.sin(beatCycle)) * (24 + pulse * 14) * stepsActive;
  const rightHop = Math.max(0, Math.sin(beatCycle + Math.PI)) * (24 + pulse * 14) * stepsActive;
  const leftTilt = -Math.max(0, Math.sin(beatCycle)) * 10 * stepsActive;
  const rightTilt = Math.max(0, Math.sin(beatCycle + Math.PI)) * 10 * stepsActive;

  // Periodic splash ripples every 24 frames during A3 Steps
  const splashCycleLen = 24;
  const splashLocal = ((frame - CUES.A3_STEPS) % splashCycleLen + splashCycleLen) % splashCycleLen;
  const splashT = splashLocal / splashCycleLen;
  const splashIndex = Math.floor((frame - CUES.A3_STEPS) / splashCycleLen);
  const splashOriginX = shoesGroupX + (splashIndex % 2 === 0 ? -95 : 95);

  // =========================================================================
  // Beat 4 & 5: A3 Footprints (6061..6224) & A3 Vivid (6224..6404)
  // =========================================================================
  const footpathOpacity = interpolate(
    frame,
    [CUES.A3_FOOTPRINTS - 6, CUES.A3_FOOTPRINTS + 22, CUES.FINALE_CHANGE - 14, CUES.FINALE_CHANGE + 24],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const footpathProgress = interpolate(
    frame,
    [CUES.A3_FOOTPRINTS, CUES.A3_VIVID + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // Vivid pastel watercolor-paper blooms (6224..6404)
  const vividBloomT = interpolate(
    frame,
    [CUES.A3_VIVID - 8, CUES.A3_VIVID + 95],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );
  const vividOpacity = interpolate(
    frame,
    [CUES.A3_VIVID - 8, CUES.A3_VIVID + 28, CUES.FINALE_CHANGE + 10, CUES.FINALE_CHANGE + 58],
    [0, 1, 0.85, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // =========================================================================
  // Beat 6 & 7: Finale Dawn Maze (6404..6859) & Pop-Up Book Unfold (6859..7046)
  // =========================================================================
  const mazeOpacity = interpolate(
    frame,
    [CUES.FINALE_CHANGE - 12, CUES.FINALE_CHANGE + 28, CUES.FINALE_MEET - 18, CUES.FINALE_MEET + 14],
    [0, 1, 0.85, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const unfoldT = interpolate(
    frame,
    [CUES.FINALE_WALK, CUES.FINALE_MEET - 24],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Cat-ear + star silhouette walking calmly along the dawn maze corridor
  const walkerT = interpolate(
    frame,
    [CUES.FINALE_CHANGE, CUES.FINALE_WALK + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const walkerX = interpolate(walkerT, [0, 0.35, 0.7, 1], [385, 620, 1020, 1340]);
  const walkerY = interpolate(walkerT, [0, 0.35, 0.7, 1], [740, 460, 420, 560]);
  const walkerBob = Math.abs(Math.sin(frame * 0.16)) * 5;

  // =========================================================================
  // Beat 7 & 8: Sunlit Horizon Meadow, Archway Light-Door & Finale Walk (6859..7455)
  // =========================================================================
  const meadowOpacity = interpolate(
    frame,
    [CUES.FINALE_WALK + 24, CUES.FINALE_MEET - 10, CUES.OUTRO_START + 10, CUES.OUTRO_START + 55],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const archDoorOpacity = interpolate(
    frame,
    [CUES.FINALE_MEET - 26, CUES.FINALE_MEET + 24, CUES.OUTRO_START + 12, CUES.OUTRO_START + 50],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ART_PATHS.finaleWalk walking from center-left toward light-door (1320, 480)
  const finaleWalkT = interpolate(
    frame,
    [CUES.FINALE_MEET, CUES.OUTRO_START - 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) }
  );
  const finaleWalkOpacity = interpolate(
    frame,
    [CUES.FINALE_MEET - 8, CUES.FINALE_MEET + 30, CUES.FINALE_MAZE_END + 10, CUES.OUTRO_START - 12],
    [0, 1, 0.92, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const finaleWalkX = interpolate(finaleWalkT, [0, 1], [610, 1265]);
  const finaleWalkY = interpolate(finaleWalkT, [0, 1], [590, 505]);
  const finaleWalkScale = interpolate(finaleWalkT, [0, 1], [1.0, 0.56]);
  const finaleWalkSway = Math.sin(frame * 0.12) * 4;

  // Radiant FourPointStar blooming inside the archway as finaleWalk dissolves (7265..7455)
  const archRadiantStarOpacity = interpolate(
    frame,
    [CUES.FINALE_MAZE_END + 20, CUES.FINALE_MAZE_END + 95, CUES.OUTRO_START + 10, CUES.OUTRO_START + 48],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const archRadiantStarScale = interpolate(
    frame,
    [CUES.FINALE_MAZE_END + 20, CUES.OUTRO_START - 10],
    [0.4, 1.15],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // =========================================================================
  // Beat 9: Outro Theatre Curtains (7455..7830), End Card (7520..), Fade Out (7770..7830)
  // =========================================================================
  const curtainCloseT = interpolate(
    frame,
    [CUES.OUTRO_START, CUES.END_CARD_START + 18],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const endCardOpacity = interpolate(
    frame,
    [CUES.END_CARD_START, CUES.END_CARD_START + 42],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const finalPaperFade = interpolate(
    frame,
    [CUES.FADE_OUT_START, ACTS.ACT6.end],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) }
  );

  return (
    <AbsoluteFill style={{ opacity: actOpacity }}>
      {/* Beat 5: Vivid Pastel Watercolor-Paper Blooms (6224..6404) */}
      {vividOpacity > 0.005 && (
        <AbsoluteFill style={{ opacity: vividOpacity, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: 960 - 640,
              top: 520 - 460,
              width: 1280,
              height: 920,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at 35% 55%, rgba(156,168,245,0.42) 0%, rgba(156,168,245,0) 68%)',
              transform: `scale(${(0.35 + vividBloomT * 0.95).toFixed(3)})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 960 - 520,
              top: 480 - 420,
              width: 1040,
              height: 840,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at 65% 42%, rgba(215,178,248,0.42) 0%, rgba(215,178,248,0) 68%)',
              transform: `scale(${(0.25 + vividBloomT * 1.05).toFixed(3)})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 960 - 580,
              top: 540 - 440,
              width: 1160,
              height: 880,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at 52% 62%, rgba(252,227,158,0.48) 0%, rgba(252,227,158,0) 70%)',
              transform: `scale(${(0.2 + vividBloomT * 1.1).toFixed(3)})`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Main Papercraft SVG Stage */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <filter id="act6-paper-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#2E2B3E" floodOpacity="0.11" />
          </filter>
          <filter id="act6-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#2E2B3E" floodOpacity="0.09" />
          </filter>
          <linearGradient id="act6-dawn-sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.paperBase} stopOpacity="0" />
            <stop offset="55%" stopColor={PALETTE.starGoldSoft} stopOpacity="0.32" />
            <stop offset="100%" stopColor={PALETTE.starGold} stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="act6-door-glow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor={PALETTE.starGoldSoft} />
            <stop offset="100%" stopColor={PALETTE.paperWarm} />
          </linearGradient>
        </defs>

        {/* ---------------------------------------------------------------
            BEAT 1: A3 Time — Minimalist Embossed Cream Clock Face (cx=780, cy=540)
           --------------------------------------------------------------- */}
        {clockOpacity > 0.005 && (
          <g
            opacity={clockOpacity}
            transform={`translate(780, 540) scale(${clockScale.toFixed(3)})`}
          >
            {/* Layered embossed cream paper clock discs */}
            <circle cx={0} cy={0} r={246} fill={PALETTE.paperShadow} filter="url(#act6-paper-shadow)" />
            <circle cx={0} cy={0} r={228} fill={PALETTE.paperBase} />
            <circle cx={0} cy={0} r={206} fill={PALETTE.paperLight} filter="url(#act6-soft-shadow)" />
            <circle cx={0} cy={0} r={168} fill={PALETTE.paperBase} opacity={0.65} />

            {/* 12 tick marks that gently detach into drifting golden dust as hand passes */}
            {clockTicks.map((tick) => {
              const passed = interpolate(
                handAngle - tick.deg,
                [0, 85],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
              );
              const rad = ((tick.deg - 90) * Math.PI) / 180;
              const baseX = Math.cos(rad) * 186;
              const baseY = Math.sin(rad) * 186;
              const tx = baseX + tick.driftX * passed;
              const ty = baseY + tick.driftY * passed;
              const tickOpacity = interpolate(passed, [0, 0.2, 0.85, 1], [0.9, 0.95, 0.35, 0]);
              const isQuarter = tick.index % 3 === 0;

              return (
                <g
                  key={tick.index}
                  transform={`translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) rotate(${(tick.deg + tick.rot * passed).toFixed(1)})`}
                  opacity={tickOpacity}
                >
                  <rect
                    x={isQuarter ? -3.5 : -2.2}
                    y={isQuarter ? -13 : -8}
                    width={isQuarter ? 7 : 4.4}
                    height={isQuarter ? 26 : 16}
                    rx={3}
                    fill={passed > 0.08 ? PALETTE.starGold : PALETTE.paperDeepShadow}
                  />
                  {/* Golden dust sparkles trailing detached tick */}
                  {passed > 0.12 && (
                    <circle
                      cx={-10 * passed}
                      cy={8 * passed}
                      r={3.2 * (1 - passed * 0.5)}
                      fill={PALETTE.starGoldSoft}
                    />
                  )}
                </g>
              );
            })}

            {/* Shorter hour hand */}
            <g transform={`rotate(${(handAngle * 0.18 - 45).toFixed(1)})`}>
              <rect x={-4} y={-95} width={8} height={105} rx={4} fill={PALETTE.paperDeepShadow} />
            </g>

            {/* Slender FourPointStar-tipped sweeping hand */}
            <g transform={`rotate(${handAngle.toFixed(1)})`}>
              <rect x={-2.5} y={-166} width={5} height={182} rx={2.5} fill={PALETTE.inkSoft} />
              <FourPointStar
                x={0}
                y={-172}
                size={16 + pulse * 3}
                colorTop={PALETTE.starGoldSoft}
                colorBottom={PALETTE.starGold}
                goldRim={false}
                glow={0.55 + pulse * 0.35}
              />
            </g>

            {/* Center pin */}
            <circle cx={0} cy={0} r={10} fill={PALETTE.starGold} />
            <circle cx={0} cy={0} r={4.5} fill={PALETTE.paperLight} />
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 2 & 3: A3 Shoes (5599..5822) & Joyful A3 Steps (5822..6061)
           --------------------------------------------------------------- */}
        {shoesSceneOpacity > 0.005 && (
          <g
            opacity={shoesSceneOpacity}
            transform={`translate(${shoesGroupX.toFixed(1)}, 565) scale(${shoesPullBackScale.toFixed(3)}) translate(${(-shoesGroupX).toFixed(1)}, -565)`}
          >
            {/* Playful concentric rings of periwinkle, lavender, cream paper droplets & stars */}
            {stepsActive > 0.01 && (
              <g opacity={stepsActive}>
                {/* Concentric expanding water-paper rings */}
                {[0, 1, 2].map((ringIdx) => {
                  const rT = Math.min(1, Math.max(0, splashT * 1.2 - ringIdx * 0.16));
                  if (rT <= 0.01) return null;
                  const rx = 50 + rT * 240;
                  const ry = 16 + rT * 64;
                  const ringColor =
                    ringIdx === 0
                      ? PALETTE.periwinkleLight
                      : ringIdx === 1
                      ? PALETTE.lavenderSoft
                      : PALETTE.paperLight;
                  return (
                    <ellipse
                      key={ringIdx}
                      cx={splashOriginX}
                      cy={648}
                      rx={rx}
                      ry={ry}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth={6 - ringIdx * 1.5}
                      opacity={(1 - rT) * 0.8}
                    />
                  );
                })}

                {/* Splashing paper water droplets & tiny stars */}
                {Array.from({ length: 10 }, (_, dIdx) => {
                  const angle = -Math.PI * 0.88 + (dIdx / 9) * Math.PI * 0.76;
                  const speed = 135 + (dIdx % 3) * 48;
                  const dx = Math.cos(angle) * speed * splashT;
                  const dy = Math.sin(angle) * speed * splashT + 145 * splashT * splashT;
                  const dropOpacity = interpolate(splashT, [0, 0.15, 0.8, 1], [0, 0.95, 0.75, 0]);
                  const dropColor =
                    dIdx % 3 === 0
                      ? PALETTE.periwinkleLight
                      : dIdx % 3 === 1
                      ? PALETTE.lavenderSoft
                      : PALETTE.paperLight;

                  if (dIdx % 3 === 0) {
                    return (
                      <FourPointStar
                        key={dIdx}
                        x={splashOriginX + dx}
                        y={635 + dy}
                        size={9 * (1 - splashT * 0.35)}
                        opacity={dropOpacity}
                        colorTop={PALETTE.starGoldSoft}
                        colorBottom={dropColor}
                        goldRim={false}
                      />
                    );
                  }
                  return (
                    <circle
                      key={dIdx}
                      cx={splashOriginX + dx}
                      cy={635 + dy}
                      r={7 * (1 - splashT * 0.4)}
                      fill={dropColor}
                      opacity={dropOpacity}
                    />
                  );
                })}
              </g>
            )}

            {/* Grounded soft paper shadows under each shoe */}
            <ellipse
              cx={shoesGroupX - 92}
              cy={652}
              rx={90 - leftHop * 0.5}
              ry={14}
              fill={PALETTE.paperShadow}
              opacity={leftStepEnter * 0.75}
            />
            <ellipse
              cx={shoesGroupX + 98}
              cy={660}
              rx={90 - rightHop * 0.5}
              ry={14}
              fill={PALETTE.paperShadow}
              opacity={rightStepEnter * 0.75}
            />

            {/* Left shoe + white ruffled sock */}
            <g
              opacity={leftStepEnter}
              filter="url(#act6-paper-shadow)"
            >
              <HagemyShoe
                x={shoesGroupX - 102}
                y={606 - (1 - leftStepEnter) * 90 - leftHop}
                rotation={-6 + leftTilt}
                scale={0.96}
                starGlow={0.45 + pulse * 0.4}
              />
            </g>

            {/* Right shoe + white ruffled sock */}
            <g
              opacity={rightStepEnter}
              filter="url(#act6-paper-shadow)"
            >
              <HagemyShoe
                x={shoesGroupX + 92}
                y={614 - (1 - rightStepEnter) * 90 - rightHop}
                rotation={4 + rightTilt}
                scale={0.96}
                starGlow={0.45 + pulse * 0.4}
              />
            </g>
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 4: A3 Footprints — Sweeping Dotted Starlight Footpath (6061..6404)
           --------------------------------------------------------------- */}
        {footpathOpacity > 0.005 && (
          <g opacity={footpathOpacity}>
            {/* Subtle dotted curved trail guide */}
            <path
              d="M 210 890 C 640 780, 1140 520, 1680 240"
              fill="none"
              stroke={PALETTE.paperDeepShadow}
              strokeWidth={3}
              strokeDasharray="6 14"
              opacity={0.45}
            />

            {footpathSteps.map((st, idx) => {
              const stepAppear = interpolate(
                footpathProgress * footpathSteps.length - idx,
                [0, 1],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4)) }
              );
              if (stepAppear <= 0.01) return null;
              return (
                <g
                  key={st.id}
                  transform={`translate(${st.x.toFixed(1)}, ${st.y.toFixed(1)}) rotate(${st.angle.toFixed(1)}) scale(${stepAppear.toFixed(3)})`}
                  opacity={stepAppear * 0.9}
                >
                  {/* Minimalist papercraft shoe-sole footprint */}
                  <ellipse cx={6} cy={0} rx={14} ry={8} fill={PALETTE.navySoft} opacity={0.72} />
                  <ellipse cx={-12} cy={0} rx={7} ry={6.5} fill={PALETTE.periwinkleLight} opacity={0.78} />
                  {st.hasStar && (
                    <FourPointStar
                      x={16}
                      y={st.isLeft ? -16 : 16}
                      size={8 + pulse * 2}
                      colorTop={PALETTE.starGoldSoft}
                      colorBottom={PALETTE.lavenderSoft}
                      goldRim={false}
                      glow={0.35}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 6 & 7: Finale Dawn Maze & Grand Pop-Up Book Unfold (6404..7046)
           --------------------------------------------------------------- */}
        {mazeOpacity > 0.005 && (
          <g opacity={mazeOpacity}>
            {/* Warm dawn wash across maze floor */}
            <rect x={0} y={0} width={1920} height={1080} fill="url(#act6-dawn-sky)" opacity={0.65} />

            {/* Top-down papercraft maze walls that fold outward & flatten open at 6859..7046 */}
            {mazeWalls.map((wall) => {
              const cx = wall.x + wall.w / 2;
              const cy = wall.y + wall.h / 2;
              const tx = wall.foldDirX * unfoldT;
              const ty = wall.foldDirY * unfoldT;
              const flattenScale = interpolate(unfoldT, [0, 0.75, 1], [1, 0.35, 0.02]);
              const wallAlpha = interpolate(unfoldT, [0, 0.72, 1], [1, 0.75, 0]);
              const isHoriz = wall.w > wall.h;

              return (
                <g
                  key={wall.id}
                  opacity={wallAlpha}
                  transform={`translate(${(cx + tx).toFixed(1)}, ${(cy + ty).toFixed(1)}) scale(${isHoriz ? 1 : flattenScale}, ${isHoriz ? flattenScale : 1}) translate(${(-cx).toFixed(1)}, ${(-cy).toFixed(1)})`}
                  filter="url(#act6-paper-shadow)"
                >
                  {/* Extruded shadowbox side */}
                  <rect
                    x={wall.x}
                    y={wall.y + 10}
                    width={wall.w}
                    height={wall.h}
                    rx={6}
                    fill={PALETTE.paperShadow}
                  />
                  {/* Crisp top cream paper face */}
                  <rect
                    x={wall.x}
                    y={wall.y}
                    width={wall.w}
                    height={wall.h}
                    rx={6}
                    fill={wall.shade}
                  />
                  {/* Sunlit top edge highlight */}
                  <rect
                    x={wall.x + 4}
                    y={wall.y + 4}
                    width={Math.max(0, wall.w - 8)}
                    height={Math.max(0, Math.min(10, wall.h - 8))}
                    rx={3}
                    fill={PALETTE.mazeWallTop}
                    opacity={0.75}
                  />
                </g>
              );
            })}

            {/* Calmly walking cat-ear + star silhouette along dawn corridor */}
            <g
              opacity={1 - unfoldT}
              transform={`translate(${walkerX.toFixed(1)}, ${(walkerY - walkerBob).toFixed(1)})`}
              filter="url(#act6-soft-shadow)"
            >
              {/* Soft shadow */}
              <ellipse cx={0} cy={30 + walkerBob} rx={22} ry={8} fill={PALETTE.paperDeepShadow} opacity={0.5} />
              {/* Cloak / body silhouette */}
              <path
                d="M -16,26 L -10,-4 C -10,-12 10,-12 10,-4 L 16,26 Z"
                fill={PALETTE.navy}
              />
              {/* Head + cat ears */}
              <circle cx={0} cy={-16} r={14} fill={PALETTE.navy} />
              <polygon points="-13,-24 -16,-39 -3,-28" fill={PALETTE.navy} />
              <polygon points="13,-24 16,-39 3,-28" fill={PALETTE.navy} />
              {/* Signature glowing FourPointStar hairpin */}
              <FourPointStar
                x={10}
                y={-22}
                size={7.5}
                colorTop={PALETTE.starGoldSoft}
                colorBottom={PALETTE.starGold}
                goldRim={false}
                glow={0.6}
              />
            </g>

            {/* Pale faded memory petals (tiny leaf, tiny wave) drifting peacefully */}
            {memoryPetals.map((mp) => {
              const dt = frame - CUES.FINALE_CHANGE;
              const px = ((mp.startX + dt * mp.speedX * 1.4) % 1980) - 30;
              const py = mp.startY + Math.sin(frame * 0.03 + mp.phase) * 28 + dt * mp.speedY;
              return (
                <g
                  key={mp.id}
                  transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${(Math.sin(frame * 0.02 + mp.phase) * 22).toFixed(1)}) scale(${mp.scale.toFixed(2)})`}
                  opacity={0.42 * (1 - unfoldT * 0.6)}
                >
                  {mp.isWave ? (
                    <path
                      d="M -18,4 Q -6,-10 6,2 Q 16,10 22,-2 Q 12,16 -2,8 Q -12,2 -18,4 Z"
                      fill={mp.color}
                    />
                  ) : (
                    <path
                      d="M 0,-14 Q 12,-4 0,14 Q -12,-4 0,-14 Z"
                      fill={mp.color}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ---------------------------------------------------------------
            BEAT 7 & 8: Sunlit Horizon Meadow & Glowing Papercraft Archway Light-Door
           --------------------------------------------------------------- */}
        {meadowOpacity > 0.005 && (
          <g opacity={meadowOpacity}>
            {/* Radiant sunlit light rays fanning from archway (1320, 480) */}
            <g opacity={0.34 + pulse * 0.08}>
              {[-68, -44, -22, 0, 22, 46, 72].map((deg, idx) => (
                <polygon
                  key={idx}
                  points="1320,480 1250,-220 1390,-220"
                  fill={idx % 2 === 0 ? PALETTE.starGoldSoft : PALETTE.paperLight}
                  opacity={0.42}
                  transform={`rotate(${(deg + Math.sin(frame * 0.015 + idx) * 2).toFixed(1)}, 1320, 480)`}
                />
              ))}
            </g>

            {/* Expansive layered sunlit cream-and-gold horizon meadow hills */}
            <path
              d="M 0,740 Q 480,625 960,690 T 1920,655 L 1920,1080 L 0,1080 Z"
              fill={PALETTE.paperWarm}
              filter="url(#act6-soft-shadow)"
            />
            <path
              d="M 0,800 Q 540,700 1080,765 T 1920,730 L 1920,1080 L 0,1080 Z"
              fill={PALETTE.starGoldSoft}
              opacity={0.42}
            />
            <path
              d="M 0,860 Q 620,780 1240,835 T 1920,810 L 1920,1080 L 0,1080 Z"
              fill={PALETTE.paperLight}
              filter="url(#act6-soft-shadow)"
            />
          </g>
        )}

        {/* Glowing Layered Papercraft Archway Light-Door at (1320, 480) */}
        {archDoorOpacity > 0.005 && (
          <g opacity={archDoorOpacity}>
            {/* Soft golden aura behind archway */}
            <circle
              cx={1320}
              cy={480}
              r={240 + pulse * 18}
              fill={PALETTE.starGoldSoft}
              opacity={0.28}
            />

            {/* 4 nested papercraft shadowbox archway layers */}
            {[
              { w: 230, h: 320, fill: PALETTE.paperShadow },
              { w: 200, h: 295, fill: PALETTE.paperBase },
              { w: 170, h: 270, fill: PALETTE.paperLight },
              { w: 142, h: 246, fill: 'url(#act6-door-glow)' },
            ].map((arch, idx) => {
              const halfW = arch.w / 2;
              const baseY = 635;
              const topY = baseY - arch.h + halfW;
              return (
                <path
                  key={idx}
                  d={`M ${1320 - halfW},${baseY} L ${1320 - halfW},${topY} A ${halfW},${halfW} 0 0,1 ${1320 + halfW},${topY} L ${1320 + halfW},${baseY} Z`}
                  fill={arch.fill}
                  filter={idx < 3 ? 'url(#act6-soft-shadow)' : undefined}
                />
              );
            })}

            {/* Gently ascending FourPointStars from the light-door */}
            {archStars.map((st) => {
              const cycle = ((frame - CUES.FINALE_MEET) * st.speed + st.phase) % 240;
              const progress = cycle / 240;
              const sx = 1320 + st.offsetX + Math.sin(progress * Math.PI * 2 + st.id) * 16;
              const sy = 620 - progress * 440;
              const sOpacity = interpolate(progress, [0, 0.2, 0.75, 1], [0, 0.85, 0.65, 0]);
              return (
                <FourPointStar
                  key={st.id}
                  x={sx}
                  y={sy}
                  size={st.size}
                  opacity={sOpacity}
                  colorTop={PALETTE.starGoldSoft}
                  colorBottom={PALETTE.periwinkleLight}
                  goldRim={false}
                  glow={0.4}
                />
              );
            })}

            {/* Bright radiant FourPointStar inside archway as finaleWalk dissolves (7265..7455) */}
            {archRadiantStarOpacity > 0.005 && (
              <g
                opacity={archRadiantStarOpacity}
                transform={`translate(1320, 475) scale(${archRadiantStarScale.toFixed(3)})`}
              >
                <circle cx={0} cy={0} r={54 + pulse * 10} fill="#FFFFFF" opacity={0.45} />
                <FourPointStar
                  x={0}
                  y={0}
                  size={44 + pulse * 6}
                  rotation={Math.sin(frame * 0.04) * 5}
                  colorTop="#FFFFFF"
                  colorBottom={PALETTE.starGold}
                  glow={0.95 + pulse * 0.4}
                />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Beat 8: ART_PATHS.finaleWalk walking gracefully toward the light-door (7046..7455) */}
      {finaleWalkOpacity > 0.005 && (
        <div
          style={{
            position: 'absolute',
            left: finaleWalkX - 300,
            top: finaleWalkY - 300 + finaleWalkSway,
            opacity: finaleWalkOpacity,
            transform: `scale(${finaleWalkScale.toFixed(3)})`,
            transformOrigin: 'center center',
            filter: 'drop-shadow(0 0 22px rgba(252,227,158,0.65))',
            pointerEvents: 'none',
          }}
        >
          <PapercraftArt
            src={ART_PATHS.finaleWalk}
            width={600}
            height={600}
            feather
            multiply
          />
        </div>
      )}

      {/* ---------------------------------------------------------------
          BEAT 9: Outro — 4 Layered Papercraft Theatre Curtains & End Card (7455..7830)
         --------------------------------------------------------------- */}
      {curtainCloseT > 0.002 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <filter id="act6-curtain-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#2E2B3E" floodOpacity="0.14" />
              </filter>
            </defs>

            {/* Warm cream backing card revealed inside the closing curtains */}
            <rect
              x={0}
              y={0}
              width={1920}
              height={1080}
              fill={PALETTE.paperBase}
              opacity={interpolate(curtainCloseT, [0.15, 0.85], [0, 0.96], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}
            />

            {/* Left layered papercraft theatre curtain */}
            <g
              transform={`translate(${interpolate(curtainCloseT, [0, 1], [-420, 0]).toFixed(1)}, 0)`}
              filter="url(#act6-curtain-shadow)"
            >
              <path
                d="M 0,0 L 340,0 Q 290,540 340,1080 L 0,1080 Z"
                fill={PALETTE.paperShadow}
              />
              <path
                d="M 0,0 L 265,0 Q 225,540 265,1080 L 0,1080 Z"
                fill={PALETTE.paperLight}
              />
            </g>

            {/* Right layered papercraft theatre curtain */}
            <g
              transform={`translate(${interpolate(curtainCloseT, [0, 1], [420, 0]).toFixed(1)}, 0)`}
              filter="url(#act6-curtain-shadow)"
            >
              <path
                d="M 1920,0 L 1580,0 Q 1630,540 1580,1080 L 1920,1080 Z"
                fill={PALETTE.paperShadow}
              />
              <path
                d="M 1920,0 L 1655,0 Q 1695,540 1655,1080 L 1920,1080 Z"
                fill={PALETTE.paperLight}
              />
            </g>

            {/* Top layered papercraft theatre valence curtain */}
            <g
              transform={`translate(0, ${interpolate(curtainCloseT, [0, 1], [-220, 0]).toFixed(1)})`}
              filter="url(#act6-curtain-shadow)"
            >
              <path
                d="M 0,0 L 1920,0 L 1920,145 Q 960,185 0,145 Z"
                fill={PALETTE.paperShadow}
              />
              <path
                d="M 0,0 L 1920,0 L 1920,110 Q 960,144 0,110 Z"
                fill={PALETTE.paperLight}
              />
            </g>

            {/* Bottom layered papercraft theatre sill curtain */}
            <g
              transform={`translate(0, ${interpolate(curtainCloseT, [0, 1], [220, 0]).toFixed(1)})`}
              filter="url(#act6-curtain-shadow)"
            >
              <path
                d="M 0,1080 L 1920,1080 L 1920,935 Q 960,895 0,935 Z"
                fill={PALETTE.paperShadow}
              />
              <path
                d="M 0,1080 L 1920,1080 L 1920,970 Q 960,936 0,970 Z"
                fill={PALETTE.paperLight}
              />
            </g>

            {/* Small FourPointStar emblem above End Card text */}
            {endCardOpacity > 0.005 && (
              <FourPointStar
                x={960}
                y={395}
                size={24}
                opacity={endCardOpacity}
                colorTop={PALETTE.starGoldSoft}
                colorBottom={PALETTE.lavenderSoft}
                glow={0.45 + pulse * 0.25}
              />
            )}
          </svg>

          {/* End Card Typography */}
          {endCardOpacity > 0.005 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 72,
                opacity: endCardOpacity,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_JP,
                  fontSize: 44,
                  fontWeight: 500,
                  color: PALETTE.inkDark,
                  letterSpacing: '0.22em',
                  marginBottom: 28,
                }}
              >
                {END_CARD_LINES[0]}
              </div>
              <div
                style={{
                  width: 64,
                  height: 2,
                  backgroundColor: PALETTE.starGold,
                  opacity: 0.65,
                  marginBottom: 28,
                  borderRadius: 2,
                }}
              />
              {END_CARD_LINES.slice(1).map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    fontFamily: FONT_ZH,
                    fontSize: idx === 2 ? 17 : 20,
                    color: idx === 2 ? PALETTE.inkSoft : PALETTE.inkMid,
                    letterSpacing: '0.12em',
                    lineHeight: 2.0,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* Final gentle fade to #EFECE1 warm cotton paper (7770..7830) */}
      {finalPaperFade > 0.001 && (
        <AbsoluteFill
          style={{
            backgroundColor: PALETTE.paperBase,
            opacity: finalPaperFade,
            pointerEvents: 'none',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
