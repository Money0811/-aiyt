"""Capture real webpage screenshots for morning briefing columns using Playwright."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent


def capture_episode_screenshots(date_str: str = "2026-11-22") -> None:
    ep_dir = ROOT_DIR / "output" / date_str
    briefing_path = ep_dir / "briefing.json"
    briefing = json.loads(briefing_path.read_text(encoding="utf-8"))

    out_dir = ROOT_DIR / "assets" / "episode" / "screenshots"
    out_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1080, "height": 780},
            device_scale_factor=1,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        )
        page = context.new_page()

        for col in briefing["columns"]:
            idx = col["index"]
            urls = col.get("sources") or []
            if not urls:
                continue
            target_url = urls[0]
            out_path = out_dir / f"col_{idx}.png"
            print(f"Capturing col_{idx}: {target_url}")
            try:
                page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(1800)
                page.screenshot(path=str(out_path), full_page=False)
                col["screenshot_image"] = f"episode/screenshots/col_{idx}.png"
                print(f"  -> Saved {out_path.name}")
            except Exception as exc:
                print(f"  -> [WARN] Failed {target_url}: {exc}")

        browser.close()

    briefing_path.write_text(
        json.dumps(briefing, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    # Also mirror updated briefing.json to assets/episode/
    ep_assets = ROOT_DIR / "assets" / "episode" / "briefing.json"
    ep_assets.parent.mkdir(parents=True, exist_ok=True)
    ep_assets.write_text(briefing_path.read_text(encoding="utf-8"), encoding="utf-8")


if __name__ == "__main__":
    date_arg = sys.argv[1] if len(sys.argv) > 1 else "2026-11-22"
    capture_episode_screenshots(date_arg)
