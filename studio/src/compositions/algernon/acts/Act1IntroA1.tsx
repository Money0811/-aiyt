import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
} from 'remotion';
import {
  ACTS,
  ART_PATHS,
  CUES,
  FONT_JP,
  FONT_SANS,
  FPS,
  PALETTE,
} from '../constants';
import { FourPointStar, PapercraftArt, useSegmentOpacity } from '../PaperStage';

const PAPER_SHADOW = 'drop-shadow(0 8px 18px rgba(46,43,62,0.10))';
const PAPER_SHADOW_SOFT = 'drop-shadow(0 6px 14px rgba(46,43,62,0.08))';

const TITLE_CHARS = ['ア', 'ル', 'ジ', 'ャ', 'ー', 'ノ', 'ン'] as const;

export const Act1IntroA1: React.FC<{ pulse: number }> = ({ pulse }) => {
  const frame = useCurrentFrame();

  const actOpacity = useSegmentOpacity(
    frame,
    ACTS.ACT1.start,
    ACTS.ACT1.end,
    0,
    20
  );

  // Deterministic paper dust particles (Beat 1)
  const dustParticles = React.useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: 240 + random(`a1-dust-x-${i}`) * 1440,
        y: 120 + random(`a1-dust-y-${i}`) * 840,
        r: 2 + random(`a1-dust-r-${i}`) * 3.5,
        speedY: 0.25 + random(`a1-dust-sy-${i}`) * 0.45,
        driftX: (random(`a1-dust-dx-${i}`) - 0.5) * 0.3,
        phase: random(`a1-dust-ph-${i}`) * Math.PI * 2,
        color:
          i % 3 === 0
            ? PALETTE.paperLight
            : i % 3 === 1
              ? PALETTE.starGoldSoft
              : PALETTE.cloudBlue,
      })),
    []
  );

  // Deterministic title scatter vectors (Beat 2)
  const titleScatter = React.useMemo(
    () =>
      TITLE_CHARS.map((_, i) => ({
        dx: (random(`a1-ts-x-${i}`) - 0.35) * 140,
        dy: -40 - random(`a1-ts-y-${i}`) * 110,
        rot: (random(`a1-ts-r-${i}`) - 0.5) * 28,
      })),
    []
  );

  // Deterministic heart sparkles (Beat 3)
  const heartSparkles = React.useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: (i / 10) * Math.PI * 2 + random(`a1-hs-a-${i}`) * 0.35,
        radius: 58 + random(`a1-hs-r-${i}`) * 72,
        size: 7 + random(`a1-hs-s-${i}`) * 7,
        speed: 0.015 + random(`a1-hs-sp-${i}`) * 0.018,
        phase: random(`a1-hs-ph-${i}`) * Math.PI * 2,
        isGold: i % 2 === 0,
      })),
    []
  );

  // Deterministic dream orbiting stars & pastel bubbles (Beat 6)
  const dreamStars = React.useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: (i / 10) * Math.PI * 2,
        rx: 290 + (i % 3) * 85,
        ry: 185 + (i % 2) * 65,
        size: 10 + random(`a1-ds-s-${i}`) * 10,
        speed: (i % 2 === 0 ? 1 : -1) * (0.008 + random(`a1-ds-sp-${i}`) * 0.006),
        colorTop: i % 2 === 0 ? PALETTE.starCyan : PALETTE.starGoldSoft,
        colorBottom: i % 2 === 0 ? PALETTE.lavender : PALETTE.periwinkleLight,
      })),
    []
  );

  const dreamBubbles = React.useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        x: 220 + random(`a1-db-x-${i}`) * 1480,
        y: 160 + random(`a1-db-y-${i}`) * 760,
        r: 12 + random(`a1-db-r-${i}`) * 26,
        speedY: 0.35 + random(`a1-db-sy-${i}`) * 0.45,
        phase: random(`a1-db-ph-${i}`) * Math.PI * 2,
        color:
          i % 4 === 0
            ? PALETTE.cloudWhite
            : i % 4 === 1
              ? PALETTE.cloudBlue
              : i % 4 === 2
                ? PALETTE.lavenderSoft
                : PALETTE.paperWarm,
      })),
    []
  );

  // Floral barefoot steps along a gentle arc (Beat 7)
  const barefootSteps = React.useMemo(
    () => [
      { x: 890, y: 720, rot: -16, delay: 14, side: -1 },
      { x: 1015, y: 650, rot: -22, delay: 32, side: 1 },
      { x: 1150, y: 605, rot: -14, delay: 50, side: -1 },
      { x: 1285, y: 540, rot: -20, delay: 68, side: 1 },
      { x: 1425, y: 500, rot: -12, delay: 86, side: -1 },
      { x: 1560, y: 440, rot: -18, delay: 104, side: 1 },
      { x: 1690, y: 400, rot: -10, delay: 122, side: -1 },
    ],
    []
  );

  if (actOpacity <= 0.001) {
    return null;
  }

  // Segment envelopes (driven directly by verified CUES)
  const beat1Opacity = 0; // Vocals begin at 00:00.88 (frame 26), go straight into Beat 3 + soft title
  const beat2Opacity = 0;
  const beat3Opacity = useSegmentOpacity(frame, 0, CUES.A1_EYES + 16, 12, 20);
  const beat4Opacity = useSegmentOpacity(frame, CUES.A1_EYES - 10, CUES.A1_SKY_WIND + 14, 18, 18);
  const beat5Opacity = useSegmentOpacity(frame, CUES.A1_SKY_WIND - 10, CUES.A1_DREAM + 48, 20, 42);
  const beat6Opacity = useSegmentOpacity(frame, CUES.A1_DREAM - 10, CUES.A1_BAREFOOT + 16, 20, 20);
  const beat7Opacity = useSegmentOpacity(frame, CUES.A1_BAREFOOT - 10, ACTS.ACT1.end, 18, 20);

  // Beat 1: Unused (kept for clean compilation)
  const starDropY = 520;
  const starHoverY = 0;
  const starRot = 0;
  const starSize = 44 + pulse * 5;

  // Beat 2: Unused (kept for clean compilation)
  const curtainOpen = 1;
  const curtainExit = 1;
  const titleFadeIn = 0;
  const titleScatterT = 1;

  // Beat 3: A1 Heart (00:00.88 - 00:07.58)
  const heartArtEnter = interpolate(frame, [0, 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const heartBloom = interpolate(frame, [8, CUES.A1_HEART + 24], [0.25, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const heartFloatY = Math.sin(frame * 0.065) * 9;
  const heartRot = Math.sin(frame * 0.045) * 5.5;
  const heartScale = (0.72 + heartBloom * 0.28) * (1 + pulse * 0.065);

  // Beat 4: A1 Eyes (720..943)
  const eyesUnfold = interpolate(frame, [CUES.A1_EYES - 8, CUES.A1_EYES + 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const eyesZoom = interpolate(frame, [CUES.A1_EYES, CUES.A1_SKY_WIND], [1.0, 1.06], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Beat 5: A1 Sky & Wind (943..1186)
  const skyT = Math.max(0, frame - CUES.A1_SKY_WIND);

  // Beat 6: A1 Dream (1186..1348)
  const dreamT = Math.max(0, frame - CUES.A1_DREAM);

  // Beat 7: A1 Barefoot (1348..1544)
  const barefootLocal = Math.max(0, frame - CUES.A1_BAREFOOT);
  const apertureScale = spring({
    frame: barefootLocal,
    fps: FPS,
    config: { damping: 16, stiffness: 70, mass: 1.1 },
  });

  return (
    <AbsoluteFill style={{ opacity: actOpacity, overflow: 'hidden' }}>
      {/* ================================================================= */}
      {/* BEAT 1 (0..180): Glowing FourPointStar Drop + Concentric Rings    */}
      {/* ================================================================= */}
      {beat1Opacity > 0.001 && (
        <AbsoluteFill style={{ opacity: beat1Opacity }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">
            {/* Soft paper dust particles */}
            {dustParticles.map((p, idx) => {
              const py =
                ((p.y - frame * p.speedY + 1080) % 1080);
              const px = p.x + Math.sin(frame * 0.025 + p.phase) * 14 + frame * p.driftX;
              const pAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(frame * 0.05 + p.phase));
              return (
                <circle
                  key={idx}
                  cx={px}
                  cy={py}
                  r={p.r}
                  fill={p.color}
                  opacity={pAlpha}
                />
              );
            })}

            {/* 3 soft concentric paper-shadow rings expanding after landing */}
            {[0, 1, 2].map((ringIdx) => {
              const ringStart = 90 + ringIdx * 18;
              const progress = interpolate(frame, [ringStart, ringStart + 82], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              });
              if (progress <= 0.001) return null;
              const radius = 24 + progress * (260 + ringIdx * 75);
              const ringAlpha = interpolate(progress, [0, 0.2, 1], [0, 0.72, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <g
                  key={ringIdx}
                  opacity={ringAlpha}
                  style={{ filter: PAPER_SHADOW_SOFT }}
                >
                  <circle
                    cx={960}
                    cy={520}
                    r={radius}
                    fill="none"
                    stroke={PALETTE.paperShadow}
                    strokeWidth={10 - ringIdx * 2}
                  />
                  <circle
                    cx={960}
                    cy={520}
                    r={Math.max(4, radius - 6)}
                    fill="none"
                    stroke={PALETTE.paperLight}
                    strokeWidth={3}
                    opacity={0.75}
                  />
                </g>
              );
            })}

            {/* Soft ground contact paper shadow */}
            <ellipse
              cx={960}
              cy={576}
              rx={interpolate(starDropY, [-60, 520], [10, 42], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}
              ry={interpolate(starDropY, [-60, 520], [3, 10], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}
              fill={PALETTE.paperShadow}
              opacity={interpolate(starDropY, [120, 520], [0, 0.55], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}
            />

            {/* Dropping & resting FourPointStar */}
            <FourPointStar
              x={960}
              y={starDropY + starHoverY}
              size={starSize}
              rotation={starRot}
              glow={0.45 + pulse * 0.4}
              colorTop={PALETTE.starCyan}
              colorBottom={PALETTE.lavender}
            />
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 2 (180..360): Papercraft Theatre Curtains & Vertical Title   */}
      {/* ================================================================= */}
      {beat2Opacity > 0.001 && (
        <AbsoluteFill style={{ opacity: beat2Opacity }}>
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* 4 layered cream & pale-blue papercraft theatre curtains sliding outward */}
            {[
              { color: PALETTE.cloudBlue, baseOffset: 440, travel: 390, exit: 220, curve: 90 },
              { color: PALETTE.paperTintSky, baseOffset: 340, travel: 340, exit: 240, curve: 75 },
              { color: PALETTE.mazeWallLight, baseOffset: 220, travel: 300, exit: 260, curve: 60 },
              { color: PALETTE.mazeWallTop, baseOffset: 100, travel: 260, exit: 280, curve: 48 },
            ].map((layer, idx) => {
              const shift = curtainOpen * layer.travel + curtainExit * layer.exit;
              const leftX = 960 - layer.baseOffset - shift;
              const rightX = 960 + layer.baseOffset + shift;
              return (
                <g key={idx} style={{ filter: PAPER_SHADOW }}>
                  {/* Left papercraft curtain panel */}
                  <path
                    d={`M -120 -40 L ${leftX} -40 Q ${leftX - layer.curve} 270 ${leftX + 12} 540 Q ${leftX - layer.curve} 810 ${leftX} 1120 L -120 1120 Z`}
                    fill={layer.color}
                  />
                  {/* Right papercraft curtain panel */}
                  <path
                    d={`M 2040 -40 L ${rightX} -40 Q ${rightX + layer.curve} 270 ${rightX - 12} 540 Q ${rightX + layer.curve} 810 ${rightX} 1120 L 2040 1120 Z`}
                    fill={layer.color}
                  />
                </g>
              );
            })}

            {/* Decorative papercraft star crest near title */}
            <FourPointStar
              x={1168}
              y={220 - titleScatterT * 60}
              size={20 + pulse * 3}
              rotation={frame * 0.4}
              opacity={titleFadeIn * (1 - titleScatterT)}
              glow={0.3 + pulse * 0.3}
              colorTop={PALETTE.starGoldSoft}
              colorBottom={PALETTE.periwinkleLight}
            />
          </svg>

          {/* Vertical Japanese title + subtitle on right-center */}
          <div
            style={{
              position: 'absolute',
              left: 1040,
              top: 255,
              display: 'flex',
              flexDirection: 'row-reverse',
              alignItems: 'flex-start',
              gap: 36,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                fontFamily: FONT_JP,
                fontSize: 64,
                fontWeight: 500,
                color: PALETTE.inkDark,
                letterSpacing: '0.12em',
                filter: PAPER_SHADOW_SOFT,
              }}
            >
              {TITLE_CHARS.map((ch, idx) => {
                const charIn = interpolate(
                  frame,
                  [202 + idx * 5, 224 + idx * 5],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );
                const vec = titleScatter[idx];
                const tx = titleScatterT * vec.dx;
                const ty = (1 - charIn) * 18 + titleScatterT * vec.dy;
                const rot = titleScatterT * vec.rot;
                return (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-block',
                      opacity: charIn * (1 - titleScatterT),
                      transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
                      lineHeight: 1.08,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>

            <div
              style={{
                writingMode: 'vertical-rl',
                fontFamily: FONT_SANS,
                fontSize: 22,
                fontWeight: 400,
                letterSpacing: '0.26em',
                color: PALETTE.inkMid,
                marginTop: 110,
                opacity: titleFadeIn * (1 - titleScatterT),
                transform: `translate(${titleScatterT * 50}px, ${-titleScatterT * 45}px)`,
              }}
            >
              Cover by 哈Gemi
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 3 (360..720): A1 Heart — Maze Contours, HandsHeart, Heart    */}
      {/* ================================================================= */}
      {beat3Opacity > 0.001 && (
        <AbsoluteFill style={{ opacity: beat3Opacity }}>
          {/* Subtle paper maze contour lines in background */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0, opacity: 0.55 }}
          >
            <g
              fill="none"
              stroke={PALETTE.paperShadow}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: PAPER_SHADOW_SOFT }}
            >
              <path d="M 90 150 H 540 V 260 H 320 V 390 H 160" />
              <path d="M 140 890 H 640 V 780 H 920 V 930 H 1260" />
              <path d="M 980 120 H 1460 V 240 H 1220 V 380 H 1490" />
              <path d="M 1060 660 H 1380 V 520 H 1520" />
              <path d="M 680 180 V 320 H 890 V 210 H 1040" />
            </g>
            {/* Subtle raised paper highlight contour */}
            <g
              fill="none"
              stroke={PALETTE.paperLight}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.7}
            >
              <path d="M 92 148 H 542 V 258 H 322" />
              <path d="M 982 118 H 1462 V 238 H 1222" />
              <path d="M 142 888 H 642 V 778 H 922" />
            </g>
          </svg>

          {/* PapercraftArt of handsHeart gliding in on left-center */}
          <div
            style={{
              position: 'absolute',
              left: 220 + (1 - heartArtEnter) * -52,
              top: 100 + Math.sin((frame - 360) * 0.035) * 6,
              opacity: heartArtEnter,
            }}
          >
            <PapercraftArt
              src={ART_PATHS.handsHeart}
              width={880}
              height={880}
              multiply={true}
              feather={true}
            />
          </div>

          {/* Folded papercraft heart floating above outstretched palm (x ~ 410, y ~ 510) */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <g
              transform={`translate(410, ${510 + heartFloatY}) rotate(${heartRot}) scale(${heartScale})`}
              style={{ filter: PAPER_SHADOW }}
            >
              {/* Soft radiant glow behind folded heart */}
              <circle
                cx={0}
                cy={-4}
                r={74 + pulse * 14}
                fill={PALETTE.starCrimson}
                opacity={0.11 + pulse * 0.08}
              />
              {/* Left half — crimson-pink paper */}
              <path
                d="M 0 54 C -44 26 -64 -6 -58 -32 C -53 -54 -30 -64 -12 -52 C -4 -47 0 -38 0 -34 Z"
                fill={PALETTE.starCrimson}
              />
              {/* Right half — soft lavender-cream paper (folded origami crease) */}
              <path
                d="M 0 54 C 44 26 64 -6 58 -32 C 53 -54 30 -64 12 -52 C 4 -47 0 -38 0 -34 Z"
                fill={PALETTE.lavenderSoft}
              />
              {/* Subtle inner folded paper highlight on left */}
              <path
                d="M 0 46 C -26 24 -40 -2 -36 -24 C -33 -38 -18 -46 -6 -38 C -2 -35 0 -30 0 -27 Z"
                fill="#F28FA6"
                opacity={0.45}
              />
              {/* Subtle inner folded shadow near center crease on right */}
              <path
                d="M 0 54 L 9 32 L 0 -34 Z"
                fill={PALETTE.lavender}
                opacity={0.28}
              />
            </g>

            {/* Emitting four-pointed star sparkles synced to pulse */}
            {heartSparkles.map((sp, idx) => {
              const t = frame - 360;
              const angle = sp.angle + t * sp.speed;
              const radialPulse = sp.radius + Math.sin(t * 0.06 + sp.phase) * 14 + pulse * 16;
              const sx = 410 + Math.cos(angle) * radialPulse;
              const sy = 510 + heartFloatY + Math.sin(angle) * radialPulse * 0.88;
              const twinkle =
                heartBloom * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.14 + sp.phase)));
              return (
                <FourPointStar
                  key={idx}
                  x={sx}
                  y={sy}
                  size={sp.size * (0.85 + pulse * 0.35)}
                  rotation={t * 0.8 + idx * 24}
                  opacity={twinkle}
                  goldRim={sp.isGold}
                  colorTop={sp.isGold ? PALETTE.starGoldSoft : PALETTE.starCyan}
                  colorBottom={sp.isGold ? PALETTE.starCrimson : PALETTE.lavender}
                  glow={pulse * 0.5}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 4 (720..943): A1 Eyes — Unfolding Horizontal Paper Window    */}
      {/* ================================================================= */}
      {beat4Opacity > 0.001 && (
        <AbsoluteFill style={{ opacity: beat4Opacity }}>
          {/* Soft-shadowed layered paper window strip (1400x520) centered slightly left */}
          <div
            style={{
              position: 'absolute',
              left: 110,
              top: 280,
              width: 1400,
              height: 520,
              transformOrigin: '50% 50%',
              transform: `scaleY(${0.08 + eyesUnfold * 0.92})`,
              opacity: eyesUnfold,
              filter: PAPER_SHADOW,
            }}
          >
            {/* Outer cream paper mat */}
            <div
              style={{
                position: 'absolute',
                inset: -14,
                borderRadius: 24,
                backgroundColor: PALETTE.mazeWallTop,
                boxShadow: '0 14px 32px rgba(46,43,62,0.10)',
              }}
            />
            {/* Inner recessed window */}
            <div
              style={{
                position: 'relative',
                width: 1400,
                height: 520,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: PALETTE.paperBase,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PapercraftArt
                src={ART_PATHS.eyes}
                width={1400}
                height={520}
                multiply={true}
                feather={false}
                scale={eyesZoom}
              />
            </div>
          </div>

          {/* Subtle drifting pale-sky paper clouds across window edges */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <g
              transform={`translate(${65 + (frame - 720) * 0.35}, 275)`}
              style={{ filter: PAPER_SHADOW_SOFT }}
              opacity={0.92}
            >
              <path
                d="M 0 42 C 18 12 62 4 92 22 C 118 -4 176 -2 198 26 C 228 18 262 38 254 64 L -8 64 Z"
                fill={PALETTE.cloudBlue}
              />
              <path
                d="M 28 54 C 46 28 84 22 112 36 C 138 14 186 18 206 42 C 228 38 250 52 246 70 L 18 70 Z"
                fill={PALETTE.cloudWhite}
              />
            </g>
            <g
              transform={`translate(${1240 - (frame - 720) * 0.28}, 745)`}
              style={{ filter: PAPER_SHADOW_SOFT }}
              opacity={0.92}
            >
              <path
                d="M 0 44 C 24 14 76 6 112 24 C 144 -6 212 -2 240 28 C 276 20 310 42 302 68 L -10 68 Z"
                fill={PALETTE.cloudBlue}
              />
              <path
                d="M 38 56 C 60 30 104 24 134 38 C 162 16 216 22 238 46 C 264 40 288 54 282 74 L 24 74 Z"
                fill={PALETTE.cloudWhite}
              />
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 5 (943..1186): A1 Sky & Wind — 5 Cloud Banks + Wind Ribbons  */}
      {/* ================================================================= */}
      {beat5Opacity > 0.001 && (
        <AbsoluteFill style={{ opacity: beat5Opacity }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">
            {/* 5 layered parallax paper cloud banks */}
            {[
              { y: 150, speed: 0.45, color: '#B8C3F2', scale: 1.08, offset: -120 },
              { y: 290, speed: 0.72, color: PALETTE.cloudBlue, scale: 1.0, offset: 60 },
              { y: 470, speed: 1.05, color: '#EDF0FA', scale: 1.06, offset: -200 },
              { y: 650, speed: 1.38, color: PALETTE.cloudBlue, scale: 1.12, offset: 40 },
              { y: 810, speed: 1.75, color: PALETTE.cloudWhite, scale: 1.15, offset: -90 },
            ].map((bank, idx) => {
              const shiftX = ((bank.offset + skyT * bank.speed) % 960) - 480;
              return (
                <g
                  key={idx}
                  transform={`translate(${shiftX}, ${bank.y}) scale(${bank.scale})`}
                  style={{ filter: PAPER_SHADOW }}
                >
                  {[0, 960, 1920].map((tileX) => (
                    <path
                      key={tileX}
                      transform={`translate(${tileX}, 0)`}
                      d="M -60 180 L -60 72 C 10 24 95 16 168 52 C 230 -6 355 -12 426 44 C 490 10 600 18 656 60 C 724 14 845 12 912 64 L 980 180 Z"
                      fill={bank.color}
                    />
                  ))}
                </g>
              );
            })}

            {/* 4 sweeping animated SVG paper wind ribbons */}
            {[
              {
                d: 'M -160 280 C 260 160, 620 420, 1080 260 C 1440 135, 1740 310, 2120 210',
                color: PALETTE.cloudWhite,
                width: 18,
                dash: 520,
                gap: 1700,
                speed: 14,
                delay: 0,
              },
              {
                d: 'M -180 460 C 240 570, 680 310, 1140 440 C 1520 545, 1780 350, 2140 420',
                color: PALETTE.periwinkleLight,
                width: 12,
                dash: 460,
                gap: 1800,
                speed: 17,
                delay: 26,
              },
              {
                d: 'M -140 610 C 310 490, 740 710, 1180 560 C 1540 435, 1810 615, 2120 535',
                color: PALETTE.lavenderSoft,
                width: 10,
                dash: 400,
                gap: 1750,
                speed: 15.5,
                delay: 52,
              },
              {
                d: 'M -200 350 C 280 440, 640 230, 1060 365 C 1460 490, 1780 260, 2140 325',
                color: PALETTE.cloudBlue,
                width: 14,
                dash: 480,
                gap: 1650,
                speed: 13,
                delay: 78,
              },
            ].map((ribbon, idx) => {
              const travel = Math.max(0, skyT - ribbon.delay) * ribbon.speed;
              const dashOffset = ribbon.dash + 180 - travel;
              return (
                <path
                  key={idx}
                  d={ribbon.d}
                  fill="none"
                  stroke={ribbon.color}
                  strokeWidth={ribbon.width + pulse * 2.5}
                  strokeLinecap="round"
                  strokeDasharray={`${ribbon.dash} ${ribbon.gap}`}
                  strokeDashoffset={dashOffset}
                  opacity={0.86}
                  style={{ filter: PAPER_SHADOW_SOFT }}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 6 (1186..1348): A1 Dream — Vellum Wash + Double Exposure     */}
      {/* ================================================================= */}
      {beat6Opacity > 0.001 && (
        <AbsoluteFill style={{ opacity: beat6Opacity }}>
          {/* Translucent vellum paper wash softening the clouds */}
          <AbsoluteFill
            style={{
              background:
                'radial-gradient(ellipse at 50% 46%, rgba(247,244,234,0.72) 0%, rgba(239,236,225,0.52) 68%, rgba(220,227,245,0.36) 100%)',
            }}
          />

          {/* Dreamy double-exposure silhouette of handsHeart */}
          <div
            style={{
              position: 'absolute',
              left: 520,
              top: 64 + Math.sin(dreamT * 0.04) * 8,
              opacity: 0.65,
            }}
          >
            <PapercraftArt
              src={ART_PATHS.handsHeart}
              width={880}
              height={880}
              multiply={true}
              feather={true}
              scale={1.03}
            />
          </div>
          {/* Soft offset ghost double-exposure echo */}
          <div
            style={{
              position: 'absolute',
              left: 544 + Math.sin(dreamT * 0.03) * 10,
              top: 52 + Math.cos(dreamT * 0.035) * 6,
              opacity: 0.22,
            }}
          >
            <PapercraftArt
              src={ART_PATHS.handsHeart}
              width={880}
              height={880}
              multiply={true}
              feather={true}
              scale={1.07}
            />
          </div>

          {/* Orbiting miniature FourPointStars and pastel paper bubbles */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {dreamBubbles.map((b, idx) => {
              const by = ((b.y - dreamT * b.speedY + 1080) % 1080);
              const bx = b.x + Math.sin(dreamT * 0.03 + b.phase) * 18;
              return (
                <g key={idx} style={{ filter: PAPER_SHADOW_SOFT }}>
                  <circle
                    cx={bx}
                    cy={by}
                    r={b.r}
                    fill={b.color}
                    opacity={0.48}
                  />
                  <circle
                    cx={bx - b.r * 0.28}
                    cy={by - b.r * 0.28}
                    r={b.r * 0.24}
                    fill={PALETTE.cloudWhite}
                    opacity={0.75}
                  />
                </g>
              );
            })}

            {dreamStars.map((st, idx) => {
              const a = st.angle + dreamT * st.speed;
              const sx = 960 + Math.cos(a) * st.rx;
              const sy = 485 + Math.sin(a) * st.ry;
              return (
                <FourPointStar
                  key={idx}
                  x={sx}
                  y={sy}
                  size={st.size * (0.9 + pulse * 0.25)}
                  rotation={dreamT * 0.7 + idx * 36}
                  opacity={0.85}
                  colorTop={st.colorTop}
                  colorBottom={st.colorBottom}
                  glow={0.3 + pulse * 0.4}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      {/* ================================================================= */}
      {/* BEAT 7 (1348..1544): A1 Barefoot — Circular Aperture + Footprints */}
      {/* ================================================================= */}
      {beat7Opacity > 0.001 && (
        <AbsoluteFill style={{ opacity: beat7Opacity }}>
          {/* Layered circular papercraft aperture matte (center-left) */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <g
              transform={`translate(480, 468) scale(${apertureScale})`}
              style={{ filter: PAPER_SHADOW }}
            >
              <circle cx={0} cy={0} r={348} fill={PALETTE.mazeWall} />
              <circle cx={0} cy={0} r={322} fill={PALETTE.paperWarm} />
              <circle cx={0} cy={0} r={298} fill={PALETTE.paperLight} />
            </g>

            {/* Delicate lavender-blue floral paper footprints stepping along an arc */}
            {barefootSteps.map((step, idx) => {
              const stepSpring = spring({
                frame: Math.max(0, barefootLocal - step.delay),
                fps: FPS,
                config: { damping: 14, stiffness: 120, mass: 0.8 },
              });
              if (stepSpring <= 0.01) return null;
              const fillMain =
                idx % 2 === 0 ? PALETTE.periwinkleLight : PALETTE.lavenderSoft;
              const fillAccent =
                idx % 2 === 0 ? PALETTE.cloudBlue : PALETTE.paperLight;
              return (
                <g
                  key={idx}
                  transform={`translate(${step.x}, ${step.y}) rotate(${step.rot}) scale(${stepSpring})`}
                  opacity={stepSpring * 0.88}
                  style={{ filter: PAPER_SHADOW_SOFT }}
                >
                  {/* Stylized papercraft footprint sole */}
                  <ellipse cx={-12} cy={0} rx={15} ry={10} fill={fillMain} />
                  <ellipse cx={16} cy={step.side * 2} rx={18} ry={12} fill={fillMain} />
                  {/* Delicate toe dots */}
                  {[-10, -4, 2, 8].map((ty, tIdx) => (
                    <circle
                      key={tIdx}
                      cx={38 - Math.abs(tIdx - 1.5) * 2}
                      cy={ty * step.side}
                      r={3.2 - tIdx * 0.3}
                      fill={fillMain}
                    />
                  ))}
                  {/* Tiny 4-petal floral paper blossom tucked beside footprint */}
                  <g transform={`translate(${-4}, ${step.side * -22})`}>
                    <circle cx={0} cy={-5} r={4} fill={fillAccent} />
                    <circle cx={5} cy={0} r={4} fill={fillAccent} />
                    <circle cx={0} cy={5} r={4} fill={fillAccent} />
                    <circle cx={-5} cy={0} r={4} fill={fillAccent} />
                    <circle cx={0} cy={0} r={2.6} fill={PALETTE.starGoldSoft} />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Circular clipped PapercraftArt of barefoot inside the aperture */}
          <div
            style={{
              position: 'absolute',
              left: 480 - 294,
              top: 468 - 294,
              width: 588,
              height: 588,
              borderRadius: '50%',
              overflow: 'hidden',
              transform: `scale(${apertureScale})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PapercraftArt
              src={ART_PATHS.barefoot}
              width={600}
              height={600}
              multiply={true}
              feather={true}
              scale={1.04}
            />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
