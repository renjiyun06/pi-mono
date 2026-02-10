CREATE TABLE IF NOT EXISTS twitter_accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    handle          TEXT    NOT NULL UNIQUE,                                                    -- @handle without @, e.g. "AndrewYNg"
    nickname        TEXT,                                                                       -- display name
    avatar_url      TEXT,                                                                       -- profile photo URL
    bio             TEXT,                                                                       -- profile bio / description
    website         TEXT,                                                                       -- profile website link
    location        TEXT,                                                                       -- location text
    verified        INTEGER NOT NULL DEFAULT 0,                                                 -- 1 = verified account
    followers_count INTEGER,                                                                    -- number of followers
    following_count INTEGER,                                                                    -- number of following
    joined_at       TEXT,                                                                       -- account creation month, e.g. "November 2010"
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')) -- row creation time
);
