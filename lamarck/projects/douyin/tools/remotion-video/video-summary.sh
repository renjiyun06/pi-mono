#!/bin/bash
# Generate a visual summary grid from a video.
# Creates a 4x4 grid of keyframes at even intervals.
# Useful for quick visual review without watching the full video.
#
# Usage:
#   ./video-summary.sh input.mp4 output.jpg
#
# The output is a single image showing 16 frames with timestamps.

set -euo pipefail

INPUT="${1:?Usage: $0 input.mp4 output.jpg}"
OUTPUT="${2:?Usage: $0 input.mp4 output.jpg}"

# Get video duration
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT")
DURATION_INT=${DURATION%.*}

# Calculate interval (16 frames across the video)
INTERVAL=$((DURATION_INT / 16))
if [ "$INTERVAL" -lt 1 ]; then
    INTERVAL=1
fi

echo "Video: $INPUT"
echo "Duration: ${DURATION_INT}s, sampling every ${INTERVAL}s"

# Extract 16 frames
TMPDIR=$(mktemp -d)
for i in $(seq 0 15); do
    T=$((i * INTERVAL + INTERVAL / 2))
    if [ "$T" -ge "$DURATION_INT" ]; then
        T=$((DURATION_INT - 1))
    fi
    # Add timestamp text overlay
    ffmpeg -ss "$T" -i "$INPUT" -frames:v 1 \
        -vf "drawtext=text='${T}s':fontsize=36:fontcolor=white:borderw=2:bordercolor=black:x=10:y=10" \
        -q:v 3 "$TMPDIR/frame_$(printf '%02d' $i).jpg" -y -loglevel error
done

# Create 4x4 grid using montage (ImageMagick) or ffmpeg
if command -v montage &>/dev/null; then
    montage "$TMPDIR/frame_"*.jpg -tile 4x4 -geometry 270x480+2+2 "$OUTPUT"
else
    # Fallback: use ffmpeg to create grid
    # Build input and filter_complex for 4x4 grid
    INPUTS=""
    FILTER=""
    for i in $(seq 0 15); do
        INPUTS="$INPUTS -i $TMPDIR/frame_$(printf '%02d' $i).jpg"
    done

    # Scale each to 270x480
    for i in $(seq 0 15); do
        FILTER="${FILTER}[$i:v]scale=270:480[s$i];"
    done

    # Stack in 4x4 grid
    for row in 0 1 2 3; do
        BASE=$((row * 4))
        FILTER="${FILTER}[s$((BASE))][s$((BASE+1))][s$((BASE+2))][s$((BASE+3))]hstack=inputs=4[row$row];"
    done
    FILTER="${FILTER}[row0][row1][row2][row3]vstack=inputs=4[out]"

    ffmpeg $INPUTS -filter_complex "$FILTER" -map "[out]" -q:v 3 "$OUTPUT" -y -loglevel error
fi

echo "Summary grid: $OUTPUT"
rm -rf "$TMPDIR"
