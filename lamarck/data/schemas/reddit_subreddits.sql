CREATE TABLE IF NOT EXISTS reddit_subreddits (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,                                                    -- subreddit name without r/ prefix, e.g. "SaaS"
    url        TEXT    NOT NULL,                                                           -- full URL, e.g. "https://www.reddit.com/r/SaaS/"
    category   TEXT,                                                                       -- category tag, e.g. "ai", "saas", "automation"
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')) -- row creation time
);
