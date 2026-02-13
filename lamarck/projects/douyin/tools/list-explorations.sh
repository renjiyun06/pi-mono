#!/bin/bash
# List all exploration notes with first-line title and word count.
# Usage: bash tools/list-explorations.sh

cd "$(dirname "$0")/../exploration"

echo "=== Exploration Notes ==="
echo ""

total=0
for f in 0*.md; do
  id=$(echo "$f" | grep -oP '^\d+')
  title=$(head -1 "$f" | sed 's/^# //')
  words=$(wc -w < "$f")
  total=$((total + 1))
  printf "  %s  %4d words  %s\n" "$id" "$words" "$title"
done

echo ""
echo "Total: $total explorations"
