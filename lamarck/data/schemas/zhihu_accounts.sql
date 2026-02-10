CREATE TABLE IF NOT EXISTS zhihu_accounts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    url_token     TEXT    NOT NULL UNIQUE,                                                    -- URL path identifier, e.g. "wonglei"
    account_type  TEXT    NOT NULL DEFAULT 'people',                                          -- "people" (personal) or "org" (organization)
    nickname      TEXT    NOT NULL,                                                           -- display name
    avatar_url    TEXT,                                                                       -- profile picture URL
    headline      TEXT,                                                                       -- one-line tagline below the nickname
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')) -- row creation time
);
