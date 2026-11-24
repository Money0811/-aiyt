"""One-click orchestrator for HaGemi Morning Briefing after briefing.json is ready.

Runs:
1. Playwright webpage screenshot capture
2. GPT-SoVITS voice synthesis + subtitle sync + lip-sync amplitude
3. Remotion full MP4 rendering
4. Remotion pop-art thumbnail rendering
5. YouTube metadata/chapters export
6. (Optional) YouTube Data API v3 upload
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
MAIN_PY = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
GSV_PY = ROOT_DIR / "tools" / "GPT-SoVITS" / ".venv" / "Scripts" / "python.exe"
REMOTION_CMD = ROOT_DIR / "studio" / "node_modules" / ".bin" / "remotion.cmd"


def run_step(title: str, cmd: list[str], cwd: Path | None = None) -> None:
    print(f"\n========== {title} ==========")
    print("CMD:", " ".join(cmd))
    subprocess.run(cmd, cwd=str(cwd or ROOT_DIR), check=True)


def main() -> None:
    default_date = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
    parser = argparse.ArgumentParser(description="HaGemi Morning Briefing Production Pipeline")
    parser.add_argument("--date", default=default_date, help="Episode date YYYY-MM-DD")
    parser.add_argument("--skip-screenshots", action="store_true", help="Skip Playwright webpage capture")
    parser.add_argument("--skip-audio", action="store_true", help="Skip GPT-SoVITS audio synthesis")
    parser.add_argument("--skip-video", action="store_true", help="Skip Remotion MP4 rendering")
    parser.add_argument("--skip-thumbnail", action="store_true", help="Skip Remotion thumbnail rendering")
    parser.add_argument("--upload", action="store_true", help="Upload finished video & thumbnail to YouTube")
    parser.add_argument("--privacy", default="private", choices=["private", "unlisted", "public"])
    args = parser.parse_args()

    ep_dir = ROOT_DIR / "output" / args.date
    briefing_path = ep_dir / "briefing.json"
    if not briefing_path.exists():
        raise FileNotFoundError(
            f"找不到 {briefing_path}！請先執行 fetch_news.py 並由 Antigravity 產出 briefing.json。"
        )

    if not args.skip_screenshots:
        run_step(
            "1/5 擷取新聞真實網頁截圖 (Playwright)",
            [str(MAIN_PY), str(ROOT_DIR / "scripts" / "capture_screenshots.py"), args.date],
        )

    if not args.skip_audio:
        run_step(
            "2/5 合成 GPT-SoVITS 雙語配音與對嘴時間軸",
            [str(GSV_PY), str(ROOT_DIR / "scripts" / "generate_gsv_audio.py"), "--date", args.date],
        )

    out_mp4 = ep_dir / f"ha_gemi_{args.date}.mp4"
    if not args.skip_video:
        run_step(
            "3/5 渲染 1080p 早報影片 (Remotion)",
            [str(REMOTION_CMD), "render", "src/index.ts", "MorningBriefing", str(out_mp4)],
            cwd=ROOT_DIR / "studio",
        )

    out_thumb = ep_dir / "thumbnail.png"
    if not args.skip_thumbnail:
        run_step(
            "4/5 渲染普普漫畫風封面縮圖 (Remotion)",
            [str(REMOTION_CMD), "still", "src/index.ts", "ThumbnailCover", str(out_thumb)],
            cwd=ROOT_DIR / "studio",
        )

    run_step(
        "5/5 產生 YouTube 標題、簡介與精準章節時間軸",
        [str(MAIN_PY), str(ROOT_DIR / "scripts" / "export_yt_meta.py"), args.date],
    )

    if args.upload:
        upload_cmd = [
            str(MAIN_PY),
            str(ROOT_DIR / "scripts" / "upload_youtube.py"),
            "--date",
            args.date,
            "--video",
            str(out_mp4),
            "--privacy",
            args.privacy,
        ]
        srt_path = ep_dir / "subtitles.srt"
        if srt_path.exists():
            upload_cmd.extend(["--captions", str(srt_path)])
        run_step(
            "Bonus: 自動上傳至 YouTube (YouTube Data API v3)",
            upload_cmd,
        )

    print(f"\n✅ 全部完成！成品位於：{ep_dir}")


if __name__ == "__main__":
    main()
