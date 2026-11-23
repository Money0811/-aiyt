"""Fetch daily AI news from official blogs, tech media, HN, GitHub Trending, Reddit, and HF Daily Papers."""

from __future__ import annotations

import html
import json
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

import feedparser
import httpx

ROOT_DIR = Path(__file__).resolve().parent.parent
SOURCES_PATH = ROOT_DIR / "sources.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Morning-News/1.0"
}


def clean_text(raw: str, max_len: int = 400) -> str:
    text = html.unescape(re.sub(r"<[^>]+>", " ", raw or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_len] + ("..." if len(text) > max_len else "")


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        pass
    try:
        dt = parsedate_to_datetime(value)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def fetch_rss(client: httpx.Client, feed_cfg: dict[str, str], cutoff: datetime) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    resp = client.get(feed_cfg["url"], timeout=15)
    resp.raise_for_status()
    parsed = feedparser.parse(resp.text)
    for entry in parsed.entries[:20]:
        published = parse_dt(entry.get("published") or entry.get("updated"))
        if published and published < cutoff:
            continue
        items.append(
            {
                "source": feed_cfg["name"],
                "category": feed_cfg["category"],
                "title": clean_text(entry.get("title", ""), 200),
                "url": entry.get("link", ""),
                "published_at": published.isoformat() if published else None,
                "summary": clean_text(entry.get("summary") or entry.get("description", ""), 400),
            }
        )
    return items


def fetch_anthropic(client: httpx.Client, cfg: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    resp = client.get(cfg["url"], timeout=15)
    resp.raise_for_status()
    matches = re.findall(
        r'href="(/news/[^"]+)"[^>]*>.*?<h[234][^>]*>(.*?)</h[234]>',
        resp.text,
        flags=re.DOTALL,
    )
    seen: set[str] = set()
    for path, raw_title in matches:
        url = f"https://www.anthropic.com{path}"
        title = clean_text(raw_title, 200)
        if not title or url in seen:
            continue
        seen.add(url)
        items.append(
            {
                "source": "Anthropic News",
                "category": "official",
                "title": title,
                "url": url,
                "published_at": None,
                "summary": "",
            }
        )
        if len(items) >= cfg.get("limit", 10):
            break
    return items


def fetch_hacker_news(client: httpx.Client, cfg: dict[str, Any], cutoff: datetime) -> list[dict[str, Any]]:
    ts_cutoff = int(cutoff.timestamp())
    min_pts = cfg.get("min_points", 50)
    url = (
        "https://hn.algolia.com/api/v1/search_by_date"
        f"?tags=story&numericFilters=created_at_i>{ts_cutoff},points>={min_pts}"
        f"&hitsPerPage={cfg.get('limit', 20)}"
    )
    resp = client.get(url, timeout=15)
    resp.raise_for_status()
    items: list[dict[str, Any]] = []
    for hit in resp.json().get("hits", []):
        items.append(
            {
                "source": "Hacker News",
                "category": "community",
                "title": hit.get("title", ""),
                "url": hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                "hn_url": f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                "score": hit.get("points", 0),
                "comments": hit.get("num_comments", 0),
                "published_at": hit.get("created_at"),
                "summary": "",
            }
        )
    return items


def fetch_reddit(client: httpx.Client, subreddit: str, cutoff: datetime) -> list[dict[str, Any]]:
    url = f"https://www.reddit.com/r/{subreddit}/hot/.rss?limit=15"
    resp = client.get(
        url,
        headers={
            "User-Agent": "python:ai-morning-news:v0.1.0 (by /u/ai_morning_news_bot)",
            "Accept": "application/rss+xml, application/xml, text/xml",
        },
        timeout=15,
    )
    resp.raise_for_status()
    parsed = feedparser.parse(resp.text)
    items: list[dict[str, Any]] = []
    for entry in parsed.entries[:15]:
        published = parse_dt(entry.get("published") or entry.get("updated"))
        if published and published < cutoff:
            continue
        items.append(
            {
                "source": f"r/{subreddit}",
                "category": "community",
                "title": clean_text(entry.get("title", ""), 200),
                "url": entry.get("link", ""),
                "published_at": published.isoformat() if published else None,
                "summary": clean_text(entry.get("summary", ""), 350),
            }
        )
    return items


def fetch_github_trending(client: httpx.Client, cfg: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for lang in cfg.get("languages", [""]):
        url = f"https://github.com/trending/{lang}?since=daily" if lang else "https://github.com/trending?since=daily"
        resp = client.get(url, timeout=15)
        resp.raise_for_status()
        articles = re.findall(r'<article class="Box-row">(.*?)</article>', resp.text, flags=re.DOTALL)
        for block in articles:
            repo_match = re.search(r'<h2[^>]*>.*?href="(/[^"]+)"', block, flags=re.DOTALL)
            if not repo_match:
                continue
            repo_path = repo_match.group(1).strip()
            if repo_path in seen:
                continue
            seen.add(repo_path)
            desc_match = re.search(r'<p class="[^"]*col-9[^"]*">(.*?)</p>', block, flags=re.DOTALL)
            stars_match = re.search(r'([\d,]+)\s+stars today', block)
            items.append(
                {
                    "source": "GitHub Trending",
                    "category": "opensource",
                    "title": repo_path.lstrip("/"),
                    "url": f"https://github.com{repo_path}",
                    "stars_today": stars_match.group(1) if stars_match else "",
                    "summary": clean_text(desc_match.group(1), 300) if desc_match else "",
                }
            )
            if len(items) >= cfg.get("limit", 15):
                return items
    return items


def fetch_hf_daily_papers(client: httpx.Client, cfg: dict[str, Any]) -> list[dict[str, Any]]:
    resp = client.get("https://huggingface.co/api/daily_papers", timeout=15)
    resp.raise_for_status()
    items: list[dict[str, Any]] = []
    for entry in resp.json()[: cfg.get("limit", 15)]:
        paper = entry.get("paper", {})
        paper_id = paper.get("id", "")
        items.append(
            {
                "source": "HF Daily Papers",
                "category": "paper",
                "title": paper.get("title", ""),
                "url": f"https://huggingface.co/papers/{paper_id}" if paper_id else "",
                "arxiv_url": f"https://arxiv.org/abs/{paper_id}" if paper_id else "",
                "upvotes": paper.get("upvotes", 0),
                "published_at": entry.get("publishedAt"),
                "summary": clean_text(paper.get("summary", ""), 400),
            }
        )
    return items


def main() -> None:
    cfg = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    now = datetime.now(timezone(timedelta(hours=8)))
    cutoff = datetime.now(timezone.utc) - timedelta(hours=36)

    all_items: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    with httpx.Client(headers=HEADERS, follow_redirects=True) as client:
        for feed in cfg.get("rss_feeds", []):
            try:
                fetched = fetch_rss(client, feed, cutoff)
                all_items.extend(fetched)
                print(f"[OK] {feed['name']}: {len(fetched)} items")
            except Exception as exc:
                errors.append({"source": feed["name"], "error": str(exc)})
                print(f"[WARN] {feed['name']}: {exc}")

        if "anthropic_news" in cfg:
            try:
                fetched = fetch_anthropic(client, cfg["anthropic_news"])
                all_items.extend(fetched)
                print(f"[OK] Anthropic News: {len(fetched)} items")
            except Exception as exc:
                errors.append({"source": "Anthropic News", "error": str(exc)})
                print(f"[WARN] Anthropic News: {exc}")

        if "hacker_news" in cfg:
            try:
                fetched = fetch_hacker_news(client, cfg["hacker_news"], cutoff)
                all_items.extend(fetched)
                print(f"[OK] Hacker News: {len(fetched)} items")
            except Exception as exc:
                errors.append({"source": "Hacker News", "error": str(exc)})
                print(f"[WARN] Hacker News: {exc}")

        for sub in cfg.get("reddit_subreddits", []):
            try:
                fetched = fetch_reddit(client, sub, cutoff)
                all_items.extend(fetched)
                print(f"[OK] r/{sub}: {len(fetched)} items")
            except Exception as exc:
                errors.append({"source": f"r/{sub}", "error": str(exc)})
                print(f"[WARN] r/{sub}: {exc}")

        if "github_trending" in cfg:
            try:
                fetched = fetch_github_trending(client, cfg["github_trending"])
                all_items.extend(fetched)
                print(f"[OK] GitHub Trending: {len(fetched)} items")
            except Exception as exc:
                errors.append({"source": "GitHub Trending", "error": str(exc)})
                print(f"[WARN] GitHub Trending: {exc}")

        if "hf_daily_papers" in cfg:
            try:
                fetched = fetch_hf_daily_papers(client, cfg["hf_daily_papers"])
                all_items.extend(fetched)
                print(f"[OK] HF Daily Papers: {len(fetched)} items")
            except Exception as exc:
                errors.append({"source": "HF Daily Papers", "error": str(exc)})
                print(f"[WARN] HF Daily Papers: {exc}")

    out_dir = ROOT_DIR / "output" / now.strftime("%Y-%m-%d")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "raw_news.json"
    out_path.write_text(
        json.dumps(
            {
                "fetched_at": now.isoformat(),
                "total_items": len(all_items),
                "errors": errors,
                "items": all_items,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nSaved {len(all_items)} items to {out_path}")


if __name__ == "__main__":
    main()
