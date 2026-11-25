import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FONT_FAMILY =
  '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Segoe UI", sans-serif';

export const CodeDocMvp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerEnter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const boxEnter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 15, stiffness: 130 } });
  const nodeEnter = spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 14, stiffness: 120 } });
  const charBounce = Math.sin(frame * 0.16) * 4;
  const lineProgress = interpolate(frame, [24, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        backgroundColor: '#09141c',
        color: '#f8fafc',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Subtle 48px tech grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      {/* Ambient radial vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 55% 42%, rgba(34, 211, 238, 0.06) 0%, rgba(9, 20, 28, 0.72) 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top-right Watermark */}
      <div
        style={{
          position: 'absolute',
          top: 42,
          right: 54,
          fontSize: 24,
          fontWeight: 600,
          color: 'rgba(203, 213, 225, 0.55)',
          letterSpacing: 1,
        }}
      >
        開源逆襲戰 · v2
      </div>

      {/* Main Content Area (Right of character) */}
      <div
        style={{
          position: 'absolute',
          top: 112,
          left: 560,
          right: 96,
        }}
      >
        {/* Minimalist Heading + Thin Divider */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: '#e2e8f0',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * 14}px)`,
          }}
        >
          先看這場逆襲的起點
        </div>
        <div
          style={{
            marginTop: 18,
            height: 2,
            width: '100%',
            backgroundColor: 'rgba(148, 163, 184, 0.25)',
          }}
        />

        {/* Wireframe Focus Box + Question Mark */}
        <div
          style={{
            marginTop: 38,
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            opacity: boxEnter,
            transform: `scale(${0.96 + boxEnter * 0.04})`,
          }}
        >
          <div
            style={{
              flex: 1,
              border: '3px solid #f1f5f9',
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              padding: '30px 38px',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 24, color: '#94a3b8', fontWeight: 600, marginBottom: 14 }}>
              2023 年 3 月 · 一場意外的權重外洩
            </div>
            <div style={{ fontSize: 54, fontWeight: 900, color: '#ffffff', lineHeight: 1.25 }}>
              用消費級顯卡
            </div>
            <div style={{ fontSize: 54, fontWeight: 900, color: '#22d3ee', lineHeight: 1.25 }}>
              跑起本地大模型
            </div>
            <div style={{ fontSize: 26, color: '#cbd5e1', fontWeight: 600, marginTop: 16 }}>
              llama.cpp 一週內落地 · 打破萬卡算力壟斷
            </div>
          </div>

          <div
            style={{
              fontSize: 104,
              fontWeight: 900,
              color: '#fbbf24',
              textShadow: '0 0 24px rgba(251, 191, 36, 0.3)',
            }}
          >
            ?
          </div>
        </div>

        {/* SVG Geometric Node + Connection Animation */}
        <div
          style={{
            marginTop: 44,
            display: 'flex',
            alignItems: 'center',
            opacity: nodeEnter,
            transform: `translateY(${(1 - nodeEnter) * 16}px)`,
          }}
        >
          <div
            style={{
              border: '3px solid #22d3ee',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              padding: '20px 44px',
              position: 'relative',
              minWidth: 320,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 38, fontWeight: 900, color: '#22d3ee' }}>
              從零開始
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#cbd5e1', marginTop: 4 }}>
              4-bit 量化突破
            </div>
            {/* Decorative corner yellow dot */}
            <div
              style={{
                position: 'absolute',
                bottom: -9,
                left: 24,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#fbbf24',
              }}
            />
          </div>

          {/* Animated SVG connector */}
          <svg width="260" height="60" viewBox="0 0 260 60" style={{ overflow: 'visible' }}>
            <line
              x1="0"
              y1="30"
              x2={180 * lineProgress}
              y2="30"
              stroke="#64748b"
              strokeWidth="3"
              strokeDasharray="8 6"
            />
            {lineProgress > 0.35 && (
              <>
                <line x1="78" y1="20" x2="96" y2="38" stroke="#f87171" strokeWidth="4" />
                <line x1="96" y1="20" x2="78" y2="38" stroke="#f87171" strokeWidth="4" />
              </>
            )}
            {lineProgress > 0.7 && (
              <circle cx="180" cy="30" r="10" fill="#fbbf24" />
            )}
          </svg>
        </div>
      </div>

      {/* Bottom-left Pixelated Character Sprite */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          bottom: 54,
          width: 380,
          height: 680,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <Img
          src={staticFile('models/deepseek/pixel.png')}
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            transform: `translateY(${charBounce}px)`,
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))',
          }}
        />
      </div>

      {/* Bottom Translucent Subtitle Bar */}
      <div
        style={{
          position: 'absolute',
          left: 520,
          right: 72,
          bottom: 46,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          border: '1.5px solid rgba(148, 163, 184, 0.22)',
          borderRadius: 14,
          padding: '18px 34px',
          textAlign: 'center',
          zIndex: 30,
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
          其實也不奇怪，原來不需要萬卡集群，家裡的顯卡也能跑起大模型！
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, color: '#94a3b8', marginTop: 4 }}>
          Open-source AI started from consumer hardware breakthroughs.
        </div>
      </div>
    </AbsoluteFill>
  );
};
