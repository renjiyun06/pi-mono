#!/bin/bash
# Show detailed information about a topic from the database
# Usage: ./topic-detail.sh <id>
#        ./topic-detail.sh --list  (list all topics)
#        ./topic-detail.sh --search <keyword>

DB="/home/lamarck/pi-mono/lamarck/data/lamarck.db"

if [ "$1" = "--list" ]; then
  sqlite3 -header -column "$DB" "
    SELECT id, substr(topic_name, 1, 50) as topic, report_date
    FROM topics ORDER BY id DESC"
  exit 0
fi

if [ "$1" = "--search" ] && [ -n "$2" ]; then
  sqlite3 -header -column "$DB" "
    SELECT id, substr(topic_name, 1, 60) as topic
    FROM topics
    WHERE topic_name LIKE '%$2%' OR summary LIKE '%$2%' OR key_points LIKE '%$2%'
    ORDER BY id DESC"
  exit 0
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <id> | --list | --search <keyword>"
  exit 1
fi

sqlite3 "$DB" "
  SELECT '=== ' || topic_name || ' ===' || char(10)
    || char(10) || 'Report Date: ' || report_date
    || char(10) || char(10) || '--- Summary ---' || char(10) || summary
    || char(10) || char(10) || '--- Key Points ---' || char(10) || key_points
    || char(10) || char(10) || '--- Sources ---' || char(10) || sources
    || char(10) || char(10) || '--- Competitor Coverage ---' || char(10) || competitor_coverage
    || char(10) || char(10) || '--- Trend Tags ---' || char(10) || COALESCE(trend_tags, '(none)')
  FROM topics WHERE id = $1"
