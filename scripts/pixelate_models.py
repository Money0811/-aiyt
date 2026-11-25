"""Convert transparent character PNGs into crisp, outlined pixel-art sprites."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def pixelate_sprite(
    src_path: Path,
    dst_path: Path,
    target_height: int = 120,
    num_colors: int = 48,
    upscale: int = 6,
    outline_color: tuple[int, int, int, int] = (20, 18, 32, 255),
) -> None:
    img = Image.open(src_path).convert("RGBA")
    # Crop tight to non-transparent bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    w, h = img.size
    target_w = max(16, int(round(w * (target_height / h))))

    # Downscale with LANCZOS for clean proportions, then binarize alpha cleanly
    small = img.resize((target_w, target_height), Image.Resampling.LANCZOS)
    arr = np.array(small)
    alpha = arr[:, :, 3]
    mask = alpha >= 110

    # Quantize RGB colors on opaque pixels only
    rgb_img = Image.fromarray(arr[:, :, :3], mode="RGB")
    quantized = rgb_img.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    q_rgb = np.array(quantized.convert("RGB"))

    # Create padded canvas (+2px border for 1px outline)
    out_h, out_w = target_height + 2, target_w + 2
    out = np.zeros((out_h, out_w, 4), dtype=np.uint8)

    # Place opaque pixels
    padded_mask = np.zeros((out_h, out_w), dtype=bool)
    padded_mask[1:-1, 1:-1] = mask
    out[1:-1, 1:-1, :3] = q_rgb
    out[1:-1, 1:-1, 3] = np.where(mask, 255, 0)

    # Add crisp 1px dark outline around non-transparent silhouette (4-neighborhood)
    outline_mask = np.zeros((out_h, out_w), dtype=bool)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        shifted = np.roll(padded_mask, shift=(dy, dx), axis=(0, 1))
        outline_mask |= shifted & (~padded_mask)
    # Clear wrap-around edges
    outline_mask[0, :] |= padded_mask[1, :] & (~padded_mask[0, :])
    out[outline_mask] = outline_color

    sprite = Image.fromarray(out, mode="RGBA")
    final_sprite = sprite.resize((out_w * upscale, out_h * upscale), Image.Resampling.NEAREST)
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    final_sprite.save(dst_path)
    print(f"Pixelated ({out_w}x{out_h} -> {final_sprite.size[0]}x{final_sprite.size[1]}): {dst_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", nargs="+", default=["claude", "deepseek", "qwen", "llama", "glm", "mistral", "gpt", "gemini"])
    parser.add_argument("--height", type=int, default=120)
    parser.add_argument("--colors", type=int, default=48)
    args = parser.parse_args()

    models_dir = Path(__file__).resolve().parent.parent / "assets" / "models"
    for mid in args.models:
        src = models_dir / mid / "portrait.png"
        if not src.exists():
            print(f"[SKIP] Missing {src}")
            continue
        dst = models_dir / mid / "pixel.png"
        pixelate_sprite(src, dst, target_height=args.height, num_colors=args.colors)


if __name__ == "__main__":
    main()
