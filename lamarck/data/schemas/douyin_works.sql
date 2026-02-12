CREATE TABLE IF NOT EXISTS douyin_works (
    aweme_id        TEXT PRIMARY KEY,                       -- 作品 ID
    author_uid      TEXT NOT NULL,                          -- 博主 UID
    author_sec_uid  TEXT NOT NULL,                          -- 博主 sec_uid，关联 douyin_accounts
    title           TEXT,                                   -- 纯标题 (itemTitle)
    description     TEXT,                                   -- 完整描述，含 hashtag
    hashtags        TEXT,                                   -- JSON 数组，如 ["AI","LLM"]
    create_time     INTEGER NOT NULL,                       -- 发布时间，Unix 时间戳（秒）
    media_type      INTEGER DEFAULT 4,                      -- 媒体类型（4=视频）
    is_top          INTEGER DEFAULT 0,                      -- 是否置顶
    video_width     INTEGER,                                -- 视频宽度
    video_height    INTEGER,                                -- 视频高度
    video_duration  INTEGER,                                -- 视频时长（毫秒）
    video_ratio     TEXT,                                   -- 视频比例（"default"/"1080p"）
    cover_url       TEXT,                                   -- 封面图 URL
    digg_count      INTEGER DEFAULT 0,                      -- 点赞数
    comment_count   INTEGER DEFAULT 0,                      -- 评论数
    share_count     INTEGER DEFAULT 0,                      -- 分享数
    collect_count   INTEGER DEFAULT 0,                      -- 收藏数
    recommend_count INTEGER DEFAULT 0,                      -- 推荐数
    music_title     TEXT,                                   -- 音乐标题
    video_path      TEXT,                                   -- 下载的视频文件绝对路径
    transcript_path TEXT,                                   -- 转录文本文件绝对路径
    summary         TEXT,                                   -- 视频内容摘要（核心主题、关键信息点、作者观点）
    first_seen_at   TEXT DEFAULT (datetime('now')),          -- 首次发现时间
    updated_at      TEXT DEFAULT (datetime('now')),          -- 最后更新时间
    source          TEXT NOT NULL DEFAULT 'discover'        -- 来源：discover=发现任务, liked=点赞同步
);
