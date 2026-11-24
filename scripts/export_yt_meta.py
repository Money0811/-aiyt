"""Generate YouTube title, description with exact MM:SS chapters, and tags from briefing & timeline."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CIRCLED_NUMS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"]


def fmt_mmss(seconds: float) -> str:
    total = int(round(seconds))
    m, s = divmod(total, 60)
    return f"{m:02d}:{s:02d}"


def fmt_srt_time(seconds: float) -> str:
    ms_total = max(0, int(round(seconds * 1000)))
    h, rem = divmod(ms_total, 3600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def export_srt(ep_dir: Path, timeline: dict) -> Path:
    fps = float(timeline.get("fps", 30))
    segs = timeline.get("segments", {})
    order = ["cover", "agenda"] + [
        k for k in segs.keys() if k.startswith("col_")
    ] + ["flash", "outro"]

    srt_blocks: list[str] = []
    cue_idx = 1
    offset_frames = 0
    for seg_key in order:
        seg = segs.get(seg_key)
        if not seg:
            continue
        for sub in seg.get("subtitles", []):
            start_sec = (offset_frames + sub["start_frame"]) / fps
            end_sec = (offset_frames + sub["end_frame"]) / fps
            if end_sec <= start_sec:
                end_sec = start_sec + 0.3
            srt_blocks.append(
                f"{cue_idx}\n{fmt_srt_time(start_sec)} --> {fmt_srt_time(end_sec)}\n{sub['text']}\n"
            )
            cue_idx += 1
        offset_frames += int(seg.get("duration_frames", 0))

    srt_path = ep_dir / "subtitles.srt"
    srt_path.write_text("\n".join(srt_blocks), encoding="utf-8")
    print(f"Exported CC subtitles to {srt_path} ({cue_idx - 1} cues)")
    return srt_path


def export_meta(date_str: str = "2026-11-22") -> Path:
    ep_dir = ROOT_DIR / "output" / date_str
    briefing = json.loads((ep_dir / "briefing.json").read_text(encoding="utf-8"))
    timeline = json.loads((ep_dir / "timeline.json").read_text(encoding="utf-8"))
    export_srt(ep_dir, timeline)

    segs = timeline["segments"]
    col_count = len(briefing["columns"])
    flash_count = len(briefing["flash_news"])

    # Title with channel name moved to the end for better mobile CTR
    c2_title = briefing["columns"][1]["header_title"] if col_count > 1 else ""
    c3_title = briefing["columns"][2]["header_title"] if col_count > 2 else ""
    title = (
        f"{briefing['cover']['headline']}"
        f"{c2_title}，{c3_title}｜{briefing['channel_name']}"
    )

    # Calculate exact chapter timestamps from timeline.json
    cursor = 0.0
    chapters_lines = [f"{fmt_mmss(cursor)} 片頭"]
    cursor += segs["cover"]["duration_sec"] + segs["agenda"]["duration_sec"]

    for idx, col in enumerate(briefing["columns"]):
        seg_key = f"col_{col['index']}"
        num_icon = CIRCLED_NUMS[idx] if idx < len(CIRCLED_NUMS) else f"{col['index']}."
        chapters_lines.append(f"{fmt_mmss(cursor)} {num_icon} {col['header_title']}：{col['card_title']}")
        cursor += segs[seg_key]["duration_sec"]

    # Split flash segment duration evenly across flash items for chapter listing
    flash_dur = segs["flash"]["duration_sec"]
    per_flash = flash_dur / max(1, flash_count)
    for f_idx, f_item in enumerate(briefing["flash_news"]):
        t_start = cursor + f_idx * per_flash
        short_title = f_item["title"].split("：")[0][:24]
        chapters_lines.append(f"{fmt_mmss(t_start)} 快訊：{short_title}")
    cursor += flash_dur

    chapters_lines.append(f"{fmt_mmss(cursor)} 片尾")

    # Source links section
    sources_lines = ["📎 本集新聞來源："]
    for col in briefing["columns"]:
        for url in col.get("sources", [])[:2]:
            sources_lines.append(f"• {col['header_title']}: {url}")

    month_day = briefing["date"].split("-")
    date_zh = f"{int(month_day[1])}月{int(month_day[2])}日"

    description = "\n".join(
        [
            f"早安喵！{date_zh}，{col_count} 條重點正式新聞與 {flash_count} 條快訊。新聞窗口：過去 36 小時（台北時間）。",
            "",
            *chapters_lines,
            "",
            *sources_lines,
            "",
            f"資訊整理：Antigravity｜畫面：哈Gemi｜播報：哈Gemi",
            "#AI新聞 #人工智慧 #哈Gemi早報 #科技早報 #AI趨勢",
            "",
            "---",
            "【虛擬角色形象與版權聲明】",
            "本片虛擬角色「哈Gemi」形象衍生自 B 站畫師 @ZipZipPipe 創作之「Gemini 娘」擬人設定。",
            "本頻道基於原作設定進行二次創作與 AI 動作表情繪製，依原作者聲明採用「創用 CC 姓名標示－非商業性－相同方式分享 4.0 國際授權條款 (CC BY-NC-SA 4.0)」釋出：",
            "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant",
            "（本頻道僅作非商業性科技資訊分享，未開啟任何商業營利。）",
        ]
    )

    meta_text = f"=== 推薦標題 ===\n{title}\n\n=== 資訊欄簡介（含時間軸）===\n{description}\n"
    out_path = ep_dir / "youtube_meta.txt"
    out_path.write_text(meta_text, encoding="utf-8")
    print(f"Exported YouTube metadata to {out_path}")
    return out_path


if __name__ == "__main__":
    date_arg = sys.argv[1] if len(sys.argv) > 1 else "2026-11-22"
    export_meta(date_arg)
