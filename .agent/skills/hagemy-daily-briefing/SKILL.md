---
name: hagemy-daily-briefing
description: End-to-end daily production workflow for 《哈Gemi早報》 AI news videos (fetch news, deduplicate against history, script with human-meme-kb, capture screenshots, GPT-SoVITS synthesis, Remotion render, thumbnail & YouTube upload).
---

# 哈Gemi早報 — 每日製作工作流 (Antigravity Skill)

當使用者要求「製作今天的早報」或「執行早報工作流」時，嚴格按照以下三階段執行：

## 階段一：抓取最新 AI 新聞
1. 執行新聞抓取腳本（產出 `output/YYYY-MM-DD/raw_news.json`）：
   ```powershell
   d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\fetch_news.py
   ```
   *(若在沙盒中遇到網路限制，使用 `BypassSandbox: true`)*

## 階段二：查重、篩選與撰寫 `briefing.json`（不接外部 API，由 Antigravity 直接產出）
1. **鎖定文風基準**：寫稿前先讀取 `output/2026-11-22/briefing.json` 作為**黃金文風範本**（維持相同 JSON 結構、節奏與單段口播字數約 `100～140` 字）。
2. **人設與語氣規範**：
   * 主播為元氣貓娘「哈Gemi」，口語自然俐落、像在跟朋友聊今天 AI 圈大事。
   * 僅在開場（`cover`）與片尾（`outro`）句尾自然帶「喵」，正文專欄不刻意堆疊賣萌語氣詞。
   * 適度參考 `knowledge/human-meme-kb/meme-lab/README.md` 詞庫，每條專欄最多自然融入 1 個圈內梗，切忌硬湊。
3. **查重與過濾規則**：
   * 讀取 `output/YYYY-MM-DD/raw_news.json` 與 `output/history.json`。
   * 排查 `output/history.json` 中已報導過的 `covered_urls` 與 `covered_topics`，絕不重複播報。
   * 去除純教學文章、工具推薦清單與非 AI/科技新聞；合併同一事件的多來源報導。
   * 依重要性挑出 **1～5 條專欄深度講解** ＋ **其餘精華（約 5～6 條）製成快訊**。
4. **文案與顯示規範**：
   * **頻道名稱**：`哈Gemi早報`（畫面與字幕保留 `哈Gemi早報`，`generate_gsv_audio.py` 會自動在背景唸成 `哈基米早報`）。
   * **數字規範**：畫面卡片與字幕統一使用**阿拉伯數字**（如 `5.2`、`5.4G`、`1,084`、`87%`）；未翻譯的模型／專案名稱維持英文（如 `Claude-BugHunter`）。
   * **版型與立繪輪替**：5 條專欄需輪替使用 `evidence_zoom`、`quote_verdict`、`screenshot_bullets`、`terminal_dark`，並搭配對應立繪（`chibi_think.png`、`chibi_chair.png`/`chibi_chair_closed.png`、`chibi_phone.png`、`chibi_excited.png`/`chibi_excited_closed.png`、`chibi_explain.png`/`chibi_explain_closed.png`）。
5. 將產出的劇本寫入 `output/YYYY-MM-DD/briefing.json`，並將本集涵蓋的 URL 與主題追加回 `output/history.json`。

## 階段三：一鍵合成配音、渲染影片與上傳 YouTube
執行 `produce_episode.py`（自動完成 Playwright 真實網頁截圖 → GPT-SoVITS 雙語配音與對嘴時間軸 → Remotion 1080p MP4 → 普普漫畫風 `thumbnail.png` → `youtube_meta.txt`）：
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date YYYY-MM-DD
```
若使用者要同步上傳 YouTube（預設 `private` 草稿）：
```powershell
d:\youtube\.venv\Scripts\python.exe d:\youtube\scripts\produce_episode.py --date YYYY-MM-DD --upload
```
