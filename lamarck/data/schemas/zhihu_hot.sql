CREATE TABLE IF NOT EXISTS zhihu_hot (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id   TEXT    NOT NULL,                                                           -- ISO 8601 timestamp grouping one scrape batch
    rank          INTEGER NOT NULL,                                                          -- position on the hot list, 1~50
    question_id   TEXT    NOT NULL,                                                          -- zhihu question id extracted from URL
    title         TEXT    NOT NULL,                                                          -- question title
    excerpt       TEXT,                                                                       -- question description / summary, may be NULL
    heat          INTEGER NOT NULL,                                                          -- heat value in 万, e.g. 1789 means "1789 万热度"
    tag           TEXT,                                                                       -- badge like "新" for newly listed, NULL if none
    url           TEXT    NOT NULL,                                                           -- full question URL
    thumbnail_url TEXT,                                                                       -- thumbnail image URL, may be NULL
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')) -- row creation time
);
