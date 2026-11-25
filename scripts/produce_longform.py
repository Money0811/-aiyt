r"""One-click producer for HaGemi Long-form Documentary episodes.

Usage:
  d:\youtube\.venv\Scripts\python.exe scripts/produce_longform.py --dir output/longform/open_source_counterattack
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
GSV_PY = ROOT_DIR / "tools" / "GPT-SoVITS" / ".venv" / "Scripts" / "python.exe"
REMOTION_CMD = ROOT_DIR / "studio" / "node_modules" / ".bin" / "remotion.cmd"


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


def export_srt(ep_dir: Path, data: dict, timeline: dict) -> Path:
    fps = float(timeline.get("fps", 30))
    segs = timeline.get("segments", {})
    srt_blocks: list[str] = []
    cue_idx = 1
    offset_frames = 0
    for sec in data["sections"]:
        seg = segs.get(sec["id"])
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
    print(f"Exported CC subtitles -> {srt_path} ({cue_idx - 1} cues)")
    return srt_path


def synthesize_longform_audio(ep_dir: Path, only_section: str = "") -> None:
    audio_dir = ep_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

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

ep_dir = Path(r"{ep_dir}")
audio_dir = ep_dir / "audio"
data = json.loads((ep_dir / "longform.json").read_text(encoding="utf-8"))
voices_cfg = json.loads((Path(r"{ROOT_DIR}") / "assets" / "voice" / "voices.json").read_text(encoding="utf-8"))["voices"]
timeline_path = ep_dir / "timeline.json"
existing = json.loads(timeline_path.read_text(encoding="utf-8")) if timeline_path.exists() else {{"fps": 30, "voice": "GPT-SoVITS-MultiVoice", "segments": {{}}}}

only_sec = {only_section!r}
current_voice = "gemini"

segments = existing.get("segments", {{}})
for sec in data["sections"]:
    sid = sec["id"]
    if only_sec and sid != only_sec:
        continue
    voice_id = sec.get("voice", "gemini")
    v_info = voices_cfg.get(voice_id, voices_cfg["gemini"])
    if voice_id != current_voice:
        print(f"Switching GPT-SoVITS voice -> {{voice_id}} ({{v_info['label']}})")
        tts_pipeline.init_t2s_weights(str(Path(r"{ROOT_DIR}") / v_info["gpt_weights"]))
        tts_pipeline.init_vits_weights(str(Path(r"{ROOT_DIR}") / v_info["sovits_weights"]))
        current_voice = voice_id
    ref_audio = str(Path(r"{ROOT_DIR}") / v_info["ref_audio"])
    prompt_text = (Path(r"{ROOT_DIR}") / v_info["ref_text"]).read_text(encoding="utf-8").strip()
    print(f"Synthesizing {{sid}} ({{voice_id}}) via GPT-SoVITS...")
    seg = gsv.synthesize_segment(
        tts_pipeline=tts_pipeline,
        seg_id=sid,
        script=sec["script"],
        out_dir=audio_dir,
        ref_audio=ref_audio,
        prompt_text=prompt_text,
    )
    seg["audio_file"] = f"longform/{{sid}}.wav"
    seg["voice"] = voice_id
    segments[sid] = seg

timeline = {{"fps": 30, "voice": "GPT-SoVITS-Hajimi-Finetuned", "segments": segments}}
timeline_path.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
total_sec = sum(s["duration_sec"] for s in segments.values())
print(f"Done! Total longform duration: {{total_sec:.1f}}s ({{total_sec/60:.1f}} min)")
"""
    subprocess.run([str(GSV_PY), "-c", code], cwd=str(ROOT_DIR), check=True)


def export_meta(ep_dir: Path) -> None:
    data = json.loads((ep_dir / "longform.json").read_text(encoding="utf-8"))
    timeline = json.loads((ep_dir / "timeline.json").read_text(encoding="utf-8"))
    export_srt(ep_dir, data, timeline)

    cursor = 0.0
    chapters: list[str] = []
    for sec in data["sections"]:
        seg = timeline["segments"].get(sec["id"])
        if not seg:
            continue
        chapters.append(f"{fmt_mmss(cursor)} {sec['chapter_label']}")
        cursor += seg["duration_sec"]

    meta = f"""=== 推薦標題 ===
{data['title']}｜AI 深度專欄

=== 資訊欄簡介（含時間軸）===
哈囉喵！這支不具時效性的深度專欄，帶你一次看懂開源與閉源 AI 的五年競爭史（Llama、Mistral、Qwen 通義千問、智譜 GLM、DeepSeek），看看開源陣營是如何從初期的絕望差距一步步追趕並改寫遊戲規則的！

{chr(10).join(chapters)}

主講：哈Gemi｜製作：Antigravity
#開源AI #DeepSeek #Qwen #Llama #GLM #Mistral #哈Gemi早報

---
【虛擬角色形象與版權聲明】
本片登場之虛擬角色「哈Gemi」及各 AI 模型擬人形象（含 Gemini、GPT、Claude、Llama、Mistral、Qwen、GLM、DeepSeek 等角色設定），皆衍生自 B 站畫師 @ZipZipPipe 創作之 AI 模型娘擬人設定。
本頻道基於原作設定進行二次創作與像素化／動態繪製，依原作者聲明採用「創用 CC 姓名標示－非商業性－相同方式分享 4.0 國際授權條款 (CC BY-NC-SA 4.0)」釋出：
https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant
（本頻道僅作非商業性科技資訊分享，未開啟任何商業營利。）
"""
    (ep_dir / "youtube_meta.txt").write_text(meta, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="HaGemi Longform Documentary Producer")
    parser.add_argument("--dir", required=True, help="Episode directory containing longform.json")
    parser.add_argument("--only-section", default="", help="Re-synthesize only one section id")
    parser.add_argument("--skip-audio", action="store_true")
    parser.add_argument("--skip-video", action="store_true")
    parser.add_argument("--concurrency", type=int, default=5, help="Remotion render concurrency")
    args = parser.parse_args()

    ep_dir = Path(args.dir)
    if not ep_dir.is_absolute():
        ep_dir = ROOT_DIR / ep_dir

    if not args.skip_audio:
        synthesize_longform_audio(ep_dir, only_section=args.only_section)

    public_dir = ROOT_DIR / "assets" / "longform"
    public_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ep_dir / "longform.json", public_dir / "longform.json")
    if (ep_dir / "timeline.json").exists():
        shutil.copy2(ep_dir / "timeline.json", public_dir / "timeline.json")
    for wav in (ep_dir / "audio").glob("*.wav"):
        shutil.copy2(wav, public_dir / wav.name)

    if not args.skip_video:
        data = json.loads((ep_dir / "longform.json").read_text(encoding="utf-8"))
        out_mp4 = ep_dir / f"{data['id']}.mp4"
        subprocess.run(
            [str(REMOTION_CMD), "render", "src/index.ts", "Documentary", str(out_mp4), f"--concurrency={args.concurrency}"],
            cwd=str(ROOT_DIR / "studio"),
            check=True,
        )

    if (ep_dir / "timeline.json").exists():
        export_meta(ep_dir)

    print(f"\n✅ 長片製作完成！成品位於：{ep_dir}")


if __name__ == "__main__":
    main()
