#!/bin/bash
# Render all canvas-video demos.
# Requires network for TTS generation.

set -e
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"
TOOLS="$ROOT/tools/canvas-video"

echo "=== Canvas Video Render Pipeline ==="
echo ""

render() {
  local name="$1"
  local script="$2"
  echo "--- Rendering: $name ---"
  npx tsx "$TOOLS/$script" 2>&1
  echo ""
}

# Core videos
render "Intro V2" "demo-intro-v2.ts"
render "Cognitive Debt V2 (full)" "demo-cognitive-debt-v2.ts"
render "Cognitive Debt (short)" "demo-cognitive-debt-short.ts"
render "Vibe Coding" "demo-vibe-coding.ts"

echo "=== All renders complete ==="
echo ""
echo "Output locations:"
echo "  Intro V2:             /tmp/canvas-demo-intro-v2.mp4"
echo "  Cognitive Debt V2:    content/demo-cognitive-debt-v2/video.mp4"
echo "  Cognitive Debt Short: content/demo-cognitive-debt-short/video.mp4"
echo "  Vibe Coding:          content/demo-vibe-coding-v2/video.mp4"
