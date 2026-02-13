#!/bin/bash
# Render all terminal-style prototype videos
# Usage: ./tools/render-all.sh [--only demo-centaur]

set -e
cd "$(dirname "$0")/.."

ONLY="$2"

render() {
  local dir="$1"
  local script="$2"
  local output="$3"
  
  if [ -n "$ONLY" ] && [ "$dir" != "$ONLY" ]; then
    return
  fi
  
  if [ ! -f "$script" ]; then
    echo "SKIP $dir (no script)"
    return
  fi
  
  echo "--- $dir ---"
  npx tsx tools/terminal-video.ts --input "$script" --output "$output" 2>&1 | grep -E "(Audio:|Video saved)"
  echo ""
}

echo "=== Rendering terminal videos ==="
echo ""

# Intro
render "000-intro" "content/000-intro/terminal-script.json" "content/000-intro/intro.mp4"

# Prototypes  
for dir in content/demo-*/; do
  name=$(basename "$dir")
  render "$name" "${dir}script.json" "${dir}video.mp4"
done

echo "=== Done ==="
