#!/bin/bash
# Render all short-version videos in the "AI Confessions" series.
# Usage: bash tools/render-series.sh
#
# Renders 5 episodes + intro, all with SRT subtitles.

set -e
cd "$(dirname "$0")/.."

echo "=== Rendering AI Confessions Series ==="
echo ""

VIDEOS=(
  "content/000-intro/terminal-script.json:content/000-intro/intro.mp4"
  "content/demo-cognitive-debt/script-v4-short.json:content/demo-cognitive-debt/video-v4.mp4"
  "content/demo-memory/script-v2-short.json:content/demo-memory/video-v2.mp4"
  "content/demo-homogenization/script-v2-short.json:content/demo-homogenization/video-v2.mp4"
  "content/demo-vibe-coding/script-v2-short.json:content/demo-vibe-coding/video-v2.mp4"
  "content/demo-centaur/script-v2-short.json:content/demo-centaur/video-v2.mp4"
)

TOTAL=${#VIDEOS[@]}
CURRENT=0

for entry in "${VIDEOS[@]}"; do
  IFS=':' read -r input output <<< "$entry"
  CURRENT=$((CURRENT + 1))
  
  if [ ! -f "$input" ]; then
    echo "[$CURRENT/$TOTAL] SKIP (no script): $input"
    continue
  fi
  
  echo "[$CURRENT/$TOTAL] Rendering: $output"
  npx tsx tools/terminal-video.ts --input "$input" --output "$output" 2>&1 | grep -E "^(Video saved|Subtitles saved|Sections:)"
  
  # Show duration
  duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$output" 2>/dev/null | cut -d. -f1)
  echo "  -> ${duration}s"
  echo ""
done

echo "=== All done ==="
echo ""
echo "Videos ready at: content/demo-*/video-v2.mp4"
echo "Subtitles at:    content/demo-*/video-v2.srt"
echo ""
echo "Windows path: \\\\wsl\$\\Ubuntu\\home\\lamarck\\pi-mono\\lamarck\\projects\\douyin\\content\\"
