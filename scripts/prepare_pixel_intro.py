import json
import math
import os
import random
import struct
import wave
from pathlib import Path
from PIL import Image

ROOT = Path(r"d:\youtube")
CHAR_SRC = ROOT / "assets" / "character"
CHAR_OUT = CHAR_SRC / "pixel"
INTRO_DIR = ROOT / "assets" / "intro"
SCRIPT_PATH = INTRO_DIR / "intro_script.json"

SAMPLE_RATE = 44100


def pixelate_character_sprites() -> None:
    """Convert character PNGs into crisp low-res pixel-art sprites with clean alpha."""
    CHAR_OUT.mkdir(parents=True, exist_ok=True)
    sprites = [
        "opening_normal.png",
        "opening_normal_closed.png",
        "chibi_excited.png",
        "chibi_excited_closed.png",
        "chibi_explain.png",
        "chibi_explain_closed.png",
        "chibi_chair.png",
        "chibi_chair_closed.png",
        "chibi_think.png",
    ]
    target_height = 128

    for name in sprites:
        src_path = CHAR_SRC / name
        if not src_path.exists():
            print(f"[skip] missing {src_path}")
            continue

        img = Image.open(src_path).convert("RGBA")
        # Crop transparent margins first so character fills sprite cleanly
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        w, h = img.size
        target_width = max(1, round(w * (target_height / h)))

        # Downscale with BOX then quantize RGB to 48 colors for crisp pixel-art palette
        small = img.resize((target_width, target_height), Image.Resampling.BOX)
        r, g, b, a = small.split()

        # Hard alpha threshold so there is no semi-transparent halo
        a_hard = a.point(lambda p: 255 if p >= 128 else 0)

        rgb = Image.merge("RGB", (r, g, b))
        quant = rgb.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
        qr, qg, qb = quant.split()
        out = Image.merge("RGBA", (qr, qg, qb, a_hard))

        out_path = CHAR_OUT / name
        out.save(out_path, "PNG")
        print(f"[sprite] {name} -> {out.size}")


def write_wav(path: Path, samples: list[float]) -> None:
    """Write mono 16-bit PCM WAV from normalized float samples [-1, 1]."""
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            frames.extend(struct.pack("<h", int(clamped * 32767)))
        wf.writeframes(bytes(frames))


def square_wave(freq: float, t: float, duty: float = 0.5) -> float:
    phase = (freq * t) % 1.0
    return 1.0 if phase < duty else -1.0


def triangle_wave(freq: float, t: float) -> float:
    phase = (freq * t) % 1.0
    return 4.0 * abs(phase - 0.5) - 1.0


def add_tone(
    buf: list[float],
    start_sec: float,
    dur_sec: float,
    freq: float,
    amp: float = 0.25,
    wave_type: str = "square",
    duty: float = 0.5,
    freq_end: float | None = None,
) -> None:
    start_idx = int(start_sec * SAMPLE_RATE)
    n_samples = int(dur_sec * SAMPLE_RATE)
    for i in range(n_samples):
        idx = start_idx + i
        if idx >= len(buf):
            break
        t = i / SAMPLE_RATE
        progress = i / max(1, n_samples - 1)
        f = freq if freq_end is None else freq + (freq_end - freq) * progress
        # Quick attack + exponential decay envelope
        attack = min(1.0, i / (0.004 * SAMPLE_RATE))
        decay = math.exp(-4.5 * progress)
        env = attack * decay
        if wave_type == "triangle":
            val = triangle_wave(f, t)
        else:
            val = square_wave(f, t, duty=duty)
        buf[idx] += val * amp * env


def add_sfx(buf: list[float], sfx_name: str, start_sec: float = 0.0) -> None:
    if sfx_name == "startup":
        add_tone(buf, start_sec + 0.00, 0.08, 440, amp=0.22, duty=0.25)
        add_tone(buf, start_sec + 0.10, 0.08, 587.33, amp=0.22, duty=0.25)
    elif sfx_name == "ding":
        add_tone(buf, start_sec + 0.00, 0.12, 987.77, amp=0.22, duty=0.25)
        add_tone(buf, start_sec + 0.07, 0.22, 1318.51, amp=0.24, duty=0.25)
    elif sfx_name == "powerup":
        notes = [523.25, 659.25, 783.99, 1046.50]
        for idx, f in enumerate(notes):
            add_tone(buf, start_sec + idx * 0.055, 0.12, f, amp=0.22, duty=0.25)
    elif sfx_name == "levelup":
        notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
        for idx, f in enumerate(notes):
            dur = 0.28 if idx == len(notes) - 1 else 0.07
            add_tone(buf, start_sec + idx * 0.065, dur, f, amp=0.24, duty=0.25)


def generate_line_audio(line: dict, chars_per_sec: float, seed: int) -> float:
    """Generate 8-bit beep-boop dialogue WAV for a single line. Returns duration in seconds."""
    rng = random.Random(seed)
    text = line["text"]
    tone = line.get("tone", "normal")
    sfx = line.get("sfx", "none")
    hold_sec = float(line.get("holdSec", 1.0))

    typing_sec = len(text) / chars_per_sec
    total_sec = typing_sec + hold_sec
    buf = [0.0] * int(total_sec * SAMPLE_RATE)

    base_freq_map = {
        "test": 420.0,
        "normal": 540.0,
        "cheerful": 640.0,
        "excited": 740.0,
        "mysterious": 480.0,
        "shy": 500.0,
    }
    base_f = base_freq_map.get(tone, 560.0)

    if sfx == "startup":
        add_sfx(buf, "startup", 0.0)

    char_dt = 1.0 / chars_per_sec
    pause_chars = set("，。、！？…—～「」《》 ")
    for i, ch in enumerate(text):
        t_char = i * char_dt
        if ch in pause_chars:
            continue
        # Alternate slightly in frequency for cute "beep-boop" cadence
        jitter = rng.uniform(-0.08, 0.14)
        freq = base_f * (1.0 + jitter)
        duty = 0.25 if tone in ("cheerful", "excited") else 0.5
        amp = 0.16 if tone == "shy" else 0.20
        add_tone(buf, t_char, 0.055, freq, amp=amp, duty=duty)

    if sfx in ("ding", "powerup"):
        add_sfx(buf, sfx, max(0.0, typing_sec - 0.15))
    elif sfx == "levelup":
        add_sfx(buf, "levelup", typing_sec + 0.1)

    out_path = INTRO_DIR / f"{line['id']}.wav"
    write_wav(out_path, buf)
    return total_sec


def generate_bgm(total_sec: float) -> None:
    """Generate a gentle 8-bit Chiptune BGM loop."""
    buf = [0.0] * int(total_sec * SAMPLE_RATE)
    bpm = 120.0
    eighth = 60.0 / bpm / 2.0  # 0.25s

    # Cute C-major / F-major / G-major / C-major loop (16 eighth-notes = 4s)
    melody = [
        523.25, 659.25, 783.99, 659.25,
        880.00, 783.99, 659.25, 523.25,
        587.33, 698.46, 880.00, 698.46,
        783.99, 659.25, 587.33, 523.25,
    ]
    bass = [
        130.81, 0, 196.00, 0,
        174.61, 0, 130.81, 0,
        146.83, 0, 174.61, 0,
        196.00, 0, 130.81, 0,
    ]

    step = 0
    t = 0.0
    while t < total_sec - 0.1:
        m_freq = melody[step % len(melody)]
        b_freq = bass[step % len(bass)]
        if m_freq > 0:
            add_tone(buf, t, eighth * 0.75, m_freq, amp=0.045, wave_type="square", duty=0.25)
        if b_freq > 0:
            add_tone(buf, t, eighth * 1.4, b_freq, amp=0.075, wave_type="triangle")
        step += 1
        t = step * eighth

    write_wav(INTRO_DIR / "bgm.wav", buf)
    print(f"[audio] bgm.wav ({total_sec:.2f}s)")


def main() -> None:
    pixelate_character_sprites()
    script = json.loads(SCRIPT_PATH.read_text(encoding="utf-8"))
    fps = int(script.get("fps", 30))
    cps = float(script.get("charsPerSecond", 11))

    total_frames = 0
    for idx, line in enumerate(script["lines"]):
        dur_sec = generate_line_audio(line, cps, seed=100 + idx)
        frames = math.ceil(dur_sec * fps)
        line["durationFrames"] = frames
        total_frames += frames
        print(f"[audio] {line['id']}.wav ({dur_sec:.2f}s / {frames}f)")

    script["totalFrames"] = total_frames
    SCRIPT_PATH.write_text(json.dumps(script, ensure_ascii=False, indent=2), encoding="utf-8")
    generate_bgm(total_frames / fps)
    print(f"[done] Total duration: {total_frames / fps:.2f}s ({total_frames} frames @ {fps}fps)")


if __name__ == "__main__":
    main()
