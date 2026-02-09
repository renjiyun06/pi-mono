# Tool Index

Use `--help` on any script for detailed usage.

## Tools (lamarck/tools/)
One-shot scripts for specific tasks.

| Script | Description |
|--------|-------------|
| download-video.ts | Download video from URL (Douyin, Bilibili, YouTube, etc.) |
| extract-audio.ts | Extract audio track from video file |
| transcribe-audio.ts | Transcribe audio to text using faster-whisper |
| generate-image.ts | Generate images using OpenRouter API (default: Nano Banana) |
| fetch-zhihu-hot.ts | Fetch Zhihu Hot List (知乎热榜，30条) |

## Tasks (lamarck/tasks/)
Long-running monitor scripts, run in tmux.

| Script | Description |
|--------|-------------|
| monitor-blogger.ts | Monitor Douyin bloggers for new videos |
| monitor-hackernews.ts | Monitor Hacker News front page, save to inbox (source=hackernews) |
| monitor-producthunt.ts | Monitor Product Hunt front page, save to inbox |
| monitor-reddit.ts | Monitor Reddit subreddit hot posts, save to inbox (source=reddit) |
| monitor-twitter.ts | Monitor Twitter/X AI KOL accounts, save to inbox (source=twitter) |

## download-douyin-video.ts
Download Douyin video by ID or URL.
```bash
npx tsx download-douyin-video.ts <video_id_or_url> [output_dir]
npx tsx download-douyin-video.ts 7603069063497043234
npx tsx download-douyin-video.ts https://www.douyin.com/video/7603069063497043234
```

## find-agent-session.ts
根据 tmux session 名称查找对应的 pi 会话文件
```bash
npx tsx find-agent-session.ts <session-name>
```

## fetch-somebodymakethis.ts
从 somebodymakethis.org 抓取整理好的 Reddit 需求帖。支持分页（--page）、搜索（--search）、分类筛选（--category）。返回 JSON 数组（title, category, description, claps, url）。
