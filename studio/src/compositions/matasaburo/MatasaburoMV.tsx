import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  AUDIO_PATHS,
  CharacterPose,
  EVENTS,
  SECTIONS,
} from './constants';
import { FlyingFruits } from './layers/FlyingFruits';
import { Clouds } from './layers/Clouds';
import { Fields } from './layers/Fields';
import { Leaves } from './layers/Leaves';
import { Lightning } from './layers/Lightning';
import { Rain } from './layers/Rain';
import { Sky } from './layers/Sky';
import { WindStreaks } from './layers/WindStreaks';
import { LyricLine } from './lrc';
export { parseLrc } from './lrc';
import { DebugMeter } from './overlays/DebugMeter';
import { EndCard } from './overlays/EndCard';
import { KineticDoddodo } from './overlays/KineticDoddodo';
import { LyricsLayer } from './overlays/LyricsLayer';
import { TitleCard } from './overlays/TitleCard';
import { SingingCharacter } from './SingingCharacter';
import { Flash } from './transitions/Flash';
import { PixelBlinds } from './transitions/PixelBlinds';
import { WindWipe } from './transitions/WindWipe';
import { useBassPulse } from './useBassPulse';
import { useLipSync } from './useLipSync';

export type MatasaburoMVProps = {
  lyrics?: LyricLine[];
  debugLipSync?: boolean;
  [key: string]: unknown;
};

export const MatasaburoMV: React.FC<MatasaburoMVProps> = ({
  lyrics = [],
  debugLipSync = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { level: lipLevel, raw: lipRaw } = useLipSync();
  const bassPulse = useBassPulse();

  // Compute camera transform (scale, translateX, translateY, rotateDeg)
  let camScale = 1;
  let camX = 0;
  let camY = 0;
  let camRot = 0;

  if (frame < SECTIONS.S2.start) {
    // S1: slowly pan camera upward
    camY = interpolate(frame, [0, SECTIONS.S1.end], [42, -14], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camScale = interpolate(frame, [0, SECTIONS.S1.end], [1.04, 1.0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < SECTIONS.S3.start) {
    // S2: push in 1.00 -> 1.08
    const settle = spring({
      fps,
      frame: frame - SECTIONS.S2.start,
      config: { damping: 18, stiffness: 120 },
    });
    camScale =
      interpolate(
        frame,
        [SECTIONS.S2.start, SECTIONS.S2.end],
        [1.0, 1.08],
        {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      ) +
      (1 - settle) * 0.02;
  } else if (frame < SECTIONS.S4.start) {
    // S3: energetic beat bounce driven by mix bass
    camScale = 1.03 + bassPulse * 0.04;
    camY = -bassPulse * 14;
  } else if (frame < SECTIONS.S5.start) {
    // S4: pixel interlude steady frame with slight drift
    camScale = 1.02;
    camX = interpolate(frame, [SECTIONS.S4.start, SECTIONS.S4.end], [12, -12], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < SECTIONS.S6a.start) {
    // S5: pan left across rain
    camScale = 1.05;
    camX = interpolate(frame, [SECTIONS.S5.start, SECTIONS.S5.end], [38, -38], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < SECTIONS.S6b.start) {
    // S6a: storm camera shake proportional to bass amplitude
    const shakeAmp = 6 + bassPulse * 22;
    camScale = 1.06 + bassPulse * 0.03;
    camX = (random(`cam-sx-${frame}`) - 0.5) * shakeAmp;
    camY = (random(`cam-sy-${frame}`) - 0.5) * shakeAmp * 0.75;
    camRot = (random(`cam-sr-${frame}`) - 0.5) * (0.5 + bassPulse * 1.1);
  } else if (frame < SECTIONS.S7.start) {
    // S6b: gentle ±2° rotation around character as sky clears
    const dt = frame - SECTIONS.S6b.start;
    const settle = spring({
      fps,
      frame: dt,
      config: { damping: 16, stiffness: 100 },
    });
    camScale = 1.04 + (1 - settle) * 0.06;
    camRot = Math.sin(dt * 0.032) * 2.0;
  } else {
    // S7 (& S8 base): pull back 1.10 -> 0.95 (clamped to 1.0 outer background safety via padding or scaling scene content)
    camScale = interpolate(
      frame,
      [SECTIONS.S7.start, SECTIONS.S7.end],
      [1.1, 0.95],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
  }

  // Opening white fade-in (first 24 frames of S1)
  const introWhiteOpacity = interpolate(frame, [0, 24], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Character selection per section
  const renderCharacter = () => {
    if (frame >= SECTIONS.S8.start) {
      return null;
    }

    // S1: opening_normal slides in from right starting at 18 s (frame 540)
    if (frame < SECTIONS.S2.start) {
      if (frame < EVENTS.INTRO_CHAR_ENTER) {
        return null;
      }
      const slideProgress = interpolate(
        frame,
        [EVENTS.INTRO_CHAR_ENTER, SECTIONS.S1.end],
        [0, 1],
        {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
      const xPercent = interpolate(slideProgress, [0, 1], [112, 33]);
      const floatY = Math.sin(frame * 0.08) * 6;
      return (
        <SingingCharacter
          pose="opening_normal"
          lipLevel={lipLevel}
          xPercent={xPercent}
          bottom={70}
          height={840}
          floatY={floatY}
        />
      );
    }

    // S2: opening_normal on left 1/3 with breathing float ±6px
    if (frame < SECTIONS.S3.start) {
      const floatY = Math.sin(frame * 0.08) * 6;
      return (
        <SingingCharacter
          pose="opening_normal"
          lipLevel={lipLevel}
          xPercent={33}
          bottom={70}
          height={840}
          floatY={floatY}
        />
      );
    }

    // S3: chibi_excited centered & zoomed
    if (frame < SECTIONS.S4.start) {
      const beatJump = -bassPulse * 12;
      return (
        <SingingCharacter
          pose="chibi_excited"
          lipLevel={lipLevel}
          xPercent={50}
          height={840}
          scale={1.14}
          floatY={beatJump}
        />
      );
    }

    // S4: pixel/chibi_chair -> pixel/opening_normal
    if (frame < SECTIONS.S5.start) {
      const switchFrame = Math.floor((SECTIONS.S4.start + SECTIONS.S4.end) / 2);
      const pose: CharacterPose =
        frame < switchFrame ? 'chibi_chair' : 'opening_normal';
      return (
        <SingingCharacter
          pose={pose}
          lipLevel={lipLevel}
          pixelated
          xPercent={50}
          height={720}
          bottom={30}
        />
      );
    }

    // S5: chibi_explain on right 1/3
    if (frame < SECTIONS.S6a.start) {
      const floatY = Math.sin(frame * 0.07) * 5;
      return (
        <SingingCharacter
          pose="chibi_explain"
          lipLevel={lipLevel}
          xPercent={67}
          bottom={70}
          height={830}
          floatY={floatY}
        />
      );
    }

    // S6a: opening_normal <-> chibi_excited alternating every 8 beats (~126 frames)
    if (frame < SECTIONS.S6b.start) {
      const barIndex = Math.floor((frame - SECTIONS.S6a.start) / 126);
      const pose: CharacterPose =
        barIndex % 2 === 0 ? 'opening_normal' : 'chibi_excited';
      const beatBounce = -bassPulse * 10;
      return (
        <SingingCharacter
          pose={pose}
          lipLevel={lipLevel}
          xPercent={50}
          bottom={70}
          height={840}
          scale={1.06}
          floatY={beatBounce}
        />
      );
    }

    // S6b: chibi_excited close-up (scale 1.25)
    if (frame < SECTIONS.S7.start) {
      return (
        <SingingCharacter
          pose="chibi_excited"
          lipLevel={lipLevel}
          xPercent={50}
          height={840}
          scale={1.25}
        />
      );
    }

    // S7: 1.5 s (45f) long cross-dissolve from S6b chibi_excited -> distant chibi_chair
    const crossFade = interpolate(
      frame,
      [SECTIONS.S7.start, SECTIONS.S7.start + 45],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return (
      <>
        {crossFade < 1 && (
          <SingingCharacter
            pose="chibi_excited"
            lipLevel={lipLevel}
            xPercent={50}
            height={840}
            scale={1.25}
            opacity={1 - crossFade}
          />
        )}
        <SingingCharacter
          pose="chibi_chair"
          lipLevel={lipLevel}
          xPercent={50}
          height={760}
          scale={0.72}
          bottom={140}
          opacity={crossFade}
        />
      </>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#1B2A41', overflow: 'hidden' }}>
      {/* Only mix.wav is connected to audio output; vocal.wav is analysis-only */}
      <Audio src={staticFile(AUDIO_PATHS.mix)} />

      {/* Camera-transformed visual world */}
      <AbsoluteFill
        style={{
          transform: `scale(${Math.max(1, camScale).toFixed(4)}) translate3d(${camX.toFixed(
            2
          )}px, ${camY.toFixed(2)}px, 0) rotate(${camRot.toFixed(3)}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <Sky />
        <Clouds />
        <Fields />

        {/* Distant/background atmosphere */}
        <WindStreaks bassPulse={bassPulse} />

        {/* Character layer (scaled smoothly if S7 pulls below 1.0) */}
        <AbsoluteFill
          style={{
            transform:
              camScale < 1 ? `scale(${camScale.toFixed(4)})` : undefined,
            transformOrigin: 'center bottom',
          }}
        >
          {renderCharacter()}
        </AbsoluteFill>

        {/* Foreground weather & particles */}
        <Rain />
        <FlyingFruits />
        <Leaves />
        <Lightning />
      </AbsoluteFill>

      {/* Custom transitions */}
      <WindWipe startFrame={SECTIONS.S2.start} direction="ltr" />
      <Flash
        startFrame={SECTIONS.S3.start}
        durationFrames={12}
        variant="radialBlur"
      />
      <PixelBlinds startFrame={SECTIONS.S4.start} durationFrames={22} />
      <WindWipe startFrame={SECTIONS.S5.start} direction="rtl" />
      <Flash
        startFrame={SECTIONS.S6a.start}
        durationFrames={10}
        variant="white"
      />
      <Flash
        startFrame={SECTIONS.S6b.start}
        durationFrames={20}
        variant="lightBeam"
      />

      {/* Opening white fade-in */}
      {introWhiteOpacity > 0.005 && (
        <AbsoluteFill
          style={{
            backgroundColor: '#FFFFFF',
            opacity: introWhiteOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Overlays */}
      <TitleCard />
      <KineticDoddodo />
      <LyricsLayer lyrics={lyrics} />
      <EndCard />

      {debugLipSync && (
        <DebugMeter level={lipLevel} raw={lipRaw} bassPulse={bassPulse} />
      )}
    </AbsoluteFill>
  );
};
