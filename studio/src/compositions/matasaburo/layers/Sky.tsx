import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from 'remotion';
import { EVENTS, PALETTE, SECTIONS } from '../constants';

export const Sky: React.FC = () => {
  const frame = useCurrentFrame();

  // Keyframe timeline for seasonal sky transitions (Summer -> Gale -> Storm -> Clearing -> Autumn Sunset)
  const inputFrames = [
    SECTIONS.S1.start,
    SECTIONS.S2.end - 30,
    SECTIONS.S3.start + 15,
    SECTIONS.S4.start,
    SECTIONS.S4.start + 30,
    SECTIONS.S5.end - 60,
    SECTIONS.S6a.start + 20,
    SECTIONS.S6b.start,
    EVENTS.SKY_CLEAR_FULL,
    SECTIONS.S6b.end,
    SECTIONS.S7.start + 90,
    SECTIONS.S8.start,
  ];

  const topColor = interpolateColors(frame, inputFrames, [
    PALETTE.summerSkyTop,
    PALETTE.summerSkyTop,
    PALETTE.galeSkyTop,
    PALETTE.galeSkyTop,
    PALETTE.stormLeadTop,
    PALETTE.stormLeadTop,
    PALETTE.stormDeepTop,
    PALETTE.stormDeepTop,
    PALETTE.summerSkyTop,
    PALETTE.summerSkyTop,
    PALETTE.autumnSunsetTop,
    PALETTE.autumnSunsetTop,
  ]);

  const bottomColor = interpolateColors(frame, inputFrames, [
    PALETTE.summerSky,
    PALETTE.summerSky,
    PALETTE.galeBlue,
    PALETTE.galeBlue,
    PALETTE.stormLeadBlue,
    PALETTE.stormLeadBlue,
    PALETTE.stormDark,
    PALETTE.stormDark,
    PALETTE.summerSky,
    PALETTE.summerSky,
    PALETTE.autumnSunsetOrange,
    PALETTE.autumnSunsetOrange,
  ]);

  // Horizon accent tint (warm glow in sunset, pale mist in storm)
  const horizonColor = interpolateColors(frame, inputFrames, [
    '#DDF1FF',
    '#DDF1FF',
    '#BFE0FF',
    '#BFE0FF',
    PALETTE.rainGrey,
    PALETTE.rainGrey,
    '#3B506B',
    '#4A6B8A',
    '#E8F7FF',
    '#FFE1BA',
    '#FFD099',
    PALETTE.autumnLavender,
  ]);

  // Sunbeams emerging as sky clears in S6b (4826 -> 5715 -> 6210)
  const sunbeamOpacity = interpolate(
    frame,
    [
      SECTIONS.S6b.start,
      SECTIONS.S6b.start + 120,
      EVENTS.SKY_CLEAR_FULL,
      SECTIONS.S6b.end,
      SECTIONS.S7.start + 90,
    ],
    [0, 0.25, 0.55, 0.35, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtle autumn sun disk during S7 / S8
  const sunsetGlow = interpolate(
    frame,
    [SECTIONS.S7.start, SECTIONS.S7.start + 120, SECTIONS.S8.end],
    [0, 0.65, 0.45],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 62%, ${horizonColor} 100%)`,
      }}
    >
      {sunbeamOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: sunbeamOpacity,
            background:
              'conic-gradient(from 195deg at 50% 18%, transparent 0deg, rgba(255,250,225,0.45) 14deg, transparent 32deg, rgba(255,250,225,0.35) 54deg, transparent 74deg, rgba(255,250,225,0.4) 98deg, transparent 120deg)',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {sunsetGlow > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: sunsetGlow,
            background:
              'radial-gradient(circle at 50% 66%, rgba(255, 224, 150, 0.65) 0%, rgba(242, 162, 92, 0.28) 32%, transparent 65%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
