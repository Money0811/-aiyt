import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AUDIO_PATHS } from './constants';

/**
 * Returns a gentle 0..1 musical energy pulse from mix.wav for subtle
 * papercraft breathing, star twinkle, and wave sway.
 */
export function useAudioPulse(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(AUDIO_PATHS.mix));

  if (!audioData) return 0;

  const spectrum = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 32,
    smoothing: true,
  });

  // Blend low-mid + upper-mid energy for acoustic guitar / vocal warmth
  const lowMid = (spectrum[1] + spectrum[2] + spectrum[3] + spectrum[4]) / 4;
  const presence = (spectrum[6] + spectrum[7] + spectrum[8]) / 3;
  const raw = lowMid * 0.65 + presence * 0.35;
  return Math.min(1, Math.max(0, raw * 3.2));
}
