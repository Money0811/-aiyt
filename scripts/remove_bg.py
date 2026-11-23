"""Convert solid white-background character JPGs into transparent PNGs."""

from collections import deque
from pathlib import Path
from PIL import Image


def remove_white_background(
    src_path: Path,
    dst_path: Path,
    white_threshold: int = 242,
    feather_threshold: int = 225,
) -> None:
    """Flood-fill from the image borders to remove pure/near-white background."""
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    def is_bg(r: int, g: int, b: int) -> bool:
        return r >= white_threshold and g >= white_threshold and b >= white_threshold

    visited = [[False] * width for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()

    # Seed flood-fill from all four edges
    for x in range(width):
        for y in (0, height - 1):
            r, g, b, _ = pixels[x, y]
            if is_bg(r, g, b) and not visited[y][x]:
                visited[y][x] = True
                queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            r, g, b, _ = pixels[x, y]
            if is_bg(r, g, b) and not visited[y][x]:
                visited[y][x] = True
                queue.append((x, y))

    while queue:
        cx, cy = queue.popleft()
        pixels[cx, cy] = (255, 255, 255, 0)
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
                r, g, b, _ = pixels[nx, ny]
                if is_bg(r, g, b):
                    visited[ny][nx] = True
                    queue.append((nx, ny))

    # Soften 1px fringe adjacent to transparent pixels
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r >= feather_threshold and g >= feather_threshold and b >= feather_threshold:
                has_transparent_neighbor = any(
                    pixels[nx, ny][3] == 0
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                )
                if has_transparent_neighbor:
                    brightness = (r + g + b) / 3.0
                    new_alpha = int(max(0, min(255, (255 - brightness) * 6)))
                    pixels[x, y] = (r, g, b, new_alpha)

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst_path, "PNG")


def main() -> None:
    char_dir = Path(__file__).resolve().parent.parent / "assets" / "character"
    for jpg_path in sorted(char_dir.glob("*.jpg")):
        png_path = jpg_path.with_suffix(".png")
        remove_white_background(jpg_path, png_path)
        print(f"Converted: {jpg_path.name} -> {png_path.name}")


if __name__ == "__main__":
    main()
