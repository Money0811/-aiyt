"""Generate edge-tts audio segments and sentence-level timing metadata for Remotion."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

import edge_tts
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

FPS = 30
PADDING_SEC = 0.45


def split_sentences(text: str) -> list[str]:
    """Split Chinese/English script into short, readable subtitle chunks."""
    parts = re.split(r"([。！？；，、])", text.strip())
    chunks: list[str] = []
    buf = ""
    for part in parts:
        if not part:
            continue
        buf += part
        if part in "。！？；" or (part in "，、" and len(buf) >= 14):
            cleaned = buf.strip()
            if cleaned:
                chunks.append(cleaned)
            buf = ""
    if buf.strip():
        chunks.append(buf.strip())
    return chunks


def get_audio_duration(audio_path: Path) -> float:
    """Measure exact audio duration in seconds via ffprobe or mutagen/edge-tts fallback."""
    try:
        out = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(audio_path),
            ],
            text=True,
        ).strip()
        return float(out)
    except Exception:
        # Fallback if ffprobe is not on current shell PATH: estimate from file size/bitrate
        return 0.0


async def synthesize_segment(
    seg_id: str,
    text: str,
    out_dir: Path,
    voice: str,
    rate: str,
    pitch: str,
) -> dict[str, Any]:
    mp3_path = out_dir / f"{seg_id}.mp3"
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
        boundary="SentenceBoundary",
    )

    boundaries: list[dict[str, Any]] = []
    with mp3_path.open("wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] in ("SentenceBoundary", "WordBoundary"):
                boundaries.append(
                    {
                        "offset_sec": chunk["offset"] / 10_000_000.0,
                        "duration_sec": chunk["duration"] / 10_000_000.0,
                        "text": chunk["text"],
                    }
                )

    total_sec = get_audio_duration(mp3_path)
    if total_sec <= 0 and boundaries:
        last = boundaries[-1]
        total_sec = last["offset_sec"] + last["duration_sec"] + 0.3
    elif total_sec <= 0:
        total_sec = max(3.0, len(text) * 0.22)

    # Build clean subtitle cues aligned to total audio duration
    sentences = split_sentences(text)
    total_chars = max(1, sum(len(s) for s in sentences))
    subtitles: list[dict[str, Any]] = []
    cursor = 0.0
    for s in sentences:
        dur = total_sec * (len(s) / total_chars)
        subtitles.append(
            {
                "text": s.rstrip("，、。；"),
                "start_frame": int(round(cursor * FPS)),
                "end_frame": int(round((cursor + dur) * FPS)),
            }
        )
        cursor += dur

    duration_frames = int(round((total_sec + PADDING_SEC) * FPS))
    return {
        "id": seg_id,
        "audio_file": f"episode/{seg_id}.mp3",
        "duration_sec": round(total_sec, 3),
        "duration_frames": duration_frames,
        "subtitles": subtitles,
    }


async def run(date_str: str, voice: str, rate: str, pitch: str) -> None:
    ep_dir = ROOT_DIR / "output" / date_str
    briefing_path = ep_dir / "briefing.json"
    briefing = json.loads(briefing_path.read_text(encoding="utf-8"))

    audio_dir = ep_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    segments_input: list[tuple[str, str]] = [
        ("cover", briefing["cover"]["script"]),
        ("agenda", briefing["agenda"]["script"]),
    ]
    for col in briefing["columns"]:
        segments_input.append((f"col_{col['index']}", col["script"]))
    segments_input.append(("flash", briefing["flash_script"]))
    segments_input.append(("outro", briefing["outro"]["script"]))

    results: dict[str, Any] = {}
    for seg_id, script in segments_input:
        print(f"Synthesizing {seg_id} ({voice})...")
        results[seg_id] = await synthesize_segment(
            seg_id=seg_id,
            text=script,
            out_dir=audio_dir,
            voice=voice,
            rate=rate,
            pitch=pitch,
        )

    timeline = {
        "fps": FPS,
        "voice": voice,
        "segments": results,
    }
    timeline_path = ep_dir / "timeline.json"
    timeline_path.write_text(
        json.dumps(timeline, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Mirror audio + episode JSON into studio/public/episode (assets/ is publicDir)
    public_ep_dir = ROOT_DIR / "assets" / "episode"
    public_ep_dir.mkdir(parents=True, exist_ok=True)
    for mp3 in audio_dir.glob("*.mp3"):
        shutil.copy2(mp3, public_ep_dir / mp3.name)
    shutil.copy2(briefing_path, public_ep_dir / "briefing.json")
    shutil.copy2(timeline_path, public_ep_dir / "timeline.json")

    total_sec = sum(seg["duration_sec"] + PADDING_SEC for seg in results.values())
    print(f"\nDone! Total episode duration: {total_sec:.1f}s ({total_sec/60:.1f} min)")
    print(f"Timeline saved to {timeline_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default="2026-11-22")
    parser.add_argument("--voice", default=os.getenv("TTS_VOICE", "zh-TW-HsiaoChenNeural"))
    parser.add_argument("--rate", default="+8%")
    parser.add_argument("--pitch", default="+4Hz")
    args = parser.parse_args()
    asyncio.run(run(args.date, args.voice, args.rate, args.pitch))


if __name__ == "__main__":
    main()
