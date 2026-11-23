import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

export interface ChapterItem {
  label: string;
  weight?: number;
}

export interface NewsLayoutProps {
  channelName?: string;
  dateText: string;
  progressBadge?: string;
  headerTitle?: string;
  tagText?: string;
  tagVariant?: 'orange' | 'stamp';
  characterImage: string;
  characterClosedImage?: string;
  isMouthOpen?: boolean;
  characterMode: 'normal' | 'chibi';
  cardTheme?: 'light' | 'dark';
  subtitle: string;
  chapters: ChapterItem[];
  activeChapterIndex: number;
  children: React.ReactNode;
}

const FONT_FAMILY =
  '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Segoe UI", sans-serif';

export const NewsLayout: React.FC<NewsLayoutProps> = ({
  channelName = '哈Gemi早報',
  dateText,
  progressBadge,
  headerTitle,
  tagText,
  tagVariant = 'orange',
  characterImage,
  characterClosedImage,
  isMouthOpen = true,
  characterMode,
  cardTheme = 'light',
  subtitle,
  chapters,
  activeChapterIndex,
  children,
}) => {
  const activeCharImg =
    !isMouthOpen && characterClosedImage ? characterClosedImage : characterImage;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        background:
          'linear-gradient(135deg, #efe7ff 0%, #f8f5ff 42%, #e6eeff 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Subtle decorative sparkles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(167,139,250,0.18) 0%, transparent 28%), radial-gradient(circle at 86% 24%, rgba(96,165,250,0.16) 0%, transparent 30%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Bar */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 56,
          right: 56,
          height: 68,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 28,
              fontWeight: 900,
              color: '#1e2246',
              letterSpacing: 0.5,
            }}
          >
            <span style={{ color: '#f59e0b' }}>✦</span>
            <span>{channelName}</span>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#5b6085',
              marginLeft: 32,
              marginTop: 2,
            }}
          >
            {dateText}
          </div>
        </div>

        {progressBadge && (
          <div
            style={{
              backgroundColor: '#1f285e',
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 800,
              padding: '8px 22px',
              borderRadius: 999,
              boxShadow: '0 4px 10px rgba(31, 40, 94, 0.18)',
            }}
          >
            {progressBadge}
          </div>
        )}

        {headerTitle && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#181c3a',
              letterSpacing: 0.5,
            }}
          >
            {headerTitle}
          </div>
        )}

        {tagText && tagVariant === 'orange' && (
          <div
            style={{
              background: 'linear-gradient(90deg, #f97316, #ea580c)',
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 800,
              padding: '8px 24px',
              borderRadius: 999,
              border: '2px solid #2b2d5c',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
            }}
          >
            {tagText}
          </div>
        )}

        {tagText && tagVariant === 'stamp' && (
          <div
            style={{
              color: '#dc2626',
              fontSize: 24,
              fontWeight: 900,
              padding: '4px 16px',
              border: '3px solid #dc2626',
              borderRadius: 8,
              transform: 'rotate(-5deg)',
              backgroundColor: 'rgba(255,255,255,0.75)',
              letterSpacing: 1,
            }}
          >
            {tagText}
          </div>
        )}
      </div>

      {/* Main Presentation Card (Left Side) */}
      <div
        style={{
          position: 'absolute',
          top: 118,
          left: 56,
          width: 1210,
          height: 755,
          backgroundColor: cardTheme === 'dark' ? '#121826' : '#ffffff',
          borderRadius: 26,
          border:
            cardTheme === 'dark'
              ? '2.5px solid #1e293b'
              : '2.5px solid #252b59',
          borderTop:
            cardTheme === 'dark' ? '6px solid #10b981' : '8px solid #f97316',
          boxShadow: '0 14px 36px rgba(37, 43, 89, 0.16)',
          backgroundImage:
            cardTheme === 'dark'
              ? 'none'
              : 'repeating-linear-gradient(to bottom, transparent, transparent 47px, rgba(148, 163, 184, 0.14) 48px)',
          padding: cardTheme === 'dark' ? '28px 46px 38px' : '38px 46px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 5,
        }}
      >
        {children}
      </div>

      {/* Anchor Character (Right Side) */}
      <div
        style={{
          position: 'absolute',
          right: characterMode === 'normal' ? 18 : 28,
          bottom: 42,
          width: characterMode === 'normal' ? 660 : 590,
          height: characterMode === 'normal' ? 920 : 820,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 8,
          pointerEvents: 'none',
        }}
      >
        <Img
          src={staticFile(activeCharImg)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 12px 24px rgba(30, 34, 70, 0.16))',
          }}
        />
      </div>

      {/* Subtitle Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 62,
          left: 60,
          right: 520,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.3,
            textShadow:
              '-2px -2px 0 #181c3a, 2px -2px 0 #181c3a, -2px 2px 0 #181c3a, 2px 2px 0 #181c3a, 0 4px 10px rgba(0,0,0,0.45)',
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Bottom Chapter Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 44,
          backgroundColor: 'rgba(23, 27, 56, 0.88)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 6,
          zIndex: 30,
        }}
      >
        {chapters.map((ch, idx) => {
          const isActive = idx === activeChapterIndex;
          const isPast = idx < activeChapterIndex;
          return (
            <div
              key={ch.label}
              style={{
                flex: ch.weight ?? 1,
                height: 30,
                borderRadius: 6,
                backgroundColor: isActive
                  ? '#fef3c7'
                  : isPast
                    ? 'rgba(255,255,255,0.22)'
                    : 'rgba(255,255,255,0.08)',
                color: isActive ? '#b45309' : '#e2e8f0',
                fontSize: 16,
                fontWeight: isActive ? 900 : 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: isActive ? '2px solid #f59e0b' : '1px solid transparent',
              }}
            >
              {ch.label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
