export interface LyricLine {
  startFrame: number;
  endFrame: number;
  ja: string;
  zh: string;
}

const TIMESTAMP_RE = /^\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\](.*)$/;

/**
 * Parse a bilingual LRC file where consecutive lines share the same timestamp
 * (first line: Japanese, second line: Traditional Chinese), and empty-text
 * timestamps explicitly clear the active lyric.
 */
export function parseLrc(lrcText: string, fps = 30): LyricLine[] {
  const maxDurationFrames = Math.round(8 * fps);
  const rawLines = lrcText.split(/\r?\n/);

  interface TimedGroup {
    timeSec: number;
    texts: string[];
  }

  const groups: TimedGroup[] = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const match = TIMESTAMP_RE.exec(trimmed);
    if (!match) continue;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const timeSec = minutes * 60 + seconds;
    const text = match[3].trim();

    const last = groups[groups.length - 1];
    if (last && Math.abs(last.timeSec - timeSec) < 0.002) {
      if (text) {
        last.texts.push(text);
      }
    } else {
      groups.push({
        timeSec,
        texts: text ? [text] : [],
      });
    }
  }

  const result: LyricLine[] = [];

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g.texts.length === 0) {
      // Explicit clear marker; already limits the previous line's endFrame
      continue;
    }

    const startFrame = Math.round(g.timeSec * fps);
    const nextGroup = groups[i + 1];
    const nextFrame = nextGroup
      ? Math.round(nextGroup.timeSec * fps)
      : startFrame + maxDurationFrames;
    const endFrame = Math.max(
      startFrame + 1,
      Math.min(nextFrame, startFrame + maxDurationFrames)
    );

    result.push({
      startFrame,
      endFrame,
      ja: g.texts[0] ?? '',
      zh: g.texts[1] ?? '',
    });
  }

  return result;
}
