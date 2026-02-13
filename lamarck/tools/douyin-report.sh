#!/bin/bash
# Generate a quick operational report for Douyin content strategy
# Usage: ./douyin-report.sh

DB="/home/lamarck/pi-mono/lamarck/data/lamarck.db"

echo "=== 抖音运营数据报告 ==="
echo "生成时间: $(date '+%Y-%m-%d %H:%M')"
echo ""

echo "--- 竞品概览 ---"
sqlite3 "$DB" "
SELECT COUNT(DISTINCT da.sec_uid) as accounts,
       COUNT(dw.aweme_id) as total_works,
       SUM(dw.digg_count) as total_likes
FROM douyin_accounts da
LEFT JOIN douyin_works dw ON da.sec_uid = dw.author_sec_uid"
echo ""

echo "--- Top 5 高效率账号（粉丝/视频）---"
sqlite3 -header -column "$DB" "
SELECT da.nickname, da.follower_count as fans, da.video_count as videos,
       ROUND(CAST(da.follower_count AS FLOAT) / da.video_count) as fans_per_vid
FROM douyin_accounts da
WHERE da.video_count > 10
ORDER BY fans_per_vid DESC
LIMIT 5"
echo ""

echo "--- Top 5 高互动作品（评论率）---"
sqlite3 -header -column "$DB" "
SELECT substr(dw.title, 1, 30) as title,
       dw.digg_count as likes,
       ROUND(CAST(dw.comment_count AS FLOAT) / dw.digg_count * 100, 1) as comment_pct
FROM douyin_works dw
WHERE dw.digg_count > 5000
ORDER BY comment_pct DESC
LIMIT 5"
echo ""

echo "--- 话题研究库 ---"
sqlite3 "$DB" "SELECT COUNT(*) || ' topics' FROM topics"
echo ""

echo "--- 转录稿库 ---"
echo "$(ls /home/lamarck/pi-mono/lamarck/data/transcripts/*.txt 2>/dev/null | wc -l) transcripts"
echo ""

echo "--- 搜索索引 ---"
sqlite3 "$DB" "SELECT COUNT(*) || ' records in FTS5 index' FROM search_index" 2>/dev/null
echo ""

echo "--- 内容状态 ---"
echo "待发布视频:"
for dir in /home/lamarck/pi-mono/lamarck/projects/douyin/content/*/; do
  name=$(basename "$dir")
  mp4=$(ls "$dir"*.mp4 2>/dev/null | head -1)
  if [ -n "$mp4" ]; then
    dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$mp4" 2>/dev/null)
    echo "  $name: ${dur}s"
  fi
done
echo ""
echo "探索笔记: $(ls /home/lamarck/pi-mono/lamarck/projects/douyin/exploration/0*.md 2>/dev/null | wc -l) 篇"
