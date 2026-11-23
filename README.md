# 哈Gemi早報 — 專案導覽與新對話接手指南

《哈Gemi早報》是一套半自動化的 AI 科技新聞日更影片生產線，將 **「抓取新聞 → 查重寫稿 → 網頁截圖 → GPT-SoVITS 雙語配音與對嘴 → Remotion 1080p 渲染 → 封面縮圖 → 上傳 YouTube 草稿」** 串接成完整工作流。

---

## 🚀 在新對話中怎麼開始？

當你開啟一個新的 Antigravity 對話時，只需要直接輸入：

> **「幫我跑今天的哈Gemi早報工作流」**（或 **「做今天的早報上傳吧」**）

Antigravity 會自動載入 [SKILL.md](.agent/skills/hagemy-daily-briefing/SKILL.md)，依序完成：
1. **抓取今日新聞**：執行 `scripts/fetch_news.py` 產出 `output/YYYY-MM-DD/raw_news.json`（需外網權限）。
2. **查重與撰寫腳本**：比對 `output/history.json` 排除已播報新聞，參考 `output/2026-11-22/briefing.json` 黃金範本與 `knowledge/human-meme-kb` 詞庫，產出 `output/YYYY-MM-DD/briefing.json` 並更新 `history.json`。
3. **產片與上傳**：執行 `scripts/produce_episode.py --date YYYY-MM-DD --upload`，預設以 `private` 私人草稿上傳至 YouTube 並自動設定封面縮圖。

---

## 🛠️ 常用指令速查

### 1. 只抓今日新聞
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\fetch_news.py
```

### 2. 一鍵產片（不上傳）
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date YYYY-MM-DD
```

### 3. 一鍵產片並上傳 YouTube（預設 `private`）
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date YYYY-MM-DD --upload
```

### 4. 局部重跑參數（`produce_episode.py`）
* `--skip-screenshots`：跳過 Playwright 網頁截圖
* `--skip-audio`：跳過 GPT-SoVITS 配音（只改畫面排版時最快）
* `--skip-video`：跳過 Remotion MP4 渲染
* `--skip-thumbnail`：跳過封面縮圖渲染
* `--privacy private|unlisted|public`：指定上傳隱私狀態（預設 `private`）

---

## 📂 專案結構導覽

| 路徑 | 說明 |
|:---|:---|
| [WORKFLOW.md](WORKFLOW.md) | 每日製作 3 步驟精簡手冊 |
| [.agent/skills/hagemy-daily-briefing/SKILL.md](.agent/skills/hagemy-daily-briefing/SKILL.md) | Antigravity 自動化製作 Skill 完整規範 |
| [sources.json](sources.json) | 新聞抓取來源設定（官方部落格、科技媒體、HN、GitHub Trending、HF Daily Papers） |
| [scripts/fetch_news.py](scripts/fetch_news.py) | 抓取最新新聞至 `output/YYYY-MM-DD/raw_news.json` |
| [scripts/capture_screenshots.py](scripts/capture_screenshots.py) | 使用 Playwright 擷取專欄真實網頁截圖 |
| [scripts/generate_gsv_audio.py](scripts/generate_gsv_audio.py) | 呼叫本地 GPT-SoVITS 合成雙語配音與對嘴時間軸（自動將字幕「哈Gemi早報」唸為「哈基米早報」） |
| [scripts/export_yt_meta.py](scripts/export_yt_meta.py) | 產生 YouTube 推薦標題、章節時間軸、`youtube_meta.txt` 與版權聲明 |
| [scripts/upload_youtube.py](scripts/upload_youtube.py) | 透過 YouTube Data API v3 上傳影片與自訂縮圖 |
| [scripts/produce_episode.py](scripts/produce_episode.py) | 串接截圖、配音、Remotion 渲染、資訊欄與上傳的一鍵總控腳本 |
| [knowledge/human-meme-kb/meme-lab/README.md](knowledge/human-meme-kb/meme-lab/README.md) | 文案靈感與圈內梗詞庫 |
| [output/history.json](output/history.json) | 歷屆已報導的 URL 與主題紀錄（用於每日去重） |
| `output/YYYY-MM-DD/` | 每日產出目錄（含 `raw_news.json`、`briefing.json`、`ha_gemi_YYYY-MM-DD.mp4`、`thumbnail.png`、`youtube_meta.txt`） |

---

## 📌 目前狀態與接手注意事項

* **最新已完成集數**：`2026-11-22`、`2026-11-23`（均已登錄於 [output/history.json](output/history.json)）。
* **版權聲明已自動化**：[scripts/export_yt_meta.py](scripts/export_yt_meta.py) 已內建「哈Gemi」虛擬角色形象與 CC BY-NC-SA 4.0 版權聲明，未來每集會自動附帶於 `youtube_meta.txt` 與 YouTube 資訊欄中。
* **沙盒與網路提醒**：執行 `fetch_news.py`、Playwright 截圖與 YouTube 上傳時需要對外網路連線，在 Antigravity 中需以 `BypassSandbox: true` 執行。
* **避免系統休眠中斷**：GPT-SoVITS（CPU 模式）與 Remotion 渲染約需 10～15 分鐘；建議將 Windows 電源設定的「睡眠」設為「永不」，避免電腦休眠導致背景任務中止。
* **發布前建議人工把關**：YouTube 上傳預設為 `private` 草稿，建議人工快速檢查配音與截圖無誤後，再於 YouTube Studio 手動公開。

---

## ©️ 虛擬角色形象與版權聲明

本片虛擬角色「哈Gemi」形象衍生自 B 站畫師 `@ZipZipPipe` 創作之「Gemini 娘」擬人設定。  
本頻道基於原作設定進行二次創作與 AI 動作表情繪製，依原作者聲明採用「創用 CC 姓名標示－非商業性－相同方式分享 4.0 國際授權條款 (CC BY-NC-SA 4.0)」釋出：  
https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant  
（本頻道僅作非商業性科技資訊分享，未開啟任何商業營利。）
