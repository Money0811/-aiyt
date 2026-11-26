export interface BilingualLyric {
  startFrame: number;
  endFrame: number;
  ja: string;
  zh: string;
}

/**
 * Parses bilingual LRC where each timestamp has a Japanese line followed by
 * a Traditional Chinese line with the same timestamp, and empty timestamps
 * mark phrase breaks.
 */
export function parseBilingualLrc(
  text: string,
  fps: number = 30
): BilingualLyric[] {
  const rawLines = text.split(/\r?\n/);
  const entries: { frame: number; text: string }[] = [];

  for (const line of rawLines) {
    const match = line.match(/^\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)$/);
    if (!match) continue;
    const min = parseInt(match[1], 10);
    const sec = parseFloat(match[2]);
    const frame = Math.round((min * 60 + sec) * fps);
    entries.push({ frame, text: match[3].trim() });
  }

  // Group consecutive lines with the same timestamp
  const grouped: { frame: number; lines: string[] }[] = [];
  for (const e of entries) {
    const last = grouped[grouped.length - 1];
    if (last && Math.abs(last.frame - e.frame) <= 2) {
      if (e.text) last.lines.push(e.text);
    } else {
      grouped.push({ frame: e.frame, lines: e.text ? [e.text] : [] });
    }
  }

  const result: BilingualLyric[] = [];
  for (let i = 0; i < grouped.length; i++) {
    const g = grouped[i];
    if (g.lines.length === 0) continue;
    const nextFrame =
      i + 1 < grouped.length ? grouped[i + 1].frame : g.frame + 6 * fps;
    result.push({
      startFrame: g.frame,
      endFrame: Math.max(g.frame + 15, nextFrame),
      ja: g.lines[0] || '',
      zh: g.lines[1] || '',
    });
  }
  return result;
}
