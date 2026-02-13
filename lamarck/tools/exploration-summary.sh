#!/bin/bash
# Quick summary of all explorations with status
# Usage: ./exploration-summary.sh

DIR="/home/lamarck/pi-mono/lamarck/projects/douyin/exploration"

echo "=== Exploration Notes Summary ==="
echo ""

for f in "$DIR"/0*.md; do
  num=$(basename "$f" .md | cut -d- -f1)
  title=$(head -1 "$f" | sed 's/^# //' | sed 's/^探索.*：//')
  status=$(grep -m1 "^\*\*状态\*\*" "$f" | sed 's/\*\*状态\*\*：//' | head -1)
  has_video="no"
  
  # Check for prototype video
  for vdir in /home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-*/; do
    if [ -f "${vdir}script.json" ]; then
      script_title=$(python3 -c "import json; print(json.load(open('${vdir}script.json'))['title'])" 2>/dev/null)
      if [ -n "$script_title" ]; then
        has_video="yes"
        break
      fi
    fi
  done
  
  echo "  $num | $title"
  if [ -n "$status" ]; then
    echo "       Status: $status"
  fi
done

echo ""
echo "=== Video Assets ==="
for vdir in /home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-*/; do
  name=$(basename "$vdir")
  if [ -f "${vdir}video.mp4" ]; then
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "${vdir}video.mp4" 2>/dev/null | cut -d. -f1)
    echo "  $name: ${dur}s"
  fi
done
