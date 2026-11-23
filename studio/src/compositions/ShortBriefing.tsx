import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SubtitleCue } from './MorningBriefing';

export interface ShortPill {
  text: string;
  color: 'red' | 'amber' | 'blue' | 'purple';
}

export interface ShortData {
  id: string;
  date: string;
  hook_tag: string;
  headline: string;
  subheadline: string;
  source_url: string;
  source_label: string;
  pills: ShortPill[];
  takeaway: string;
  cta_text: string;
  character_image: string;
  character_closed_image?: string;
  screenshot_image?: string;
  script: string;
  audio_file?: string;
  duration_sec?: number;
  duration_frames?: number;
  subtitles?: SubtitleCue[];
  mouth_open?: number[];
}

export interface ShortBriefingProps {
  shortData: ShortData | null;
}

const FONT_FAMILY =
  '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Segoe UI", sans-serif';

const PILL_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  red: { bg: '#fee2e2', fg: '#b91c1c', border: '#ef4444' },
  amber: { bg: '#fef3c7', fg: '#b45309', border: '#f59e0b' },
  blue: { bg: '#dbeafe', fg: '#1d4ed8', border: '#3b82f6' },
  purple: { bg: '#ede9fe', fg: '#6d28d9', border: '#8b5cf6' },
};

function getActiveSubtitle(subtitles: SubtitleCue[], frame: number): string {
  if (!subtitles || subtitles.length === 0) return '';
  let active = subtitles[0].text;
  for (const s of subtitles) {
    if (frame >= s.start_frame) {
      active = s.text;
    } else {
      break;
    }
  }
  return active;
}

export const ShortBriefing: React.FC<ShortBriefingProps> = ({ shortData }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!shortData) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#f5f3ff',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 42,
          fontFamily: FONT_FAMILY,
          color: '#1e2246',
        }}
      >
        Loading ShortData...
      </AbsoluteFill>
    );
  }

  const subtitles = shortData.subtitles ?? [];
  const activeSubtitle = getActiveSubtitle(subtitles, frame);
  const mouthOpenArr = shortData.mouth_open ?? [];
  const isMouthOpen =
    mouthOpenArr.length > 0 ? mouthOpenArr[frame] === 1 : frame % 8 < 5;

  const activeCharImg =
    !isMouthOpen && shortData.character_closed_image
      ? shortData.character_closed_image
      : shortData.character_image;

  const cardEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const imgZoom = interpolate(frame, [0, Math.max(1, durationInFrames)], [1.0, 1.08], {
    extrapolateRight: 'clamp',
  });

  const talkBounce = isMouthOpen ? Math.sin(frame * 0.45) * 4 : 0;

  const ctaStartFrame = Math.max(0, durationInFrames - Math.round(fps * 4.5));
  const isCtaActive = frame >= ctaStartFrame;
  const ctaPop = isCtaActive
    ? spring({
        frame: frame - ctaStartFrame,
        fps,
        config: { damping: 14, stiffness: 140 },
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        background:
          'linear-gradient(155deg, #efe7ff 0%, #f8f5ff 45%, #e6eeff 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {shortData.audio_file && (
        <Audio src={staticFile(shortData.audio_file)} />
      )}

      {/* Decorative background glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(167,139,250,0.24) 0%, transparent 34%), radial-gradient(circle at 85% 45%, rgba(96,165,250,0.20) 0%, transparent 35%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Brand & Hook Tag */}
      <div
        style={{
          position: 'absolute',
          top: 86,
          left: 52,
          right: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#1e2246',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: 999,
            fontSize: 26,
            fontWeight: 900,
            boxShadow: '4px 4px 0 #8b5cf6',
          }}
        >
          <span style={{ color: '#fbbf24' }}>✦</span>
          <span>哈Gemi早報 · SHORTS</span>
        </div>

        <div
          style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: 999,
            fontSize: 26,
            fontWeight: 900,
            border: '3px solid #1e2246',
            boxShadow: '4px 4px 0 #1e2246',
          }}
        >
          {shortData.hook_tag}
        </div>
      </div>

      {/* Big Hook Headline */}
      <div
        style={{
          position: 'absolute',
          top: 176,
          left: 52,
          right: 52,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#1e2246',
            lineHeight: 1.15,
            letterSpacing: -0.5,
            textShadow: '3px 3px 0 rgba(255,255,255,0.9)',
          }}
        >
          {shortData.headline}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 32,
            fontWeight: 800,
            color: '#4f46e5',
            lineHeight: 1.3,
          }}
        >
          {shortData.subheadline}
        </div>
      </div>

      {/* Center Evidence Card */}
      <div
        style={{
          position: 'absolute',
          top: 400,
          left: 52,
          right: 52,
          backgroundColor: '#ffffff',
          borderRadius: 28,
          border: '4px solid #1e2246',
          boxShadow: '10px 10px 0 #1e2246',
          overflow: 'hidden',
          transform: `translateY(${(1 - cardEnter) * 30}px) scale(${0.96 + cardEnter * 0.04})`,
          opacity: cardEnter,
          zIndex: 5,
        }}
      >
        {/* Browser Header */}
        <div
          style={{
            backgroundColor: '#1e2246',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#ef4444' }} />
            <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#f59e0b' }} />
            <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981' }} />
          </div>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.14)',
              color: '#e2e8f0',
              fontSize: 22,
              fontWeight: 600,
              padding: '4px 16px',
              borderRadius: 999,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shortData.source_label}
          </div>
        </div>

        {/* Screenshot Viewport */}
        {shortData.screenshot_image && (
          <div
            style={{
              width: '100%',
              height: 440,
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              borderBottom: '3px solid #e2e8f0',
            }}
          >
            <Img
              src={staticFile(shortData.screenshot_image)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                transform: `scale(${imgZoom})`,
              }}
            />
          </div>
        )}

        {/* Stats Pills + Takeaway */}
        <div style={{ padding: '22px 26px 26px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {shortData.pills.map((pill, i) => {
              const c = PILL_COLORS[pill.color] || PILL_COLORS.amber;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: c.bg,
                    color: c.fg,
                    border: `2px solid ${c.border}`,
                    fontSize: 24,
                    fontWeight: 800,
                    padding: '6px 16px',
                    borderRadius: 999,
                  }}
                >
                  {pill.text}
                </div>
              );
            })}
          </div>

          <div
            style={{
              backgroundColor: '#fef3c7',
              borderLeft: '6px solid #f59e0b',
              padding: '14px 18px',
              borderRadius: 12,
              fontSize: 27,
              fontWeight: 800,
              color: '#78350f',
              lineHeight: 1.35,
            }}
          >
            {shortData.takeaway}
          </div>
        </div>
      </div>

      {/* High-contrast Subtitle Box (safely above YT Shorts bottom UI) */}
      {activeSubtitle && (
        <div
          style={{
            position: 'absolute',
            top: 1185,
            left: 52,
            right: 110,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(30, 34, 70, 0.94)',
              color: '#ffffff',
              border: '3px solid #fbbf24',
              borderRadius: 20,
              padding: '16px 28px',
              fontSize: 40,
              fontWeight: 900,
              lineHeight: 1.32,
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(30, 34, 70, 0.28)',
            }}
          >
            {activeSubtitle}
          </div>
        </div>
      )}

      {/* Bottom Character + CTA Bubble (above YT bottom ~180px safe zone) */}
      <div
        style={{
          position: 'absolute',
          bottom: 185,
          left: 36,
          right: 110,
          height: 330,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
          zIndex: 15,
        }}
      >
        <Img
          src={staticFile(activeCharImg)}
          style={{
            width: 320,
            height: 320,
            objectFit: 'contain',
            transform: `translateY(${talkBounce}px)`,
            filter: 'drop-shadow(0 10px 18px rgba(30,34,70,0.22))',
          }}
        />

        <div
          style={{
            flex: 1,
            marginBottom: 42,
            backgroundColor: isCtaActive ? '#fbbf24' : '#ffffff',
            color: '#1e2246',
            border: '4px solid #1e2246',
            borderRadius: 24,
            padding: '18px 22px',
            boxShadow: '6px 6px 0 #1e2246',
            transform: isCtaActive ? `scale(${0.95 + ctaPop * 0.08})` : 'scale(1)',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: isCtaActive ? '#78350f' : '#6366f1', marginBottom: 4 }}>
            {isCtaActive ? '👇 完整版早報傳送門' : '💬 哈Gemi 重點劃線'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.3 }}>
            {shortData.cta_text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
