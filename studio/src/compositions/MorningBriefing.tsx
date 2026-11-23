import React from 'react';
import {
  Audio,
  Img,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ChapterItem, NewsLayout } from '../components/NewsLayout';

export interface SubtitleCue {
  text: string;
  start_frame: number;
  end_frame: number;
}

export interface SegmentTiming {
  id: string;
  audio_file: string;
  duration_sec: number;
  duration_frames: number;
  subtitles: SubtitleCue[];
  mouth_open?: number[];
}

export interface TimelineData {
  fps: number;
  voice: string;
  segments: Record<string, SegmentTiming>;
}

export interface ColumnData {
  index: number;
  chapter_label: string;
  header_title: string;
  tag_text: string;
  tag_variant: 'orange' | 'stamp';
  card_type:
    | 'evidence_zoom'
    | 'quote_verdict'
    | 'screenshot_bullets'
    | 'terminal_dark'
    | 'summary';
  card_title: string;
  card_subtitle: string;
  screenshot_image?: string;
  source_snippet?: string;
  zoom_label?: string;
  zoom_content?: string;
  category_pill?: string;
  stamp_text?: string;
  verdict_text?: string;
  mini_stamp?: string;
  terminal_box_text?: string;
  pills?: { text: string; color: string }[];
  bullets?: string[];
  conclusion?: string;
  character_image: string;
  character_closed_image?: string;
  character_mode: 'normal' | 'chibi';
  script: string;
}

export interface FlashItem {
  num: number;
  title: string;
  source: string;
}

export interface BriefingData {
  date: string;
  date_display: string;
  date_short: string;
  channel_name: string;
  cover: {
    badge: string;
    tag: string;
    headline: string;
    subheadline: string;
    bars: { label: string; color: string; status: string }[];
    banner: string;
    character_image: string;
    character_closed_image?: string;
    character_mode: 'normal' | 'chibi';
    script: string;
  };
  agenda: {
    progress_badge: string;
    header_title: string;
    estimated_duration: string;
    character_image: string;
    character_closed_image?: string;
    character_mode: 'normal' | 'chibi';
    script: string;
  };
  columns: ColumnData[];
  flash_news: FlashItem[];
  flash_script: string;
  outro: {
    character_image: string;
    character_closed_image?: string;
    character_mode: 'normal' | 'chibi';
    script: string;
  };
}

export interface MorningBriefingProps {
  briefing: BriefingData | null;
  timeline: TimelineData | null;
}

function getActiveSubtitle(subtitles: SubtitleCue[], frame: number): string {
  if (subtitles.length === 0) return '';
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

function getMouthOpen(timing: SegmentTiming, frame: number): boolean {
  if (!timing.mouth_open || timing.mouth_open.length === 0) return true;
  const clamped = Math.min(frame, timing.mouth_open.length - 1);
  return timing.mouth_open[clamped] === 1;
}

const AnimatedCardBody: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const translateY = interpolate(progress, [0, 1], [18, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      {children}
    </div>
  );
};

const CoverSegment: React.FC<{
  briefing: BriefingData;
  timing: SegmentTiming;
  chapters: ChapterItem[];
}> = ({ briefing, timing, chapters }) => {
  const frame = useCurrentFrame();
  const c = briefing.cover;

  return (
    <>
      <Audio src={staticFile(timing.audio_file)} />
      <NewsLayout
        channelName={briefing.channel_name}
        dateText={briefing.date_display}
        tagText={c.tag}
        tagVariant="orange"
        characterImage={c.character_image}
        characterClosedImage={c.character_closed_image}
        isMouthOpen={getMouthOpen(timing, frame)}
        characterMode={c.character_mode}
        subtitle={getActiveSubtitle(timing.subtitles, frame)}
        chapters={chapters}
        activeChapterIndex={0}
      >
        <AnimatedCardBody>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706' }}>
            {c.badge}
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 900,
              color: '#181c3a',
              marginTop: 14,
              lineHeight: 1.18,
            }}
          >
            {c.headline}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: '#475569',
              marginTop: 14,
              lineHeight: 1.4,
            }}
          >
            {c.subheadline}
          </div>
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {c.bars.map((bar) => (
              <div
                key={bar.label}
                style={{ display: 'flex', alignItems: 'center', gap: 24 }}
              >
                <div
                  style={{
                    width: 180,
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#1e2246',
                  }}
                >
                  {bar.label}
                </div>
                <div
                  style={{
                    width: bar.color === 'red' ? 300 : 250,
                    height: 42,
                    borderRadius: 999,
                    background:
                      bar.color === 'red'
                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                        : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    border: '2.5px solid #252b59',
                  }}
                />
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: bar.color === 'red' ? '#dc2626' : '#d97706',
                  }}
                >
                  {bar.status}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 'auto',
              backgroundColor: '#1f2a68',
              color: '#ffffff',
              borderRadius: 18,
              padding: '22px 30px',
              fontSize: 27,
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(31, 42, 104, 0.2)',
            }}
          >
            {c.banner}
          </div>
        </AnimatedCardBody>
      </NewsLayout>
    </>
  );
};

const AgendaSegment: React.FC<{
  briefing: BriefingData;
  timing: SegmentTiming;
  chapters: ChapterItem[];
}> = ({ briefing, timing, chapters }) => {
  const frame = useCurrentFrame();
  const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

  return (
    <>
      <Audio src={staticFile(timing.audio_file)} />
      <NewsLayout
        channelName={briefing.channel_name}
        dateText={briefing.date_display}
        progressBadge={briefing.agenda.progress_badge}
        headerTitle={briefing.agenda.header_title}
        characterImage={briefing.agenda.character_image}
        characterClosedImage={briefing.agenda.character_closed_image}
        isMouthOpen={getMouthOpen(timing, frame)}
        characterMode={briefing.agenda.character_mode}
        subtitle={getActiveSubtitle(timing.subtitles, frame)}
        chapters={chapters}
        activeChapterIndex={0}
      >
        <AnimatedCardBody>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 900, color: '#181c3a' }}>
              📋 今日 AI 早報目錄
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b' }}>
              預計時長 {briefing.agenda.estimated_duration}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 15,
              flex: 1,
            }}
          >
            {briefing.columns.map((col, idx) => (
              <div
                key={col.index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  backgroundColor: '#f8fafc',
                  border: '2px solid #cbd5e1',
                  borderRadius: 16,
                  padding: '15px 20px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#1f285e',
                    color: '#ffffff',
                    fontSize: 22,
                    fontWeight: 900,
                    width: 50,
                    height: 42,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  0{col.index}
                </div>
                <div
                  style={{
                    backgroundColor: colors[idx % colors.length],
                    color: '#ffffff',
                    fontSize: 17,
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                >
                  {col.tag_text}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {col.header_title}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              backgroundColor: '#eef2ff',
              border: '2px solid #818cf8',
              borderRadius: 14,
              padding: '14px 22px',
              fontSize: 21,
              fontWeight: 800,
              color: '#312e81',
            }}
          >
            ⚡ 文末加碼：{briefing.flash_news.length} 條產業與開源快訊速覽
          </div>
        </AnimatedCardBody>
      </NewsLayout>
    </>
  );
};

const ColumnSegment: React.FC<{
  briefing: BriefingData;
  col: ColumnData;
  timing: SegmentTiming;
  chapters: ChapterItem[];
}> = ({ briefing, col, timing, chapters }) => {
  const frame = useCurrentFrame();
  const isDark = col.card_type === 'terminal_dark';

  const renderCardBody = () => {
    if (col.card_type === 'quote_verdict') {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            gap: 28,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div
              style={{
                background: 'linear-gradient(90deg, #ea580c, #f97316)',
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 900,
                padding: '10px 26px',
                borderRadius: 999,
              }}
            >
              {col.category_pill || '🔥 重磅焦點'}
            </div>
            {col.stamp_text && (
              <div
                style={{
                  color: '#dc2626',
                  fontSize: 32,
                  fontWeight: 900,
                  padding: '6px 22px',
                  border: '4px solid #dc2626',
                  borderRadius: 12,
                  transform: 'rotate(-8deg)',
                  backgroundColor: 'rgba(255,255,255,0.88)',
                }}
              >
                {col.stamp_text}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#1e2246',
              lineHeight: 1.2,
            }}
          >
            {col.card_title}
          </div>

          <div style={{ fontSize: 28, fontWeight: 700, color: '#64748b' }}>
            {col.card_subtitle}
          </div>

          <div
            style={{
              marginTop: 12,
              backgroundColor: '#f1f5f9',
              border: '2.5px solid #94a3b8',
              borderRadius: 20,
              padding: '24px 32px',
              fontSize: 30,
              fontWeight: 800,
              color: '#ea580c',
            }}
          >
            {col.verdict_text || col.conclusion}
          </div>
        </div>
      );
    }

    if (col.card_type === 'terminal_dark') {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Mac window dots */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#ef4444',
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
          </div>

          {/* Watermark index */}
          <div
            style={{
              position: 'absolute',
              right: 20,
              top: 10,
              fontSize: 160,
              fontWeight: 900,
              color: 'rgba(255,255,255,0.04)',
              lineHeight: 1,
              pointerEvents: 'none',
            }}
          >
            0{col.index}
          </div>

          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.25,
            }}
          >
            {col.card_title}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: '#94a3b8',
              marginTop: 10,
            }}
          >
            {col.card_subtitle}
          </div>

          <div
            style={{
              marginTop: 42,
              border: '2.5px solid #10b981',
              borderRadius: 20,
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              padding: '38px 34px',
              fontSize: 32,
              fontWeight: 800,
              color: '#ecfdf5',
              lineHeight: 1.45,
            }}
          >
            {col.terminal_box_text}
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 'auto' }}>
            {(col.pills || []).map((pill) => (
              <div
                key={pill.text}
                style={{
                  backgroundColor:
                    pill.color === 'amber' ? '#f59e0b' : '#3b82f6',
                  color: pill.color === 'amber' ? '#1e293b' : '#ffffff',
                  fontSize: 24,
                  fontWeight: 900,
                  padding: '12px 28px',
                  borderRadius: 999,
                }}
              >
                {pill.text}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (col.card_type === 'screenshot_bullets') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#181c3a' }}>
            {col.card_title}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#64748b',
              marginTop: 6,
            }}
          >
            {col.card_subtitle}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 28,
              marginTop: 28,
              flex: 1,
              alignItems: 'center',
            }}
          >
            {/* Left Real Screenshot */}
            <div
              style={{
                width: 540,
                height: 410,
                borderRadius: 18,
                border: '2.5px solid #94a3b8',
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
                boxShadow: '0 8px 20px rgba(30, 41, 59, 0.12)',
                flexShrink: 0,
              }}
            >
              {col.screenshot_image ? (
                <Img
                  src={staticFile(col.screenshot_image)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top center',
                  }}
                />
              ) : (
                <div style={{ padding: 24, fontSize: 20 }}>網頁截圖載入中</div>
              )}
            </div>

            {/* Right 3 Stacked Pills */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                position: 'relative',
              }}
            >
              {(col.bullets || []).map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: idx === 0 ? '#ea580c' : '#f8fafc',
                    color: idx === 0 ? '#ffffff' : '#1e293b',
                    border:
                      idx === 0 ? '2.5px solid #c2410c' : '2.5px solid #94a3b8',
                    borderRadius: 18,
                    padding: '22px 24px',
                    fontSize: 24,
                    fontWeight: 800,
                    lineHeight: 1.4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  {b}
                </div>
              ))}
              {col.mini_stamp && (
                <div
                  style={{
                    alignSelf: 'flex-end',
                    marginTop: 4,
                    color: '#dc2626',
                    fontSize: 22,
                    fontWeight: 900,
                    padding: '4px 14px',
                    border: '3px solid #dc2626',
                    borderRadius: 8,
                    transform: 'rotate(-6deg)',
                  }}
                >
                  {col.mini_stamp}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default: evidence_zoom with real screenshot + 3x zoom callout
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 42, fontWeight: 900, color: '#181c3a' }}>
          {col.card_title}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#64748b',
            marginTop: 6,
          }}
        >
          {col.card_subtitle}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            marginTop: 26,
            flex: 1,
          }}
        >
          {/* Left Real Webpage Screenshot with orange focus frame */}
          <div
            style={{
              width: 460,
              height: 360,
              backgroundColor: '#cbd5e1',
              borderRadius: 16,
              border: '3px solid #475569',
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {col.screenshot_image ? (
              <Img
                src={staticFile(col.screenshot_image)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  filter: 'brightness(0.88)',
                }}
              />
            ) : null}
            <div
              style={{
                position: 'absolute',
                left: 18,
                right: 18,
                bottom: 22,
                backgroundColor: 'rgba(255,255,255,0.94)',
                border: '3px solid #f97316',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 16,
                fontWeight: 800,
                color: '#111827',
                boxShadow: '0 6px 14px rgba(0,0,0,0.2)',
              }}
            >
              {col.source_snippet}
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
              }}
            >
              {col.zoom_label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#1e293b',
                lineHeight: 1.65,
              }}
            >
              {col.zoom_content}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            backgroundColor: '#f1f5f9',
            border: '2px solid #334155',
            borderRadius: 16,
            padding: '16px 26px',
            fontSize: 26,
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
            {col.conclusion}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Audio src={staticFile(timing.audio_file)} />
      <NewsLayout
        channelName={briefing.channel_name}
        dateText={briefing.date_short}
        progressBadge={`第${col.index}條 / 共${briefing.columns.length}條`}
        headerTitle={col.header_title}
        tagText={col.tag_text}
        tagVariant={col.tag_variant}
        characterImage={col.character_image}
        characterClosedImage={col.character_closed_image}
        isMouthOpen={getMouthOpen(timing, frame)}
        characterMode={col.character_mode}
        cardTheme={isDark ? 'dark' : 'light'}
        subtitle={getActiveSubtitle(timing.subtitles, frame)}
        chapters={chapters}
        activeChapterIndex={col.index}
      >
        <AnimatedCardBody>{renderCardBody()}</AnimatedCardBody>
      </NewsLayout>
    </>
  );
};

const FlashSegment: React.FC<{
  briefing: BriefingData;
  timing: SegmentTiming;
  chapters: ChapterItem[];
}> = ({ briefing, timing, chapters }) => {
  const frame = useCurrentFrame();

  return (
    <>
      <Audio src={staticFile(timing.audio_file)} />
      <NewsLayout
        channelName={briefing.channel_name}
        dateText={briefing.date_short}
        progressBadge="快訊速覽"
        headerTitle={`今日 ${briefing.flash_news.length} 條產業快訊`}
        tagText="⚡ 1分鐘掃描"
        tagVariant="orange"
        characterImage="character/chibi_explain.png"
        characterClosedImage="character/chibi_explain_closed.png"
        isMouthOpen={getMouthOpen(timing, frame)}
        characterMode="chibi"
        subtitle={getActiveSubtitle(timing.subtitles, frame)}
        chapters={chapters}
        activeChapterIndex={briefing.columns.length + 1}
      >
        <AnimatedCardBody>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {briefing.flash_news.map((item) => (
              <div
                key={item.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  backgroundColor: '#f8fafc',
                  border: '2px solid #cbd5e1',
                  borderRadius: 14,
                  padding: '14px 20px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#f97316',
                    color: '#ffffff',
                    fontSize: 20,
                    fontWeight: 900,
                    width: 40,
                    height: 36,
                    borderRadius: 8,
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
                    fontSize: 23,
                    fontWeight: 800,
                    color: '#1e293b',
                    flex: 1,
                    lineHeight: 1.35,
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#64748b',
                    backgroundColor: '#e2e8f0',
                    padding: '4px 12px',
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                >
                  {item.source}
                </div>
              </div>
            ))}
          </div>
        </AnimatedCardBody>
      </NewsLayout>
    </>
  );
};

const OutroSegment: React.FC<{
  briefing: BriefingData;
  timing: SegmentTiming;
  chapters: ChapterItem[];
}> = ({ briefing, timing, chapters }) => {
  const frame = useCurrentFrame();

  return (
    <>
      <Audio src={staticFile(timing.audio_file)} />
      <NewsLayout
        channelName={briefing.channel_name}
        dateText={briefing.date_display}
        progressBadge="今日完畢"
        headerTitle="感謝收看哈Gemi早報"
        tagText="✦ 明天見"
        tagVariant="orange"
        characterImage={briefing.outro.character_image}
        characterClosedImage={briefing.outro.character_closed_image}
        isMouthOpen={getMouthOpen(timing, frame)}
        characterMode={briefing.outro.character_mode}
        subtitle={getActiveSubtitle(timing.subtitles, frame)}
        chapters={chapters}
        activeChapterIndex={briefing.columns.length + 2}
      >
        <AnimatedCardBody>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              gap: 28,
            }}
          >
            <div style={{ fontSize: 56, fontWeight: 900, color: '#181c3a' }}>
              ✦ 今天的 {briefing.channel_name} 到這邊 ✦
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#475569' }}>
              喜歡這期內容的話，歡迎按讚、訂閱、開啟小鈴鐺！
            </div>
            <div
              style={{
                backgroundColor: '#1f2a68',
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 800,
                padding: '18px 42px',
                borderRadius: 999,
              }}
            >
              我們明天早上同一時間見！
            </div>
          </div>
        </AnimatedCardBody>
      </NewsLayout>
    </>
  );
};

export const MorningBriefing: React.FC<MorningBriefingProps> = ({
  briefing,
  timeline,
}) => {
  if (!briefing || !timeline) {
    return null;
  }

  const chapters: ChapterItem[] = [
    { label: '開場', weight: 0.7 },
    ...briefing.columns.map((c) => ({ label: c.chapter_label, weight: 1.3 })),
    { label: `快訊 ${briefing.flash_news.length} 條`, weight: 1 },
    { label: '片尾', weight: 0.6 },
  ];

  const segs = timeline.segments;

  return (
    <Series>
      <Series.Sequence durationInFrames={segs.cover.duration_frames}>
        <CoverSegment
          briefing={briefing}
          timing={segs.cover}
          chapters={chapters}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={segs.agenda.duration_frames}>
        <AgendaSegment
          briefing={briefing}
          timing={segs.agenda}
          chapters={chapters}
        />
      </Series.Sequence>

      {briefing.columns.map((col) => {
        const seg = segs[`col_${col.index}`];
        return (
          <Series.Sequence key={col.index} durationInFrames={seg.duration_frames}>
            <ColumnSegment
              briefing={briefing}
              col={col}
              timing={seg}
              chapters={chapters}
            />
          </Series.Sequence>
        );
      })}

      <Series.Sequence durationInFrames={segs.flash.duration_frames}>
        <FlashSegment
          briefing={briefing}
          timing={segs.flash}
          chapters={chapters}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={segs.outro.duration_frames}>
        <OutroSegment
          briefing={briefing}
          timing={segs.outro}
          chapters={chapters}
        />
      </Series.Sequence>
    </Series>
  );
};
