CREATE TABLE IF NOT EXISTS topics (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date         TEXT    NOT NULL,                                                           -- discovery date, e.g. "2026-02-11"
    topic_name          TEXT    NOT NULL,                                                           -- topic title, e.g. "一人公司时代来了：AI让你成为全栈创业者"
    summary             TEXT    NOT NULL,                                                           -- one-sentence overview
    why_now             TEXT,                                                                       -- timeliness argument: why this topic matters right now
    key_points          TEXT,                                                                       -- JSON array of key facts, e.g. ["SaaS股价暴跌15%", "零基础4天出Demo"]
    sources             TEXT,                                                                       -- JSON array of information sources, e.g. ["36氪深度报道", "中关村两院访谈"]
    competitor_coverage TEXT,                                                                       -- how much douyin peers have covered this topic
    trend_tags          TEXT,                                                                       -- JSON array of trend labels, e.g. ["AI编程", "创业", "门槛降低"]
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')) -- row creation time
);
