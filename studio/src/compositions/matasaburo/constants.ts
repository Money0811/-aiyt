export const FPS = 30;
export const TOTAL_FRAMES = 6960; // 232.0 s @ 30fps

export const AUDIO_PATHS = {
  mix: 'mv/matasaburo/mix.wav',
  vocal: 'mv/matasaburo/vocal.wav',
  lyrics: 'mv/matasaburo/lyrics.lrc',
} as const;

/**
 * Measured via cross-correlation between vocal.wav and mix.wav (20-80 s):
 * vocal.wav leads mix.wav by 0.965 s (~28.95 frames @ 30fps).
 * Using f = frame - VOCAL_OFFSET_FRAMES aligns vocal.wav to mix.wav.
 */
export const VOCAL_OFFSET_FRAMES = 29;

/**
 * Calibrated from visualizeAudio(vocal.wav, numberOfSamples=32, smoothing=true).slice(1, 10):
 * - Interlude (frames 2450..2800): median 0.00009, max 0.00544
 * - Active singing (>0.005): p10=0.0156, p50=0.0429, p85=0.0600, p95=0.0696
 */
export const LIP_SYNC_GATE = 0.008;
export const LIP_SYNC_FULL = 0.065;

export interface SectionRange {
  id: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6a' | 'S6b' | 'S7' | 'S8';
  label: string;
  start: number;
  end: number;
}

export const SECTIONS = {
  S1: { id: 'S1', label: '前奏', start: 0, end: 615 },
  S2: { id: 'S2', label: 'A1', start: 615, end: 1710 },
  S3: { id: 'S3', label: '副歌1', start: 1710, end: 2451 },
  S4: { id: 'S4', label: '像素間奏', start: 2451, end: 2850 },
  S5: { id: 'S5', label: 'A2', start: 2850, end: 3960 },
  S6a: { id: 'S6a', label: '副歌2+胡桃', start: 3960, end: 4826 },
  S6b: { id: 'S6b', label: '高潮', start: 4826, end: 6210 },
  S7: { id: 'S7', label: 'どっどど+尾奏', start: 6210, end: 6810 },
  S8: { id: 'S8', label: '片尾字卡', start: 6810, end: 6960 },
} as const satisfies Record<string, SectionRange>;

export const EVENTS = {
  TITLE_START: 120, // 4.0 s
  TITLE_END: 360, // 12.0 s
  INTRO_CHAR_ENTER: 540, // 18.0 s
  DODDODO_1_START: 2256, // 75.2 s
  DODDODO_1_END: 2451, // 81.7 s
  LIGHTNING_1: 3722, // 124.06 s
  LIGHTNING_2: 3795, // 126.5 s
  FRUITS_START: 4485, // 149.5 s
  FRUITS_END: 4826, // 160.8 s
  MATASABURO_EMPHASIS_START: 5370, // 179.0 s
  MATASABURO_EMPHASIS_END: 5495, // 183.17 s
  SKY_CLEAR_FULL: 5715, // 190.5 s
  DODDODO_2_START: 6210, // 207.0 s
  DODDODO_2_END: 6435, // 214.5 s
  END_CARD_FADE_BLACK_START: 6930, // last 30f
} as const;

export const PALETTE = {
  summerSky: '#4FA3E0',
  summerSkyTop: '#2475B8',
  cloudWhite: '#F4F7FA',
  riceGreen: '#7BC67B',
  riceDark: '#4E9A54',
  galeBlue: '#2E86DE',
  galeSkyTop: '#1A5296',
  sunflowerYellow: '#FFD25A',
  stormLeadBlue: '#3A4A5C',
  stormLeadTop: '#253140',
  rainGrey: '#8A9BAE',
  stormDark: '#1B2A41',
  stormDeepTop: '#0F1826',
  autumnMapleRed: '#D9573B',
  autumnSunsetOrange: '#F2A25C',
  autumnSunsetTop: '#C96E4B',
  deadLeafBrown: '#A0643C',
  autumnLavender: '#B9A6D9',
} as const;

export const END_CARD_LINES = [
  '又三郎',
  '原曲：ヨルシカ（作詞・作曲：n-buna）',
  '翻唱：哈Gemi',
  '@ZipZipPipe ｜ CC BY-NC-SA 4.0',
] as const;

export type CharacterPose =
  | 'opening_normal'
  | 'chibi_excited'
  | 'chibi_explain'
  | 'chibi_chair';

export const CHARACTER_ASSETS: Record<
  CharacterPose,
  {
    normal: { open: string; closed: string };
    pixel: { open: string; closed: string };
  }
> = {
  opening_normal: {
    normal: {
      open: 'character/opening_normal.png',
      closed: 'character/opening_normal_closed.png',
    },
    pixel: {
      open: 'character/pixel/opening_normal.png',
      closed: 'character/pixel/opening_normal_closed.png',
    },
  },
  chibi_excited: {
    normal: {
      open: 'character/chibi_excited.png',
      closed: 'character/chibi_excited_closed.png',
    },
    pixel: {
      open: 'character/pixel/chibi_excited.png',
      closed: 'character/pixel/chibi_excited_closed.png',
    },
  },
  chibi_explain: {
    normal: {
      open: 'character/chibi_explain.png',
      closed: 'character/chibi_explain_closed.png',
    },
    pixel: {
      open: 'character/pixel/chibi_explain.png',
      closed: 'character/pixel/chibi_explain_closed.png',
    },
  },
  chibi_chair: {
    normal: {
      open: 'character/chibi_chair.png',
      closed: 'character/chibi_chair_closed.png',
    },
    pixel: {
      open: 'character/pixel/chibi_chair.png',
      closed: 'character/pixel/chibi_chair_closed.png',
    },
  },
};
