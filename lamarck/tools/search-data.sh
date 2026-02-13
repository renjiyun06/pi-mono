#!/bin/bash
# Quick search across all data sources
# Usage: ./search-data.sh "query terms"
# English: uses FTS5 for fast matching
# Chinese: uses LIKE for character matching

DB="/home/lamarck/pi-mono/lamarck/data/lamarck.db"
QUERY="$1"

if [ -z "$QUERY" ]; then
  echo "Usage: $0 \"search query\""
  echo "Searches across: twitter posts, zhihu topics, research topics, video transcripts"
  exit 1
fi

# Detect if query contains CJK characters
if echo "$QUERY" | grep -qP '[\x{4e00}-\x{9fff}]'; then
  # Chinese query - use LIKE
  sqlite3 "$DB" "
  SELECT source, substr(title, 1, 50), substr(content, 1, 150)
  FROM search_index 
  WHERE content LIKE '%${QUERY}%' OR title LIKE '%${QUERY}%'
  LIMIT 20
  " | column -t -s '|'
else
  # English query - use FTS5
  sqlite3 "$DB" "
  SELECT source, substr(title, 1, 50), substr(content, 1, 150)
  FROM search_index 
  WHERE search_index MATCH '${QUERY}'
  ORDER BY rank
  LIMIT 20
  " | column -t -s '|'
fi
