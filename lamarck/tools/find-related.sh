#!/bin/bash
# Find data related to a specific exploration theme
# Usage: ./find-related.sh <theme>
# Themes: cognitive-debt, memory, homogenization, vibe-coding, centaur, agent

DB="/home/lamarck/pi-mono/lamarck/data/lamarck.db"
THEME="${1:-cognitive-debt}"

case "$THEME" in
  cognitive-debt|009)
    KEYWORDS="思考|认知|大脑|批判|依赖|萎缩|能力|教育"
    ;;
  memory|003)
    KEYWORDS="记忆|遗忘|失忆|context|上下文|持久|长期"
    ;;
  homogenization|002)
    KEYWORDS="同质|趋同|千篇一律|创意|创造|独立|个性"
    ;;
  vibe-coding|008)
    KEYWORDS="编程|Cursor|代码|coding|开发|bug|安全|漏洞"
    ;;
  centaur|010)
    KEYWORDS="协作|合作|人机|搭档|团队|主导|自动"
    ;;
  agent|001)
    KEYWORDS="agent|智能体|自主|多智能体|编排"
    ;;
  *)
    echo "Unknown theme: $THEME"
    echo "Available: cognitive-debt, memory, homogenization, vibe-coding, centaur, agent"
    exit 1
    ;;
esac

echo "=== Related data for: $THEME ==="
echo "Keywords: $KEYWORDS"
echo ""

echo "--- Topics ---"
IFS='|' read -ra KW_ARRAY <<< "$KEYWORDS"
LIKE_CLAUSES=""
for kw in "${KW_ARRAY[@]}"; do
  [ -n "$LIKE_CLAUSES" ] && LIKE_CLAUSES="$LIKE_CLAUSES OR"
  LIKE_CLAUSES="$LIKE_CLAUSES topic_name LIKE '%$kw%' OR summary LIKE '%$kw%'"
done
sqlite3 "$DB" "SELECT id, topic_name FROM topics WHERE $LIKE_CLAUSES"
echo ""

echo "--- Zhihu Hot ---"
LIKE_CLAUSES_Z=""
for kw in "${KW_ARRAY[@]}"; do
  [ -n "$LIKE_CLAUSES_Z" ] && LIKE_CLAUSES_Z="$LIKE_CLAUSES_Z OR"
  LIKE_CLAUSES_Z="$LIKE_CLAUSES_Z title LIKE '%$kw%'"
done
sqlite3 "$DB" "SELECT title, MAX(heat) FROM zhihu_hot WHERE $LIKE_CLAUSES_Z GROUP BY title ORDER BY MAX(heat) DESC LIMIT 5"
echo ""

echo "--- Twitter (top 5 by likes) ---"
LIKE_CLAUSES_T=""
for kw in "${KW_ARRAY[@]}"; do
  [ -n "$LIKE_CLAUSES_T" ] && LIKE_CLAUSES_T="$LIKE_CLAUSES_T OR"
  LIKE_CLAUSES_T="$LIKE_CLAUSES_T content LIKE '%$kw%'"
done
sqlite3 "$DB" "SELECT substr(content, 1, 80), like_count FROM twitter_posts WHERE $LIKE_CLAUSES_T ORDER BY like_count DESC LIMIT 5"
