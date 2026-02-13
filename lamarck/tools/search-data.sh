#!/bin/bash
# Quick search across all data sources
# Usage: ./search-data.sh "query terms"
#        ./search-data.sh --stats  (show data summary)
# English: uses FTS5 for fast matching
# Chinese: uses LIKE for character matching

DB="/home/lamarck/pi-mono/lamarck/data/lamarck.db"
QUERY="$1"

if [ "$1" = "--stats" ]; then
  sqlite3 "$DB" "
    SELECT '  twitter:     ' || COUNT(*) FROM twitter_posts
    UNION ALL SELECT '  zhihu_hot:   ' || COUNT(*) FROM zhihu_hot
    UNION ALL SELECT '  zhihu_acts:  ' || COUNT(*) FROM zhihu_activities
    UNION ALL SELECT '  douyin_works: ' || COUNT(*) FROM douyin_works
    UNION ALL SELECT '  topics:      ' || COUNT(*) FROM topics
    UNION ALL SELECT '  explorations: ' || COUNT(*) FROM search_index WHERE source='exploration'
    UNION ALL SELECT '  search_index: ' || COUNT(*) FROM search_index
  "
  exit 0
fi

if [ -z "$QUERY" ]; then
  echo "Usage: $0 \"search query\""
  echo "       $0 --stats"
  echo ""
  echo "Searches across: twitter posts, zhihu topics, research topics, video transcripts"
  exit 1
fi

# Detect if query contains CJK characters
if echo "$QUERY" | grep -qP '[\x{4e00}-\x{9fff}]'; then
  # Chinese query - use LIKE
  sqlite3 "$DB" "
  SELECT source || ' | ' || COALESCE(substr(title, 1, 40), '(no title)') || ' | ' || substr(content, 1, 120)
  FROM search_index 
  WHERE content LIKE '%${QUERY}%' OR title LIKE '%${QUERY}%'
  LIMIT 20
  "
else
  # English query - use FTS5
  sqlite3 "$DB" "
  SELECT source || ' | ' || COALESCE(substr(title, 1, 40), '(no title)') || ' | ' || substr(content, 1, 120)
  FROM search_index 
  WHERE search_index MATCH '${QUERY}'
  ORDER BY rank
  LIMIT 20
  "
fi
