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

## Tasks (lamarck/tasks/)
Long-running monitor scripts, run in tmux.

| Script | Description |
|--------|-------------|
| monitor-blogger.ts | Monitor a blogger for new posts |
| monitor-hackernews.ts | Monitor Hacker News front page, save to inbox (source=hackernews) |
| monitor-producthunt.ts | Monitor Product Hunt front page, save to inbox |
| monitor-reddit.ts | Monitor Reddit subreddit hot posts, save to inbox (source=reddit) |

## Tasks (lamarck/tasks/)

Long-running background monitors. Run with tmux.

| Script | Description |
|--------|-------------|
| monitor-reddit.ts | Monitor Reddit subreddit hot posts |
| monitor-producthunt.ts | Monitor Product Hunt daily hot products |

## download-douyin-video.ts
Download Douyin video by ID or URL.
```bash
npx tsx download-douyin-video.ts <video_id_or_url> [output_dir]
npx tsx download-douyin-video.ts 7603069063497043234
npx tsx download-douyin-video.ts https://www.douyin.com/video/7603069063497043234
```
