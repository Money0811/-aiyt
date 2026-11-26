import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ART_PATHS, FONT_JP, FONT_ZH, PALETTE } from './constants';
import { FourPointStar } from './PaperStage';

/**
 * 1280x720 YouTube Thumbnail in the exact lineless papercraft storybook style.
 */
export const AlgernonThumbnail: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.paperBase,
        overflow: 'hidden',
      }}
    >
      {/* Warm dawn radial glow */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 32% 52%, rgba(252,226,158,0.48) 0%, rgba(186,124,242,0.12) 48%, rgba(239,236,225,0) 78%)',
        }}
      />

      {/* Layered papercraft archway & maze lines in background */}
      <svg
        width={1280}
        height={720}
        viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Outer papercraft matte frame */}
        <path
          d="M 0 0 H 1280 V 720 H 0 Z M 42 42 V 678 H 1238 V 42 Z"
          fill={PALETTE.paperLight}
          fillRule="evenodd"
          style={{ filter: 'drop-shadow(0 6px 14px rgba(46,43,62,0.12))' }}
        />

        {/* Subtle geometric papercraft maze lines on right */}
        <g opacity={0.42} stroke={PALETTE.paperDeepShadow} strokeWidth={3} fill="none">
          <path d="M 760 80 H 1180 V 640 H 760" />
          <path d="M 810 130 H 1130 V 590 H 860" />
          <path d="M 860 180 H 1080 V 540" />
        </g>

        {/* Soft layered paper cloud / hill accent bottom */}
        <path
          d="M 0 600 Q 260 540 520 595 T 1040 575 T 1280 615 V 720 H 0 Z"
          fill={PALETTE.paperWarm}
          style={{ filter: 'drop-shadow(0 -6px 16px rgba(46,43,62,0.08))' }}
        />

        {/* Signature four-pointed stars */}
        <FourPointStar x={140} y={138} size={34} rotation={8} glow={0.8} />
        <FourPointStar x={695} y={115} size={22} rotation={-12} glow={0.5} />
        <FourPointStar x={1155} y={150} size={28} rotation={14} glow={0.7} />
        <FourPointStar x={1110} y={595} size={18} rotation={-8} glow={0.4} />
      </svg>

      {/* Main character art: transparent papercraft cutout Hagemy on left */}
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 34,
          width: 650,
          height: 650,
        }}
      >
        <Img
          src={staticFile(ART_PATHS.handsHeart)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 12px 22px rgba(46,43,62,0.14))',
          }}
        />
      </div>

      {/* Editorial title block on right */}
      <div
        style={{
          position: 'absolute',
          right: 78,
          top: 0,
          bottom: 0,
          width: 580,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 18,
        }}
      >
        <div
          style={{
            fontFamily: FONT_ZH,
            fontSize: 24,
            letterSpacing: '0.24em',
            color: PALETTE.periwinkle,
            fontWeight: 600,
          }}
        >
          AI COVER ✦ 紙雕繪本 MV
        </div>
        <div
          style={{
            fontFamily: FONT_JP,
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: PALETTE.inkDark,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            textAlign: 'right',
            textShadow: '0 4px 18px rgba(239,236,225,0.95)',
          }}
        >
          アルジャーノン
        </div>
        <div
          style={{
            fontFamily: FONT_ZH,
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: '0.2em',
            color: PALETTE.inkMid,
            textAlign: 'right',
          }}
        >
          阿爾吉儂 ／ 哈Gemi
        </div>
        <div
          style={{
            marginTop: 12,
            padding: '8px 22px',
            borderRadius: 999,
            backgroundColor: PALETTE.navy,
            color: PALETTE.paperLight,
            fontFamily: FONT_JP,
            fontSize: 20,
            letterSpacing: '0.14em',
            boxShadow: '0 6px 16px rgba(39,41,74,0.18)',
          }}
        >
          ヨルシカ（Yorushika）
        </div>
      </div>
    </AbsoluteFill>
  );
};
