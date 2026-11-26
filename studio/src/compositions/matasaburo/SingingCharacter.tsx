import React from 'react';
import { Img, interpolate, staticFile } from 'remotion';
import { CHARACTER_ASSETS, CharacterPose } from './constants';

export interface SingingCharacterProps {
  pose: CharacterPose;
  lipLevel: number;
  pixelated?: boolean;
  /** Horizontal center position as percentage of container width (default 50) */
  xPercent?: number;
  /** Bottom offset in pixels (default 0) */
  bottom?: number;
  /** Rendered height in pixels (default 820) */
  height?: number;
  /** Additional scale multiplier */
  scale?: number;
  /** Vertical bobbing offset in px */
  floatY?: number;
  /** Horizontal translation offset in px */
  offsetX?: number;
  /** Opacity override */
  opacity?: number;
  /** Flip horizontally if needed */
  flipX?: boolean;
}

export const SingingCharacter: React.FC<SingingCharacterProps> = ({
  pose,
  lipLevel,
  pixelated = false,
  xPercent = 50,
  bottom = 0,
  height = 820,
  scale = 1,
  floatY = 0,
  offsetX = 0,
  opacity = 1,
  flipX = false,
}) => {
  const sprites = pixelated
    ? CHARACTER_ASSETS[pose].pixel
    : CHARACTER_ASSETS[pose].normal;

  // Per spec §7: level < 0.25 -> 0, level > 0.5 -> 1, linear in between
  const openOpacity = interpolate(lipLevel, [0.25, 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Per spec §7: subtle vertical stretch when singing
  const mouthScaleY = 1 + lipLevel * 0.015;

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'bottom center',
    imageRendering: pixelated ? 'pixelated' : 'auto',
    pointerEvents: 'none',
  };

  // Preserve consistent container box for aspect ratio (~896/1200 = 0.7467)
  const boxWidth = Math.round(height * 0.78);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${xPercent}%`,
        bottom,
        width: boxWidth,
        height,
        opacity,
        transform: `translateX(-50%) translate3d(${offsetX}px, ${floatY}px, 0) scale(${
          flipX ? -scale : scale
        }, ${scale * mouthScaleY})`,
        transformOrigin: 'bottom center',
        filter: pixelated
          ? 'drop-shadow(0 10px 0 rgba(15, 24, 38, 0.35))'
          : 'drop-shadow(0 18px 32px rgba(15, 24, 38, 0.24))',
        pointerEvents: 'none',
      }}
    >
      <Img src={staticFile(sprites.closed)} style={imgStyle} />
      {openOpacity > 0 && (
        <Img
          src={staticFile(sprites.open)}
          style={{
            ...imgStyle,
            opacity: openOpacity,
          }}
        />
      )}
    </div>
  );
};
