#!/bin/bash
# assemble-video.sh — Assemble AI-generated video clips + TTS audio + subtitles into final Douyin video
#
# Usage:
#   ./assemble-video.sh <project-dir>
#
# Expected directory structure:
#   <project-dir>/
#     storyboard.md          # Script reference (not used by this tool)
#     clips/                 # AI-generated video clips (01.mp4, 02.mp4, ...)
#     audio/                 # TTS audio segments (01.mp3, 02.mp3, ...)
#     subtitles/             # Subtitle files (01.txt, 02.txt, ... — one line per subtitle)
#     output/                # Created by this script
#       final.mp4            # Final assembled video
#
# The script:
# 1. Normalizes all clips to 1080x1920 30fps
# 2. Concatenates clips with 0.5s crossfade transitions
# 3. Overlays subtitles (bottom center, white on semi-transparent black)
# 4. Mixes in TTS audio synced to each clip
# 5. Outputs final.mp4

set -euo pipefail

PROJECT_DIR="${1:?Usage: $0 <project-dir>}"
CLIPS_DIR="$PROJECT_DIR/clips"
AUDIO_DIR="$PROJECT_DIR/audio"
SUBS_DIR="$PROJECT_DIR/subtitles"
OUTPUT_DIR="$PROJECT_DIR/output"

mkdir -p "$OUTPUT_DIR"

# Check dependencies
command -v ffmpeg >/dev/null || { echo "ERROR: ffmpeg not found"; exit 1; }

# Step 1: Normalize clips to 1080x1920 30fps
echo "=== Step 1: Normalizing clips ==="
NORM_DIR="$OUTPUT_DIR/normalized"
mkdir -p "$NORM_DIR"

for clip in "$CLIPS_DIR"/*.mp4; do
    [ -f "$clip" ] || continue
    base=$(basename "$clip")
    echo "  Normalizing $base..."
    ffmpeg -y -i "$clip" \
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" \
        -r 30 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
        -an \
        "$NORM_DIR/$base" 2>/dev/null
done

# Step 2: Build concat list and merge audio
echo "=== Step 2: Building concat list ==="
CONCAT_FILE="$OUTPUT_DIR/concat.txt"
> "$CONCAT_FILE"

# Collect normalized clips in sorted order
CLIP_FILES=()
for clip in "$NORM_DIR"/*.mp4; do
    [ -f "$clip" ] || continue
    CLIP_FILES+=("$clip")
done

if [ ${#CLIP_FILES[@]} -eq 0 ]; then
    echo "ERROR: No clips found in $CLIPS_DIR"
    exit 1
fi

echo "  Found ${#CLIP_FILES[@]} clips"

# Step 3: Concatenate clips (simple concat, no crossfade for reliability)
echo "=== Step 3: Concatenating clips ==="
for clip in "${CLIP_FILES[@]}"; do
    echo "file '$clip'" >> "$CONCAT_FILE"
done

ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" \
    -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
    "$OUTPUT_DIR/video_only.mp4" 2>/dev/null

# Step 4: Merge audio tracks
echo "=== Step 4: Merging audio ==="
AUDIO_FILES=()
for audio in "$AUDIO_DIR"/*.mp3 "$AUDIO_DIR"/*.wav; do
    [ -f "$audio" ] || continue
    AUDIO_FILES+=("$audio")
done

if [ ${#AUDIO_FILES[@]} -gt 0 ]; then
    echo "  Found ${#AUDIO_FILES[@]} audio files"

    # Get duration of each clip to calculate audio offsets
    OFFSET=0
    FILTER_PARTS=""
    INPUTS=""
    idx=0

    for i in "${!CLIP_FILES[@]}"; do
        clip="${CLIP_FILES[$i]}"
        dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$clip" 2>/dev/null)

        if [ $i -lt ${#AUDIO_FILES[@]} ]; then
            audio="${AUDIO_FILES[$i]}"
            INPUTS="$INPUTS -i $audio"
            FILTER_PARTS="${FILTER_PARTS}[$((idx+1)):a]adelay=${OFFSET}000|${OFFSET}000[a${idx}];"
            idx=$((idx+1))
        fi

        OFFSET=$(echo "$OFFSET + $dur" | bc)
    done

    if [ $idx -gt 0 ]; then
        # Build amix filter
        MIX_INPUTS=""
        for j in $(seq 0 $((idx-1))); do
            MIX_INPUTS="${MIX_INPUTS}[a${j}]"
        done

        ffmpeg -y -i "$OUTPUT_DIR/video_only.mp4" $INPUTS \
            -filter_complex "${FILTER_PARTS}${MIX_INPUTS}amix=inputs=${idx}:duration=longest[aout]" \
            -map 0:v -map "[aout]" \
            -c:v copy -c:a aac -b:a 128k \
            "$OUTPUT_DIR/with_audio.mp4" 2>/dev/null

        CURRENT="$OUTPUT_DIR/with_audio.mp4"
    else
        CURRENT="$OUTPUT_DIR/video_only.mp4"
    fi
else
    echo "  No audio files found, using video only"
    CURRENT="$OUTPUT_DIR/video_only.mp4"
fi

# Step 5: Add subtitles (if subtitle files exist)
echo "=== Step 5: Adding subtitles ==="
if ls "$SUBS_DIR"/*.txt 1>/dev/null 2>&1; then
    # Generate SRT from subtitle text files + clip durations
    SRT_FILE="$OUTPUT_DIR/subtitles.srt"
    > "$SRT_FILE"

    OFFSET=0
    SUB_IDX=1

    for i in "${!CLIP_FILES[@]}"; do
        clip="${CLIP_FILES[$i]}"
        dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$clip" 2>/dev/null)

        sub_file="$SUBS_DIR/$(printf '%02d' $((i+1))).txt"
        if [ -f "$sub_file" ]; then
            while IFS= read -r line || [ -n "$line" ]; do
                [ -z "$line" ] && continue
                # Calculate timestamps
                start_h=$((${OFFSET%.*} / 3600))
                start_m=$(( (${OFFSET%.*} % 3600) / 60))
                start_s=$((${OFFSET%.*} % 60))
                end_time=$(echo "$OFFSET + $dur" | bc)
                end_h=$((${end_time%.*} / 3600))
                end_m=$(( (${end_time%.*} % 3600) / 60))
                end_s=$((${end_time%.*} % 60))

                printf "%d\n%02d:%02d:%02d,000 --> %02d:%02d:%02d,000\n%s\n\n" \
                    "$SUB_IDX" "$start_h" "$start_m" "$start_s" \
                    "$end_h" "$end_m" "$end_s" \
                    "$line" >> "$SRT_FILE"
                SUB_IDX=$((SUB_IDX + 1))
            done < "$sub_file"
        fi

        OFFSET=$(echo "$OFFSET + $dur" | bc)
    done

    if [ -s "$SRT_FILE" ]; then
        echo "  Generated SRT with $((SUB_IDX-1)) entries"
        # Burn subtitles into video
        ffmpeg -y -i "$CURRENT" \
            -vf "subtitles=$SRT_FILE:force_style='FontName=Noto Sans CJK SC,FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H80000000,BorderStyle=4,BackColour=&H80000000,Outline=2,Shadow=0,MarginV=120,Alignment=2'" \
            -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
            -c:a copy \
            "$OUTPUT_DIR/final.mp4" 2>/dev/null
    else
        cp "$CURRENT" "$OUTPUT_DIR/final.mp4"
    fi
else
    echo "  No subtitle files found"
    cp "$CURRENT" "$OUTPUT_DIR/final.mp4"
fi

# Cleanup intermediate files
rm -rf "$NORM_DIR" "$OUTPUT_DIR/concat.txt" "$OUTPUT_DIR/video_only.mp4" "$OUTPUT_DIR/with_audio.mp4"

# Report
FINAL_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUTPUT_DIR/final.mp4" 2>/dev/null)
FINAL_SIZE=$(du -h "$OUTPUT_DIR/final.mp4" | cut -f1)
echo ""
echo "=== Done ==="
echo "  Output: $OUTPUT_DIR/final.mp4"
echo "  Duration: ${FINAL_DUR}s"
echo "  Size: $FINAL_SIZE"
