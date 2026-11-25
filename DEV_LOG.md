# 《哈Gemi早報》開發與迭代日誌 (DEV_LOG)

> 最後更新：2026-11-25  
> 本文件盤點「基米哈Gemi 運營中 / 《哈Gemi早報》」專案的完整檔案結構、系統架構演進、核心自動化規範（`SKILL.md` 與各腳本邏輯）以及開發過程中解決的實戰問題。

---

## 一、 專案檔案結構總覽

```text
d:\youtube\
├── .agent/skills/hagemy-daily-briefing/
│   └── SKILL.md                    # Antigravity 自動化產片總規範（查重、文風、產片）
├── assets/
│   ├── character/                  # 哈Gemi 去背立繪與閉嘴替換圖組 (normal / chibi_*)
│   ├── intro/                      # 像素風頻道自介音訊與腳本 (intro_script.json, bgm.wav, line_*.wav)
│   ├── voice/                      # 配音參考音檔 (source_voice.mp3, ref_hajimi*.wav/.txt)
│   ├── episode/                    # Remotion 渲染早報時的公開映射目錄 (staticFile('episode/...'))
│   └── short/                      # Remotion 渲染 Shorts 時的公開映射目錄 (staticFile('short/...'))
├── knowledge/human-meme-kb/        # 文案靈感與圈內梗詞庫 (meme-lab/README.md)
├── output/
│   ├── history.json                # 歷屆已報導 URL 與主題去重紀錄
│   ├── intro/                      # 像素風自介產出 (pixel_intro_preview.mp4, youtube_meta.txt)
│   ├── 2026-11-22/                 # 第 1 集早報產出（亦作為黃金文風範本）
│   ├── 2026-11-23/                 # 第 2 集早報產出
│   └── shorts/2026-11-22-riemann/  # 首支試水溫 YouTube Shorts（黎曼猜想 Lean 驗證）
├── scripts/
│   ├── fetch_news.py               # 抓取 6 大類新聞來源至 raw_news.json
│   ├── capture_screenshots.py      # Playwright 擷取專欄真實網頁截圖
│   ├── generate_audio.py           # [早期] edge-tts 配音與字幕時間軸腳本
│   ├── generate_gsv_audio.py       # [現行] GPT-SoVITS v2 雙語配音、發音轉換與 30fps 對嘴
│   ├── export_yt_meta.py           # 產出標題、精準 MM:SS 章節時間軸與 CC 授權聲明
│   ├── upload_youtube.py           # YouTube Data API v3 上傳腳本（支援 --video / --meta）
│   ├── produce_episode.py          # 日更早報一鍵總控腳本（支援局部 --skip-* 重跑）
│   ├── produce_short.py            # 直式 9:16 Shorts 一鍵總控腳本
│   ├── train_hajimi_cpu.py         # GPT-SoVITS v2 Windows CPU 微調訓練自動化腳本
│   ├── prepare_pixel_intro.py      # 像素風頻道自介音訊與腳本前處理
│   └── remove_bg.py                # 角色立繪去背處理工具
├── studio/                         # Remotion 影片渲染專案 (publicDir: ../assets)
│   └── src/
│       ├── Root.tsx                # 註冊 MorningBriefing / ThumbnailCover / PixelIntro / ShortBriefing
│       ├── components/NewsLayout.tsx
│       └── compositions/
│           ├── MorningBriefing.tsx # 1920x1080 橫式日更早報主模板
│           ├── ThumbnailCover.tsx  # 1920x1080 普普漫畫風封面縮圖
│           ├── PixelIntro.tsx      # 純代碼像素風頻道自我介紹
│           ├── PreviewScenes.tsx   # 版型預覽測試場景
│           └── ShortBriefing.tsx   # 1080x1920 直式 YouTube Shorts 模板
├── tools/GPT-SoVITS/               # 本地 GPT-SoVITS v2 推論與微調環境
├── sources.json                    # 新聞抓取來源設定
├── README.md                       # 專案導覽與新對話接手指南
├── WORKFLOW.md                     # 每日製作 3 步驟精簡手冊
└── DEV_LOG.md                      # 本開發與迭代日誌
```

---

## 二、 系統架構演進

### 階段 1：角色視覺與純代碼開台
* **角色素材與版權確立**：採用 B 站畫師 `@ZipZipPipe`「Gemini 娘」二創設定，透過 [remove_bg.py](file:///d:/youtube/scripts/remove_bg.py) 去背並建立開合嘴成對圖檔（如 `opening_normal.png` / `opening_normal_closed.png`、`chibi_excited.png` / `chibi_excited_closed.png`），於所有輸出資訊欄內建 `CC BY-NC-SA 4.0` 聲明。
* **純代碼像素風自介**：透過 [prepare_pixel_intro.py](file:///d:/youtube/scripts/prepare_pixel_intro.py) 與 [PixelIntro.tsx](file:///d:/youtube/studio/src/compositions/PixelIntro.tsx)，以純代碼生成房間背景、LIVE 狀態列、對話框與 8-bit 音效，驗證 Remotion 渲染管線。

### 階段 2：語音引擎演進（雲端 TTS → 本地 Zero-Shot → 專屬微調）
1. **初代 `edge-tts`（[generate_audio.py](file:///d:/youtube/scripts/generate_audio.py)）**：早期使用微軟雲端 TTS 搭配 `PADDING_SEC = 0.45` 產出字幕時間軸，作為原型驗證。
2. **二代本地 GPT-SoVITS v2 Zero-Shot（[generate_gsv_audio.py](file:///d:/youtube/scripts/generate_gsv_audio.py)）**：改用本地 GPT-SoVITS v2 預訓練底模搭配 `ref_hajimi_mix.wav` 進行零樣本音色克隆，並實作 **30fps RMS 能量對嘴計算（`compute_mouth_open`）**，驅動畫面角色張閉嘴同步。
3. **三代 CPU 微調專屬模型（[train_hajimi_cpu.py](file:///d:/youtube/scripts/train_hajimi_cpu.py)）**：為解決 Zero-Shot 偶發音色飄移與中英混讀不穩，將 2 分鐘原始音檔 [source_voice.mp3](file:///d:/youtube/assets/voice/source_voice.mp3) 切分為 33 段 2.4～6.3 秒片段，以 `faster-whisper` (`small`, `int8`) 轉錄並校正科技專有名詞後，在本地 6 核 CPU 上完成微調：
   * **SoVITS 音色模型**：8 epochs → `SoVITS_weights_v2/hajimi_e8_s400.pth`
   * **GPT 韻律模型**：15 epochs（`top_3_acc_epoch: 0.999`）→ `GPT_weights_v2/hajimi-e15.ckpt`
   * 已更新 [tts_infer.yaml](file:///d:/youtube/tools/GPT-SoVITS/GPT_SoVITS/configs/tts_infer.yaml) `custom` 預設權重，並產出試聽檔 [test_finetuned.wav](file:///d:/youtube/output/test_finetuned.wav)。

### 階段 3：半自動化日更產線（`2026-11-22` ～ `2026-11-23`）
* 打通 **「抓取新聞 → Antigravity 查重寫稿 → Playwright 網頁截圖 → GPT-SoVITS 配音對嘴 → Remotion 1080p 渲染 → 封面縮圖 → YouTube 時間軸匯出與草稿上傳」** 完整閉環。
* **關鍵決策**：腳本撰寫**不串接外部 LLM API**，而是由使用者在 Antigravity 對話中觸發 [SKILL.md](file:///d:/youtube/.agent/skills/hagemy-daily-briefing/SKILL.md)，直接由主對話讀取 `raw_news.json` 與黃金範本撰寫 `briefing.json`，省去外部 API 成本並確保文風與去重品質可控。

### 階段 4：直式 YouTube Shorts 擴充
* 新增 `1080×1920` 直式模板 [ShortBriefing.tsx](file:///d:/youtube/studio/src/compositions/ShortBriefing.tsx)（字幕與立繪避開 YouTube Shorts 底部與右側 UI 遮擋區）與獨立產片腳本 [produce_short.py](file:///d:/youtube/scripts/produce_short.py)，使用獨立的 `assets/short/` 目錄避免覆蓋每日早報素材。
* 已完成首支測試片 [short_2026-11-22_riemann.mp4](file:///d:/youtube/output/shorts/2026-11-22-riemann/short_2026-11-22_riemann.mp4)（33.19 秒 / 996 幀）並上傳為 YouTube `private` 草稿（ID：`olHUk3DEGD4`）。

---

## 三、 核心 Prompt 與自動化規範設計邏輯

### 1. `SKILL.md` 三階段控制邏輯
* **階段一（抓新聞）**：執行 [fetch_news.py](file:///d:/youtube/scripts/fetch_news.py)，從 [sources.json](file:///d:/youtube/sources.json) 抓取過去時間窗口內的官方部落格（OpenAI、Google AI、DeepMind、HF、Anthropic）、科技媒體（TechCrunch、The Verge、MIT Tech Review）、Hacker News（`min_points: 50`）、GitHub Trending（全語言/Python/TypeScript）、HF Daily Papers 與 Reddit。
* **階段二（查重與寫稿）**：
  * **去重機制**：嚴格比對 [history.json](file:///d:/youtube/output/history.json) 中的 `covered_urls` 與 `covered_topics`（例如 `2026-11-23` 從 73 條原始新聞中排除了 10 條歷史重複與 19 條純教學／無關新聞），並將同一事件的多來源網址合併至單一專欄的 `sources` 陣列。
  * **文風鎖定**：以 `output/2026-11-22/briefing.json` 為黃金範本，單段專欄口播維持 `100～140` 字；僅在 `cover` 與 `outro` 句尾帶「喵」，正文專欄不堆疊賣萌語氣詞；每條專欄最多自然融入 1 個 `knowledge/human-meme-kb/meme-lab/README.md` 梗。
  * **視覺版型與立繪輪替**：5 條專欄強制輪替 `evidence_zoom`、`quote_verdict`、`screenshot_bullets`、`terminal_dark`，搭配對應 Q 版立繪。
* **階段三（總控產片）**：呼叫 [produce_episode.py](file:///d:/youtube/scripts/produce_episode.py) 串接所有產出並匯出 `youtube_meta.txt`。

### 2. 發音轉換與字幕分離機制（[generate_gsv_audio.py](file:///d:/youtube/scripts/generate_gsv_audio.py)）
為兼顧「畫面專業度」與「TTS 唸讀自然度」，採用**顯示文本與 TTS 文本分離**策略（`to_tts_text()`）：
* **品牌唸法替換**：畫面與字幕保留 `哈Gemi早報`，TTS 背景轉為 `哈基米早报`；`Nasdaq` → `那斯达克`、`Android` → `安卓`。
* **數字讀法標準化（`_int_to_zh`）**：畫面保留阿拉伯數字（`5.2`、`5.4G`、`1,084`、`87%`）；TTS 自動將百分比轉為「百分之八十七」、小數轉為「五點二」（避免英文單字後被唸成 `five point two`）、模型連字號 `Inkling-2-Mini` 轉空白、其餘整數轉中文數字。
* **中英邊界韻律優化**：在中英文交界自動插入空白，並在每句間加入 `PAUSE_SEC = 0.14` 秒停頓與句尾 `TAIL_PADDING_SEC = 0.35` 秒緩衝，最後計算 30fps 二值化 `mouth_open` 陣列供 Remotion 對嘴。

### 3. 局部重跑參數設計（[produce_episode.py](file:///d:/youtube/scripts/produce_episode.py)）
針對耗時步驟提供細粒度跳過參數，加速迭代調校：
* `--skip-screenshots`：跳過 Playwright 網頁截圖（網路來源未變時使用）
* `--skip-audio`：跳過 GPT-SoVITS CPU 配音（**只調整 Remotion 排版時最快**）
* `--skip-video`：跳過 Remotion MP4 渲染
* `--skip-thumbnail`：跳過 `ThumbnailCover` 縮圖渲染
* `--upload` / `--privacy private|unlisted|public`：控制是否上傳 YouTube 及隱私狀態（預設 `private`）

### 4. YouTube 章節與版權自動化（[export_yt_meta.py](file:///d:/youtube/scripts/export_yt_meta.py)）
* 讀取 `timeline.json` 各段實際 `duration_sec`，精算 `00:00 片頭` → `①～⑤ 專欄` → `快訊`（依快訊條數均分時間戳）→ `片尾` 的 `MM:SS` 章節時間軸。
* 自動附加來源連結與 `@ZipZipPipe`「哈Gemi」`CC BY-NC-SA 4.0` 非商業授權聲明。

---

## 四、 開發過程中遇到的問題與修正紀錄

| 問題現象 / 錯誤訊息 | 根因分析 | 解決方案與落地檔案 |
|:---|:---|:---|
| 沙盒內執行 `fetch_news.py`、`faster-whisper` 下載、Playwright、`upload_youtube.py` 失敗（DNS/連線失敗） | 預設終端機沙盒阻擋對外網路連線 | 僅將需要聯網的步驟以 `BypassSandbox: true` 執行，其餘前處理與音訊合成維持沙盒內運行 |
| 沙盒內執行 Remotion `render` 於 `Rendered 0/996` 報 `Error: write EOF` | Windows 沙盒環境限制 Remotion Chromium/FFmpeg 多進程 IPC 管線 | 渲染階段改以 `BypassSandbox: true` 執行，並於 `produce_short.py` 加入 `--concurrency=2` 降低併發負載 |
| `torchaudio.load` 載入參考音檔時因缺少系統 FFmpeg 共用 DLL 報錯 | Windows `.venv` 環境未附帶對應 torchaudio FFmpeg backend | 在 `generate_gsv_audio.py` 以 `soundfile.read` 實作 `_safe_torchaudio_load` 覆寫 `torchaudio.load` 作為 fallback |
| 執行 GPT-SoVITS 切片與訓練腳本報 `ModuleNotFoundError: No module named 'gradio_client.serializing'` | `tools/my_utils.py` 頂層 `import gradio as gr` 與環境內套件版本不相容；且 Windows `DataLoader` `spawn` 子進程不會繼承主進程 `sys.modules` stub | 在 `logs/hajimi/_stub/gradio.py` 建立空模組存根，並透過 `PYTHONPATH` 注入讓主進程與所有 `DataLoader` 子進程繼承 |
| `s2_train.py` 啟動報 `AttributeError: 'HParams' object has no attribute 'version'` | `configs/s2.json` 預設未顯式包含 `model.version` 欄位 | 在 `train_hajimi_cpu.py` 寫入 `s2_hajimi.json` 時顯式補上 `model.version = "v2"`，並設 `fp16_run = False` 相容純 CPU |
| `s2_train.py` 於 Epoch 4 存檔時報 `FileNotFoundError` (`logs_s2_v2` 不存在) | `s2_train.py` 未自動建立 `logs_s2_v2` 子目錄 | 在 `train_hajimi_cpu.py` 啟動訓練前預先 `mkdir` 建立 `logs_s2_v2` 與 `logs_s1_v2` |
| `s1_train.py` 啟動報 `ValueError: prefetch_factor option could only be specified in multiprocessing` | `AR/data/data_module.py` 寫死了 `prefetch_factor`，與 `num_workers=0` 衝突 | 搭配上述 `PYTHONPATH` 存根機制，將 `s1_hajimi.yaml` 的 `data.num_workers` 設為 `2` 且 `precision: "32-true"` 順利完成訓練 |
| `upload_youtube.py` 上傳 Shorts 時標題簡介無法解析 | 原先 `parse_meta()` 僅認 `=== 資訊欄簡介（含時間軸）===` 且寫死讀取 `output/<date>/youtube_meta.txt` | 擴充 `parse_meta()` 同時相容 `=== 資訊欄簡介 ===`，並新增 `--meta` 參數支援指定 Shorts 的 metadata 檔案 |

---

## 五、 2026-11-24 後續迭代紀錄（乾淨語料重訓、長片系統與日更優化）

### 1. 語音「糊聲／底噪」根因定位與 UVR5 乾淨重訓
* **根因診斷**：聲學頻譜分析顯示舊訓練檔 `source_voice.mp3`（因經過 MP4 錄影＋網頁轉 MP3 多次有損壓縮，且原片帶有 BGM）信噪比僅 `22.2 dB`、`85%` 頻譜滾降點僅 `4,305 Hz`；參考音 `ref_hajimi_mix.wav` 僅 `17.9 dB`，導致微調權重學進悶糊感與低頻底噪（單靠 95Hz 高通濾波無法消除 150Hz–3.5kHz 頻段內混入的 BGM 糊聲）。
* **解決方案**：改用 OBS 內錄取得 `2026-11-24 00-33-36.mp4`（8 分 26 秒），以 `ffmpeg` 無損抽出 44.1kHz WAV（`obs_raw.wav`，SNR `24.7 dB`）後，透過 `tools/GPT-SoVITS/tools/uvr5` 搭配 `HP5_only_main_vocal.pth` 徹底剝離 BGM，實測靜音底噪降至 `0.00000`（估算 SNR 達 `158.3 dB`）。
* **重新微調成果**：切出 104 段乾淨片段並以 `faster-whisper` 標註校正後，透過 [train_hajimi_clean.py](file:///d:/youtube/scripts/train_hajimi_clean.py) 完成 CPU 微調（SoVITS 6 epochs → `hajimi_clean_e6_s312.pth`、GPT 12 epochs → `hajimi_clean-e12.ckpt`），並將預設參考音替換為 `ref_hajimi_clean.wav`。

### 2. 深色紀實長片管線與 12 位 AI 模型娘素材庫
* **模型娘素材庫**：整理 12 位 AI 模型角色（`gemini`、`gpt`、`claude`、`grok`、`llama`、`mistral`、`deepseek`、`qwen`、`kimi`、`glm`、`seed`、`ernie`）至 [assets/models/catalog.json](file:///d:/youtube/assets/models/catalog.json)，並以 `remove_bg.py` 為登場角色批次去背成透明 `.png`。
* **長片模板與腳本**：建立深色紀實長片模板 [Documentary.tsx](file:///d:/youtube/studio/src/compositions/Documentary.tsx) 與總控 [produce_longform.py](file:///d:/youtube/scripts/produce_longform.py)，完成 10 章節《開源逆襲戰：從絕望差距到掀翻牌桌》（8.4 分鐘）渲染；同時修復了 `sec_02` 誤配不同姿勢立繪導致 1 分鐘處 Q 版瘋狂閃爍的問題（改為成對開合嘴圖檔＋3 幀平滑取樣）。

### 3. 早報節奏、CC 字幕與每日自動化排程
* **文案與標題優化**：[SKILL.md](file:///d:/youtube/.agent/skills/hagemy-daily-briefing/SKILL.md) 改為目錄頁「一句話總結帶過」（25～45 字）；[export_yt_meta.py](file:///d:/youtube/scripts/export_yt_meta.py) 將「哈Gemi早報」移至標題尾端並自動產出精準時間軸的 `subtitles.srt` CC 字幕。
* **每日排程實戰（`2026-11-24`）**：設定每日 `07:40` 排程，自動完成今日 94 條新聞抓取、去重寫稿、早報（`NQM5Ie123F8`）與黃仁勳回鍋 Shorts（`ZlIHdLKmqec`）公開發布。
  * *待優化筆記*：現行 `token.json` 僅含 `youtube.upload` scope，呼叫 `captions.insert` 上傳 `.srt` 時會回傳 `403 insufficientPermissions`（已加防呆提示不中斷主片上傳）；若需全自動上 CC 字幕，後續需以 `youtube.force-ssl` 重新授權 `token.json`。

---

## 六、 2026-11-25 哈基米 RVC 模型建置與《又三郎》日語翻唱混音實戰

### 1. RVC 隔離環境建置與算力路線決策
* **環境隔離**：將 **Applio (RVC V3.7.2)** 複製至 `tools/RVC/`（已由 `.gitignore` 忽略），建立獨立虛擬環境 `tools/RVC/.venv`（`torch==2.9.1+cpu`）並新增一鍵啟動檔 `tools/RVC/run-rvc-cpu.bat`，避免與 `GPT-SoVITS` 依賴衝突。
* **AMD 內顯實測與雲端訓練分工**：
  * 實測本機顯示卡為 `AMD Radeon(TM) 840M Graphics`，驗證 `tools/GPT-SoVITS/.venv-rocm` 的 `torch 2.9.1+rocm7.2.1` 回傳 `is_available: False`，確認 Windows 版 ROCm 7.2.1 不支援此內顯（隨即中止下載 CUDA/ROCm 大檔節省 20 Mbps 頻寬）。
  * 因 RVC / Applio 基於 PyTorch CUDA，**不支援 TPU（XLA）**，改採 **Google Colab 免費 T4 GPU 訓練 ＋ 本地輕量 CPU 保留推論** 之架構。

### 2. 雲端訓練成果與模型歸位
* 直接沿用先前 UVR5 清洗好的 104 段哈基米語料（`tools/GPT-SoVITS/output/hajimi_obs_slicer`，32kHz、共 `452.7 秒` / 約 7.5 分鐘，打包為 `22.96 MB`）。
* 於 Colab T4 GPU 以 `40k / v2`、`rmvpe`、`Batch Size = 8`、`Total Epochs = 250` 完成訓練（約 20 秒/epoch）並生成特徵索引。
* 產出權重 `hajimi_200e_5600s.pth`、`hajimi_250e_7000s.pth` 與 `hajimi.index` 已下載並歸位至 `tools/RVC/logs/hajimi/`。

### 3. 《又三郎》日語翻唱問題排查與混音調校紀錄

| 問題現象 / 使用者回饋 | 排查與數據分析結果 | 最終解決方案 |
|:---|:---|:---|
| YouTube 網頁下載器音質糊（僅 128 kbps）＋ 確認《又三郎》版權 | 確認《又三郎》詞曲屬 JASRAC（YouTube 有包括契約），但嚴禁使用原曲錄音／MV（原盤權）；第三方網頁下載會二次壓損音質 | 改用 `uvx yt-dlp` 直抓最高音質串流無損轉 `.wav`，並搭配可二創翻唱人聲導唱與獨立 `Off Vocal` 伴奏 |
| `UVR-MDX-NET-Inst_HQ_3.onnx` 拆人聲仍殘留伴奏 | `Inst_HQ_3` 偏重提取伴奏，對某些編曲的人聲殘留較多 | 改用人聲專用模型 **`UVR-MDX-NET-Voc_FT.onnx`** 分離出乾淨純人聲乾聲 |
| 第一版導唱副歌與 1:16–1:19 嚴重破音、電音劈裂 | 使用者聽測定位為「主唱於尾音與副歌疊了同一人的密集和聲補高音」；RVC 單音高線遇雙聲部疊音必劈裂，且說話語料超出超高音域產生聲碼器電子音 | 更換為純單人聲導唱（`dj2Tt9-yvIg`），並將 `Pitch` 降 **`-2`** 避開臨界破音 |
| 日語咬字「含滷蛋／大舌頭」，且換 `fcpe` 後反而更破 | `Index Rate` 偏高（`0.3+`）帶入中文舌位特徵；確認 Applio V3.7.2 已移除 UI 的 `Filter Radius`，且 `fcpe` 在氣音尾段不如 `rmvpe` 穩定 | 鎖定 **`rmvpe`** ＋ **`Index Rate = 0.13`** ＋ **`Protect = 0.5`** ＋ **`Volume Envelope = 0.25`** |
| 初版混音「太空靈」→ 去混響版「KTV 乾唱感重」→ 第三版「伴奏蓋過人聲」 | 相關性實測前後 60 秒延遲皆為 `-0.96s`（無跑拍）；實測人聲發聲段 RMS `-14.09 dB`、伴奏 `-13.3 dB`，且人聲 **`>10kHz` 高頻能量僅 `0.024%`**。<br>• `v2` 疊加 45/75ms 長 echo 變空靈<br>• `v2_dry` 零空間＋人聲凸出 ~5 dB 變 KTV<br>• `v3` 人聲砍至 `0.88`（`makeup=1`）＋伴奏拉至 `0.90` 導致被電吉他牆淹沒 | 定案版（`v4_balanced`）：伴奏以 `ffmpeg rubberband` 降 `-2` 半音對齊調性、設 `volume=0.80` 並於 `2.8kHz` 微挖 `-1.5 dB` 讓位；人聲延遲 `960ms` 對齊、設 `volume=1.05`、補 `6.5kHz` 空氣感與極短 `12/22ms` 早期反射，最後經總線膠合壓縮與 Limiter 輸出 |


