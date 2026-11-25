"""Extract and background-remove the front-view chibi sprite from 3-view turnaround sheets."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from remove_bg import remove_white_background


def extract_front_sprite(turnaround_path: Path, out_path: Path) -> None:
    tmp_nobg = out_path.with_name("_tmp_turnaround_nobg.png")
    remove_white_background(turnaround_path, tmp_nobg, white_threshold=238, feather_threshold=215)

    img = Image.open(tmp_nobg).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]

    # Find horizontal spans of opaque content (the 3 views: front, side, back)
    col_has_pixel = np.any(alpha > 20, axis=0)
    spans: list[tuple[int, int]] = []
    in_span = False
    start = 0
    for x, has in enumerate(col_has_pixel):
        if has and not in_span:
            in_span = True
            start = x
        elif not has and in_span:
            in_span = False
            if x - start > 30:  # ignore tiny speckles
                spans.append((start, x))
    if in_span and len(col_has_pixel) - start > 30:
        spans.append((start, len(col_has_pixel)))

    if spans:
        x0, x1 = spans[0]
        # Guard against merged spans: if first span is > 45% of width, clamp to left 36%
        if (x1 - x0) > img.width * 0.45:
            x1 = int(img.width * 0.36)
    else:
        x0, x1 = 0, int(img.width * 0.34)

    front_crop = img.crop((max(0, x0 - 6), 0, min(img.width, x1 + 6), img.height))
    bbox = front_crop.getbbox()
    if bbox:
        front_crop = front_crop.crop(bbox)

    front_crop.save(out_path)
    tmp_nobg.unlink(missing_ok=True)
    print(f"Extracted front sprite ({front_crop.size[0]}x{front_crop.size[1]}) -> {out_path}")


def main() -> None:
    models_dir = Path(__file__).resolve().parent.parent / "assets" / "models"
    for mid in ("claude", "deepseek", "qwen", "llama", "glm", "mistral", "gpt", "gemini"):
        src = models_dir / mid / "chibi_turnaround.jpg"
        if not src.exists():
            print(f"[SKIP] Missing {src}")
            continue
        dst = models_dir / mid / "chibi_front.png"
        extract_front_sprite(src, dst)


if __name__ == "__main__":
    main()
