CREATE TABLE IF NOT EXISTS zhihu_activities (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_hash    TEXT    NOT NULL UNIQUE,                                                    -- SHA256(action_type + content_url + activity_time), dedup key
    action_type      TEXT    NOT NULL,                                                           -- upvote_answer, upvote_article, upvote_pin, publish_answer, publish_article, publish_pin, etc.
    activity_time    TEXT    NOT NULL,                                                           -- when the action happened, e.g. "2026-02-09T00:08:00"
    title            TEXT,                                                                       -- question title or article title; NULL for pins
    content_url      TEXT,                                                                       -- full URL to the answer/article/pin
    content_excerpt  TEXT,                                                                       -- truncated body text from the feed card
    cover_image_url  TEXT,                                                                       -- cover image URL (articles may have one)
    author_name      TEXT,                                                                       -- content author display name
    author_url       TEXT,                                                                       -- author profile URL
    author_avatar    TEXT,                                                                       -- author avatar image URL
    author_headline  TEXT,                                                                       -- author one-line bio / credential
    upvote_count     INTEGER DEFAULT 0,                                                         -- upvote count at scrape time
    comment_count    INTEGER DEFAULT 0,                                                         -- comment count at scrape time
    pin_images       TEXT,                                                                       -- JSON array of image URLs for pins, e.g. ["url1","url2"]
    pin_publish_time TEXT,                                                                       -- original publish/edit time of the pin itself
    ring_name        TEXT,                                                                       -- circle (圈子) name, if any
    ring_url         TEXT,                                                                       -- circle URL
    scraped_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')) -- when this row was inserted
);
