# 哈Gemi早報 — 每日製作工作流手冊

這份專案已經把「抓新聞 → AI 篩選寫稿 → 真實網頁截圖 → GPT-SoVITS 配音對嘴 → Remotion 渲染 → 封面縮圖 → 上傳 YouTube」串成完整工作流。

## 每日製作 3 步驟

### 步驟 1：抓今日新聞
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\fetch_news.py
```
* 自動抓取官方部落格、科技媒體、Hacker News、GitHub Trending、HF Daily Papers，存成 `output/YYYY-MM-DD/raw_news.json`。

### 步驟 2：在 Antigravity 產出文案（不接外部 API）
直接在對話中說：「**幫我跑今天的哈Gemi早報工作流**」。
Antigravity 會自動：
1. 讀取 `raw_news.json` 並對照 `output/history.json` 排除過去重複新聞。
2. 濾除純教學與無關新聞，選出 5 條專欄＋5～6 條快訊。
3. 參考 `knowledge/human-meme-kb` 詞庫撰寫繁體中文 `briefing.json`（保留阿拉伯數字與 `哈Gemi早報` 字幕），並更新 `history.json`。

### 步驟 3：一鍵產片（與上傳 YouTube）
產出完整影片、縮圖與 YouTube 時間軸簡介：
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date 2026-11-22
```
若要同時上傳至 YouTube（預設為 `private` 私人草稿）：
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date 2026-11-22 --upload
```

### 常用局部重跑參數（`produce_episode.py`）
* `--skip-screenshots`：跳過網頁截圖
* `--skip-audio`：跳過 GPT-SoVITS 配音（只改畫面排版時超快！）
* `--skip-video`：跳過 MP4 渲染
* `--skip-thumbnail`：跳過縮圖渲染
* `--privacy private|unlisted|public`：指定上傳隱私狀態
