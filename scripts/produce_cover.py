r"""One-click local CPU RVC cover producer for HaGemi characters.

Pipeline:
  1) Download vocal reference / instrumental from YouTube (if URL given)
  2) Separate dry vocals using audio-separator (CPU ONNX, UVR-MDX-NET-Voc_FT)
  3) Convert vocals using local Applio RVC (core.py infer on CPU)
  4) Auto-compute millisecond sync offset against instrumental
  5) Mix & master via rvc_pro_mix (Pedalboard + Pyloudnorm + Librosa)

Usage example:
  d:\youtube\.venv\Scripts\python.exe scripts/produce_cover.py `
    --vocal-file tmp/matasaburo_vocal_v2.wav `
    --inst-file tmp/matasaburo_offvocal_v2.wav `
    --out output/covers/matasaburo
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
VOICES_JSON = ROOT_DIR / "assets" / "voice" / "voices.json"
RVC_DIR = ROOT_DIR / "tools" / "RVC"
RVC_PY = RVC_DIR / ".venv" / "Scripts" / "python.exe"
AUDIO_SEP_EXE = RVC_DIR / ".venv" / "Scripts" / "audio-separator.exe"


def run_step(title: str, cmd: list[str], cwd: Path | None = None) -> None:
    """Run a subprocess step with clear section logging."""
    print(f"\n========== {title} ==========")
    print("CMD:", " ".join(str(c) for c in cmd))
    subprocess.run([str(c) for c in cmd], cwd=str(cwd or ROOT_DIR), check=True)


def load_rvc_config(character: str) -> dict:
    """Load RVC model paths and default inference params from voices.json."""
    data = json.loads(VOICES_JSON.read_text(encoding="utf-8"))
    voice = data.get("voices", {}).get(character)
    if not voice or "rvc" not in voice:
        raise ValueError(f"Character '{character}' has no 'rvc' config in {VOICES_JSON}")
    return voice["rvc"]


def download_yt_wav(url: str, out_wav: Path) -> Path:
    """Download highest-quality audio from YouTube as WAV via uvx yt-dlp."""
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    stem = out_wav.with_suffix("")
    cmd = [
        "uvx",
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "-f",
        "bestaudio",
        "-x",
        "--audio-format",
        "wav",
        "-o",
        f"{stem}.%(ext)s",
        url,
    ]
    run_step(f"Download audio -> {out_wav.name}", cmd)
    if not out_wav.exists():
        raise FileNotFoundError(f"Expected downloaded WAV at {out_wav}")
    return out_wav


def separate_vocals(
    input_wav: Path,
    sep_dir: Path,
    model_name: str = "UVR-MDX-NET-Voc_FT.onnx",
) -> Path:
    """Extract dry vocals from a mixed cover track using audio-separator."""
    sep_dir.mkdir(parents=True, exist_ok=True)
    before = set(sep_dir.glob("*.wav"))
    sep_cmd = (
        [str(AUDIO_SEP_EXE)]
        if AUDIO_SEP_EXE.exists()
        else [str(RVC_PY), "-m", "audio_separator.utils.cli"]
    )
    cmd = sep_cmd + [
        str(input_wav),
        "--model_filename",
        model_name,
        "--output_dir",
        str(sep_dir),
        "--single_stem",
        "Vocals",
    ]
    run_step("Separate dry vocals (CPU ONNX)", cmd, cwd=RVC_DIR)
    after = sorted(set(sep_dir.glob("*.wav")) - before)
    if after:
        return after[0]
    existing = sorted(sep_dir.glob("*Vocals*.wav"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not existing:
        raise FileNotFoundError(f"No separated vocal WAV found in {sep_dir}")
    return existing[0]


def run_rvc_infer(
    input_wav: Path,
    out_wav: Path,
    rvc_cfg: dict,
    pitch: int,
    index_rate: float,
    protect: float,
    f0_method: str,
) -> Path:
    """Run local Applio RVC inference via core.py infer."""
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    pth_path = ROOT_DIR / rvc_cfg["pth_path"]
    index_path = ROOT_DIR / rvc_cfg["index_path"]
    if not pth_path.exists():
        raise FileNotFoundError(f"RVC model not found: {pth_path}")
    if not index_path.exists():
        raise FileNotFoundError(f"RVC index not found: {index_path}")

    cmd = [
        str(RVC_PY),
        str(RVC_DIR / "core.py"),
        "infer",
        "--input-path",
        str(input_wav),
        "--output-path",
        str(out_wav),
        "--pth-path",
        str(pth_path),
        "--index-path",
        str(index_path),
        "--pitch",
        str(pitch),
        "--index-rate",
        str(index_rate),
        "--volume-envelope",
        str(rvc_cfg.get("volume_envelope", 0.25)),
        "--protect",
        str(protect),
        "--f0-method",
        f0_method,
        "--embedder-model",
        str(rvc_cfg.get("embedder_model", "contentvec")),
        "--export-format",
        "WAV",
    ]
    run_step(f"RVC CPU inference (pitch={pitch}, f0={f0_method})", cmd, cwd=RVC_DIR)
    return out_wav


def compute_sync_offset_ms(vocal_source_wav: Path, inst_wav: Path) -> int:
    """Compute millisecond delay needed on vocal track to align with instrumental."""
    py_code = (
        "import numpy as np, soundfile as sf\n"
        "from scipy.signal import correlate, resample_poly\n"
        "v, sr1 = sf.read(r'''" + str(vocal_source_wav) + "''')\n"
        "inst, sr2 = sf.read(r'''" + str(inst_wav) + "''')\n"
        "if v.ndim > 1: v = v.mean(axis=1)\n"
        "if inst.ndim > 1: inst = inst.mean(axis=1)\n"
        "v_ds = resample_poly(v, 1000, sr1)\n"
        "i_ds = resample_poly(inst, 1000, sr2)\n"
        "v_env = np.convolve(np.abs(v_ds), np.ones(50)/50, mode='same')\n"
        "i_env = np.convolve(np.abs(i_ds), np.ones(50)/50, mode='same')\n"
        "corr = correlate(v_env - v_env.mean(), i_env - i_env.mean(), mode='full')\n"
        "lag_ms = int(np.argmax(corr) - (len(i_env) - 1))\n"
        "print(lag_ms)\n"
    )
    print("\n========== Compute Vocal/Instrumental Sync Offset ==========")
    res = subprocess.run(
        [str(RVC_PY), "-c", py_code],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        check=True,
    )
    lag_ms = int(res.stdout.strip().splitlines()[-1])
    # Negative lag means instrumental starts earlier (has more leading intro),
    # so delay vocal by -lag_ms; positive lag means vocal starts earlier/later inversely.
    delay_ms = -lag_ms
    print(f"Detected raw lag_ms={lag_ms} -> vocal delay_ms={delay_ms}")
    return delay_ms


def mix_studio(
    rvc_vocal_wav: Path,
    inst_wav: Path,
    out_wav: Path,
    delay_ms: int,
    pitch_semitones: int,
    vocal_gain: float = 1.0,
    inst_gain: float = 1.0,
) -> Path:
    """Pitch-shift instrumental if needed, then mix & master via rvc_pro_mix."""
    from rvc_pro_mix import mix_and_master

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    effective_inst = inst_wav

    if pitch_semitones != 0:
        pitch_ratio = 2.0 ** (pitch_semitones / 12.0)
        shifted_inst = out_wav.parent / f"{inst_wav.stem}_pitch{pitch_semitones:+d}.wav"
        cmd = [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(inst_wav),
            "-af",
            f"rubberband=pitch={pitch_ratio:.7f}",
            "-c:a",
            "pcm_s24le",
            str(shifted_inst),
        ]
        run_step(f"Pitch-shift instrumental ({pitch_semitones:+d} st)", cmd)
        effective_inst = shifted_inst

    out_mp3 = out_wav.with_suffix(".mp3")
    print(f"\n========== Pro Mix & Master (rvc_pro_mix) -> {out_wav.name} ==========")
    mix_and_master(
        vocal_path=rvc_vocal_wav,
        inst_path=effective_inst,
        out_wav=out_wav,
        out_mp3=out_mp3,
        delay_ms=delay_ms,
        vocal_gain=vocal_gain,
        inst_gain=inst_gain,
    )
    return out_wav


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="One-click local CPU RVC cover producer")
    p.add_argument("--character", default="gemini", help="Character key in assets/voice/voices.json")
    p.add_argument("--vocal-url", help="YouTube URL of vocal guide cover")
    p.add_argument("--vocal-file", help="Local WAV path of vocal guide cover")
    p.add_argument("--dry-vocal-file", help="Skip separation by providing already-dry vocal WAV")
    p.add_argument("--inst-url", help="YouTube URL of off-vocal instrumental")
    p.add_argument("--inst-file", help="Local WAV path of off-vocal instrumental")
    p.add_argument("--out", required=True, help="Output directory, e.g. output/covers/matasaburo")
    p.add_argument("--pitch", type=int, default=None, help="Override RVC pitch shift in semitones")
    p.add_argument("--index-rate", type=float, default=None, help="Override RVC index rate")
    p.add_argument("--protect", type=float, default=None, help="Override RVC protect")
    p.add_argument("--f0-method", default=None, help="Override f0 method (rmvpe/fcpe/crepe)")
    p.add_argument("--vocal-gain", type=float, default=1.0, help="Extra vocal multiplier after LUFS match")
    p.add_argument("--inst-gain", type=float, default=1.0, help="Extra inst multiplier after LUFS match")
    p.add_argument("--offset-ms", type=int, default=None, help="Manual vocal delay in ms (skip auto-sync)")
    p.add_argument("--skip-sep", action="store_true", help="Reuse existing separated vocal in output dir")
    p.add_argument("--skip-rvc", action="store_true", help="Reuse existing RVC output in output dir")
    p.add_argument("--skip-mix", action="store_true", help="Stop after RVC vocal conversion")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    out_dir = (ROOT_DIR / args.out) if not Path(args.out).is_absolute() else Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    rvc_cfg = load_rvc_config(args.character)
    pitch = args.pitch if args.pitch is not None else int(rvc_cfg.get("default_pitch", 0))
    index_rate = args.index_rate if args.index_rate is not None else float(rvc_cfg.get("index_rate", 0.13))
    protect = args.protect if args.protect is not None else float(rvc_cfg.get("protect", 0.5))
    f0_method = args.f0_method or str(rvc_cfg.get("f0_method", "rmvpe"))

    # 1. Resolve vocal guide source
    vocal_src: Path | None = None
    if args.vocal_file:
        vocal_src = (ROOT_DIR / args.vocal_file) if not Path(args.vocal_file).is_absolute() else Path(args.vocal_file)
    elif args.vocal_url:
        vocal_src = download_yt_wav(args.vocal_url, out_dir / "vocal_source.wav")

    # 2. Separate dry vocals
    dry_vocal = out_dir / "vocal_dry.wav"
    if args.dry_vocal_file:
        dry_vocal = (ROOT_DIR / args.dry_vocal_file) if not Path(args.dry_vocal_file).is_absolute() else Path(args.dry_vocal_file)
    elif args.skip_sep:
        sep_candidates = sorted((out_dir / "sep").glob("*.wav"))
        if sep_candidates:
            dry_vocal = sep_candidates[0]
        elif not dry_vocal.exists():
            raise FileNotFoundError(f"--skip-sep set, but no vocal found in {out_dir / 'sep'}")
    else:
        if vocal_src is None or not vocal_src.exists():
            raise ValueError("Provide --vocal-file, --vocal-url, or --dry-vocal-file")
        dry_vocal = separate_vocals(vocal_src, out_dir / "sep")

    # 3. Run local CPU RVC inference
    rvc_vocal = out_dir / f"{args.character}_rvc_vocal.wav"
    if not args.skip_rvc:
        run_rvc_infer(dry_vocal, rvc_vocal, rvc_cfg, pitch, index_rate, protect, f0_method)
    elif not rvc_vocal.exists():
        raise FileNotFoundError(f"--skip-rvc set, but {rvc_vocal} does not exist")

    if args.skip_mix:
        print(f"\nDone (skipped mix). RVC vocal saved to: {rvc_vocal}")
        return 0

    # 4. Resolve instrumental
    inst_wav: Path | None = None
    if args.inst_file:
        inst_wav = (ROOT_DIR / args.inst_file) if not Path(args.inst_file).is_absolute() else Path(args.inst_file)
    elif args.inst_url:
        inst_wav = download_yt_wav(args.inst_url, out_dir / "instrumental.wav")
    if inst_wav is None or not inst_wav.exists():
        raise ValueError("Provide --inst-file or --inst-url for mixing (or pass --skip-mix)")

    # 5. Compute sync offset and mix
    if args.offset_ms is not None:
        delay_ms = args.offset_ms
    elif vocal_src is not None and vocal_src.exists():
        delay_ms = compute_sync_offset_ms(vocal_src, inst_wav)
    else:
        delay_ms = 0

    final_mix = out_dir / f"{args.character}_cover_mix.wav"
    mix_studio(rvc_vocal, inst_wav, final_mix, delay_ms, pitch, args.vocal_gain, args.inst_gain)
    print(f"\nCover mix ready: {final_mix}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
