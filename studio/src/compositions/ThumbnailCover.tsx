import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { BriefingData } from './MorningBriefing';

const FONT_FAMILY =
  '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Segoe UI", sans-serif';

export interface ThumbnailCoverProps {
  briefing: BriefingData | null;
}

export const ThumbnailCover: React.FC<ThumbnailCoverProps> = ({ briefing }) => {
  if (!briefing) return null;

  const c = briefing.cover;
  const col1 = briefing.columns[0];
  const col2 = briefing.columns[1];
  const col3 = briefing.columns[2];

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        backgroundColor: '#22d3ee',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Pop-art diagonal color blocks */}
      <div
        style={{
          position: 'absolute',
          left: -120,
          top: -80,
          width: 980,
          height: 1300,
          backgroundColor: '#fde047',
          transform: 'rotate(11deg)',
          borderRight: '8px solid #111827',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 840,
          top: -120,
          width: 480,
          height: 1350,
          backgroundColor: '#fb7185',
          transform: 'rotate(11deg)',
          borderRight: '8px solid #111827',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -120,
          top: -120,
          width: 780,
          height: 1350,
          backgroundColor: '#22d3ee',
          transform: 'rotate(11deg)',
        }}
      />

      {/* Subtle comic halftone dot overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(17, 24, 39, 0.08) 2px, transparent 2px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }}
      />

      {/* Top Pills */}
      <div
        style={{
          position: 'absolute',
          top: 42,
          left: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: '#111827',
            color: '#fde047',
            fontSize: 34,
            fontWeight: 900,
            padding: '12px 28px',
            borderRadius: 999,
            border: '4px solid #ffffff',
            boxShadow: '4px 5px 0 #111827',
          }}
        >
          ✦ {briefing.channel_name}
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            color: '#111827',
            fontSize: 32,
            fontWeight: 900,
            padding: '12px 26px',
            borderRadius: 999,
            border: '4px solid #111827',
            boxShadow: '4px 5px 0 #111827',
          }}
        >
          {briefing.date.slice(5).replace('-', '月')}日
        </div>
        <div
          style={{
            backgroundColor: '#f43f5e',
            color: '#ffffff',
            fontSize: 30,
            fontWeight: 900,
            padding: '12px 26px',
            borderRadius: 999,
            border: '4px solid #111827',
            boxShadow: '4px 5px 0 #111827',
            marginLeft: 24,
          }}
        >
          {c.tag}
        </div>
      </div>

      {/* Main Tilted Headline Stack */}
      <div
        style={{
          position: 'absolute',
          top: 155,
          left: 56,
          width: 1120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 22,
          transform: 'rotate(-2deg)',
          zIndex: 15,
        }}
      >
        {/* Main Giant Black Box */}
        <div
          style={{
            backgroundColor: '#111827',
            color: '#fde047',
            fontSize: 78,
            fontWeight: 900,
            padding: '22px 38px',
            borderRadius: 22,
            border: '5px solid #ffffff',
            boxShadow: '10px 12px 0 #111827',
            lineHeight: 1.15,
          }}
        >
          {c.headline}
        </div>

        {/* Second Cyan Box */}
        <div
          style={{
            backgroundColor: '#22d3ee',
            color: '#111827',
            fontSize: 54,
            fontWeight: 900,
            padding: '16px 34px',
            borderRadius: 18,
            border: '5px solid #111827',
            boxShadow: '8px 10px 0 #111827',
          }}
        >
          {col2 ? col2.header_title : 'Anthropic 正式上市推 5.2'}
        </div>

        {/* Third Pink Box */}
        <div
          style={{
            backgroundColor: '#f43f5e',
            color: '#ffffff',
            fontSize: 50,
            fontWeight: 900,
            padding: '16px 34px',
            borderRadius: 18,
            border: '5px solid #111827',
            boxShadow: '8px 10px 0 #111827',
          }}
        >
          {col3 ? col3.header_title : 'Signal 封鎖手機截圖防 AI！'}
        </div>

        {/* Fourth White Ticker Strip */}
        <div
          style={{
            backgroundColor: '#ffffff',
            color: '#111827',
            fontSize: 32,
            fontWeight: 900,
            padding: '12px 28px',
            borderRadius: 14,
            border: '4px solid #111827',
            boxShadow: '6px 8px 0 #111827',
          }}
        >
          5.4G 跑 Inkling-2-Mini · LLM 無梯度改寫權重 · {briefing.flash_news.length} 條快訊
        </div>
      </div>

      {/* Bottom Left Compact Progress Bars Card */}
      <div
        style={{
          position: 'absolute',
          bottom: 42,
          left: 56,
          width: 960,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          border: '5px solid #111827',
          borderRadius: 22,
          padding: '20px 28px',
          boxShadow: '8px 10px 0 #111827',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          zIndex: 15,
        }}
      >
        {[
          {
            label: col1 ? '黎曼驗證' : '頭條 1',
            color: '#f43f5e',
            width: 390,
            text: 'HN 1,084 分熱議',
          },
          {
            label: 'Anthropic',
            color: '#f59e0b',
            width: 330,
            text: 'IPO 上市 ＋ 5.2',
          },
          {
            label: '本地量化',
            color: '#3b82f6',
            width: 280,
            text: '5.4G 即可運行',
          },
        ].map((row) => (
          <div
            key={row.label}
            style={{ display: 'flex', alignItems: 'center', gap: 20 }}
          >
            <div
              style={{
                width: 150,
                fontSize: 28,
                fontWeight: 900,
                color: '#111827',
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                width: row.width,
                height: 34,
                backgroundColor: row.color,
                borderRadius: 999,
                border: '3.5px solid #111827',
              }}
            />
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#111827',
              }}
            >
              {row.text}
            </div>
          </div>
        ))}
      </div>

      {/* Right Side Character */}
      <div
        style={{
          position: 'absolute',
          right: -10,
          bottom: -20,
          width: 740,
          height: 1030,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <Img
          src={staticFile('character/opening_normal.png')}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(-6px 10px 0 rgba(17, 24, 39, 0.35))',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
