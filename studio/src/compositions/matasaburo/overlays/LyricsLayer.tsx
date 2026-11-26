import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { LyricLine } from '../lrc';

export interface LyricsLayerProps {
  lyrics: LyricLine[];
}

const MAX_CONTIGUOUS_GAP_FRAMES = 15; // 0.5 s @ 30fps

interface Span {
  start: number;
  end: number;
}

function buildBackdropSpans(lyrics: LyricLine[]): Span[] {
  const visible = lyrics.filter((line) => !line.ja.includes('どっどど'));
  const spans: Span[] = [];

  for (const line of visible) {
    const last = spans[spans.length - 1];
    if (last && line.startFrame - last.end < MAX_CONTIGUOUS_GAP_FRAMES) {
      last.end = Math.max(last.end, line.endFrame);
    } else {
      spans.push({ start: line.startFrame, end: line.endFrame });
    }
  }

  return spans;
}

export const LyricsLayer: React.FC<LyricsLayerProps> = ({ lyrics }) => {
  const frame = useCurrentFrame();

  const spans = React.useMemo(() => buildBackdropSpans(lyrics), [lyrics]);
  const activeSpan = spans.find((s) => frame >= s.start && frame < s.end);

  let backdropOpacity = 0;
  if (activeSpan) {
    const spanDuration = Math.max(2, activeSpan.end - activeSpan.start);
    const fadeInEnd = Math.min(activeSpan.start + 10, activeSpan.end - 1);
    const fadeOutStart = Math.max(fadeInEnd, activeSpan.end - 10);

    if (spanDuration <= 2) {
      backdropOpacity = 1;
    } else if (fadeInEnd >= fadeOutStart) {
      const mid = (activeSpan.start + activeSpan.end) / 2;
      backdropOpacity = interpolate(
        frame,
        [activeSpan.start, mid, activeSpan.end],
        [0, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    } else {
      backdropOpacity = interpolate(
        frame,
        [activeSpan.start, fadeInEnd, fadeOutStart, activeSpan.end],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }
  }

  const active = lyrics.find(
    (line) => frame >= line.startFrame && frame < line.endFrame
  );
  const showLyrics = Boolean(active && !active.ja.includes('どっどど'));

  if (!showLyrics && backdropOpacity <= 0.005) {
    return null;
  }

  let exitX = 0;
  let exitOpacity = 1;
  let zhEnter = 0;
  let zhX = 0;
  let zhBlur = 0;
  let localFrame = 0;
  let chars: string[] = [];

  if (showLyrics && active) {
    localFrame = frame - active.startFrame;
    const totalDuration = Math.max(2, active.endFrame - active.startFrame);
    const exitStart = Math.min(
      totalDuration - 1,
      Math.max(0, totalDuration - 10)
    );

    const exitProgress = interpolate(
      localFrame,
      [exitStart, totalDuration],
      [0, 1],
      {
        easing: Easing.in(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
    exitX = interpolate(exitProgress, [0, 1], [0, -80]);
    exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

    zhEnter = interpolate(localFrame - 6, [0, 12], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    zhX = interpolate(zhEnter, [0, 1], [50, 0]);
    zhBlur = interpolate(zhEnter, [0, 1], [5, 0]);
    chars = Array.from(active.ja);
  }

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 92, // lower ~1/5 of 1080p frame
      }}
    >
      {/* Bottom readability gradient (0-300px from bottom), continuous across gaps < 0.5s */}
      {backdropOpacity > 0.005 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 300,
            opacity: backdropOpacity,
            background:
              'linear-gradient(to top, rgba(10, 16, 30, 0.55) 0%, rgba(10, 16, 30, 0) 100%)',
          }}
        />
      )}

      {showLyrics && active && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 1680,
            padding: '0 48px',
            transform: `translateX(${exitX}px)`,
            opacity: exitOpacity,
          }}
        >
          {/* Japanese primary lyric: 64px serif, per-char wind stagger 1.5f */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              fontFamily: '"Yu Mincho", "Noto Serif JP", serif',
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.28,
              color: '#FFFFFF',
              letterSpacing: '0.06em',
              WebkitTextStroke: '3px rgba(10, 20, 35, 0.72)',
              paintOrder: 'stroke fill',
              textShadow: '0 4px 18px rgba(8, 16, 28, 0.78)',
            }}
          >
            {chars.map((ch, idx) => {
              const charStart = idx * 1.5;
              const p = interpolate(localFrame - charStart, [0, 10], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const cx = interpolate(p, [0, 1], [60, 0]);
              const blur = interpolate(p, [0, 1], [6, 0]);

              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    opacity: p,
                    transform: `translateX(${cx}px)`,
                    filter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : 'none',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>

          {/* Traditional Chinese secondary lyric: 40px sans, opacity 0.85, delayed 6f */}
          {active.zh && (
            <div
              style={{
                marginTop: 10,
                fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
                fontSize: 40,
                fontWeight: 500,
                lineHeight: 1.3,
                color: '#F4F7FA',
                letterSpacing: '0.08em',
                opacity: 0.85 * zhEnter,
                transform: `translateX(${zhX}px)`,
                filter:
                  zhBlur > 0.1 ? `blur(${zhBlur.toFixed(2)}px)` : 'none',
                WebkitTextStroke: '2.5px rgba(10, 20, 35, 0.7)',
                paintOrder: 'stroke fill',
                textShadow: '0 3px 12px rgba(8, 16, 28, 0.75)',
              }}
            >
              {active.zh}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
