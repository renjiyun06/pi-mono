CREATE TABLE IF NOT EXISTS douyin_accounts (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    sec_uid           TEXT    NOT NULL UNIQUE,                                                    -- URL 中的用户标识，如 MS4wLjABAAAA8U_l6rBzmy7bcy6xOJel4v0RzoR_wfAubGPeJimN__4
    douyin_id         TEXT,                                                                       -- 抖音号，如 rmrbxmt
    nickname          TEXT    NOT NULL,                                                           -- 昵称
    avatar_url        TEXT,                                                                       -- 头像 URL
    verification_type TEXT,                                                                       -- 认证类型：red_v / yellow_v / none
    verification_desc TEXT,                                                                       -- 认证描述，如"人民日报官方账号"
    signature         TEXT,                                                                       -- 个人简介
    gender            TEXT,                                                                       -- 性别：男/女（部分账号不展示）
    ip_location       TEXT,                                                                       -- IP属地，如"辽宁"（部分账号不展示）
    following_count   INTEGER,                                                                    -- 关注数
    follower_count    INTEGER,                                                                    -- 粉丝数
    like_count        INTEGER,                                                                    -- 获赞数
    video_count       INTEGER,                                                                    -- 作品数
    created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')), -- 入库时间
    updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')), -- 更新时间
    source            TEXT    NOT NULL DEFAULT 'discover'                                           -- 来源：discover=发现任务, liked=点赞同步
);
