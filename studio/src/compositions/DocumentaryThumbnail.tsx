import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

const FONT_FAMILY =
  '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Segoe UI", sans-serif';

export const DocumentaryThumbnail: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        backgroundColor: '#071017',
        color: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Tech Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Dramatic Split Glow: Crimson left vs Cyan right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 22% 45%, rgba(239, 68, 68, 0.24) 0%, transparent 48%), radial-gradient(circle at 78% 52%, rgba(34, 211, 238, 0.26) 0%, transparent 50%)',
        }}
      />

      {/* Left Typography Block */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 66,
          width: 660,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            border: '2px solid #22d3ee',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            color: '#22d3ee',
            fontSize: 28,
            fontWeight: 900,
            padding: '8px 22px',
            letterSpacing: 1.5,
          }}
        >
          2022–2026 開源 vs 閉源
        </div>

        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1.08,
            color: '#ffffff',
            textShadow: '0 8px 24px rgba(0,0,0,0.8)',
          }}
        >
          從絕望差距
        </div>

        <div
          style={{
            fontSize: 98,
            fontWeight: 900,
            lineHeight: 1.08,
            color: '#fbbf24',
            textShadow: '0 8px 28px rgba(251, 191, 36, 0.35)',
          }}
        >
          到掀翻牌桌！
        </div>

        {/* Contrast Bar */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            border: '2px solid rgba(226, 232, 240, 0.6)',
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            padding: '16px 24px',
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 900, color: '#f87171' }}>
            GPT / Claude
          </span>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#94a3b8' }}>
            VS
          </span>
          <span style={{ fontSize: 30, fontWeight: 900, color: '#22d3ee' }}>
            Llama · Qwen · DeepSeek
          </span>
        </div>
      </div>

      {/* Right Pixel Chibi Trio */}
      <div
        style={{
          position: 'absolute',
          right: 24,
          bottom: 16,
          width: 560,
          height: 640,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 15,
        }}
      >
        {/* Qwen (Back Left) */}
        <Img
          src={staticFile('models/qwen/chibi_front.png')}
          style={{
            position: 'absolute',
            left: 0,
            bottom: 24,
            height: 450,
            width: 'auto',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.75))',
          }}
        />
        {/* Llama (Back Right) */}
        <Img
          src={staticFile('models/llama/chibi_front.png')}
          style={{
            position: 'absolute',
            right: 4,
            bottom: 24,
            height: 450,
            width: 'auto',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.75))',
          }}
        />
        {/* DeepSeek (Center Front) */}
        <Img
          src={staticFile('models/deepseek/chibi_front.png')}
          style={{
            position: 'relative',
            zIndex: 10,
            height: 540,
            width: 'auto',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 16px 32px rgba(34, 211, 238, 0.35))',
          }}
        />
      </div>

      {/* Bottom Right Subtle Badge */}
      <div
        style={{
          position: 'absolute',
          right: 36,
          top: 32,
          fontSize: 22,
          fontWeight: 700,
          color: 'rgba(203, 213, 225, 0.7)',
          letterSpacing: 1,
        }}
      >
        五年競爭全紀錄 · 哈Gemi主講
      </div>
    </AbsoluteFill>
  );
};
