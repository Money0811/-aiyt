export const FPS = 30;
export const TOTAL_FRAMES = 7830; // 261.0 s @ 30fps (mix.wav is 260.598 s)

export const AUDIO_PATHS = {
  mix: 'mv/algernon/mix.wav',
  vocal: 'mv/algernon/vocal.wav',
  lyrics: 'mv/algernon/lyrics.lrc',
} as const;

export const ART_PATHS = {
  handsHeart: 'mv/algernon/art/01_hands_heart.png',
  eyes: 'mv/algernon/art/02_heterochromia_eyes.png',
  barefoot: 'mv/algernon/art/03_barefoot_step.png',
  running: 'mv/algernon/art/04_running_maze.png',
  handsPetals: 'mv/algernon/art/05_hands_petals.png',
  seaside: 'mv/algernon/art/06_seaside_back.png',
  sleeping: 'mv/algernon/art/07_sleeping_serene.png',
  smile: 'mv/algernon/art/08_gentle_smile_profile.png',
  finaleWalk: 'mv/algernon/art/09_finale_walk_turn.png',
} as const;

export const PALETTE = {
  // Paper canvas & layers (matched to reference 01_hands_heart.jpg)
  paperBase: '#EFECE1',
  paperLight: '#F7F4EA',
  paperWarm: '#F3E9D6',
  paperShadow: '#DDD6C3',
  paperDeepShadow: '#C7BEA8',
  paperTintSky: '#E9ECF4',
  paperTintDusk: '#EAE2DD',
  paperTintDawn: '#F4EFE3',

  // Typography & ink
  inkDark: '#2E2B3E',
  inkMid: '#5A5570',
  inkSoft: '#8A849E',

  // Hagemy signature colors
  periwinkle: '#6E7EEB',
  periwinkleLight: '#9CA8F5',
  lavender: '#BA7CF2',
  lavenderSoft: '#D7B2F8',
  navy: '#27294A',
  navySoft: '#3D4170',
  starGold: '#F4C65E',
  starGoldSoft: '#FCE39E',
  starCrimson: '#E86382',
  starCyan: '#8AD9F0',

  // Scenic papercraft layers
  cloudWhite: '#F8F6EE',
  cloudBlue: '#DCE3F5',
  mazeWall: '#E6DFCE',
  mazeWallLight: '#F4EFE2',
  mazeWallTop: '#FAF7EF',
  breadCrust: '#E3AD6B',
  breadGlow: '#FBE4B4',
  waveDeep: '#31396B',
  waveMid: '#5A67B8',
  waveLight: '#9FA6EA',
  waveFoam: '#F6F3EA',
  treeTrunk: '#7A6861',
  treeLeaf1: '#7B8CE8',
  treeLeaf2: '#C590F0',
  treeLeaf3: '#EFC97D',
  treeLeaf4: '#A6B4F4',
} as const;

/** Exact frame cues @ 30fps aligned to verified vocal.wav & lyrics.lrc */
export const CUES = {
  INTRO_START: 0, // 00:00.00
  TITLE_IN: 0, // 00:00.00 (subtle quick opening title)
  CHAR_ENTER: 0, // 00:00.00

  // A1 (00:00.88 - 00:33.20)
  A1_HEART: 26, // 00:00.88 貴方はどうして僕に心をくれたんでしょう
  A1_EYES: 227, // 00:07.58 貴方はどうして僕に目を描いたんだ
  A1_SKY_WIND: 426, // 00:14.19 空より大きく 雲を流す風を呑み込んで
  A1_DREAM: 627, // 00:20.89 僕のまなこはまた夢を見てた
  A1_BAREFOOT: 852, // 00:28.40 裸足のままで
  A1_END: 996, // 00:33.20

  // Chorus 1 (00:37.75 - 01:04.00)
  CHORUS1_START: 1132, // 00:37.75 貴方はゆっくりと変わっていく とても小さく
  CHORUS1_BREAD: 1332, // 00:44.41 少しずつ膨らむパンを眺めるように
  CHORUS1_RUN: 1532, // 00:51.07 貴方はゆっくりと走っていく
  CHORUS1_MAZE_END: 1732, // 00:57.73 長い迷路の先も恐れないままで
  CHORUS1_END: 1920, // 01:04.00

  // A2 (01:05.90 - 01:36.20)
  A2_NAME: 1977, // 01:05.90 貴方はどうして僕に名前をくれたんでしょう
  A2_HANDS: 2176, // 01:12.55 貴方はどうして僕に手を作ったんだ
  A2_WAVES: 2376, // 01:19.20 海より大きく 砂を流す波も呑み込んで
  A2_SEASIDE: 2575, // 01:25.84 小さな両手はまだ遠くを見てた
  A2_YAWN: 2751, // 01:31.70 あくびを一つ
  A2_END: 2886, // 01:36.20

  // Chorus 2 (01:41.09 - 02:07.40)
  CHORUS2_SLEEP: 3033, // 01:41.09 僕らはゆっくりと眠っていく とても長く
  CHORUS2_TREE: 3232, // 01:47.75 頭の真ん中に育っていく大きな木の
  CHORUS2_SHADE: 3432, // 01:54.41 根元をゆっくりと歩いていく
  CHORUS2_FORGET: 3632, // 02:01.07 長い迷路の先を恐れないように
  CHORUS2_MEMORIES: 3732, // 02:04.40
  CHORUS2_END: 3822, // 02:07.40

  // Bridge & C-melody first half (02:07.97 - 02:44.58)
  BRIDGE_BREAK: 3839, // 02:07.97 いつかとても追いつけない人に出会うのだろうか
  BRIDGE_SMILE: 4039, // 02:14.62 いつかとても越えられない壁にすくむのだろうか
  BRIDGE_LIVE: 4238, // 02:21.28 いつか貴方もそれを諦めてしまうのだろうか
  INTERLUDE_START: 4458, // 02:28.60 ゆっくりと変わっていく ×3 / 忘れていく

  // C-melody second half & Final Chorus & 46s Instrumental Outro (02:44.58 - 04:21.00)
  A3_TIME: 4937, // 02:44.58 少しずつ崩れる塔を眺めるように
  A3_SHOES: 5133, // 02:51.11 僕らはゆっくりと眠っていく
  A3_STEPS: 5432, // 03:01.07 貴方はゆっくりと変わっていく とても小さく
  A3_FOOTPRINTS: 5632, // 03:07.73 あの木の真ん中に育っていく木陰のように
  A3_VIVID: 5832, // 03:14.39 貴方はゆっくりと走っていく
  A3_END: 6000, // 03:20.00

  FINALE_CHANGE: 6032, // 03:21.05 長い迷路の先も恐れないままで
  FINALE_FORGOT_DAY: 6244, // 03:28.15 確かに迷いながら
  FINALE_WALK: 6444, // 03:34.80 Instrumental outro — maze unfolds!
  FINALE_MEET: 6780, // 03:46.00 Hagemy walks toward archway light-door
  FINALE_MAZE_END: 7140, // 03:58.00 Dissolves into radiant star
  OUTRO_START: 7380, // 04:06.00 Theatre curtains close
  END_CARD_START: 7470, // 04:09.00 End card
  FADE_OUT_START: 7770, // 04:19.00 Fade to cream paper
} as const;

export const ACTS = {
  ACT1: { start: 0, end: 1150 }, // Intro + A1
  ACT2: { start: 1112, end: 1995 }, // Chorus 1 Maze
  ACT3: { start: 1957, end: 3050 }, // A2 Name, Hands, Waves
  ACT4: { start: 3013, end: 3858 }, // Chorus 2 Sleep, Tree, Walk
  ACT5: { start: 3820, end: 4960 }, // Bridge & C-melody MG showcase
  ACT6: { start: 4920, end: TOTAL_FRAMES }, // C-melody, Final Chorus & Outro
} as const;

export const FONT_JP =
  '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", Georgia, serif';
export const FONT_ZH =
  '"Noto Serif TC", "PMingLiU", "Microsoft JhengHei", sans-serif';
export const FONT_SANS =
  '"Noto Sans TC", "Segoe UI", "Microsoft JhengHei", sans-serif';

export const END_CARD_LINES = [
  'アルジャーノン',
  '原曲：ヨルシカ（作詞・作曲：n-buna）',
  '翻唱：哈Gemi',
  '角色原案：@ZipZipPipe ｜ CC BY-NC-SA 4.0',
] as const;
