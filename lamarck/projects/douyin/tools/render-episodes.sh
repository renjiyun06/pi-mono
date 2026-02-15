#!/bin/bash
# Render all AI's Clumsiness episodes using terminal-video.ts
# Usage: bash tools/render-episodes.sh [--only ep04]
#
# Renders all episodes that have terminal-script.json files.
# Skips episodes that already have video files unless --force is passed.

set -e
cd "$(dirname "$0")/.."

WSL_BRIDGE="/mnt/d/wsl-bridge"
FORCE=false
ONLY=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --force) FORCE=true; shift ;;
    --only) ONLY="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

RENDERED=0
SKIPPED=0
FAILED=0

for dir in content/ep*/; do
  ep=$(basename "$dir")
  num=$(echo "$ep" | grep -oP 'ep\K\d+')
  script="${dir}terminal-script.json"

  if [ ! -f "$script" ]; then
    continue
  fi

  if [ -n "$ONLY" ] && [[ "$ep" != *"$ONLY"* ]]; then
    continue
  fi

  # Determine output path (S1-S2 use -v2, S3+ use plain)
  if [ "$num" -le 9 ]; then
    output="${WSL_BRIDGE}/ep$(printf '%02d' $num)-v2-video.mp4"
  else
    output="${WSL_BRIDGE}/ep${num}-video.mp4"
  fi

  if [ -f "$output" ] && [ "$FORCE" != "true" ]; then
    dur=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output" 2>/dev/null | cut -d. -f1)
    echo "SKIP  ${ep} (${dur}s exists)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "RENDER  ${ep} → ${output}"
  if npx tsx tools/terminal-video.ts --input "$script" --output "$output" 2>&1; then
    dur=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output" 2>/dev/null | cut -d. -f1)
    echo "  OK  ${dur}s"
    RENDERED=$((RENDERED + 1))
  else
    echo "  FAILED"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "Done: ${RENDERED} rendered, ${SKIPPED} skipped, ${FAILED} failed"
