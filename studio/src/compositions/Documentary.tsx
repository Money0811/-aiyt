import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SegmentTiming, SubtitleCue } from './MorningBriefing';

export interface LongformStep {
  year: string;
  title: string;
  desc: string;
}

export interface LongformSection {
  id: string;
  chapter_label: string;
  layout_type:
    | 'hero_hook'
    | 'timeline_steps'
    | 'showcase_character'
    | 'comparison_table'
    | 'summary_qa';
  headline: string;
  subheadline: string;
  badge: string;
  featured_models?: string[];
  highlights?: string[];
  guest_model?: string;
  guest_name?: string;
  steps?: LongformStep[];
  bullets?: string[];
  verdict?: string;
  left_title?: string;
  left_points?: string[];
  right_title?: string;
  right_points?: string[];
  takeaways?: string[];
  host_image: string;
  host_closed_image?: string;
  script: string;
}

export interface LongformData {
  id: string;
  title: string;
  channel_name: string;
  bgm_file?: string;
  sections: LongformSection[];
}

export interface LongformTimeline {
  fps: number;
  voice: string;
  segments: Record<string, SegmentTiming>;
}

export interface DocumentaryProps {
  data: LongformData | null;
  timeline: LongformTimeline | null;
}

const FONT_FAMILY =
  '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Segoe UI", sans-serif';

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

const SectionView: React.FC<{
  section: LongformSection;
  timing: SegmentTiming;
  sectionIndex: number;
  totalSections: number;
  channelName: string;
}> = ({ section, timing, sectionIndex, totalSections, channelName }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const activeSubtitle = getActiveSubtitle(timing.subtitles, frame);
  const mouthArr = timing.mouth_open ?? [];
  const sampledFrame = Math.min(
    Math.max(0, mouthArr.length - 1),
    Math.floor(frame / 3) * 3
  );
  const isMouthOpen =
    mouthArr.length > 0 ? mouthArr[sampledFrame] === 1 : frame % 8 < 5;

  const activeHostImg =
    !isMouthOpen && section.host_closed_image
      ? section.host_closed_image
      : section.host_image;

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  const kenBurns = interpolate(
    frame,
    [0, Math.max(1, durationInFrames)],
    [1.0, 1.06],
    { extrapolateRight: 'clamp' }
  );

  const talkBounce = isMouthOpen ? Math.sin(frame * 0.42) * 3 : 0;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        background:
          'linear-gradient(135deg, #0b0f19 0%, #151c32 52%, #0d1323 100%)',
        color: '#f8fafc',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Audio src={staticFile(timing.audio_file)} />

      {/* Subtle ambient glow & grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(99,102,241,0.18) 0%, transparent 40%), radial-gradient(circle at 80% 72%, rgba(245,158,11,0.12) 0%, transparent 42%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Documentary Header & Chapter Progress */}
      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 64,
          right: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.16)',
              border: '1.5px solid #f59e0b',
              color: '#fbbf24',
              fontSize: 20,
              fontWeight: 800,
              padding: '6px 18px',
              borderRadius: 999,
            }}
          >
            ✦ {channelName}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#cbd5e1',
            }}
          >
            {section.chapter_label}
          </div>
        </div>

        {/* Chapter Progress Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Array.from({ length: totalSections }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === sectionIndex ? 36 : 12,
                height: 10,
                borderRadius: 999,
                backgroundColor:
                  i === sectionIndex
                    ? '#fbbf24'
                    : i < sectionIndex
                      ? '#6366f1'
                      : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Headline Block */}
      <div
        style={{
          position: 'absolute',
          top: 104,
          left: 64,
          right: 360,
          zIndex: 10,
          transform: `translateY(${(1 - enter) * 18}px)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            fontSize: 20,
            fontWeight: 800,
            padding: '5px 16px',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {section.badge}
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.18,
            letterSpacing: -0.5,
          }}
        >
          {section.headline}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 26,
            fontWeight: 600,
            color: '#94a3b8',
          }}
        >
          {section.subheadline}
        </div>
      </div>

      {/* Main Content Stage */}
      <div
        style={{
          position: 'absolute',
          top: 295,
          left: 64,
          right: 340,
          bottom: 165,
          display: 'flex',
          gap: 32,
          alignItems: 'stretch',
          zIndex: 10,
        }}
      >
        {section.layout_type === 'hero_hook' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
            <div style={{ display: 'flex', gap: 18, height: 330 }}>
              {(section.featured_models ?? []).map((imgPath, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.14)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                  }}
                >
                  <Img
                    src={staticFile(imgPath)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: `scale(${kenBurns})`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(section.highlights ?? []).map((h, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.85)',
                    borderLeft: '5px solid #fbbf24',
                    padding: '14px 22px',
                    borderRadius: 12,
                    fontSize: 25,
                    fontWeight: 700,
                    color: '#f1f5f9',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>
        )}

        {(section.layout_type === 'timeline_steps' ||
          section.layout_type === 'showcase_character') && (
          <>
            {/* Guest Model Portrait Card */}
            {section.guest_model && (
              <div
                style={{
                  width: 390,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '2px solid rgba(129, 140, 248, 0.35)',
                  borderRadius: 24,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Img
                    src={staticFile(section.guest_model)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: `scale(${kenBurns})`,
                      filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.45))',
                    }}
                  />
                </div>
                {section.guest_name && (
                  <div
                    style={{
                      marginTop: 10,
                      backgroundColor: 'rgba(79, 70, 229, 0.28)',
                      border: '1px solid #818cf8',
                      color: '#e0e7ff',
                      fontSize: 22,
                      fontWeight: 800,
                      padding: '6px 18px',
                      borderRadius: 999,
                    }}
                  >
                    {section.guest_name}
                  </div>
                )}
              </div>
            )}

            {/* Right Column: Steps or Bullets */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
              {section.steps?.map((st, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.85)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: 16,
                    padding: '18px 24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span
                      style={{
                        backgroundColor: '#fbbf24',
                        color: '#0f172a',
                        fontSize: 18,
                        fontWeight: 900,
                        padding: '3px 12px',
                        borderRadius: 999,
                      }}
                    >
                      {st.year}
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#ffffff' }}>
                      {st.title}
                    </span>
                  </div>
                  <div style={{ fontSize: 22, color: '#cbd5e1', lineHeight: 1.4 }}>
                    {st.desc}
                  </div>
                </div>
              ))}

              {section.bullets?.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.85)',
                    borderLeft: '5px solid #818cf8',
                    borderRadius: 12,
                    padding: '16px 22px',
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    lineHeight: 1.35,
                  }}
                >
                  ✦ {b}
                </div>
              ))}

              {section.verdict && (
                <div
                  style={{
                    marginTop: 6,
                    backgroundColor: 'rgba(245, 158, 11, 0.16)',
                    border: '1.5px solid #f59e0b',
                    borderRadius: 14,
                    padding: '14px 22px',
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#fde68a',
                  }}
                >
                  💡 {section.verdict}
                </div>
              )}
            </div>
          </>
        )}

        {section.layout_type === 'comparison_table' && (
          <>
            {section.guest_model && (
              <div
                style={{
                  width: 340,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '2px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: 24,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Img
                  src={staticFile(section.guest_model)}
                  style={{
                    width: '100%',
                    flex: 1,
                    objectFit: 'contain',
                    transform: `scale(${kenBurns})`,
                  }}
                />
                {section.guest_name && (
                  <div style={{ fontSize: 21, fontWeight: 800, color: '#bae6fd', marginTop: 8 }}>
                    {section.guest_name}
                  </div>
                )}
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', gap: 20 }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(30, 41, 59, 0.78)',
                  border: '2px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: 20,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: '#94a3b8' }}>
                  {section.left_title}
                </div>
                {(section.left_points ?? []).map((pt, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      padding: '14px 18px',
                      borderRadius: 12,
                      fontSize: 23,
                      color: '#cbd5e1',
                      lineHeight: 1.4,
                    }}
                  >
                    • {pt}
                  </div>
                ))}
              </div>

              <div
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(30, 58, 138, 0.35)',
                  border: '2px solid #38bdf8',
                  borderRadius: 20,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: '#38bdf8' }}>
                  ⚡ {section.right_title}
                </div>
                {(section.right_points ?? []).map((pt, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      borderLeft: '4px solid #38bdf8',
                      padding: '14px 18px',
                      borderRadius: 12,
                      fontSize: 23,
                      fontWeight: 700,
                      color: '#f8fafc',
                      lineHeight: 1.4,
                    }}
                  >
                    {pt}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {section.layout_type === 'summary_qa' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            {(section.takeaways ?? []).map((t, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor:
                    idx === (section.takeaways?.length ?? 1) - 1
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(30, 41, 59, 0.88)',
                  border:
                    idx === (section.takeaways?.length ?? 1) - 1
                      ? '2px solid #fbbf24'
                      : '1.5px solid rgba(255,255,255,0.14)',
                  borderRadius: 18,
                  padding: '22px 28px',
                  fontSize: 28,
                  fontWeight: 800,
                  color:
                    idx === (section.takeaways?.length ?? 1) - 1
                      ? '#fde68a'
                      : '#f8fafc',
                  lineHeight: 1.4,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Host Character (Bottom Right) */}
      <div
        style={{
          position: 'absolute',
          right: 28,
          bottom: 24,
          width: 310,
          height: 360,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 25,
          pointerEvents: 'none',
        }}
      >
        <Img
          src={staticFile(activeHostImg)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `translateY(${talkBounce}px)`,
            filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.55))',
          }}
        />
      </div>

      {/* Cinema Subtitle Bar (Bottom Left-Center) */}
      {activeSubtitle && (
        <div
          style={{
            position: 'absolute',
            left: 64,
            right: 360,
            bottom: 44,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 30,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(11, 15, 25, 0.9)',
              border: '2px solid rgba(251, 191, 36, 0.7)',
              borderRadius: 16,
              padding: '14px 28px',
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.35,
              boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
            }}
          >
            {activeSubtitle}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Documentary: React.FC<DocumentaryProps> = ({ data, timeline }) => {
  if (!data || !timeline) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#0b0f19',
          color: '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 36,
          fontFamily: FONT_FAMILY,
        }}
      >
        Loading Documentary...
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0f19' }}>
      {data.bgm_file ? (
        <Audio src={staticFile(data.bgm_file)} volume={0.12} loop />
      ) : null}
      <Series>
        {data.sections.map((sec, idx) => {
          const timing = timeline.segments[sec.id];
          if (!timing) return null;
          return (
            <Series.Sequence key={sec.id} durationInFrames={timing.duration_frames}>
              <SectionView
                section={sec}
                timing={timing}
                sectionIndex={idx}
                totalSections={data.sections.length}
                channelName={data.channel_name}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
