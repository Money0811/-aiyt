import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
} from 'remotion';
import { ACTS, ART_PATHS, CUES, FPS, PALETTE } from '../constants';
import { FourPointStar, PapercraftArt, useSegmentOpacity } from '../PaperStage';

const PAPER_SHADOW = 'drop-shadow(0 8px 18px rgba(46,43,62,0.10))';
const PAPER_SHADOW_DEEP = 'drop-shadow(0 12px 24px rgba(46,43,62,0.13))';

interface MazeBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  extrude: number;
  delay: number;
}

const POPUP_MAZE_BLOCKS: readonly MazeBlock[] = [
  // Outer ring walls framing the central corridor
  { x: 180, y: 110, w: 460, h: 52, extrude: 30, delay: 4 },
  { x: 740, y: 110, w: 520, h: 52, extrude: 32, delay: 10 },
  { x: 1350, y: 110, w: 390, h: 52, extrude: 30, delay: 16 },
  { x: 180, y: 162, w: 56, h: 360, extrude: 28, delay: 12 },
  { x: 1684, y: 162, w: 56, h: 380, extrude: 28, delay: 20 },
  { x: 180, y: 610, w: 56, h: 260, extrude: 28, delay: 26 },
  { x: 1684, y: 620, w: 56, h: 250, extrude: 28, delay: 32 },
  // Mid labyrinth corridors
  { x: 360, y: 245, w: 380, h: 48, extrude: 28, delay: 18 },
  { x: 1180, y: 245, w: 380, h: 48, extrude: 28, delay: 24 },
  { x: 360, y: 293, w: 50, h: 280, extrude: 26, delay: 28 },
  { x: 1510, y: 293, w: 50, h: 290, extrude: 26, delay: 34 },
  { x: 520, y: 690, w: 340, h: 48, extrude: 26, delay: 38 },
  { x: 1060, y: 690, w: 360, h: 48, extrude: 26, delay: 42 },
  // Inner walls flanking the shrinking center corridor (960, 480)
  { x: 640, y: 365, w: 220, h: 44, extrude: 24, delay: 30 },
  { x: 1060, y: 365, w: 220, h: 44, extrude: 24, delay: 36 },
  { x: 640, y: 409, w: 46, h: 195, extrude: 24, delay: 40 },
  { x: 1234, y: 409, w: 46, h: 195, extrude: 24, delay: 44 },
  { x: 740, y: 585, w: 140, h: 42, extrude: 22, delay: 48 },
  { x: 1040, y: 585, w: 140, h: 42, extrude: 22, delay: 52 },
];

export const Act2Chorus1Maze: React.FC<{ pulse: number }> = ({ pulse }) => {
  const frame = useCurrentFrame();

  const actOpacity = useSegmentOpacity(
    frame,
    ACTS.ACT2.start,
    ACTS.ACT2.end,
    20,
    20
  );

  // Deterministic trailing star particles for Running beat
  const runParticles = React.useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        offsetX: random(`a2-rp-x-${i}`) * 720,
        baseY: 290 + random(`a2-rp-y-${i}`) * 410,
        size: 6 + random(`a2-rp-s-${i}`) * 9,
        speed: 4.5 + random(`a2-rp-sp-${i}`) * 4.5,
        phase: random(`a2-rp-ph-${i}`) * Math.PI * 2,
        isStar: i % 2 === 0,
        colorTop:
          i % 3 === 0
            ? PALETTE.periwinkle
            : i % 3 === 1
              ? PALETTE.lavender
              : PALETTE.starGoldSoft,
        colorBottom:
          i % 3 === 0
            ? PALETTE.lavenderSoft
            : i % 3 === 1
              ? PALETTE.periwinkleLight
              : PALETTE.starCyan,
      })),
    []
  );

  // Deterministic golden motes near vanishing-point beacon (Maze End)
  const beaconMotes = React.useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        angle: (i / 18) * Math.PI * 2 + random(`a2-bm-a-${i}`) * 0.4,
        dist: 60 + random(`a2-bm-d-${i}`) * 260,
        r: 2.5 + random(`a2-bm-r-${i}`) * 4,
        speed: 0.014 + random(`a2-bm-sp-${i}`) * 0.02,
        phase: random(`a2-bm-ph-${i}`) * Math.PI * 2,
      })),
    []
  );

  if (actOpacity <= 0.001) {
    return null;
  }

  // Segment envelopes (driven directly by verified CUES)
  const shrinkOpacity = useSegmentOpacity(frame, ACTS.ACT2.start, CUES.CHORUS1_BREAD + 22, 20, 24);
  const breadOpacity = useSegmentOpacity(frame, CUES.CHORUS1_BREAD - 12, CUES.CHORUS1_RUN + 18, 22, 22);
  const runOpacity = useSegmentOpacity(frame, CUES.CHORUS1_RUN - 10, CUES.CHORUS1_MAZE_END + 18, 18, 20);
  const portalOpacity = useSegmentOpacity(frame, CUES.CHORUS1_MAZE_END - 12, ACTS.ACT2.end, 20, 20);

  // Beat 1: Chorus 1 Shrink (1524..1757)
  const shrinkLocal = Math.max(0, frame - ACTS.ACT2.start);
  const mazeExpandScale = interpolate(
    frame,
    [CUES.CHORUS1_START, CUES.CHORUS1_BREAD],
    [0.9, 1.07],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );
  const catStarScale = interpolate(
    frame,
    [CUES.CHORUS1_START, CUES.CHORUS1_BREAD],
    [1.0, 0.55],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Beat 2: Bread (1757..1980)
  const breadLocal = Math.max(0, frame - CUES.CHORUS1_BREAD);
  const lightboxOpen = spring({
    frame: breadLocal,
    fps: FPS,
    config: { damping: 16, stiffness: 80, mass: 1 },
  });
  const breadSwell =
    interpolate(frame, [CUES.CHORUS1_BREAD, CUES.CHORUS1_RUN], [0.78, 1.18], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    }) +
    pulse * 0.04;

  // Beat 3: Running (1980..2166)
  const runLocal = Math.max(0, frame - CUES.CHORUS1_RUN);
  const runBounceY = -Math.abs(Math.sin(runLocal * 0.28)) * 18;
  const runLean = 1.8 + Math.sin(runLocal * 0.28) * 1.4;

  // Beat 4: Maze End Portals (2166..2452)
  const portalLocal = Math.max(0, frame - CUES.CHORUS1_MAZE_END);
  const portalTravel = interpolate(
    frame,
    [CUES.CHORUS1_MAZE_END, ACTS.ACT2.end],
    [0, 3.6],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );
  const beaconSize =
    interpolate(frame, [CUES.CHORUS1_MAZE_END, ACTS.ACT2.end - 30], [24, 62], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }) +
    pulse * 8;

  const portalColors = [
    PALETTE.mazeWallTop,
    PALETTE.mazeWallLight,
    PALETTE.mazeWall,
    '#DFD7C4',
    PALETTE.paperWarm,
    PALETTE.mazeWallLight,
  ] as const;

  return (
    <AbsoluteFill style={{ opacity: actOpacity, overflow: 'hidden' }}>
      {/* ================================================================= */}
      {/* BEAT 1 (1524..1757): Pop-up Isometric Maze Walls + Shrinking Cat  */}
      {/* ================================================================= */}
      {shrinkOpacity > 0.001 && (
        <AbsoluteFill style={{ opacity: shrinkOpacity }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">
            <g
              transform={`translate(960, 490) scale(${mazeExpandScale}) translate(-960, -490)`}
            >
              {/* Soft paper floor grid lines */}
              <g stroke={PALETTE.paperShadow} strokeWidth={2} opacity={0.45}>
                {[240, 480, 720, 960, 1200, 1440, 1680].map((gx) => (
                  <line key={`vx-${gx}`} x1={gx} y1={80} x2={gx} y2={920} />
                ))}
                {[180, 360, 540, 720, 900].map((gy) => (
                  <line key={`hy-${gy}`} x1={140} y1={gy} x2={1780} y2={gy} />
                ))}
              </g>

              {/* Pop-up isometric papercraft maze walls */}
              {POPUP_MAZE_BLOCKS.map((b, idx) => {
                const pop = spring({
                  frame: Math.max(0, shrinkLocal - b.delay),
                  fps: FPS,
                  config: { damping: 14, stiffness: 115, mass: 0.85 },
                });
                if (pop <= 0.01) return null;
                const lift = b.extrude * pop;
                const ty = (1 - pop) * 26;
                return (
                  <g
                    key={idx}
                    transform={`translate(0, ${ty})`}
                    opacity={pop}
                    style={{ filter: PAPER_SHADOW }}
                  >
                    {/* Right isometric extruded side face */}
                    <polygon
                      points={`${b.x + b.w},${b.y} ${b.x + b.w + lift * 0.5},${b.y - lift * 0.5} ${b.x + b.w + lift * 0.5},${b.y + b.h - lift * 0.5} ${b.x + b.w},${b.y + b.h}`}
                      fill={PALETTE.mazeWall}
                    />
                    {/* Front/bottom face */}
                    <polygon
                      points={`${b.x},${b.y + b.h} ${b.x + b.w},${b.y + b.h} ${b.x + b.w + lift * 0.5},${b.y + b.h - lift * 0.5} ${b.x + lift * 0.5},${b.y + b.h - lift * 0.5}`}
                      fill={PALETTE.mazeWallLight}
                    />
                    {/* Top architectural roof face */}
                    <rect
                      x={b.x + lift * 0.5}
                      y={b.y - lift * 0.5}
                      width={b.w}
                      height={b.h}
                      rx={4}
                      fill={PALETTE.mazeWallTop}
                    />
                  </g>
                );
              })}
            </g>

            {/* Center corridor: glowing cat-ear + four-point star silhouette shrinking */}
            <g
              transform={`translate(960, 488) scale(${catStarScale})`}
              style={{ filter: PAPER_SHADOW }}
            >
              {/* Soft glowing aura */}
              <circle
                cx={0}
                cy={0}
                r={76 + pulse * 14}
                fill={PALETTE.periwinkleLight}
                opacity={0.18 + pulse * 0.1}
              />
              {/* Lineless papercraft cat-ear silhouette */}
              <path
                d="M -42 -12 L -36 -58 L -10 -34 C -3 -36 3 -36 10 -34 L 36 -58 L 42 -12 C 48 16 28 42 0 42 C -28 42 -48 16 -42 -12 Z"
                fill={PALETTE.navySoft}
              />
              {/* Soft inner ear paper cutouts */}
              <polygon points="-32,-18 -29,-43 -14,-28" fill={PALETTE.lavenderSoft} opacity={0.75} />
              <polygon points="32,-18 29,-43 14,-28" fill={PALETTE.lavenderSoft} opacity={0.75} />
              {/* Glowing FourPointStar emblem at center */}
              <FourPointStar
                x={0}
                y={6}
                size={24 + pulse * 4}
                rotation={frame * 0.4}
                glow={0.55 + pulse * 0.4}
                colorTop={PALETTE.starCyan}
                colorBottom={PALETTE.starGoldSoft}
              />
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 2 (1757..1980): Circular Shadowbox Lightbox + Rising Bread   */}
      {/* ================================================================= */}
      {breadOpacity > 0.001 && (
        <AbsoluteFill style={{ opacity: breadOpacity }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">
            <defs>
              <radialGradient id="a2-bread-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={PALETTE.breadGlow} stopOpacity="0.95" />
                <stop offset="55%" stopColor={PALETTE.starGoldSoft} stopOpacity="0.45" />
                <stop offset="100%" stopColor={PALETTE.paperBase} stopOpacity="0" />
              </radialGradient>
              <clipPath id="a2-lightbox-clip">
                <circle cx={1120} cy={468} r={276 * Math.max(0.01, lightboxOpen)} />
              </clipPath>
            </defs>

            {/* Subtle architectural maze contour lines around the left side */}
            <g
              fill="none"
              stroke={PALETTE.paperShadow}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.48}
            >
              <path d="M 140 210 H 540 V 350 H 310 V 520 H 620" />
              <path d="M 180 740 H 640 V 610 H 480" />
              <path d="M 280 120 V 260 H 420" />
            </g>

            {/* Circular shadowbox lightbox aperture (center-right: 1120, 468) */}
            <g
              transform={`translate(1120, 468) scale(${lightboxOpen})`}
              style={{ filter: PAPER_SHADOW_DEEP }}
            >
              {/* Layered paper bezel rings */}
              <circle cx={0} cy={0} r={336} fill={PALETTE.mazeWall} />
              <circle cx={0} cy={0} r={306} fill={PALETTE.paperWarm} />
              <circle cx={0} cy={0} r={278} fill={PALETTE.paperLight} />
              {/* Warm golden-cream radial glow inside lightbox */}
              <circle
                cx={0}
                cy={-6}
                r={268 + pulse * 18}
                fill="url(#a2-bread-glow)"
              />
            </g>

            {/* Clipped interior: rising layered papercraft round loaf + steam curls */}
            <g clipPath="url(#a2-lightbox-clip)">
              {/* Warm wooden/paper baking tray */}
              <ellipse
                cx={1120}
                cy={558}
                rx={178}
                ry={32}
                fill={PALETTE.paperShadow}
                opacity={0.65}
              />
              <ellipse
                cx={1120}
                cy={550}
                rx={168}
                ry={26}
                fill={PALETTE.mazeWallTop}
                style={{ filter: PAPER_SHADOW }}
              />

              {/* Layered papercraft round loaf of bread gently swelling */}
              <g
                transform={`translate(1120, 540) scale(${breadSwell}) translate(0, -48)`}
                style={{ filter: PAPER_SHADOW }}
              >
                {/* Lower crust shadow base */}
                <path
                  d="M -124 38 C -132 -12 -86 -68 0 -68 C 86 -68 132 -12 124 38 C 120 60 -120 60 -124 38 Z"
                  fill="#D69B56"
                />
                {/* Main golden crust body */}
                <path
                  d="M -118 28 C -124 -20 -80 -72 0 -72 C 80 -72 124 -20 118 28 C 114 48 -114 48 -118 28 Z"
                  fill={PALETTE.breadCrust}
                />
                {/* Top warm highlight paper layer */}
                <ellipse
                  cx={0}
                  cy={-34}
                  rx={84}
                  ry={28}
                  fill="#EFC283"
                  opacity={0.78}
                />
                {/* Crisp artisan papercraft score marks (no black strokes) */}
                <path
                  d="M -56 -22 Q -22 -42 12 -20"
                  fill="none"
                  stroke={PALETTE.breadGlow}
                  strokeWidth={9}
                  strokeLinecap="round"
                />
                <path
                  d="M -14 -40 Q 24 -54 56 -28"
                  fill="none"
                  stroke={PALETTE.breadGlow}
                  strokeWidth={8}
                  strokeLinecap="round"
                />
                <path
                  d="M -38 -4 Q 4 -22 44 -2"
                  fill="none"
                  stroke="#C98A47"
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0.45}
                />
              </g>

              {/* Soft rising steam paper curls */}
              {[
                { x: 1055, delay: 0, height: 130, amp: 14 },
                { x: 1120, delay: 22, height: 155, amp: 18 },
                { x: 1185, delay: 44, height: 125, amp: 15 },
                { x: 1090, delay: 66, height: 115, amp: 12 },
              ].map((st, idx) => {
                const cycle = ((breadLocal + st.delay) % 90) / 90;
                const sy = 415 - cycle * 150;
                const sAlpha = interpolate(cycle, [0, 0.25, 0.75, 1], [0, 0.78, 0.65, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                const sway = Math.sin(cycle * Math.PI * 2 + idx) * st.amp;
                return (
                  <path
                    key={idx}
                    d={`M ${st.x} ${sy} C ${st.x - sway} ${sy - st.height * 0.35}, ${st.x + sway} ${sy - st.height * 0.65}, ${st.x - sway * 0.5} ${sy - st.height}`}
                    fill="none"
                    stroke={idx % 2 === 0 ? PALETTE.mazeWallTop : PALETTE.breadGlow}
                    strokeWidth={7}
                    strokeLinecap="round"
                    opacity={sAlpha}
                  />
                );
              })}
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 3 (1980..2166): 3-Layer Parallax Maze + Running + Star Trail */}
      {/* ================================================================= */}
      {runOpacity > 0.001 && (
        <AbsoluteFill style={{ opacity: runOpacity }}>
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* Layer 1 (BG): Distant tall stepped papercraft maze walls */}
            <g
              transform={`translate(${-((runLocal * 1.9) % 960)}, 0)`}
              style={{ filter: PAPER_SHADOW }}
            >
              {[0, 960, 1920].map((tx) => (
                <g key={tx} transform={`translate(${tx}, 0)`}>
                  <path
                    d="M 0 210 H 190 V 140 H 410 V 250 H 630 V 165 H 820 V 230 H 960 V 740 H 0 Z"
                    fill={PALETTE.mazeWall}
                  />
                  {/* Recessed arched corridor windows */}
                  <rect x={80} y={300} width={90} height={190} rx={45} fill={PALETTE.paperBase} opacity={0.55} />
                  <rect x={470} y={320} width={110} height={210} rx={55} fill={PALETTE.paperBase} opacity={0.55} />
                  <rect x={750} y={290} width={86} height={180} rx={43} fill={PALETTE.paperBase} opacity={0.55} />
                </g>
              ))}
            </g>

            {/* Layer 2 (MID): Medium architectural corridor strips */}
            <g
              transform={`translate(${-((runLocal * 4.4) % 960)}, 0)`}
              style={{ filter: PAPER_SHADOW }}
            >
              {[0, 960, 1920].map((tx) => (
                <g key={tx} transform={`translate(${tx}, 0)`}>
                  {/* Upper corridor lintel */}
                  <path
                    d="M 0 0 H 960 V 165 H 740 V 115 H 460 V 185 H 180 V 130 H 0 Z"
                    fill={PALETTE.mazeWallLight}
                  />
                  {/* Midground floor & stepping wall blocks */}
                  <path
                    d="M 0 770 H 260 V 720 H 490 V 785 H 770 V 735 H 960 V 1080 H 0 Z"
                    fill={PALETTE.mazeWallLight}
                  />
                </g>
              ))}
            </g>

            {/* Trailing twinkling periwinkle & lavender star particles behind runner */}
            {runParticles.map((p, idx) => {
              const travel = (runLocal * p.speed + p.offsetX) % 760;
              const px = 640 - travel;
              const py = p.baseY + Math.sin(runLocal * 0.08 + p.phase) * 18;
              const alpha = interpolate(travel, [0, 80, 620, 760], [0, 0.9, 0.7, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              if (p.isStar) {
                return (
                  <FourPointStar
                    key={idx}
                    x={px}
                    y={py}
                    size={p.size * (0.85 + pulse * 0.35)}
                    rotation={runLocal * 1.4 + idx * 30}
                    opacity={alpha}
                    colorTop={p.colorTop}
                    colorBottom={p.colorBottom}
                    glow={0.3 + pulse * 0.4}
                  />
                );
              }
              return (
                <rect
                  key={idx}
                  x={px - p.size * 0.5}
                  y={py - p.size * 0.5}
                  width={p.size}
                  height={p.size}
                  rx={2}
                  transform={`rotate(${45 + runLocal * 2 + idx * 20} ${px} ${py})`}
                  fill={p.colorTop}
                  opacity={alpha * 0.8}
                />
              );
            })}
          </svg>

          {/* PapercraftArt of running gracefully gliding & bobbing center-left */}
          <div
            style={{
              position: 'absolute',
              left: 340,
              top: 120 + runBounceY,
              transform: `rotate(${runLean}deg)`,
              transformOrigin: '50% 60%',
            }}
          >
            <PapercraftArt
              src={ART_PATHS.running}
              width={740}
              height={740}
              multiply={true}
              feather={true}
            />
          </div>

          {/* Layer 3 (FG): Fast passing foreground top/side parapet pillars */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <g
              transform={`translate(${-((runLocal * 7.8) % 1280)}, 0)`}
              style={{ filter: PAPER_SHADOW_DEEP }}
            >
              {[0, 1280, 2560].map((tx) => (
                <g key={tx} transform={`translate(${tx}, 0)`}>
                  <rect x={120} y={-20} width={84} height={115} rx={8} fill={PALETTE.mazeWallTop} />
                  <rect x={680} y={-20} width={110} height={92} rx={8} fill={PALETTE.mazeWallTop} />
                  <rect x={40} y={960} width={220} height={140} rx={12} fill={PALETTE.mazeWallTop} />
                  <rect x={820} y={975} width={260} height={125} rx={12} fill={PALETTE.mazeWallTop} />
                </g>
              ))}
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 4 (2166..2452): 6 Nested Papercraft Archway Portals + Beacon */}
      {/* ================================================================= */}
      {portalOpacity > 0.001 && (
        <AbsoluteFill style={{ opacity: portalOpacity }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">
            <defs>
              <radialGradient id="a2-beacon-aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={PALETTE.starGoldSoft} stopOpacity="0.95" />
                <stop offset="42%" stopColor={PALETTE.breadGlow} stopOpacity="0.45" />
                <stop offset="100%" stopColor={PALETTE.paperBase} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Warm glowing vanishing-point aura behind portals */}
            <circle
              cx={960}
              cy={490}
              r={260 + portalTravel * 45 + pulse * 26}
              fill="url(#a2-beacon-aura)"
            />

            {/* Drifting golden paper motes around beacon */}
            {beaconMotes.map((m, idx) => {
              const a = m.angle + portalLocal * m.speed;
              const d = m.dist * (0.75 + 0.25 * Math.sin(portalLocal * 0.04 + m.phase));
              const mx = 960 + Math.cos(a) * d;
              const my = 490 + Math.sin(a) * d * 0.82;
              return (
                <circle
                  key={idx}
                  cx={mx}
                  cy={my}
                  r={m.r}
                  fill={idx % 2 === 0 ? PALETTE.starGoldSoft : PALETTE.cloudWhite}
                  opacity={0.45 + 0.4 * (0.5 + 0.5 * Math.sin(portalLocal * 0.1 + m.phase))}
                />
              );
            })}

            {/* Glowing FourPointStar beacon deep at vanishing point */}
            <FourPointStar
              x={960}
              y={490}
              size={beaconSize}
              rotation={portalLocal * 0.45}
              glow={0.65 + pulse * 0.45}
              colorTop={PALETTE.starGoldSoft}
              colorBottom={PALETTE.lavenderSoft}
            />

            {/* 6 nested papercraft archway maze portals pushing outward toward camera */}
            {Array.from({ length: 6 }, (_, i) => {
              // Continuous depth coordinate in [0..6), painted farthest (0) to nearest (6)
              const rawDepth = (i + portalTravel) % 6;
              return { idx: i, depth: rawDepth };
            })
              .sort((a, b) => a.depth - b.depth)
              .map(({ idx, depth }) => {
                // Perspective exponential scale from tiny deep arch to passing camera
                const scale = 0.24 * Math.pow(1.56, depth);
                const alpha = interpolate(depth, [0, 0.65, 4.9, 5.95], [0, 0.98, 0.98, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                const color = portalColors[idx % portalColors.length];
                return (
                  <g
                    key={idx}
                    transform={`translate(960, 490) scale(${scale})`}
                    opacity={alpha}
                    style={{ filter: PAPER_SHADOW_DEEP }}
                  >
                    {/* Outer paper wall minus inner arched doorway (evenodd cutout) */}
                    <path
                      fillRule="evenodd"
                      d="M -1200 -800 H 1200 V 800 H -1200 Z M -220 340 V -40 A 220 220 0 0 1 220 -40 V 340 Z"
                      fill={color}
                    />
                    {/* Subtle inner arch bevel highlight */}
                    <path
                      d="M -220 340 V -40 A 220 220 0 0 1 220 -40 V 340"
                      fill="none"
                      stroke={PALETTE.paperLight}
                      strokeWidth={10}
                      opacity={0.55}
                    />
                  </g>
                );
              })}
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
