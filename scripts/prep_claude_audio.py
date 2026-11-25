"""Slice clean Claude vocal audio and transcribe with faster-whisper (12 CPU threads)."""

from __future__ import annotations

import os
import shutil
import sys
import types
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
GSV_DIR = ROOT_DIR / "tools" / "GPT-SoVITS"
VOCAL_WAV = ROOT_DIR / "assets" / "voice" / "clean_claude_vocal.wav"
SLICER_DIR = GSV_DIR / "output" / "claude_obs_slicer"
ASR_DIR = GSV_DIR / "output" / "claude_asr"
LIST_PATH = ASR_DIR / "claude_obs.list"


def main() -> None:
    os.environ["OMP_NUM_THREADS"] = "12"
    os.environ["MKL_NUM_THREADS"] = "12"

    sys.modules["gradio"] = types.ModuleType("gradio")
    sys.path.insert(0, str(GSV_DIR))
    sys.path.insert(0, str(GSV_DIR / "tools"))
    sys.path.insert(0, str(GSV_DIR / "GPT_SoVITS"))

    if not VOCAL_WAV.exists():
        uvr_wavs = sorted((GSV_DIR / "output" / "uvr5_vocal_claude").glob("*.wav"))
        if not uvr_wavs:
            raise FileNotFoundError("No UVR5 vocal output found in output/uvr5_vocal_claude")
        shutil.copy2(uvr_wavs[0], VOCAL_WAV)
        print(f"Copied UVR5 vocal to {VOCAL_WAV}")

    SLICER_DIR.mkdir(parents=True, exist_ok=True)
    existing = list(SLICER_DIR.glob("*.wav"))
    if not existing:
        import numpy as np
        from scipy.io import wavfile
        from slicer2 import Slicer
        from tools.my_utils import load_audio

        print(f"Slicing {VOCAL_WAV} -> {SLICER_DIR}...")
        slicer = Slicer(sr=32000, threshold=-34, min_length=4000, min_interval=300, hop_size=10, max_sil_kept=500)
        audio = load_audio(str(VOCAL_WAV), 32000)
        for idx, (chunk, _start, _end) in enumerate(slicer.slice(audio)):
            tmp_max = np.abs(chunk).max()
            if tmp_max > 1:
                chunk /= tmp_max
            chunk = (chunk / tmp_max * (0.9 * 0.25)) + (1 - 0.25) * chunk
            wavfile.write(str(SLICER_DIR / f"claude_{idx:03d}.wav"), 32000, (chunk * 32767).astype(np.int16))

    wavs = sorted(SLICER_DIR.glob("*.wav"))
    print(f"Total slices: {len(wavs)}")

    from faster_whisper import WhisperModel

    print("Loading faster-whisper (small, int8, cpu_threads=12)...")
    model = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=12)

    ASR_DIR.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    ref_picked = False

    for wav in wavs:
        segments, _ = model.transcribe(
            str(wav),
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 700},
            language="zh",
        )
        text = "".join(seg.text for seg in segments).strip()
        if not text:
            continue
        lines.append(f"{wav}|claude_clean|ZH|{text}")

        # Pick a clean 4-8s reference clip for Claude
        if not ref_picked and 250_000 <= wav.stat().st_size <= 550_000 and len(text) >= 10:
            shutil.copy2(wav, ROOT_DIR / "assets" / "voice" / "ref_claude.wav")
            (ROOT_DIR / "assets" / "voice" / "ref_claude.txt").write_text(text, encoding="utf-8")
            ref_picked = True
            print(f"Reference clip picked: {wav.name} -> {text}")

    LIST_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"ASR done! Wrote {len(lines)} lines to {LIST_PATH}")


if __name__ == "__main__":
    main()
