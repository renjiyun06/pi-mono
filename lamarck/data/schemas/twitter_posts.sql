CREATE TABLE IF NOT EXISTS twitter_posts (
    tweet_id       TEXT    PRIMARY KEY,                                                         -- 推文 ID，从 URL 提取
    author_handle  TEXT    NOT NULL,                                                            -- 作者 handle，不含 @
    author_name    TEXT    NOT NULL,                                                            -- 作者显示名称
    content        TEXT,                                                                        -- 推文正文
    created_at     TEXT,                                                                        -- 发布时间，ISO 8601
    media_type     TEXT,                                                                        -- null / 'image' / 'video'
    media_urls     TEXT,                                                                        -- 媒体 URL，JSON 数组
    link_url       TEXT,                                                                        -- 外链卡片 URL
    reply_count    INTEGER NOT NULL DEFAULT 0,                                                  -- 回复数
    repost_count   INTEGER NOT NULL DEFAULT 0,                                                  -- 转发数
    like_count     INTEGER NOT NULL DEFAULT 0,                                                  -- 点赞数
    bookmark_count INTEGER NOT NULL DEFAULT 0,                                                  -- 书签数
    view_count     INTEGER NOT NULL DEFAULT 0,                                                  -- 浏览数
    is_pinned      INTEGER NOT NULL DEFAULT 0,                                                  -- 是否置顶 0/1
    collected_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')) -- 采集时间
);
