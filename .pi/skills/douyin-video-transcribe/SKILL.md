---
name: douyin-video-transcribe
description: Download Douyin videos via mcporter browser automation, extract audio with ffmpeg, and transcribe to text with faster-whisper. Use when you need to get the text content of a Douyin video.
---

# Douyin Video Transcribe

Download a Douyin video, extract its audio, and transcribe it to text.

## Step 1: Download Video

Open the Douyin video page in the browser, wait for the video to load, then extract the video source URL via JavaScript.

```bash
# Open the video page (replace VIDEO_ID with actual ID)
mcporter call chrome-devtools.new_page url="https://www.douyin.com/video/VIDEO_ID"
```

Wait a few seconds for the video player to initialize, then extract the video URL:

```bash
# Get the video source URL
mcporter call chrome-devtools.evaluate_script \
  --args '{"function": "() => { const v = document.querySelector(\"video\"); return v?.currentSrc || v?.src || v?.querySelector(\"source\")?.src || null; }"}'
```

If the result is null, the video may not have loaded yet. Wait a few more seconds and retry.

Once you have the video URL, download it with curl:

```bash
# Download the video file
mkdir -p /home/lamarck/pi-mono/lamarck/data/videos
curl -s -o "/home/lamarck/pi-mono/lamarck/data/videos/VIDEO_ID.mp4" "VIDEO_URL" \
  -H "Referer: https://www.douyin.com/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

Clean up the browser tab:

```bash
# Close the tab (get pageId from list_pages first)
mcporter call chrome-devtools.list_pages
mcporter call chrome-devtools.close_page pageId=PAGE_ID
```

## Step 2: Extract Audio

Use ffmpeg to extract the audio track from the video:

```bash
ffmpeg -i /home/lamarck/pi-mono/lamarck/data/videos/VIDEO_ID.mp4 \
  -vn -acodec libmp3lame -q:a 2 \
  /home/lamarck/pi-mono/lamarck/data/videos/VIDEO_ID.mp3 \
  -y -loglevel error
```

## Step 3: Transcribe

Use the transcribe-audio tool with faster-whisper:

```bash
cd /home/lamarck/pi-mono/lamarck/tools && npx tsx transcribe-audio.ts \
  /home/lamarck/pi-mono/lamarck/data/videos/VIDEO_ID.mp3 \
  -m small -l zh -t \
  -o /home/lamarck/pi-mono/lamarck/data/transcripts/VIDEO_ID.txt
```

Options:
- `-m small` — model size (tiny/base/small/medium/large). `small` is a good balance of speed and quality for Chinese.
- `-l zh` — language hint. Omit for auto-detection.
- `-t` — include timestamps in output.
- `-o FILE` — write to file instead of stdout.

The transcript file will contain the full text of the video, one segment per line.

## Output Locations

- Videos: `/home/lamarck/pi-mono/lamarck/data/videos/VIDEO_ID.mp4`
- Audio: `/home/lamarck/pi-mono/lamarck/data/videos/VIDEO_ID.mp3`
- Transcripts: `/home/lamarck/pi-mono/lamarck/data/transcripts/VIDEO_ID.txt`

## Tips

- For batch processing, look up video IDs from the database:
  ```sql
  SELECT aweme_id, title, datetime(create_time, 'unixepoch', 'localtime') as time
  FROM douyin_works
  ORDER BY create_time DESC LIMIT 10;
  ```
- Check if a video is already downloaded before re-downloading:
  ```bash
  ls /home/lamarck/pi-mono/lamarck/data/videos/VIDEO_ID.mp4 2>/dev/null
  ```
- Check if a transcript already exists:
  ```bash
  ls /home/lamarck/pi-mono/lamarck/data/transcripts/VIDEO_ID.txt 2>/dev/null
  ```
