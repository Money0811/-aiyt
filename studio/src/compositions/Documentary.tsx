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

const GuestShowcaseCard: React.FC<{
  modelPath: string;
  modelName?: string;
  enterProgress: number;
}> = ({ modelPath, modelName, enterProgress }) => {
  return (
    <div
      style={{
        width: 265,
        border: '2px solid rgba(34, 211, 238, 0.55)',
        backgroundColor: 'rgba(15, 23, 42, 0.68)',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: enterProgress,
        transform: `translateY(${(1 - enterProgress) * 14}px)`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#94a3b8',
          letterSpacing: 1,
          alignSelf: 'flex-start',
        }}
      >
        ◈ 登場模型展示
      </div>
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 0',
        }}
      >
        <Img
          src={staticFile(modelPath)}
          style={{
            maxHeight: 440,
            maxWidth: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.55))',
          }}
        />
      </div>
      {modelName && (
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            borderTop: '1.5px solid rgba(34, 211, 238, 0.35)',
            paddingTop: 10,
            fontSize: 19,
            fontWeight: 800,
            color: '#22d3ee',
          }}
        >
          {modelName}
        </div>
      )}
    </div>
  );
};

const SectionView: React.FC<{
  section: LongformSection;
  timing: SegmentTiming;
  sectionIndex: number;
  totalSections: number;
}> = ({ section, timing, sectionIndex, totalSections }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeSubtitle = getActiveSubtitle(timing.subtitles, frame);
  const mouthArr = timing.mouth_open ?? [];
  const sampledFrame = Math.min(
    Math.max(0, mouthArr.length - 1),
    Math.floor(frame / 3) * 3
  );
  const isMouthOpen =
    mouthArr.length > 0 ? mouthArr[sampledFrame] === 1 : frame % 8 < 5;

  const headerEnter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const boxEnter = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 16, stiffness: 125 },
  });

  const detailEnter = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 15, stiffness: 115 },
  });

  const lineProgress = interpolate(frame, [14, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hostBounce = isMouthOpen
    ? Math.sin(frame * 0.42) * 4
    : Math.sin(frame * 0.12) * 2;

  const showGuestCard =
    Boolean(section.guest_model) &&
    !section.guest_model?.includes('models/gemini/');

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
      <Audio src={staticFile(timing.audio_file)} />

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
            'radial-gradient(circle at 58% 42%, rgba(34, 211, 238, 0.07) 0%, rgba(9, 20, 28, 0.78) 76%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Bar: Minimalist Chapter Indicator + Watermark */}
      <div
        style={{
          position: 'absolute',
          top: 38,
          left: 56,
          right: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Array.from({ length: totalSections }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === sectionIndex ? 32 : 10,
                height: 8,
                borderRadius: 999,
                backgroundColor:
                  i === sectionIndex
                    ? '#22d3ee'
                    : i < sectionIndex
                      ? '#fbbf24'
                      : 'rgba(148, 163, 184, 0.25)',
              }}
            />
          ))}
          <span
            style={{
              marginLeft: 12,
              fontSize: 20,
              fontWeight: 700,
              color: 'rgba(203, 213, 225, 0.7)',
            }}
          >
            {section.chapter_label}
          </span>
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'rgba(203, 213, 225, 0.55)',
            letterSpacing: 1,
          }}
        >
          開源逆襲戰 · 哈Gemi主講
        </div>
      </div>

      {/* Left-Bottom: Always Host HaGemi Speaking */}
      <div
        style={{
          position: 'absolute',
          left: 44,
          bottom: 54,
          width: 390,
          height: 750,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 20,
        }}
      >
        <Img
          src={staticFile('models/gemini/chibi_front.png')}
          style={{
            maxHeight: 640,
            maxWidth: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            transform: `translateY(${hostBounce}px)`,
            filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.65))',
          }}
        />
        <div
          style={{
            marginTop: 12,
            border: '1.5px solid #fbbf24',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            color: '#fbbf24',
            fontSize: 19,
            fontWeight: 800,
            padding: '5px 18px',
          }}
        >
          🎙️ 主持主播 · 哈Gemi
        </div>
      </div>

      {/* Right-Side Pure-Code Wireframe Stage */}
      <div
        style={{
          position: 'absolute',
          top: 102,
          left: 472,
          right: 68,
          bottom: 172,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        {/* Minimalist Section Heading + Thin Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * 12}px)`,
          }}
        >
          <span
            style={{
              border: '1.5px solid #22d3ee',
              color: '#22d3ee',
              fontSize: 18,
              fontWeight: 800,
              padding: '3px 12px',
              flexShrink: 0,
            }}
          >
            {section.badge}
          </span>
          <span style={{ fontSize: 33, fontWeight: 800, color: '#e2e8f0' }}>
            {section.headline}
          </span>
        </div>
        <div
          style={{
            marginTop: 14,
            height: 2,
            width: `${lineProgress * 100}%`,
            backgroundColor: 'rgba(148, 163, 184, 0.28)',
          }}
        />

        {/* Dynamic Content Area by Layout Type */}
        <div style={{ marginTop: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {section.layout_type === 'hero_hook' && (
            <>
              <div
                style={{
                  border: '2.5px solid #f1f5f9',
                  backgroundColor: 'rgba(15, 23, 42, 0.58)',
                  padding: '22px 30px',
                  opacity: boxEnter,
                  transform: `scale(${0.97 + boxEnter * 0.03})`,
                }}
              >
                <div style={{ fontSize: 22, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>
                  {section.subheadline}
                </div>
                <div style={{ fontSize: 44, fontWeight: 900, color: '#ffffff', lineHeight: 1.25 }}>
                  從 <span style={{ color: '#f87171' }}>絕望差距</span> 到{' '}
                  <span style={{ color: '#22d3ee' }}>掀翻牌桌</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 18,
                  height: 240,
                  opacity: detailEnter,
                }}
              >
                {(section.featured_models ?? []).map((imgPath, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      border: '2px solid rgba(34, 211, 238, 0.45)',
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Img
                      src={staticFile(imgPath)}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: detailEnter }}>
                {(section.highlights ?? []).map((h, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: '4px solid #fbbf24',
                      backgroundColor: 'rgba(15, 23, 42, 0.55)',
                      padding: '10px 18px',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#e2e8f0',
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </>
          )}

          {section.layout_type === 'timeline_steps' && (
            <div style={{ display: 'flex', gap: 22, flex: 1, alignItems: 'stretch' }}>
              {showGuestCard && section.guest_model && (
                <GuestShowcaseCard
                  modelPath={section.guest_model}
                  modelName={section.guest_name}
                  enterProgress={boxEnter}
                />
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, opacity: boxEnter }}>
                <div style={{ fontSize: 22, color: '#22d3ee', fontWeight: 700 }}>
                  {section.subheadline}
                </div>
                {(section.steps ?? []).map((st, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      gap: 14,
                      opacity: detailEnter,
                    }}
                  >
                    <div
                      style={{
                        width: 155,
                        border: '2px solid #22d3ee',
                        backgroundColor: 'rgba(15, 23, 42, 0.72)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 21,
                        fontWeight: 900,
                        color: '#22d3ee',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {st.year}
                      <div
                        style={{
                          position: 'absolute',
                          right: -6,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#fbbf24',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        border: '2px solid rgba(226, 232, 240, 0.45)',
                        backgroundColor: 'rgba(15, 23, 42, 0.52)',
                        padding: '14px 20px',
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                        {st.title}
                      </div>
                      <div style={{ fontSize: 20, color: '#cbd5e1', lineHeight: 1.38 }}>
                        {st.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.layout_type === 'showcase_character' && (
            <div style={{ display: 'flex', gap: 22, flex: 1, alignItems: 'stretch' }}>
              {showGuestCard && section.guest_model && (
                <GuestShowcaseCard
                  modelPath={section.guest_model}
                  modelName={section.guest_name}
                  enterProgress={boxEnter}
                />
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, opacity: boxEnter }}>
                <div
                  style={{
                    border: '2px solid #f1f5f9',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    padding: '16px 22px',
                  }}
                >
                  <div style={{ fontSize: 23, fontWeight: 800, color: '#22d3ee', lineHeight: 1.35 }}>
                    {section.subheadline}
                  </div>
                </div>

                {(section.bullets ?? []).map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1.5px solid rgba(148, 163, 184, 0.35)',
                      borderLeft: '4px solid #22d3ee',
                      backgroundColor: 'rgba(15, 23, 42, 0.55)',
                      padding: '13px 18px',
                      fontSize: 21,
                      fontWeight: 700,
                      color: '#f1f5f9',
                      lineHeight: 1.35,
                      opacity: detailEnter,
                    }}
                  >
                    {b}
                  </div>
                ))}

                {section.verdict && (
                  <div
                    style={{
                      marginTop: 4,
                      border: '2px solid #fbbf24',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      padding: '12px 18px',
                      fontSize: 21,
                      fontWeight: 800,
                      color: '#fde68a',
                      opacity: detailEnter,
                    }}
                  >
                    ✦ {section.verdict}
                  </div>
                )}
              </div>
            </div>
          )}

          {section.layout_type === 'comparison_table' && (
            <div style={{ display: 'flex', gap: 22, flex: 1, alignItems: 'stretch' }}>
              {showGuestCard && section.guest_model && (
                <GuestShowcaseCard
                  modelPath={section.guest_model}
                  modelName={section.guest_name}
                  enterProgress={boxEnter}
                />
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, opacity: boxEnter }}>
                <div style={{ fontSize: 22, color: '#94a3b8', fontWeight: 700 }}>
                  {section.subheadline}
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flex: 1, opacity: detailEnter }}>
                  <div
                    style={{
                      flex: 1,
                      border: '2px solid rgba(148, 163, 184, 0.45)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#f87171' }}>
                      ✕ {section.left_title}
                    </div>
                    {(section.left_points ?? []).map((pt, i) => (
                      <div
                        key={i}
                        style={{
                          borderLeft: '3px solid rgba(248, 113, 113, 0.6)',
                          padding: '8px 12px',
                          fontSize: 20,
                          color: '#cbd5e1',
                          lineHeight: 1.38,
                        }}
                      >
                        {pt}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 32 32">
                      <line x1="0" y1="16" x2="32" y2="16" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 4" />
                      <circle cx="16" cy="16" r="6" fill="#fbbf24" />
                    </svg>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      border: '2.5px solid #22d3ee',
                      backgroundColor: 'rgba(15, 23, 42, 0.72)',
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#22d3ee' }}>
                      ✦ {section.right_title}
                    </div>
                    {(section.right_points ?? []).map((pt, i) => (
                      <div
                        key={i}
                        style={{
                          borderLeft: '3px solid #22d3ee',
                          padding: '8px 12px',
                          fontSize: 20,
                          fontWeight: 700,
                          color: '#f8fafc',
                          lineHeight: 1.38,
                        }}
                      >
                        {pt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {section.layout_type === 'summary_qa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', opacity: boxEnter }}>
              <div style={{ fontSize: 26, color: '#22d3ee', fontWeight: 700 }}>
                {section.subheadline}
              </div>
              {(section.takeaways ?? []).map((t, idx) => {
                const isLast = idx === (section.takeaways?.length ?? 1) - 1;
                return (
                  <div
                    key={idx}
                    style={{
                      border: isLast ? '2.5px solid #fbbf24' : '2px solid rgba(226, 232, 240, 0.5)',
                      backgroundColor: isLast ? 'rgba(251, 191, 36, 0.12)' : 'rgba(15, 23, 42, 0.62)',
                      padding: '20px 26px',
                      fontSize: 25,
                      fontWeight: 800,
                      color: isLast ? '#fde68a' : '#f8fafc',
                      lineHeight: 1.4,
                      opacity: detailEnter,
                    }}
                  >
                    {t}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Dark Translucent Subtitle Bar */}
      {activeSubtitle && (
        <div
          style={{
            position: 'absolute',
            left: 472,
            right: 68,
            bottom: 42,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            border: '1.5px solid rgba(148, 163, 184, 0.24)',
            borderRadius: 14,
            padding: '16px 30px',
            textAlign: 'center',
            zIndex: 30,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.35,
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
          backgroundColor: '#09141c',
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
    <AbsoluteFill style={{ backgroundColor: '#09141c' }}>
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
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
