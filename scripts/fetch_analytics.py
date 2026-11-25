"""Fetch YouTube channel and video analytics via YouTube Analytics API v2 & Data API v3."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

ROOT_DIR = Path(__file__).resolve().parent.parent
CLIENT_SECRETS = ROOT_DIR / "client_secrets.json"
TOKEN_FILE = ROOT_DIR / "token_analytics.json"
SCOPES = [
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
]


def get_credentials() -> Credentials:
    """Load or interactively obtain OAuth credentials for YouTube Analytics."""
    if not CLIENT_SECRETS.exists():
        raise FileNotFoundError(
            f"找不到 {CLIENT_SECRETS}，請先從 Google Cloud Console 下載 OAuth 憑證。"
        )
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    return creds


def rows_to_dicts(response: dict) -> list[dict]:
    """Convert YouTube Analytics columnHeaders + rows response into a list of dicts."""
    headers = [col["name"] for col in response.get("columnHeaders", [])]
    return [dict(zip(headers, row)) for row in response.get("rows", [])]


def fetch_video_metadata(youtube, video_ids: list[str]) -> dict[str, dict]:
    """Fetch title, publishedAt, duration, and public stats for a list of video IDs."""
    meta: dict[str, dict] = {}
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        if not batch:
            continue
        resp = (
            youtube.videos()
            .list(part="snippet,contentDetails,statistics", id=",".join(batch))
            .execute()
        )
        for item in resp.get("items", []):
            vid = item["id"]
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            meta[vid] = {
                "title": snippet.get("title", ""),
                "publishedAt": snippet.get("publishedAt", ""),
                "duration": item.get("contentDetails", {}).get("duration", ""),
                "publicViews": int(stats.get("viewCount", 0)),
                "publicLikes": int(stats.get("likeCount", 0)),
                "publicComments": int(stats.get("commentCount", 0)),
            }
    return meta


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Fetch YouTube Studio analytics data.")
    parser.add_argument("--days", type=int, default=28, help="Number of past days to query (default: 28)")
    parser.add_argument("--max-videos", type=int, default=25, help="Max top videos to include (default: 25)")
    parser.add_argument(
        "--out",
        default=str(ROOT_DIR / "output" / "analytics_latest.json"),
        help="Output JSON path",
    )
    args = parser.parse_args()

    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)
    yt_analytics = build("youtubeAnalytics", "v2", credentials=creds)

    end_date = dt.date.today()
    start_date = end_date - dt.timedelta(days=args.days)
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()

    channel_resp = (
        youtube.channels()
        .list(part="snippet,statistics", mine=True)
        .execute()
    )
    channels = channel_resp.get("items", [])
    if not channels:
        raise RuntimeError("找不到登入帳號底下的 YouTube 頻道，請確認授權時選擇了正確的頻道帳號。")
    ch = channels[0]
    channel_info = {
        "id": ch["id"],
        "title": ch.get("snippet", {}).get("title", ""),
        "statistics": ch.get("statistics", {}),
    }

    base_metrics = (
        "views,estimatedMinutesWatched,averageViewDuration,"
        "averageViewPercentage,likes,comments,shares,"
        "subscribersGained,subscribersLost"
    )

    overview_resp = (
        yt_analytics.reports()
        .query(
            ids="channel==MINE",
            startDate=start_str,
            endDate=end_str,
            metrics=base_metrics,
        )
        .execute()
    )
    overview_rows = rows_to_dicts(overview_resp)
    overview = overview_rows[0] if overview_rows else {}

    traffic_resp = (
        yt_analytics.reports()
        .query(
            ids="channel==MINE",
            startDate=start_str,
            endDate=end_str,
            dimensions="insightTrafficSourceType",
            metrics="views,estimatedMinutesWatched",
            sort="-views",
        )
        .execute()
    )
    traffic_sources = rows_to_dicts(traffic_resp)

    videos_resp = (
        yt_analytics.reports()
        .query(
            ids="channel==MINE",
            startDate=start_str,
            endDate=end_str,
            dimensions="video",
            metrics=base_metrics,
            sort="-views",
            maxResults=args.max_videos,
        )
        .execute()
    )
    top_videos = rows_to_dicts(videos_resp)
    video_meta = fetch_video_metadata(youtube, [v["video"] for v in top_videos])
    for v in top_videos:
        v.update(video_meta.get(v["video"], {}))

    daily_resp = (
        yt_analytics.reports()
        .query(
            ids="channel==MINE",
            startDate=start_str,
            endDate=end_str,
            dimensions="day",
            metrics="views,estimatedMinutesWatched,subscribersGained,subscribersLost",
            sort="day",
        )
        .execute()
    )
    daily_trend = rows_to_dicts(daily_resp)

    payload = {
        "fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "range": {"startDate": start_str, "endDate": end_str, "days": args.days},
        "channel": channel_info,
        "overview": overview,
        "trafficSources": traffic_sources,
        "topVideos": top_videos,
        "dailyTrend": daily_trend,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"頻道：{channel_info['title']} ({channel_info['id']})")
    print(f"區間：{start_str} ~ {end_str}（{args.days} 天）")
    if overview:
        print(
            f"總觀看：{overview.get('views', 0)} | "
            f"觀看分鐘：{overview.get('estimatedMinutesWatched', 0)} | "
            f"平均觀看時間：{overview.get('averageViewDuration', 0)} 秒 | "
            f"平均續看率：{overview.get('averageViewPercentage', 0)}% | "
            f"淨增訂閱：+{overview.get('subscribersGained', 0)} / -{overview.get('subscribersLost', 0)}"
        )
    print(f"\n熱門影片 Top {min(5, len(top_videos))}：")
    for idx, v in enumerate(top_videos[:5], 1):
        print(
            f"  {idx}. {v.get('title', v['video'])} — "
            f"{v.get('views', 0)} 次觀看, 平均 {v.get('averageViewPercentage', 0)}%"
        )
    print(f"\n完整報表已儲存至：{out_path}")


if __name__ == "__main__":
    main()
