import React from 'react';
import { Composition, staticFile } from 'remotion';
import {
  BriefingData,
  MorningBriefing,
  MorningBriefingProps,
  TimelineData,
} from './compositions/MorningBriefing';
import {
  ThumbnailCover,
  ThumbnailCoverProps,
} from './compositions/ThumbnailCover';
import {
  PreviewAgenda,
  PreviewCover,
  PreviewReport,
} from './compositions/PreviewScenes';
import {
  IntroScriptData,
  PixelIntro,
  PixelIntroProps,
} from './compositions/PixelIntro';
import {
  ShortBriefing,
  ShortBriefingProps,
  ShortData,
} from './compositions/ShortBriefing';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MorningBriefing"
        component={MorningBriefing}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          briefing: null,
          timeline: null,
        }}
        calculateMetadata={async (): Promise<{
          durationInFrames: number;
          fps: number;
          props: MorningBriefingProps;
        }> => {
          const [briefingRes, timelineRes] = await Promise.all([
            fetch(staticFile('episode/briefing.json')),
            fetch(staticFile('episode/timeline.json')),
          ]);
          const briefing = (await briefingRes.json()) as BriefingData;
          const timeline = (await timelineRes.json()) as TimelineData;
          const totalFrames = Object.values(timeline.segments).reduce(
            (sum, seg) => sum + seg.duration_frames,
            0
          );
          return {
            durationInFrames: Math.max(1, totalFrames),
            fps: timeline.fps || 30,
            props: {
              briefing,
              timeline,
            },
          };
        }}
      />
      <Composition
        id="ThumbnailCover"
        component={ThumbnailCover}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          briefing: null,
        }}
        calculateMetadata={async (): Promise<{
          props: ThumbnailCoverProps;
        }> => {
          const res = await fetch(staticFile('episode/briefing.json'));
          const briefing = (await res.json()) as BriefingData;
          return { props: { briefing } };
        }}
      />
      <Composition
        id="PreviewCover"
        component={PreviewCover}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PreviewAgenda"
        component={PreviewAgenda}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PreviewReport"
        component={PreviewReport}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PixelIntro"
        component={PixelIntro}
        durationInFrames={911}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          script: null,
        }}
        calculateMetadata={async (): Promise<{
          durationInFrames: number;
          fps: number;
          props: PixelIntroProps;
        }> => {
          const res = await fetch(staticFile('intro/intro_script.json'));
          const script = (await res.json()) as IntroScriptData;
          return {
            durationInFrames: Math.max(1, script.totalFrames || 900),
            fps: script.fps || 30,
            props: { script },
          };
        }}
      />
      <Composition
        id="ShortBriefing"
        component={ShortBriefing}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          shortData: null,
        }}
        calculateMetadata={async (): Promise<{
          durationInFrames: number;
          fps: number;
          props: ShortBriefingProps;
        }> => {
          const res = await fetch(staticFile('short/short_data.json'));
          const shortData = (await res.json()) as ShortData;
          return {
            durationInFrames: Math.max(1, shortData.duration_frames || 900),
            fps: 30,
            props: { shortData },
          };
        }}
      />
    </>
  );
};
