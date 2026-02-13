#!/bin/bash
# Verify all publish-ready video assets exist and are valid.
# Usage: bash tools/verify-assets.sh

set -e
cd "$(dirname "$0")/.."

echo "=== Publish Asset Verification ==="
echo ""

ERRORS=0

VIDEOS=(
  "000-intro:content/000-intro/intro.mp4::"
  "认知债:content/demo-cognitive-debt/video-v4.mp4:content/demo-cognitive-debt/video-v4.srt:content/demo-cognitive-debt/cover.png"
  "AI记忆:content/demo-memory/video-v2.mp4:content/demo-memory/video-v2.srt:content/demo-memory/cover.png"
  "同质化:content/demo-homogenization/video-v2.mp4:content/demo-homogenization/video-v2.srt:content/demo-homogenization/cover.png"
  "Vibe Coding:content/demo-vibe-coding/video-v2.mp4:content/demo-vibe-coding/video-v2.srt:content/demo-vibe-coding/cover.png"
  "半人马:content/demo-centaur/video-v2.mp4:content/demo-centaur/video-v2.srt:content/demo-centaur/cover.png"
  "AI陪伴:content/demo-companion/video-v2.mp4:content/demo-companion/video-v2.srt:content/demo-companion/cover.png"
  "创新停滞:content/demo-innovation/video-v2.mp4:content/demo-innovation/video-v2.srt:content/demo-innovation/cover.png"
  "人才管道:content/demo-pipeline/video-v2.mp4:content/demo-pipeline/video-v2.srt:content/demo-pipeline/cover.png"
  "AI正面突破:content/demo-positive/video-v2.mp4:content/demo-positive/video-v2.srt:content/demo-positive/cover.png"
)

for entry in "${VIDEOS[@]}"; do
  IFS=':' read -r name video srt cover <<< "$entry"
  
  # Check video
  if [ ! -f "$video" ]; then
    echo "  MISSING video: $video"
    ERRORS=$((ERRORS + 1))
  else
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$video" 2>/dev/null | cut -d. -f1)
    size=$(du -h "$video" | cut -f1)
    # Check pixel format
    pix=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 "$video" 2>/dev/null)
    fmt_ok="OK"
    if [ "$pix" != "yuv420p" ]; then
      fmt_ok="WARN:$pix"
      ERRORS=$((ERRORS + 1))
    fi
    echo "  OK  ${dur}s  ${size}  ${fmt_ok}  $name"
  fi
  
  # Check SRT
  if [ -n "$srt" ]; then
    if [ ! -f "$srt" ]; then
      echo "       MISSING srt: $srt"
      ERRORS=$((ERRORS + 1))
    fi
  fi
  
  # Check cover
  if [ -n "$cover" ]; then
    if [ ! -f "$cover" ]; then
      echo "       MISSING cover: $cover"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "All assets verified. Ready to publish."
else
  echo "$ERRORS issue(s) found."
fi
