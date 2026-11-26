import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AUDIO_PATHS } from './constants';

const mean = (arr: number[]): number =>
  arr.length === 0 ? 0 : arr.reduce((sum, v) => sum + v, 0) / arr.length;

/**
 * Computes normalized low-frequency energy from mix.wav (lowest 4 FFT bins)
 * for visual effects only (camera bounce, wind speed, storm shake).
 */
export function useBassPulse(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(AUDIO_PATHS.mix));

  if (!audioData || frame < 1) {
    return 0;
  }

  const maxFrame = Math.floor(audioData.durationInSeconds * fps) - 2;
  if (frame > maxFrame) {
    return 0;
  }

  const bins = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 32,
    smoothing: true,
  });

  const lowMean = mean(bins.slice(0, 4));
  // Normalize typical mix bass range (~0.02..0.28) into 0..1
  return Math.min(1, Math.max(0, (lowMean - 0.02) / 0.24));
}
