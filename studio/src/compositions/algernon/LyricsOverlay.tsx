import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { CUES, FONT_JP, FONT_ZH, PALETTE } from './constants';
import { BilingualLyric } from './lrc';

type LayoutMode = 'vertical-right' | 'bottom-center' | 'top-left' | 'center-statement';

function getLayoutForFrame(frame: number): LayoutMode {
  // Bridge "生きていくこと" — poetic center statement
  if (frame >= CUES.BRIDGE_LIVE - 5 && frame < CUES.INTERLUDE_START) {
    return 'center-statement';
  }
  // Vertical storybook layout during quiet portrait scenes (A1 heart/eyes, A2 name/hands, A3 time/shoes)
  if (
    (frame >= CUES.A1_HEART && frame < CUES.A1_SKY_WIND) ||
    (frame >= CUES.A2_NAME && frame < CUES.A2_WAVES) ||
    (frame >= CUES.CHORUS2_SLEEP && frame < CUES.CHORUS2_TREE) ||
    (frame >= CUES.A3_TIME && frame < CUES.A3_STEPS)
  ) {
    return 'vertical-right';
  }
  // Top-left poetic placement during waves & seaside back-view
  if (frame >= CUES.A2_WAVES && frame < CUES.CHORUS2_SLEEP) {
    return 'top-left';
  }
  // Default clean bottom-center for panoramic MG / maze / tree / finale scenes
  return 'bottom-center';
}

export const LyricsOverlay: React.FC<{ lyrics: BilingualLyric[] }> = ({
  lyrics,
}) => {
  const frame = useCurrentFrame();

  const current = lyrics.find(
    (l) => frame >= l.startFrame - 6 && frame <= l.endFrame + 6
  );
  if (!current) return null;

  const duration = current.endFrame - current.startFrame;
  const fadeInEnd = Math.min(current.startFrame + 16, current.endFrame - 4);
  const fadeOutStart = Math.max(fadeInEnd + 1, current.endFrame - Math.min(16, duration * 0.25));

  const opacity = interpolate(
    frame,
    [current.startFrame - 4, fadeInEnd, fadeOutStart, current.endFrame + 4],
    [0, 1, 1, 0],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const drift = interpolate(
    frame,
    [current.startFrame - 4, fadeInEnd],
    [10, 0],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const layout = getLayoutForFrame(current.startFrame);

  if (layout === 'center-statement') {
    return (
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          opacity,
          transform: `translateY(${drift}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: FONT_JP,
              fontSize: 56,
              fontWeight: 500,
              letterSpacing: '0.26em',
              color: PALETTE.inkDark,
              textShadow: '0 2px 14px rgba(239,236,225,0.95)',
            }}
          >
            {current.ja}
          </div>
          {current.zh && (
            <div
              style={{
                fontFamily: FONT_ZH,
                fontSize: 24,
                letterSpacing: '0.22em',
                color: PALETTE.inkMid,
              }}
            >
              {current.zh}
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  if (layout === 'vertical-right') {
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            right: 112,
            top: 86,
            bottom: 86,
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'flex-start',
            gap: 22,
            opacity,
            transform: `translateY(${drift}px)`,
          }}
        >
          <div
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              fontFamily: FONT_JP,
              fontSize: 33,
              fontWeight: 500,
              letterSpacing: '0.15em',
              lineHeight: 1.45,
              color: PALETTE.inkDark,
              textShadow: '0 2px 10px rgba(239,236,225,0.9)',
              maxHeight: 908,
            }}
          >
            {current.ja}
          </div>
          {current.zh && (
            <div
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                fontFamily: FONT_ZH,
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: '0.16em',
                color: PALETTE.inkMid,
                paddingTop: 22,
                textShadow: '0 1px 8px rgba(239,236,225,0.9)',
                maxHeight: 880,
              }}
            >
              {current.zh}
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  if (layout === 'top-left') {
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 95,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            opacity,
            transform: `translateY(${drift}px)`,
            maxWidth: 1100,
          }}
        >
          <div
            style={{
              fontFamily: FONT_JP,
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: '0.14em',
              color: PALETTE.inkDark,
              textShadow: '0 2px 12px rgba(239,236,225,0.95)',
            }}
          >
            {current.ja}
          </div>
          {current.zh && (
            <div
              style={{
                fontFamily: FONT_ZH,
                fontSize: 22,
                letterSpacing: '0.14em',
                color: PALETTE.inkMid,
                textShadow: '0 1px 10px rgba(239,236,225,0.95)',
              }}
            >
              {current.zh}
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // bottom-center
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 66,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
          opacity,
          transform: `translateY(${drift}px)`,
        }}
      >
        <div
          style={{
            padding: '10px 30px',
            borderRadius: 999,
            background: 'rgba(239,236,225,0.72)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 4px 18px rgba(46,43,62,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: FONT_JP,
              fontSize: 35,
              fontWeight: 500,
              letterSpacing: '0.14em',
              color: PALETTE.inkDark,
              textAlign: 'center',
            }}
          >
            {current.ja}
          </div>
          {current.zh && (
            <div
              style={{
                fontFamily: FONT_ZH,
                fontSize: 21,
                letterSpacing: '0.14em',
                color: PALETTE.inkMid,
                textAlign: 'center',
              }}
            >
              {current.zh}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
