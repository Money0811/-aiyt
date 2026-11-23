import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface IntroLine {
  id: string;
  statusTag: string;
  expression: 'normal' | 'happy' | 'excited' | 'explain' | 'chair' | 'think';
  tone: string;
  sfx: string;
  text: string;
  holdSec: number;
  durationFrames: number;
}

export interface IntroScriptData {
  fps: number;
  characterName: string;
  badgeColor: string;
  charsPerSecond: number;
  totalFrames: number;
  lines: IntroLine[];
}

export interface PixelIntroProps {
  script: IntroScriptData | null;
}

const LOGICAL_W = 480;
const LOGICAL_H = 270;
const SCALE = 4; // 480x270 * 4 = 1920x1080

const SPRITE_MAP: Record<string, { open: string; closed: string }> = {
  normal: {
    open: 'character/pixel/opening_normal.png',
    closed: 'character/pixel/opening_normal_closed.png',
  },
  happy: {
    open: 'character/pixel/opening_normal.png',
    closed: 'character/pixel/opening_normal_closed.png',
  },
  excited: {
    open: 'character/pixel/chibi_excited.png',
    closed: 'character/pixel/chibi_excited_closed.png',
  },
  explain: {
    open: 'character/pixel/chibi_explain.png',
    closed: 'character/pixel/chibi_explain_closed.png',
  },
  chair: {
    open: 'character/pixel/chibi_chair.png',
    closed: 'character/pixel/chibi_chair_closed.png',
  },
  think: {
    open: 'character/pixel/chibi_think.png',
    closed: 'character/pixel/chibi_think.png',
  },
};

const BUNTING_COLORS = ['#F48FB1', '#81D4FA', '#B39DDB', '#FFF9C4', '#FFAB91', '#80CBC4'];

const PixelRoomBackground: React.FC = () => {
  const flags = Array.from({ length: 18 }, (_, i) => ({
    x: i * 28 - 6,
    color: BUNTING_COLORS[i % BUNTING_COLORS.length],
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#F5C7CF',
        backgroundImage:
          'radial-gradient(#FCE0E6 1px, transparent 1px), radial-gradient(#FCE0E6 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
      }}
    >
      {/* Lower wainscoting wall */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 24,
          height: 70,
          backgroundColor: '#EDB3BE',
          borderTop: '4px solid #FDF7F7',
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 26px, #E4A2AF 26px, #E4A2AF 28px)',
        }}
      />

      {/* Wooden floor */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 24,
          backgroundColor: '#C5956B',
          borderTop: '2px solid #A87850',
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 46px, #B07F56 46px, #B07F56 48px)',
        }}
      />

      {/* Top bunting flags */}
      <svg
        width={LOGICAL_W}
        height={32}
        viewBox={`0 0 ${LOGICAL_W} 32`}
        shapeRendering="crispEdges"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <rect x={0} y={8} width={LOGICAL_W} height={2} fill="#E5A9B5" />
        {flags.map((f, idx) => (
          <polygon
            key={idx}
            points={`${f.x},10 ${f.x + 16},10 ${f.x + 8},24`}
            fill={f.color}
          />
        ))}
      </svg>

      {/* Round pixel window on the right */}
      <svg
        width={68}
        height={68}
        viewBox="0 0 68 68"
        shapeRendering="crispEdges"
        style={{ position: 'absolute', top: 50, right: 42 }}
      >
        <circle cx={34} cy={34} r={30} fill="#FFFFFF" />
        <circle cx={34} cy={34} r={25} fill="#A7DBFA" />
        {/* Pixel clouds inside window */}
        <rect x={16} y={24} width={14} height={4} fill="#E3F4FE" />
        <rect x={18} y={21} width={8} height={3} fill="#E3F4FE" />
        <rect x={38} y={38} width={14} height={4} fill="#E3F4FE" />
        {/* Window cross frame */}
        <rect x={32} y={8} width={4} height={52} fill="#FFFFFF" />
        <rect x={8} y={32} width={52} height={4} fill="#FFFFFF" />
      </svg>

      {/* Wall frame + shelf */}
      <svg
        width={76}
        height={64}
        viewBox="0 0 76 64"
        shapeRendering="crispEdges"
        style={{ position: 'absolute', top: 100, right: 120 }}
      >
        <rect x={4} y={2} width={68} height={42} fill="#A9744F" />
        <rect x={7} y={5} width={62} height={36} fill="#CDE9FB" />
        {/* Tiny pixel characters inside frame */}
        <rect x={14} y={26} width={6} height={11} fill="#6B65E8" />
        <rect x={24} y={25} width={6} height={12} fill="#3B66B0" />
        <rect x={34} y={26} width={6} height={11} fill="#F48FB1" />
        <rect x={44} y={24} width={6} height={13} fill="#FFAB91" />
        <rect x={54} y={26} width={6} height={11} fill="#80CBC4" />
        {/* Wooden shelf */}
        <rect x={0} y={52} width={76} height={4} fill="#B37D56" />
        <rect x={12} y={56} width={4} height={6} fill="#8F6140" />
        <rect x={60} y={56} width={4} height={6} fill="#8F6140" />
      </svg>
    </div>
  );
};

const PixelSparkles: React.FC<{ frame: number }> = ({ frame }) => {
  const items = [
    { x: 148, y: 88, color: '#FF7096', offset: 0 },
    { x: 315, y: 76, color: '#FFD54F', offset: 12 },
    { x: 132, y: 128, color: '#81D4FA', offset: 24 },
  ];

  return (
    <>
      {items.map((it, idx) => {
        const dy = Math.round(Math.sin((frame + it.offset) * 0.16) * 4);
        const visible = Math.floor((frame + it.offset) / 10) % 2 === 0;
        if (!visible) return null;
        return (
          <svg
            key={idx}
            width={10}
            height={10}
            viewBox="0 0 10 10"
            shapeRendering="crispEdges"
            style={{
              position: 'absolute',
              left: it.x,
              top: it.y + dy,
            }}
          >
            <rect x={4} y={1} width={2} height={8} fill={it.color} />
            <rect x={1} y={4} width={8} height={2} fill={it.color} />
          </svg>
        );
      })}
    </>
  );
};

const LineScene: React.FC<{
  line: IntroLine;
  lineIndex: number;
  characterName: string;
  badgeColor: string;
  charsPerSecond: number;
}> = ({ line, lineIndex, characterName, badgeColor, charsPerSecond }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const framesPerChar = fps / charsPerSecond;
  const rawChars = Math.floor(frame / framesPerChar);
  const visibleCount = Math.min(line.text.length, Math.max(0, rawChars));
  const isTyping = visibleCount < line.text.length;
  const visibleText = line.text.slice(0, visibleCount);

  // Mouth open/close synced to typing
  const mouthOpen = isTyping && Math.floor(frame / 3) % 2 === 0;
  const spriteSet = SPRITE_MAP[line.expression] ?? SPRITE_MAP.normal;
  const spriteSrc = mouthOpen ? spriteSet.open : spriteSet.closed;

  // Entrance bounce on first line + gentle talk/idle bounce
  const enterScale =
    lineIndex === 0
      ? spring({
          frame,
          fps,
          config: { damping: 12, stiffness: 140 },
        })
      : 1;
  const talkBounce = isTyping
    ? Math.round(Math.abs(Math.sin(frame * 0.45)) * -3)
    : Math.round(Math.sin(frame * 0.12) * 1.5);

  const blinkOn = Math.floor(frame / 10) % 2 === 0;

  return (
    <AbsoluteFill>
      {/* Top-left LIVE HUD */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: '"MingLiU", "PMingLiU", "Consolas", monospace',
          WebkitFontSmoothing: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: '#E84D56',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            letterSpacing: 0.5,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 4,
              height: 4,
              backgroundColor: blinkOn ? '#FFFFFF' : '#FF9AA0',
            }}
          />
          LIVE
        </div>
        <div
          style={{
            backgroundColor: 'rgba(56, 52, 74, 0.88)',
            color: '#FFFFFF',
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 2,
          }}
        >
          {line.statusTag}
        </div>
      </div>

      {/* Sparkles for happy/excited lines */}
      {(line.expression === 'excited' || line.expression === 'happy') && (
        <PixelSparkles frame={frame} />
      )}

      {/* Character sprite */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 58,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(${talkBounce + (1 - enterScale) * 50}px)`,
        }}
      >
        <Img
          src={staticFile(spriteSrc)}
          style={{
            height: 128,
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Galgame Pixel Dialogue Box */}
      <div
        style={{
          position: 'absolute',
          left: 34,
          right: 34,
          bottom: 10,
          height: 62,
          backgroundColor: '#FAF7EE',
          border: '2px solid #25233D',
          boxShadow: '0 2px 0 #25233D, inset 0 0 0 1px #E6DFCE',
          padding: '13px 14px 8px 14px',
          boxSizing: 'border-box',
          fontFamily: '"MingLiU", "PMingLiU", "Consolas", monospace',
          WebkitFontSmoothing: 'none',
        }}
      >
        {/* Character Name Badge */}
        <div
          style={{
            position: 'absolute',
            top: -11,
            left: 10,
            backgroundColor: badgeColor,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            border: '1px solid #25233D',
          }}
        >
          {characterName}
        </div>

        {/* Typewriter Dialogue Text */}
        <div
          style={{
            color: '#25233D',
            fontSize: 14,
            lineHeight: 1.45,
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          {visibleText}
        </div>

        {/* Blinking next arrow */}
        {!isTyping && (
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 6 + (blinkOn ? 0 : 2),
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '5px solid #4A72B8',
            }}
          />
        )}
      </div>

      {/* Bottom-right subtle TV icon */}
      <svg
        width={18}
        height={16}
        viewBox="0 0 18 16"
        shapeRendering="crispEdges"
        style={{ position: 'absolute', right: 10, bottom: 12, opacity: 0.75 }}
      >
        <rect x={2} y={3} width={14} height={11} fill="#FFFFFF" />
        <rect x={4} y={5} width={10} height={7} fill="#E5C0C8" />
        <polygon points="7,6 7,11 11,8.5" fill="#FFFFFF" />
      </svg>
    </AbsoluteFill>
  );
};

export const PixelIntro: React.FC<PixelIntroProps> = ({ script }) => {
  if (!script) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#111', color: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        Loading PixelIntro...
      </AbsoluteFill>
    );
  }

  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#1E1B2E', overflow: 'hidden' }}>
      {/* Background Chiptune BGM */}
      <Audio src={staticFile('intro/bgm.wav')} volume={0.45} />

      {/* Logical 480x270 canvas scaled 4x to 1920x1080 with pixelated rendering */}
      <div
        style={{
          width: LOGICAL_W,
          height: LOGICAL_H,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          position: 'relative',
          imageRendering: 'pixelated',
          overflow: 'hidden',
        }}
      >
        <PixelRoomBackground />

        {script.lines.map((line, idx) => {
          const from = cursor;
          const dur = line.durationFrames;
          cursor += dur;
          return (
            <Sequence key={line.id} from={from} durationInFrames={dur}>
              <Audio src={staticFile(`intro/${line.id}.wav`)} volume={0.9} />
              <LineScene
                line={line}
                lineIndex={idx}
                characterName={script.characterName}
                badgeColor={script.badgeColor}
                charsPerSecond={script.charsPerSecond}
              />
            </Sequence>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
