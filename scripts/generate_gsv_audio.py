"""Synthesize morning briefing audio via GPT-SoVITS with exact per-sentence subtitle sync & lip-sync."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
import torch
import torchaudio
from scipy.signal import butter, sosfiltfilt

# Patch torchaudio.load to fall back to soundfile when FFmpeg shared DLLs are absent
_orig_torchaudio_load = torchaudio.load


def _safe_torchaudio_load(uri: Any, *args: Any, **kwargs: Any) -> Any:
    try:
        return _orig_torchaudio_load(uri, *args, **kwargs)
    except Exception:
        data, sr = sf.read(str(uri), dtype="float32", always_2d=True)
        return torch.from_numpy(data.T), sr


torchaudio.load = _safe_torchaudio_load

ROOT_DIR = Path(__file__).resolve().parent.parent
GSV_DIR = ROOT_DIR / "tools" / "GPT-SoVITS"
FPS = 30
PAUSE_SEC = 0.14
TAIL_PADDING_SEC = 0.35

_DIGITS = "零一二三四五六七八九"


def _int_to_zh(num_str: str) -> str:
    n = int(num_str.replace(",", ""))
    if n == 0:
        return "零"
    if 1000 <= n <= 2099 and len(num_str.replace(",", "")) == 4 and n % 100 != 0:
        # Years like 2028 -> 二零二八
        return "".join(_DIGITS[int(ch)] for ch in str(n))
    units = [(10000, "万"), (1000, "千"), (100, "百"), (10, "十")]
    parts: list[str] = []
    rem = n
    for val, label in units:
        q, rem = divmod(rem, val)
        if q > 0:
            if val == 10 and q == 1 and not parts:
                parts.append("十")
            else:
                parts.append(_DIGITS[q] + label)
        elif parts and rem > 0 and not parts[-1].endswith("零"):
            parts.append("零")
    if rem > 0:
        parts.append(_DIGITS[rem])
    return "".join(parts)


def split_sentences(text: str) -> list[str]:
    """Split script into natural subtitle chunks while preserving Arabic numerals."""
    parts = re.split(r"([。！？；，、])", text.strip())
    chunks: list[str] = []
    buf = ""
    for part in parts:
        if not part:
            continue
        buf += part
        if part in "。！？；" or (part in "，、" and len(buf) >= 12):
            cleaned = buf.strip()
            if cleaned:
                chunks.append(cleaned)
            buf = ""
    if buf.strip():
        chunks.append(buf.strip())
    return chunks


def to_tts_text(display_text: str) -> str:
    """Convert display text to natural bilingual TTS text while keeping subtitles untouched."""
    t = display_text.strip()
    # Brand & established Chinese terms
    t = t.replace("哈Gemi早報", "哈基米早报")
    t = t.replace("哈Gemi", "哈基米")
    t = t.replace("Nasdaq", "那斯达克")
    t = t.replace("Android", "安卓")

    # Percentages like 87% -> 百分之八十七
    t = re.sub(r"(\d+)%", lambda m: f"百分之{_int_to_zh(m.group(1))}", t)
    # Decimals like 5.2 / 5.4 -> 五点二 / 五点四 (prevents 'five point two' after English)
    t = re.sub(
        r"(\d+)\.(\d+)",
        lambda m: f"{_int_to_zh(m.group(1))}点{''.join(_DIGITS[int(c)] for c in m.group(2))}",
        t,
    )
    # Model hyphens like Inkling-2-Mini -> Inkling 2 Mini
    t = re.sub(r"(?<=[A-Za-z0-9])-(?=[A-Za-z0-9])", " ", t)
    # Remaining integers -> Chinese numerals
    t = re.sub(r"\b\d[\d,]*\b", lambda m: _int_to_zh(m.group(0)), t)

    # Insert clean space between Chinese and English characters for smoother boundary prosody
    t = re.sub(r"([\u4e00-\u9fff])([A-Za-z])", r"\1 \2", t)
    t = re.sub(r"([A-Za-z])([\u4e00-\u9fff])", r"\1 \2", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def compute_mouth_open(audio: np.ndarray, sr: int, total_frames: int) -> list[int]:
    """Compute 30fps binary mouth-open states from audio RMS energy."""
    samples_per_frame = max(1, int(sr / FPS))
    rms_list: list[float] = []
    for f_idx in range(total_frames):
        start = f_idx * samples_per_frame
        end = start + samples_per_frame
        if start >= len(audio):
            rms_list.append(0.0)
            continue
        seg = audio[start:end]
        rms_list.append(float(np.sqrt(np.mean(seg * seg))))
    peak = max(rms_list) if rms_list else 1e-6
    threshold = max(0.008, peak * 0.08)
    return [1 if r > threshold else 0 for r in rms_list]


def synthesize_segment(
    tts_pipeline: Any,
    seg_id: str,
    script: str,
    out_dir: Path,
    ref_audio: str,
    prompt_text: str,
) -> dict[str, Any]:
    sentences = split_sentences(script)
    audio_pieces: list[np.ndarray] = []
    subtitles: list[dict[str, Any]] = []
    sample_rate = 32000
    cursor_sec = 0.0

    for sent in sentences:
        tts_input = to_tts_text(sent)
        req = {
            "text": tts_input,
            "text_lang": "zh",
            "ref_audio_path": ref_audio,
            "prompt_text": prompt_text,
            "prompt_lang": "zh",
            "text_split_method": "cut0",
            "speed_factor": 1.05,
        }
        sr, wav = next(tts_pipeline.run(req))
        sample_rate = sr
        wav_f32 = wav.astype(np.float32)
        if wav_f32.ndim > 1:
            wav_f32 = wav_f32.mean(axis=1)
        max_val = float(np.max(np.abs(wav_f32))) if len(wav_f32) else 1.0
        if max_val > 0:
            wav_f32 = wav_f32 / max(1.0, max_val / 0.95)

        dur_sec = len(wav_f32) / sample_rate
        start_frame = int(round(cursor_sec * FPS))
        end_frame = int(round((cursor_sec + dur_sec) * FPS))

        subtitles.append(
            {
                "text": sent.rstrip("，、。；"),
                "start_frame": start_frame,
                "end_frame": max(start_frame + 1, end_frame),
            }
        )

        audio_pieces.append(wav_f32)
        pause_samples = np.zeros(int(PAUSE_SEC * sample_rate), dtype=np.float32)
        audio_pieces.append(pause_samples)
        cursor_sec += dur_sec + PAUSE_SEC

    tail_samples = np.zeros(int(TAIL_PADDING_SEC * sample_rate), dtype=np.float32)
    audio_pieces.append(tail_samples)

    full_audio = np.concatenate(audio_pieces) if audio_pieces else np.zeros(sample_rate, dtype=np.float32)
    # Remove low-frequency wind/mic rumble (< 95 Hz)
    if len(full_audio) > 64:
        sos = butter(4, 95, btype="highpass", fs=sample_rate, output="sos")
        full_audio = sosfiltfilt(sos, full_audio).astype(np.float32)
        peak = float(np.max(np.abs(full_audio)))
        if peak > 0.95:
            full_audio = full_audio * (0.95 / peak)
    wav_path = out_dir / f"{seg_id}.wav"
    sf.write(str(wav_path), full_audio, sample_rate)

    total_sec = len(full_audio) / sample_rate
    duration_frames = max(1, int(round(total_sec * FPS)))
    mouth_open = compute_mouth_open(full_audio, sample_rate, duration_frames)

    return {
        "id": seg_id,
        "audio_file": f"episode/{seg_id}.wav",
        "duration_sec": round(total_sec, 3),
        "duration_frames": duration_frames,
        "subtitles": subtitles,
        "mouth_open": mouth_open,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default="2026-11-22")
    parser.add_argument("--ref-audio", default=str(ROOT_DIR / "assets" / "voice" / "ref_hajimi_clean.wav"))
    parser.add_argument("--ref-text-file", default=str(ROOT_DIR / "assets" / "voice" / "ref_hajimi_clean.txt"))
    args = parser.parse_args()

    os.chdir(GSV_DIR)
    sys.path.insert(0, str(GSV_DIR))
    sys.path.insert(0, str(GSV_DIR / "GPT_SoVITS"))
    from TTS_infer_pack.TTS import TTS, TTS_Config

    print("Loading GPT-SoVITS v2 (CPU)...")
    tts_config = TTS_Config("GPT_SoVITS/configs/tts_infer.yaml")
    tts_pipeline = TTS(tts_config)

    prompt_text = Path(args.ref_text_file).read_text(encoding="utf-8").strip()
    ep_dir = ROOT_DIR / "output" / args.date
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
        print(f"Synthesizing {seg_id} via GPT-SoVITS...")
        results[seg_id] = synthesize_segment(
            tts_pipeline=tts_pipeline,
            seg_id=seg_id,
            script=script,
            out_dir=audio_dir,
            ref_audio=args.ref_audio,
            prompt_text=prompt_text,
        )

    timeline = {
        "fps": FPS,
        "voice": "GPT-SoVITS-v2-Hajimi-Mix",
        "segments": results,
    }
    timeline_path = ep_dir / "timeline.json"
    timeline_path.write_text(
        json.dumps(timeline, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    public_ep_dir = ROOT_DIR / "assets" / "episode"
    public_ep_dir.mkdir(parents=True, exist_ok=True)
    for wav_file in audio_dir.glob("*.wav"):
        shutil.copy2(wav_file, public_ep_dir / wav_file.name)
    shutil.copy2(briefing_path, public_ep_dir / "briefing.json")
    shutil.copy2(timeline_path, public_ep_dir / "timeline.json")

    total_sec = sum(seg["duration_sec"] for seg in results.values())
    print(f"\nDone! Total episode duration: {total_sec:.1f}s ({total_sec/60:.1f} min)")


if __name__ == "__main__":
    main()
