"""Upload a rendered morning briefing video and thumbnail to YouTube via YouTube Data API v3."""

from __future__ import annotations

import argparse
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

ROOT_DIR = Path(__file__).resolve().parent.parent
CLIENT_SECRETS = ROOT_DIR / "client_secrets.json"
TOKEN_FILE = ROOT_DIR / "token.json"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def get_authenticated_service():
    if not CLIENT_SECRETS.exists():
        raise FileNotFoundError(
            f"找不到 {CLIENT_SECRETS}，請先從 Google Cloud Console 下載 OAuth 桌面應用程式憑證並存成 client_secrets.json。"
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
    return build("youtube", "v3", credentials=creds)


def parse_meta(meta_path: Path) -> tuple[str, str]:
    text = meta_path.read_text(encoding="utf-8")
    title = ""
    description = ""
    for marker in ("=== 資訊欄簡介（含時間軸）===", "=== 資訊欄簡介 ==="):
        if "=== 推薦標題 ===" in text and marker in text:
            part_title, part_desc = text.split(marker, 1)
            title = part_title.replace("=== 推薦標題 ===", "").strip()
            description = part_desc.strip()
            break
    return title[:100], description


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default="2026-11-22")
    parser.add_argument("--video", default="")
    parser.add_argument("--meta", default="")
    parser.add_argument("--privacy", default="private", choices=["private", "unlisted", "public"])
    args = parser.parse_args()

    ep_dir = ROOT_DIR / "output" / args.date
    if args.video:
        video_path = Path(args.video)
    else:
        mp4s = sorted(ep_dir.glob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not mp4s:
            raise FileNotFoundError(f"在 {ep_dir} 找不到 .mp4 影片檔")
        video_path = mp4s[0]

    thumb_path = ep_dir / "thumbnail.png"
    meta_path = Path(args.meta) if args.meta else (ep_dir / "youtube_meta.txt")
    title, description = parse_meta(meta_path)

    print(f"Uploading video: {video_path.name}")
    print(f"Title: {title}")
    print(f"Privacy: {args.privacy}")

    youtube = get_authenticated_service()
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": ["AI新聞", "人工智慧", "哈Gemi早報", "科技早報", "AI趨勢"],
            "categoryId": "28",  # Science & Technology
            "defaultLanguage": "zh-TW",
        },
        "status": {
            "privacyStatus": args.privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(video_path), chunksize=1024 * 1024 * 8, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Uploaded {int(status.progress() * 100)}%")

    video_id = response["id"]
    print(f"Video uploaded! ID: {video_id}")
    print(f"Watch URL: https://www.youtube.com/watch?v={video_id}")

    if thumb_path.exists():
        print(f"Uploading thumbnail: {thumb_path.name}...")
        try:
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(str(thumb_path)),
            ).execute()
            print("Thumbnail updated!")
        except HttpError as exc:
            print(
                f"[WARN] 無法透過 API 設定自訂縮圖（請確認頻道已在 YouTube Studio 完成手機驗證啟用「中級功能」）：{exc}"
            )


if __name__ == "__main__":
    main()
