"""Professional RVC Vocal & Instrumental Auto-Mixing Engine (Pedalboard + Pyloudnorm + Librosa).

Replaces basic FFmpeg filter chains with a modular studio vocal chain:
  1. Librosa spectral diagnostics (detects low-end mud and harsh sibilance)
  2. Pre-clean: HighpassFilter (85Hz) + NoiseGate (removes RVC inter-phrase noise)
  3. Surgical EQ: PeakFilter cuts (350Hz boxy, 6500Hz sibilance) + HighShelfFilter (11kHz air)
  4. Dynamic Control: Vocal Compressor
  5. Parallel Reverb Send/Return: wet-only Reverb with high-frequency damping blended back
  6. ITU-R BS.1770-4 Loudness Matching (pyloudnorm) + Glue Bus Compressor + Limiter (-1.0 dBTP)
  7. Lossless 24-bit WAV and high-quality MP3 export

Usage:
  d:\\youtube\\.venv\\Scripts\\python.exe scripts/rvc_pro_mix.py ^
    --vocal path/to/rvc_vocal.wav ^
    --inst path/to/instrumental.wav ^
    --out-wav path/to/mix.wav ^
    --out-mp3 path/to/mix.mp3
"""

from __future__ import annotations

import argparse
import copy
import sys
from pathlib import Path
from typing import Any

import librosa
import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
import soundfile as sf
from pedalboard.io import AudioFile

# =============================================================================
# CONFIG: All key mixing parameters in one place for easy fine-tuning
# =============================================================================
CONFIG: dict[str, Any] = {
    "sample_rate": 48000,
    "pre_clean": {
        "highpass_hz": 85.0,
        "gate_threshold_db": -45.0,
        "gate_ratio": 6.0,
        "gate_attack_ms": 2.0,
        "gate_release_ms": 120.0,
    },
    "vocal_eq": {
        # Cut RVC 350Hz plastic / boxy resonance
        "boxy_cut_hz": 350.0,
        "boxy_cut_db": -2.8,
        "boxy_cut_q": 1.4,
        # Gentle upper-mid presence
        "presence_hz": 3000.0,
        "presence_db": 1.5,
        "presence_q": 1.2,
        # Tame harsh 6500Hz RVC sibilance
        "deess_hz": 6500.0,
        "deess_db": -3.5,
        "deess_q": 2.5,
        # Add 11kHz vocal air
        "air_shelf_hz": 11000.0,
        "air_shelf_db": 2.2,
        "air_shelf_q": 0.707,
    },
    "vocal_comp": {
        "threshold_db": -18.0,
        "ratio": 3.0,
        "attack_ms": 10.0,
        "release_ms": 120.0,
    },
    "parallel_reverb": {
        "room_size": 0.22,
        "damping": 0.72,
        "width": 0.55,
        "return_highpass_hz": 200.0,
        # Independent blend ratio of wet reverb return mixed back to dry vocal
        "return_mix": 0.07,
    },
    "inst_carve": {
        # Subtle dip in instrumental to leave room for vocal presence
        "carve_hz": 2800.0,
        "carve_db": -1.5,
        "carve_q": 1.2,
    },
    "loudness": {
        # Reference LUFS for instrumental before summing
        "target_inst_lufs": -16.0,
        # Target LUFS difference: vocal sits this many dB above instrumental
        "vocal_over_inst_lufs": 2.5,
        # Final master loudness target (before true-peak limiter)
        "master_target_lufs": -14.0,
    },
    "mastering": {
        "bus_comp_threshold_db": -12.0,
        "bus_comp_ratio": 1.8,
        "bus_comp_attack_ms": 20.0,
        "bus_comp_release_ms": 180.0,
        # True-peak ceiling (-1.0 dBTP)
        "limiter_threshold_db": -1.0,
        "limiter_release_ms": 80.0,
        "mp3_quality": "V0",  # Best VBR quality (~245-320 kbps) or use int bitrate
    },
    "diagnostics": {
        "low_end_hz": 250.0,
        "sibilance_low_hz": 5500.0,
        "sibilance_high_hz": 9000.0,
        "low_end_warn_ratio": 0.45,
        "sibilance_warn_ratio": 0.22,
    },
}


def load_stereo_audio(path: Path, target_sr: int) -> np.ndarray:
    """Load audio file as float32 stereo array shaped (channels, samples)."""
    audio, sr = sf.read(str(path), dtype="float32", always_2d=True)
    # Transpose (samples, channels) -> (channels, samples)
    audio = audio.T
    if audio.shape[0] == 1:
        audio = np.vstack([audio, audio])
    elif audio.shape[0] > 2:
        audio = audio[:2, :]

    if sr != target_sr:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr, res_type="soxr_hq")
        audio = audio.astype(np.float32, copy=False)
    return audio


def apply_delay_and_pad(
    vocal: np.ndarray,
    inst: np.ndarray,
    delay_ms: int,
    sr: int,
) -> tuple[np.ndarray, np.ndarray]:
    """Align vocal and instrumental in time and pad to identical length."""
    shift_samples = int(round(abs(delay_ms) * sr / 1000.0))
    if delay_ms > 0:
        vocal = np.pad(vocal, ((0, 0), (shift_samples, 0)), mode="constant")
    elif delay_ms < 0:
        inst = np.pad(inst, ((0, 0), (shift_samples, 0)), mode="constant")

    max_len = max(vocal.shape[1], inst.shape[1])
    if vocal.shape[1] < max_len:
        vocal = np.pad(vocal, ((0, 0), (0, max_len - vocal.shape[1])), mode="constant")
    if inst.shape[1] < max_len:
        inst = np.pad(inst, ((0, 0), (0, max_len - inst.shape[1])), mode="constant")
    return vocal, inst


def analyze_vocal_spectrum(vocal: np.ndarray, sr: int, cfg: dict[str, Any]) -> dict[str, float]:
    """Analyze spectral energy distribution via librosa to diagnose mud or sibilance."""
    mono = np.mean(vocal, axis=0)
    if np.max(np.abs(mono)) < 1e-6:
        return {"low_ratio": 0.0, "boxy_ratio": 0.0, "sib_ratio": 0.0, "air_ratio": 0.0}

    stft = np.abs(librosa.stft(mono, n_fft=2048, hop_length=512)) ** 2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    total_energy = float(np.sum(stft)) + 1e-12

    diag = cfg["diagnostics"]
    low_mask = freqs < diag["low_end_hz"]
    boxy_mask = (freqs >= diag["low_end_hz"]) & (freqs < 500.0)
    sib_mask = (freqs >= diag["sibilance_low_hz"]) & (freqs <= diag["sibilance_high_hz"])
    air_mask = freqs > 10000.0

    stats = {
        "low_ratio": float(np.sum(stft[low_mask, :]) / total_energy),
        "boxy_ratio": float(np.sum(stft[boxy_mask, :]) / total_energy),
        "sib_ratio": float(np.sum(stft[sib_mask, :]) / total_energy),
        "air_ratio": float(np.sum(stft[air_mask, :]) / total_energy),
    }

    print(
        f"[Spectral Diagnostics] Low(<{diag['low_end_hz']:.0f}Hz): {stats['low_ratio']:.1%} | "
        f"Boxy(250-500Hz): {stats['boxy_ratio']:.1%} | "
        f"Sibilance(5.5-9kHz): {stats['sib_ratio']:.1%} | "
        f"Air(>10kHz): {stats['air_ratio']:.1%}"
    )
    if stats["low_ratio"] > diag["low_end_warn_ratio"]:
        print("  -> Warning: Heavy low-end energy detected; HighpassFilter will clean rumble.")
    if stats["sib_ratio"] > diag["sibilance_warn_ratio"]:
        print("  -> Warning: Elevated sibilance detected; 6.5kHz PeakFilter will tame harshness.")
    return stats


def build_vocal_dry_chain(cfg: dict[str, Any]) -> pb.Pedalboard:
    """Build the pre-clean, surgical EQ, and compression chain for dry vocals."""
    pc = cfg["pre_clean"]
    eq = cfg["vocal_eq"]
    comp = cfg["vocal_comp"]
    return pb.Pedalboard([
        pb.HighpassFilter(cutoff_frequency_hz=pc["highpass_hz"]),
        pb.NoiseGate(
            threshold_db=pc["gate_threshold_db"],
            ratio=pc["gate_ratio"],
            attack_ms=pc["gate_attack_ms"],
            release_ms=pc["gate_release_ms"],
        ),
        pb.PeakFilter(
            cutoff_frequency_hz=eq["boxy_cut_hz"],
            gain_db=eq["boxy_cut_db"],
            q=eq["boxy_cut_q"],
        ),
        pb.PeakFilter(
            cutoff_frequency_hz=eq["presence_hz"],
            gain_db=eq["presence_db"],
            q=eq["presence_q"],
        ),
        pb.PeakFilter(
            cutoff_frequency_hz=eq["deess_hz"],
            gain_db=eq["deess_db"],
            q=eq["deess_q"],
        ),
        pb.HighShelfFilter(
            cutoff_frequency_hz=eq["air_shelf_hz"],
            gain_db=eq["air_shelf_db"],
            q=eq["air_shelf_q"],
        ),
        pb.Compressor(
            threshold_db=comp["threshold_db"],
            ratio=comp["ratio"],
            attack_ms=comp["attack_ms"],
            release_ms=comp["release_ms"],
        ),
    ])


def process_vocal_chain(vocal: np.ndarray, sr: int, cfg: dict[str, Any]) -> np.ndarray:
    """Process dry vocal chain and blend parallel damped reverb send/return."""
    dry_board = build_vocal_dry_chain(cfg)
    dry_vocal = dry_board(vocal, sr)

    rv = cfg["parallel_reverb"]
    reverb_send_board = pb.Pedalboard([
        pb.HighpassFilter(cutoff_frequency_hz=rv["return_highpass_hz"]),
        pb.Reverb(
            room_size=rv["room_size"],
            damping=rv["damping"],
            wet_level=1.0,
            dry_level=0.0,
            width=rv["width"],
        ),
    ])
    # Parallel Send/Return: process a copy of dry_vocal and blend back
    wet_return = reverb_send_board(dry_vocal.copy(), sr)
    return (dry_vocal + rv["return_mix"] * wet_return).astype(np.float32, copy=False)


def measure_lufs(audio_channels_first: np.ndarray, sr: int) -> float:
    """Measure integrated LUFS (ITU-R BS.1770-4) safely for any clip length."""
    samples_first = audio_channels_first.T
    min_samples = int(0.4 * sr) + 1
    if samples_first.shape[0] < min_samples:
        pad_len = min_samples - samples_first.shape[0]
        samples_first = np.pad(samples_first, ((0, pad_len), (0, 0)), mode="constant")
    meter = pyln.Meter(sr)
    lufs = float(meter.integrated_loudness(samples_first))
    return lufs


def normalize_lufs(audio: np.ndarray, sr: int, target_lufs: float) -> tuple[np.ndarray, float]:
    """Scale audio to target integrated LUFS, returning (scaled_audio, measured_lufs)."""
    current_lufs = measure_lufs(audio, sr)
    if not np.isfinite(current_lufs) or current_lufs < -70.0:
        return audio, current_lufs
    gain_db = target_lufs - current_lufs
    gain_lin = float(10.0 ** (gain_db / 20.0))
    return (audio * gain_lin).astype(np.float32, copy=False), current_lufs


def mix_and_master(
    vocal_path: Path,
    inst_path: Path,
    out_wav: Path,
    out_mp3: Path | None = None,
    delay_ms: int = 0,
    vocal_gain: float = 1.0,
    inst_gain: float = 1.0,
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run full RVC vocal chain, parallel reverb, LUFS matching, and mastering export."""
    cfg = copy.deepcopy(CONFIG if config is None else config)
    sr = int(cfg["sample_rate"])

    print(f"[RVC Pro Mix] Loading vocal: {vocal_path}")
    vocal = load_stereo_audio(vocal_path, sr)
    print(f"[RVC Pro Mix] Loading instrumental: {inst_path}")
    inst = load_stereo_audio(inst_path, sr)

    vocal, inst = apply_delay_and_pad(vocal, inst, delay_ms, sr)

    # 1. Spectral diagnostics on raw RVC vocal
    diag_stats = analyze_vocal_spectrum(vocal, sr, cfg)

    # 2. Vocal Chain + Parallel Reverb
    processed_vocal = process_vocal_chain(vocal, sr, cfg)

    # 3. Gentle instrumental carve around vocal presence
    ic = cfg["inst_carve"]
    inst_board = pb.Pedalboard([
        pb.PeakFilter(
            cutoff_frequency_hz=ic["carve_hz"],
            gain_db=ic["carve_db"],
            q=ic["carve_q"],
        ),
    ])
    processed_inst = inst_board(inst, sr)

    # 4. ITU-R BS.1770-4 LUFS alignment between vocal and instrumental
    ld = cfg["loudness"]
    inst_target = ld["target_inst_lufs"]
    vocal_target = inst_target + ld["vocal_over_inst_lufs"]

    processed_inst, inst_raw_lufs = normalize_lufs(processed_inst, sr, inst_target)
    processed_vocal, vocal_raw_lufs = normalize_lufs(processed_vocal, sr, vocal_target)

    # Apply optional user trim multipliers on top of LUFS-matched balance
    processed_vocal *= float(vocal_gain)
    processed_inst *= float(inst_gain)

    print(
        f"[Loudness Match] Raw Vocal: {vocal_raw_lufs:.2f} LUFS -> {vocal_target:.2f} LUFS | "
        f"Raw Inst: {inst_raw_lufs:.2f} LUFS -> {inst_target:.2f} LUFS"
    )

    # 5. Sum & Master (Bus Glue + LUFS target + True-Peak Limiter at -1.0 dBTP)
    summed = (processed_vocal + processed_inst).astype(np.float32, copy=False)
    summed, pre_master_lufs = normalize_lufs(summed, sr, ld["master_target_lufs"])

    ms = cfg["mastering"]
    master_board = pb.Pedalboard([
        pb.Compressor(
            threshold_db=ms["bus_comp_threshold_db"],
            ratio=ms["bus_comp_ratio"],
            attack_ms=ms["bus_comp_attack_ms"],
            release_ms=ms["bus_comp_release_ms"],
        ),
        pb.Limiter(
            threshold_db=ms["limiter_threshold_db"],
            release_ms=ms["limiter_release_ms"],
        ),
    ])
    mastered = master_board(summed, sr)

    # Hard safety clip just in case of numerical overshoot beyond limiter ceiling
    ceiling_lin = float(10.0 ** (ms["limiter_threshold_db"] / 20.0))
    mastered = np.clip(mastered, -ceiling_lin, ceiling_lin)

    final_lufs = measure_lufs(mastered, sr)
    peak_db = float(20.0 * np.log10(max(float(np.max(np.abs(mastered))), 1e-12)))
    print(f"[Mastering] Final Integrated: {final_lufs:.2f} LUFS | Peak: {peak_db:.2f} dBTP")

    # 6. Export 24-bit WAV and high-quality MP3
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out_wav), mastered.T, sr, subtype="PCM_24")
    print(f"[Export] 24-bit WAV saved: {out_wav}")

    if out_mp3 is not None:
        out_mp3.parent.mkdir(parents=True, exist_ok=True)
        with AudioFile(
            str(out_mp3),
            "w",
            samplerate=sr,
            num_channels=mastered.shape[0],
            quality=ms["mp3_quality"],
        ) as mp3_file:
            mp3_file.write(mastered)
        print(f"[Export] High-quality MP3 saved: {out_mp3}")

    return {
        "out_wav": str(out_wav),
        "out_mp3": str(out_mp3) if out_mp3 else None,
        "sample_rate": sr,
        "final_lufs": final_lufs,
        "peak_db": peak_db,
        "pre_master_lufs": pre_master_lufs,
        "diagnostics": diag_stats,
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Professional RVC Auto-Mixing System (Pedalboard)")
    p.add_argument("--vocal", required=True, help="Path to RVC vocal WAV")
    p.add_argument("--inst", required=True, help="Path to instrumental WAV")
    p.add_argument("--out-wav", required=True, help="Output 24-bit WAV path")
    p.add_argument("--out-mp3", default=None, help="Output high-quality MP3 path (optional)")
    p.add_argument("--delay-ms", type=int, default=0, help="Vocal delay in ms (negative delays inst)")
    p.add_argument("--vocal-gain", type=float, default=1.0, help="Extra vocal multiplier after LUFS match")
    p.add_argument("--inst-gain", type=float, default=1.0, help="Extra inst multiplier after LUFS match")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    out_wav = Path(args.out_wav)
    out_mp3 = Path(args.out_mp3) if args.out_mp3 else out_wav.with_suffix(".mp3")
    mix_and_master(
        vocal_path=Path(args.vocal),
        inst_path=Path(args.inst),
        out_wav=out_wav,
        out_mp3=out_mp3,
        delay_ms=args.delay_ms,
        vocal_gain=args.vocal_gain,
        inst_gain=args.inst_gain,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
