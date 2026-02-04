# Tools

Small, composable TypeScript scripts following Unix philosophy. Each does one thing well.
All scripts output their result to stdout and can be composed.

## Setup

```bash
cd lamarck/tools && npm install
```

Each script is self-sufficient — external binaries (e.g., yt-dlp) are
downloaded automatically on first run.

## Usage

Use `-h` on any script for detailed usage.

| Script | Description |
|--------|-------------|
| download-video.ts | Download video from URL (Douyin, Bilibili, YouTube, etc.) |
| extract-audio.ts | Extract audio track from video file |

## Cookies

Some platforms require login cookies. Place them in `cookies/` named by platform:
`douyin.txt`, `bilibili.txt`, `youtube.txt`, etc. Auto-detected from URL.

## Examples

```bash
# Download a video
npx tsx download-video.ts -o ./videos "https://www.douyin.com/video/xxx"

# Download + extract audio (composable)
video=$(npx tsx download-video.ts "https://...") && npx tsx extract-audio.ts "$video"
```
