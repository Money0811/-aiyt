import React from 'react';
import { ChapterItem, NewsLayout } from '../components/NewsLayout';

const DEFAULT_CHAPTERS: ChapterItem[] = [
  { label: '開場', weight: 0.7 },
  { label: '1 AI數學突破', weight: 1.3 },
  { label: '2 開源模型發布', weight: 1.3 },
  { label: '3 算力額度調整', weight: 1.3 },
  { label: '4 權重正式開放', weight: 1.3 },
  { label: '5 評測新基準', weight: 1.3 },
  { label: '快訊 6 條', weight: 1 },
  { label: '片尾', weight: 0.6 },
];

export const PreviewCover: React.FC = () => {
  return (
    <NewsLayout
      dateText="11月22日 · 星期日"
      tagText="🔥 今日 AI 圈炸鍋"
      tagVariant="orange"
      characterImage="character/opening_normal.png"
      characterMode="normal"
      subtitle="早安！今天帶你 5 分鐘速覽 AI 圈五大重磅消息！"
      chapters={DEFAULT_CHAPTERS}
      activeChapterIndex={0}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 26,
            fontWeight: 800,
            color: '#d97706',
          }}
        >
          <span>⚡</span>
          <span>11月22日 AI 晨間頭條</span>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#181c3a',
            marginTop: 14,
            lineHeight: 1.18,
          }}
        >
          AI 挑戰世紀數學難題？！
        </div>

        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: '#475569',
            marginTop: 14,
          }}
        >
          數學家聲稱合作完成形式化，全球學界正進行獨立覆核
        </div>

        {/* Status Progress Bars (Matches Reference Image 1) */}
        <div
          style={{
            marginTop: 42,
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div
              style={{
                width: 200,
                fontSize: 28,
                fontWeight: 800,
                color: '#1e2246',
              }}
            >
              頭條焦點
            </div>
            <div
              style={{
                width: 310,
                height: 44,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #ef4444, #f97316)',
                border: '2.5px solid #252b59',
              }}
            />
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#dc2626',
              }}
            >
              聲稱完成 · 待獨立覆核
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div
              style={{
                width: 200,
                fontSize: 28,
                fontWeight: 800,
                color: '#1e2246',
              }}
            >
              模型動態
            </div>
            <div
              style={{
                width: 260,
                height: 44,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                border: '2.5px solid #252b59',
              }}
            />
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#d97706',
              }}
            >
              額度 +20% · 開放新權重
            </div>
          </div>
        </div>

        {/* Bottom Highlight Banner */}
        <div
          style={{
            marginTop: 'auto',
            backgroundColor: '#1f2a68',
            color: '#ffffff',
            borderRadius: 18,
            padding: '24px 32px',
            fontSize: 28,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 8px 20px rgba(31, 42, 104, 0.2)',
          }}
        >
          <span>🚀</span>
          <span>還有：開源 Mini 模型僅需 32G 顯存 · 新一代評測基準上線！</span>
        </div>
      </div>
    </NewsLayout>
  );
};

export const PreviewAgenda: React.FC = () => {
  const agendaItems = [
    {
      num: '01',
      tag: '學界震撼',
      title: '數學家聯手 AI 挑戰世紀難題，聲稱完成形式化證明',
      color: '#ef4444',
    },
    {
      num: '02',
      tag: '開源突破',
      title: 'Space 開放 Plus 版本，輕量 Mini 版僅需 32G 顯存',
      color: '#3b82f6',
    },
    {
      num: '03',
      tag: '算力更新',
      title: '開發者額度全面優化，週額度提升 20% 並重置計算',
      color: '#f59e0b',
    },
    {
      num: '04',
      tag: '模型權重',
      title: 'Inkling 正式開源權重，支援本地端高速推論部署',
      color: '#8b5cf6',
    },
    {
      num: '05',
      tag: '科學評測',
      title: 'OpenAI 發布全新藥物研發評測集，準確率創下新高',
      color: '#10b981',
    },
  ];

  return (
    <NewsLayout
      dateText="11月22日 · 星期日"
      progressBadge="今日目錄"
      headerTitle="5 大焦點 ＋ 6 條快訊"
      characterImage="character/opening_normal.png"
      characterMode="normal"
      subtitle="來看看今天早報為大家整理的五個核心重點吧！"
      chapters={DEFAULT_CHAPTERS}
      activeChapterIndex={0}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 900, color: '#181c3a' }}>
            📋 今日 AI 早報目錄
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b' }}>
            預計時長 04:30
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: 1,
          }}
        >
          {agendaItems.map((item) => (
            <div
              key={item.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                backgroundColor: '#f8fafc',
                border: '2px solid #cbd5e1',
                borderRadius: 16,
                padding: '16px 22px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#1f285e',
                  color: '#ffffff',
                  fontSize: 24,
                  fontWeight: 900,
                  width: 54,
                  height: 44,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.num}
              </div>

              <div
                style={{
                  backgroundColor: item.color,
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: 999,
                  flexShrink: 0,
                }}
              >
                {item.tag}
              </div>

              <div
                style={{
                  fontSize: 25,
                  fontWeight: 800,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.title}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 18,
            backgroundColor: '#eef2ff',
            border: '2px solid #818cf8',
            borderRadius: 14,
            padding: '14px 24px',
            fontSize: 22,
            fontWeight: 800,
            color: '#312e81',
          }}
        >
          ⚡ 文末加碼：6 條產業快訊（晶片產能、多模態新工具、最新融資消息）
        </div>
      </div>
    </NewsLayout>
  );
};

export const PreviewReport: React.FC = () => {
  return (
    <NewsLayout
      dateText="11.22 週日"
      progressBadge="第1條 / 共5條"
      headerTitle="AI 挑戰世紀數學難題"
      tagText="當事人聲稱"
      tagVariant="stamp"
      characterImage="character/chibi_think.png"
      characterMode="chibi"
      subtitle="數學家聲稱聯手 AI 解開世紀難題，目前已完成形式化"
      chapters={DEFAULT_CHAPTERS}
      activeChapterIndex={1}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#181c3a' }}>
          原文 3x 放大
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#64748b',
            marginTop: 4,
          }}
        >
          作者個人網頁聲明聚焦
        </div>

        {/* Evidence / Zoom Comparison Area (Matches Reference Image 2) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            marginTop: 28,
            flex: 1,
          }}
        >
          {/* Left Mockup of Original Page */}
          <div
            style={{
              width: 460,
              height: 360,
              backgroundColor: '#9ca3af',
              borderRadius: 16,
              border: '2.5px solid #475569',
              padding: 22,
              boxSizing: 'border-box',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              color: '#1f2937',
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            <div style={{ opacity: 0.55 }}>
              The Riemann Hypothesis is the classic problem in number theory. It
              asks for tight bounds on the count of prime numbers of a given
              size...
            </div>
            <div
              style={{
                marginTop: 14,
                backgroundColor: '#ffffff',
                border: '3px solid #f97316',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 16,
                fontWeight: 700,
                color: '#111827',
                boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
              }}
            >
              「與 AI 合作完成了形式化證明，已將完整驗證代碼公開於個人主頁。」
            </div>
            <div style={{ opacity: 0.55, marginTop: 14 }}>
              ...its many rhymes and reflections, across physics, taught us the
              unity of our fields.
            </div>
          </div>

          {/* Right 3x Zoom Callout Box */}
          <div
            style={{
              flex: 1,
              height: 340,
              backgroundColor: '#ffffff',
              borderRadius: 20,
              border: '3px solid #f97316',
              boxShadow: '0 10px 26px rgba(249, 115, 22, 0.14)',
              padding: '28px 30px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -22,
                left: 24,
                background: 'linear-gradient(90deg, #f97316, #fb923c)',
                color: '#ffffff',
                fontSize: 22,
                fontWeight: 900,
                padding: '6px 20px',
                borderRadius: 999,
                boxShadow: '0 4px 10px rgba(249, 115, 22, 0.25)',
              }}
            >
              🔍 當事人聲明原文
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#1e293b',
                lineHeight: 1.65,
              }}
            >
              數學家 Levent Alpoge 在個人網頁指出：
              <br />
              <span style={{ color: '#ea580c' }}>
                「與 AI 協作找到了廣義版本的證明思路，並已完成 Lean 形式化驗證。」
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Highlighted Conclusion Box */}
        <div
          style={{
            marginTop: 26,
            backgroundColor: '#f1f5f9',
            border: '2px solid #334155',
            borderRadius: 16,
            padding: '18px 28px',
            fontSize: 28,
            fontWeight: 800,
            color: '#181c3a',
          }}
        >
          <span
            style={{
              background:
                'linear-gradient(180deg, transparent 58%, #fde047 58%)',
              padding: '0 6px',
            }}
          >
            作者聲稱已完成形式化 · 但論文與證明尚待數學界獨立審核
          </span>
        </div>
      </div>
    </NewsLayout>
  );
};
