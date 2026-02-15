#!/bin/bash
# Verify all "AI's Clumsiness" episode assets exist and are valid.
# Usage: bash tools/verify-assets.sh

set -e
cd "$(dirname "$0")/.."

WSL_BRIDGE="/mnt/d/wsl-bridge"
CONTENT_DIR="content"

echo "=== AI's Clumsiness Asset Verification ==="
echo ""

ERRORS=0
TOTAL=0

# Iterate over all episode directories
for dir in ${CONTENT_DIR}/ep*/; do
  ep=$(basename "$dir")
  num=$(echo "$ep" | grep -oP 'ep\K\d+')
  TOTAL=$((TOTAL + 1))

  # Determine video path (S1-S2 use -v2-video, S3+ use -video)
  video="${WSL_BRIDGE}/ep${num}-v2-video.mp4"
  srt="${WSL_BRIDGE}/ep${num}-v2-video.srt"
  if [ ! -f "$video" ]; then
    video="${WSL_BRIDGE}/ep${num}-video.mp4"
    srt="${WSL_BRIDGE}/ep${num}-video.srt"
  fi

  # Check video
  if [ ! -f "$video" ]; then
    echo "  MISSING video: $ep"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$video" 2>/dev/null)
  dur_int=$(echo "$dur" | cut -d. -f1)
  size=$(du -h "$video" | cut -f1)
  pix=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 "$video" 2>/dev/null)

  status="OK"
  if [ "$pix" != "yuv420p" ]; then
    status="WARN:$pix"
    ERRORS=$((ERRORS + 1))
  fi

  # Duration check (target: 69-87s)
  if [ "$dur_int" -lt 69 ] || [ "$dur_int" -gt 87 ]; then
    status="WARN:duration"
    ERRORS=$((ERRORS + 1))
  fi

  # Check subtitles
  srt_status="✓"
  if [ ! -f "$srt" ]; then
    srt_status="✗"
    ERRORS=$((ERRORS + 1))
  fi

  # Check publish-meta
  meta_status="✓"
  if [ ! -f "${dir}publish-meta.md" ]; then
    meta_status="✗"
    ERRORS=$((ERRORS + 1))
  fi

  # Check terminal-script
  script_status="✓"
  if [ ! -f "${dir}terminal-script.json" ]; then
    script_status="✗"
    ERRORS=$((ERRORS + 1))
  fi

  printf "  %-6s %3ds  %5s  srt:%s meta:%s script:%s  %s\n" \
    "$status" "$dur_int" "$size" "$srt_status" "$meta_status" "$script_status" "$ep"
done

echo ""
echo "Total: ${TOTAL} episodes"
if [ $ERRORS -eq 0 ]; then
  echo "All assets verified. Ready for review."
else
  echo "$ERRORS issue(s) found."
fi
