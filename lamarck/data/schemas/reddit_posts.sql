CREATE TABLE IF NOT EXISTS reddit_posts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id       TEXT    NOT NULL UNIQUE,                                                    -- reddit post id extracted from URL, e.g. "1qx8bzd"
    subreddit     TEXT    NOT NULL,                                                           -- subreddit name without r/ prefix
    title         TEXT    NOT NULL,                                                           -- post title
    author        TEXT    NOT NULL,                                                           -- author username without u/ prefix
    url           TEXT    NOT NULL,                                                           -- full post URL
    flair         TEXT,                                                                       -- post flair/tag, e.g. "B2C SaaS", "Discussion"
    body          TEXT,                                                                       -- full post body (fetched from detail page)
    comments_summary TEXT,                                                                    -- LLM-generated summary of the comment section
    thumbnail_url TEXT,                                                                       -- thumbnail/preview image URL
    upvotes       INTEGER NOT NULL DEFAULT 0,                                                 -- upvote count at scrape time
    comment_count INTEGER NOT NULL DEFAULT 0,                                                 -- comment count at scrape time
    posted_at     TEXT    NOT NULL,                                                           -- post publish time (UTC ISO 8601)
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')), -- row creation time
    updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime'))  -- last update time
);
