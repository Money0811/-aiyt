# 基米哈Gemi 運營中 — 哈Gemi 頻道專案導覽與接手指南

這是 **哈Gemi（基米）** 的個人 YouTube 頻道自動化與內容製作專案，完整涵蓋 **四大內容產線** 與雙語語音／歌聲引擎（詳見 [DEV_LOG.md](DEV_LOG.md)）：
1. **每日《哈Gemi早報》**（`1920×1080`）：抓取新聞 → 查重寫稿 → Playwright 網頁截圖 → GPT-SoVITS 雙語配音與對嘴 → Remotion 渲染 → 封面縮圖 → YouTube 上傳與章節/CC 字幕匯出。
2. **直式 YouTube Shorts**（`1080×1920`）：單點快訊與技術科普短影音（`ShortBriefing.tsx`）。
3. **深色紀實長片**（`1920×1080`）：多章節深度專題紀錄片（`Documentary.tsx`），支援 12 位 AI 模型娘群像素材庫。
4. **AI 翻唱與 MV 管線**：`yt-dlp` 抓源 → `audio-separator`（`UVR-MDX-NET-Voc_FT`）人聲分離 → 本地 CPU RVC（Applio V3.7.2 + `rmvpe` + `contentvec`）歌聲轉換 → `scipy` 毫秒級自動對齊 → **`rvc_pro_mix.py`（Pedalboard + Pyloudnorm 專業混音母帶）**／`ffmpeg` 降調處理。

---

## 🐱 角色人設與文案基準

* **核心人設聖經**：[knowledge/hagemy-persona.md](knowledge/hagemy-persona.md)（全頻道共用，獨立於各工作流 Skill）
  * **身分定位**：Google 出身、搬出來在外獨立生活的自由創作者；這個頻道是基米自己的，《哈Gemi早報》只是她眾多企劃與工作之一。
  * **性格基調**：80% 元氣開朗、精力旺盛 ＋ 20% 誰都敢哈氣的小辣椒反差（頭號雷區「北美大豆包」、偶發「極其」彩蛋、頭尾招牌「喵」口癖）。
* **圈內梗詞庫**：[knowledge/human-meme-kb/meme-lab/README.md](knowledge/human-meme-kb/meme-lab/README.md)

---

## 🚀 在新對話中怎麼開始？

當你開啟一個新的 Antigravity 對話時，只需要直接輸入：

> **「幫我跑今天的哈Gemi早報工作流」**（或 **「做今天的早報上傳吧」**）

Antigravity 會自動載入 [SKILL.md](.agent/skills/hagemy-daily-briefing/SKILL.md) 與 [hagemy-persona.md](knowledge/hagemy-persona.md)，依序完成：
1. **抓取今日新聞**：執行 `scripts/fetch_news.py` 產出 `output/YYYY-MM-DD/raw_news.json`（需外網權限）。
2. **查重與撰寫腳本**：比對 `output/history.json` 排除已播報新聞，參考 `output/2026-11-22/briefing.json` 黃金範本與 `knowledge/human-meme-kb` 詞庫，產出 `output/YYYY-MM-DD/briefing.json` 並更新 `history.json`。
3. **產片與上傳**：執行 `scripts/produce_episode.py --date YYYY-MM-DD --upload`，預設以 `private` 私人草稿上傳至 YouTube 並自動設定封面縮圖。

---

## 🛠️ 常用指令速查

### 1. 每日早報（抓取 → 產片 → 上傳）
```powershell
# 只抓今日新聞
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\fetch_news.py

# 一鍵產片（不上傳）
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date YYYY-MM-DD

# 一鍵產片並上傳 YouTube（預設 private）
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date YYYY-MM-DD --upload
```
局部重跑參數（`produce_episode.py`）：
* `--skip-screenshots`：跳過 Playwright 網頁截圖
* `--skip-audio`：跳過 GPT-SoVITS 配音（只改畫面排版時最快）
* `--skip-video`：跳過 Remotion MP4 渲染
* `--skip-thumbnail`：跳過封面縮圖渲染
* `--privacy private|unlisted|public`：指定上傳隱私狀態（預設 `private`）

### 2. 直式 Shorts（`9:16`）與深度紀實長片
```powershell
# 產出直式 Shorts
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_short.py --dir output/shorts/<資料夾名稱>

# 產出深色紀實長片（支援 --only-section 單章重配）
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_longform.py --dir output/longform/<主題資料夾>
```

### 3. AI 翻唱自動化工作流（RVC ＋ 專業調音混音）
```powershell
# 一鍵執行 yt-dlp 下載 → audio-separator 人聲分離 → 本地 CPU RVC 推論 → 自動對齊 → 基礎混音
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_cover.py

# 使用新調音引擎（Pedalboard + Pyloudnorm + Librosa）：輸出 24-bit WAV 與 V0 MP3
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\rvc_pro_mix.py --vocal output/covers/<歌名>/gemini_rvc_vocal_clean.wav --inst output/covers/<歌名>/inst_pitch_-2.wav --out-wav output/covers/<歌名>/gemini_pro_mix.wav --out-mp3 output/covers/<歌名>/gemini_pro_mix.mp3
```
局部重跑與調音說明：
* `produce_cover.py`：`--skip-sep`（跳過分離）、`--skip-rvc`（跳過 RVC）、`--skip-mix`（跳過基礎混音）。
* `rvc_pro_mix.py`：支援頻譜診斷、NoiseGate、外科手術 EQ（350Hz 去塑膠感／6.5kHz 去齒音／11kHz 空氣感）、並聯阻尼殘響、ITU-R BS.1770-4 LUFS 自動響度對齊與 `-1.0 dBTP` Limiter；若伴奏需降調（如 `-2` 半音），需先以 `ffmpeg rubberband` 處理伴奏後再傳入 `--inst`。
* **高音／八度跳音防呆**：若分離後的乾軌殘留低頻伴奏導致 `rmvpe` 誤判八度瞬跳，可先對乾軌做 `220 Hz` 高通濾波再進 RVC 推論。

---

## 📂 專案結構導覽

| 路徑 | 說明 |
|:---|:---|
| [knowledge/hagemy-persona.md](knowledge/hagemy-persona.md) | 哈Gemi（基米）核心人設設定集（全頻道企劃共用） |
| [knowledge/human-meme-kb/meme-lab/README.md](knowledge/human-meme-kb/meme-lab/README.md) | 文案靈感與圈內梗詞庫 |
| [WORKFLOW.md](WORKFLOW.md) | 每日早報製作 3 步驟精簡手冊 |
| [DEV_LOG.md](DEV_LOG.md) | 完整系統架構演進、各產線迭代紀錄與問題排錯日誌 |
| [.agent/skills/hagemy-daily-briefing/SKILL.md](.agent/skills/hagemy-daily-briefing/SKILL.md) | Antigravity 早報自動化製作 Skill 規範 |
| [sources.json](sources.json) | 新聞抓取來源設定（官方部落格、科技媒體、HN、GitHub Trending、HF Daily Papers、Reddit） |
| [assets/voice/voices.json](assets/voice/voices.json) | 多角色語音配置（含 `gemini` / `claude` GPT-SoVITS 權重與 `gemini.rvc` 歌聲參數） |
| [assets/models/catalog.json](assets/models/catalog.json) | 12 位 AI 模型娘去背立繪與三視圖素材庫索引 |
| [scripts/fetch_news.py](scripts/fetch_news.py) | 抓取最新新聞至 `output/YYYY-MM-DD/raw_news.json` |
| [scripts/capture_screenshots.py](scripts/capture_screenshots.py) | 使用 Playwright 擷取專欄真實網頁截圖 |
| [scripts/generate_gsv_audio.py](scripts/generate_gsv_audio.py) | 呼叫本地 GPT-SoVITS 合成雙語配音與 30fps 對嘴時間軸 |
| [scripts/export_yt_meta.py](scripts/export_yt_meta.py) | 產生 YouTube 推薦標題（頻道名後置）、章節時間軸、`subtitles.srt` CC 字幕與版權聲明 |
| [scripts/upload_youtube.py](scripts/upload_youtube.py) | 透過 YouTube Data API v3 上傳影片、縮圖與 `.srt` CC 字幕 |
| [scripts/produce_episode.py](scripts/produce_episode.py) | 早報總控腳本（串接截圖、配音、Remotion 渲染、資訊欄與上傳） |
| [scripts/produce_short.py](scripts/produce_short.py) | 直式 `1080×1920` YouTube Shorts 總控腳本 |
| [scripts/produce_longform.py](scripts/produce_longform.py) | 深色紀實長片（`Documentary.tsx`）總控腳本 |
| [scripts/produce_cover.py](scripts/produce_cover.py) | AI 翻唱總控腳本（分離、本地 CPU RVC 推論、自動對齊與基礎混音） |
| [scripts/rvc_pro_mix.py](scripts/rvc_pro_mix.py) | 進階 AI 翻唱調音與母帶引擎（Pedalboard EQ/壓縮/並聯殘響 + Pyloudnorm LUFS 對齊） |
| [scripts/train_hajimi_clean.py](scripts/train_hajimi_clean.py) | 使用 UVR5 分離後的純人聲乾軌進行 GPT-SoVITS CPU 微調訓練 |
| [output/history.json](output/history.json) | 歷屆已報導的 URL 與主題紀錄（用於每日去重） |

---

## 📌 目前狀態與接手注意事項

* **已完成內容產出**：
  * **早報**：`2026-11-22`、`2026-11-23`、`2026-11-24`（均已登錄於 [output/history.json](output/history.json)）。
  * **Shorts 與長片**：已產出黎曼猜想／黃仁勳回鍋 Shorts，以及 10 章節深色紀實長片《開源逆襲戰》（8.4 分鐘）。
  * **AI 翻唱**：已完成《又三郎》日語翻唱混音調校（`v4_balanced`），並完成《アルジャーノン》降 2 半音翻唱（`220 Hz` 高通修復全曲 `rmvpe` 八度跳音）、[rvc_pro_mix.py](scripts/rvc_pro_mix.py) 低空間感專業混音與雙語 LRC 歌詞製作。
* **語音與歌聲模型狀態**：
  * **口播（GPT-SoVITS v2）**：以 OBS 內錄 ＋ UVR5（`HP5_only_main_vocal`）清洗的 104 段乾軌完成微調，目前預設 `hajimi_clean-e12.ckpt` ＋ `hajimi_clean_e6_s312.pth` 搭配 `ref_hajimi_clean.wav`；另於 [voices.json](assets/voice/voices.json) 預留 `claude` 音色。
  * **翻唱（Applio RVC V3.7.2）**：於 Colab T4 GPU 完成 250 epochs 訓練（`hajimi_200e_5600s.pth` / `hajimi_250e_7000s.pth` + `hajimi.index`），預設日語推論參數為 `rmvpe`、`default_pitch: -2`、`index_rate: 0.13`、`volume_envelope: 0.25`、`protect: 0.5`。
* **每日自動排程與 CC 字幕提醒**：已設定每日 `07:40` 自動產出早報與精選 Shorts。現行 `token.json` 僅含 `youtube.upload` scope，自動上 `.srt` CC 字幕會回傳 `403`（不中斷主片上傳）；若要全自動上字幕需以 `youtube.force-ssl` 重新授權。
* **沙盒與系統環境提醒**：
  * 執行 `fetch_news.py`、Playwright 截圖、Remotion 渲染與 YouTube 上傳時需要對外網路或解除多進程限制，在 Antigravity 中需以 `BypassSandbox: true` 執行。
  * GPT-SoVITS / RVC（CPU 模式）與 Remotion 渲染耗時較長，建議將 Windows 電源設定的「睡眠」設為「永不」，避免背景任務中斷。
  * YouTube 上傳預設為 `private` 草稿，建議人工快速檢查配音與畫面無誤後，再於 YouTube Studio 手動公開。

---

## ©️ 虛擬角色形象與版權聲明

本頻道虛擬角色「哈Gemi」形象衍生自 B 站畫師 `@ZipZipPipe` 創作之「Gemini 娘」擬人設定。  
本頻道基於原作設定進行二次創作與 AI 動作表情繪製，依原作者聲明採用「創用 CC 姓名標示－非商業性－相同方式分享 4.0 國際授權條款 (CC BY-NC-SA 4.0)」釋出：  
https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant  
（本頻道僅作非商業性科技資訊分享與二創交流，未開啟任何商業營利。）
