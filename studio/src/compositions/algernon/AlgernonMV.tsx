import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { Act1IntroA1 } from './acts/Act1IntroA1';
import { Act2Chorus1Maze } from './acts/Act2Chorus1Maze';
import { Act3A2Waves } from './acts/Act3A2Waves';
import { Act4Chorus2Tree } from './acts/Act4Chorus2Tree';
import { Act5BridgeInterlude } from './acts/Act5BridgeInterlude';
import { Act6A3StepsFinale } from './acts/Act6A3StepsFinale';
import { AUDIO_PATHS } from './constants';
import { BilingualLyric } from './lrc';
import { LyricsOverlay } from './LyricsOverlay';
import { PaperBackdrop } from './PaperStage';
import { useAudioPulse } from './useAudioPulse';

export { parseBilingualLrc } from './lrc';

export type AlgernonMVProps = {
  lyrics?: BilingualLyric[];
  [key: string]: unknown;
};

export const AlgernonMV: React.FC<AlgernonMVProps> = ({ lyrics = [] }) => {
  const pulse = useAudioPulse();

  return (
    <AbsoluteFill>
      <Audio src={staticFile(AUDIO_PATHS.mix)} />

      {/* Unified warm speckled cream cotton-paper canvas */}
      <PaperBackdrop />

      {/* Six overlapping papercraft MG acts */}
      <Act1IntroA1 pulse={pulse} />
      <Act2Chorus1Maze pulse={pulse} />
      <Act3A2Waves pulse={pulse} />
      <Act4Chorus2Tree pulse={pulse} />
      <Act5BridgeInterlude pulse={pulse} />
      <Act6A3StepsFinale pulse={pulse} />

      {/* Bilingual editorial storybook lyrics */}
      <LyricsOverlay lyrics={lyrics} />
    </AbsoluteFill>
  );
};
