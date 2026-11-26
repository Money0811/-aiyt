import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AUDIO_PATHS,
  LIP_SYNC_FULL,
  LIP_SYNC_GATE,
  VOCAL_OFFSET_FRAMES,
} from './constants';

const mean = (arr: number[]): number =>
  arr.length === 0 ? 0 : arr.reduce((sum, v) => sum + v, 0) / arr.length;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export interface LipSyncResult {
  level: number;
  raw: number;
}

/**
 * Pure per-frame lip-sync driver derived from vocal.wav FFT mid-voice bins (1..9).
 * Stateless across frames; uses 1-frame lookback decay for smooth mouth closure.
 */
export function useLipSync(): LipSyncResult {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(AUDIO_PATHS.vocal));

  const f = frame - VOCAL_OFFSET_FRAMES;
  if (!audioData || f < 0) {
    return { level: 0, raw: 0 };
  }

  const maxFrame = Math.floor(audioData.durationInSeconds * fps) - 2;
  if (f > maxFrame) {
    return { level: 0, raw: 0 };
  }

  const amp = (fr: number): number => {
    if (fr < 1 || fr > maxFrame) return 0;
    const spectrum = visualizeAudio({
      fps,
      frame: fr,
      audioData,
      numberOfSamples: 32,
      smoothing: true,
    });
    return mean(spectrum.slice(1, 10));
  };

  const raw = Math.max(amp(f), amp(f - 1) * 0.85);
  const level = clamp(
    (raw - LIP_SYNC_GATE) / (LIP_SYNC_FULL - LIP_SYNC_GATE),
    0,
    1
  );

  return { level, raw };
}
