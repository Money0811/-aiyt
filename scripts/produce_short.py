r"""One-click producer for HaGemi YouTube Shorts (9:16 vertical).

Usage:
  1) Capture screenshot + synthesize GPT-SoVITS audio:
     d:\youtube\.venv\Scripts\python.exe scripts/produce_short.py --dir output/shorts/2026-11-22-riemann
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
MAIN_PY = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
GSV_PY = ROOT_DIR / "tools" / "GPT-SoVITS" / ".venv" / "Scripts" / "python.exe"
REMOTION_CMD = ROOT_DIR / "studio" / "node_modules" / ".bin" / "remotion.cmd"


def run_step(title: str, cmd: list[str], cwd: Path | None = None) -> None:
    print(f"\n========== {title} ==========")
    print("CMD:", " ".join(cmd))
    subprocess.run(cmd, cwd=str(cwd or ROOT_DIR), check=True)


def capture_short_screenshot(url: str, out_path: Path) -> None:
    from playwright.sync_api import sync_playwright

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1000, "height": 680},
            device_scale_factor=1,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=25000)
        page.wait_for_timeout(2000)
        page.screenshot(path=str(out_path), full_page=False)
        browser.close()
    print(f"Saved screenshot -> {out_path}")


def synthesize_short_audio(short_dir: Path) -> None:
    """Invoke GPT-SoVITS in its own .venv to synthesize short.wav and update short_data.json."""
    code = f"""
import json, os, sys
from pathlib import Path
sys.path.insert(0, r"{ROOT_DIR / 'scripts'}")
import generate_gsv_audio as gsv

os.chdir(gsv.GSV_DIR)
sys.path.insert(0, str(gsv.GSV_DIR))
sys.path.insert(0, str(gsv.GSV_DIR / "GPT_SoVITS"))
from TTS_infer_pack.TTS import TTS, TTS_Config

tts_config = TTS_Config("GPT_SoVITS/configs/tts_infer.yaml")
tts_pipeline = TTS(tts_config)

short_dir = Path(r"{short_dir}")
data_path = short_dir / "short_data.json"
data = json.loads(data_path.read_text(encoding="utf-8"))

ref_audio = str(Path(r"{ROOT_DIR}") / "assets" / "voice" / "ref_hajimi_clean.wav")
prompt_text = (Path(r"{ROOT_DIR}") / "assets" / "voice" / "ref_hajimi_clean.txt").read_text(encoding="utf-8").strip()

seg = gsv.synthesize_segment(
    tts_pipeline=tts_pipeline,
    seg_id="short",
    script=data["script"],
    out_dir=short_dir,
    ref_audio=ref_audio,
    prompt_text=prompt_text,
)
data["audio_file"] = "short/short.wav"
data["duration_sec"] = seg["duration_sec"]
data["duration_frames"] = seg["duration_frames"]
data["subtitles"] = seg["subtitles"]
data["mouth_open"] = seg["mouth_open"]

data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Short audio ready: {{seg['duration_sec']}}s ({{seg['duration_frames']}} frames)")
"""
    subprocess.run([str(GSV_PY), "-c", code], cwd=str(ROOT_DIR), check=True)


def write_short_meta(short_dir: Path) -> None:
    data = json.loads((short_dir / "short_data.json").read_text(encoding="utf-8"))
    meta_text = f"""=== 推薦標題 ===
{data['headline']} {data['hook_tag']} #Shorts #AI新聞

=== 資訊欄簡介 ===
{data['subheadline']}
{data['takeaway']}

來源：{data['source_url']}

想看更多每日 AI 重磅新聞，歡迎訂閱《基米哈Gemi 運營中》，每天 4 分鐘掌握最新科技動態！
#Shorts #哈Gemi早報 #AI新聞 #科技趨勢

---
【虛擬角色形象與版權聲明】
本片虛擬角色「哈Gemi」形象衍生自 B 站畫師 @ZipZipPipe 創作之「Gemini 娘」擬人設定。
本頻道基於原作設定進行二次創作與 AI 動作表情繪製，依原作者聲明採用「創用 CC 姓名標示－非商業性－相同方式分享 4.0 國際授權條款 (CC BY-NC-SA 4.0)」釋出：
https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant
（本頻道僅作非商業性科技資訊分享，未開啟任何商業營利。）
"""
    (short_dir / "youtube_meta.txt").write_text(meta_text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="HaGemi YouTube Shorts Producer")
    parser.add_argument("--dir", required=True, help="Short output folder containing short_data.json")
    parser.add_argument("--skip-screenshot", action="store_true")
    parser.add_argument("--skip-audio", action="store_true")
    parser.add_argument("--skip-video", action="store_true")
    parser.add_argument("--concurrency", type=int, default=5, help="Remotion render concurrency")
    args = parser.parse_args()

    short_dir = Path(args.dir)
    if not short_dir.is_absolute():
        short_dir = ROOT_DIR / short_dir
    data_path = short_dir / "short_data.json"
    if not data_path.exists():
        raise FileNotFoundError(f"找不到 {data_path}")

    data = json.loads(data_path.read_text(encoding="utf-8"))
    public_short_dir = ROOT_DIR / "assets" / "short"
    public_short_dir.mkdir(parents=True, exist_ok=True)

    if not args.skip_screenshot and data.get("source_url"):
        print("\n========== 1/3 擷取新聞網頁截圖 ==========")
        shot_path = short_dir / "screenshot.png"
        capture_short_screenshot(data["source_url"], shot_path)
        data["screenshot_image"] = "short/screenshot.png"
        data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    if not args.skip_audio:
        print("\n========== 2/3 合成 GPT-SoVITS 配音與對嘴 ==========")
        synthesize_short_audio(short_dir)

    # Sync assets to assets/short/ for Remotion staticFile('short/...')
    for fname in ("short_data.json", "short.wav", "screenshot.png"):
        src = short_dir / fname
        if src.exists():
            shutil.copy2(src, public_short_dir / fname)

    if not args.skip_video:
        out_mp4 = short_dir / f"{data['id']}.mp4"
        run_step(
            "3/3 渲染 1080x1920 直式 Shorts (Remotion)",
            [str(REMOTION_CMD), "render", "src/index.ts", "ShortBriefing", str(out_mp4), f"--concurrency={args.concurrency}"],
            cwd=ROOT_DIR / "studio",
        )

    write_short_meta(short_dir)
    print(f"\n✅ Shorts 製作完成！成品位於：{short_dir}")


if __name__ == "__main__":
    main()
