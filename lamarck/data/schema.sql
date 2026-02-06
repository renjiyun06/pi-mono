-- Lamarck 数据库 Schema
-- 初始化: sqlite3 lamarck.db < schema.sql

-- 抖音监控账号
CREATE TABLE IF NOT EXISTS douyin_accounts (
  account_id TEXT PRIMARY KEY,   -- 账号ID，从URL提取 (MS4wLjAB...)
  account_name TEXT NOT NULL,    -- 账号名称
  direction TEXT,                -- 内容方向/标签
  profile_url TEXT NOT NULL      -- 主页链接
);

-- 抖音视频库
CREATE TABLE IF NOT EXISTS douyin_videos (
  video_id TEXT PRIMARY KEY,     -- 视频ID
  account_id TEXT NOT NULL,      -- 账号ID（关联 douyin_accounts）
  title TEXT,                    -- 标题
  video_url TEXT,                -- 视频链接
  publish_date TEXT,             -- 发布日期
  video_path TEXT,               -- 本地视频文件路径
  transcript_path TEXT,          -- 转录文件路径
  summary TEXT                   -- 内容摘要
);

-- 知乎热点
CREATE TABLE IF NOT EXISTS zhihu_hotlist (
  url TEXT PRIMARY KEY,          -- 问题链接
  title TEXT NOT NULL,           -- 标题
  heat TEXT,                     -- 热度
  discovered_at TEXT,            -- 发现时间
  summary TEXT                   -- 讨论要点摘要
);
