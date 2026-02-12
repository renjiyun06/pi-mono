---
description: Download and transcribe popular Douyin videos that haven't been processed yet
enabled: true
model: openrouter/deepseek/deepseek-v3.2
cron: "*/5 * * * *"
skipIfRunning: true
allowParallel: false
---

# 抖音视频转录

从数据库中挑一条还没有转录过的热门抖音视频，下载它，转录成文字，生成摘要，然后把结果写回数据库。

## 步骤

### 1. 找一条未处理的热门视频

直接用 SQL 过滤掉已处理的（`transcript_path IS NOT NULL` 的就是已处理的）：

```sql
SELECT aweme_id, title, description, digg_count, datetime(create_time, 'unixepoch', 'localtime') as time
FROM douyin_works
WHERE digg_count >= 1000
  AND create_time >= strftime('%s', 'now', '-7 days')
  AND transcript_path IS NULL
ORDER BY RANDOM()
LIMIT 1;
```

注意把 title 和 description 记下来，生成摘要时会用到。

如果查询结果为空，说明最近 7 天的热门视频都已处理完毕，直接结束任务。

### 2. 下载并转录

使用 `douyin-video-transcribe` 技能完成视频下载和转录。

### 3. 生成摘要

读取转录文本，结合第 1 步中查到的 title 和 description，写一段完整的摘要（3-5 句话），包括：视频的核心主题是什么、讲了哪些关键信息点、作者的主要观点或结论是什么。摘要的目标是让人不看视频就能了解这段内容的要点。

**重要：** 语音转录（whisper）对专有名词（产品名、人名、英文术语等）的识别经常出错。生成摘要时必须以视频的 title 和 description 为准来校正专有名词的拼写。例如转录中出现"seqdams"但标题写的是"Seedance"，摘要中应该使用"Seedance"。

### 4. 写回数据库

将视频路径、转录文件路径和摘要更新到 douyin_works 表：

```sql
UPDATE douyin_works
SET video_path = '/home/lamarck/pi-mono/lamarck/data/videos/AWEME_ID.mp4',
    transcript_path = '/home/lamarck/pi-mono/lamarck/data/transcripts/AWEME_ID.txt',
    summary = '这段视频的摘要内容'
WHERE aweme_id = 'AWEME_ID';
```

### 5. 输出总结

输出一行：视频 ID、标题、摘要。

## 数据库

SQLite 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`

## 输出位置

- 视频文件：`/home/lamarck/pi-mono/lamarck/data/videos/AWEME_ID.mp4`
- 音频文件：`/home/lamarck/pi-mono/lamarck/data/videos/AWEME_ID.mp3`
- 转录文件：`/home/lamarck/pi-mono/lamarck/data/transcripts/AWEME_ID.txt`
