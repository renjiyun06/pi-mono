---
cron: "*/10 * * * *"
description: "监控 Twitter 账号的新推文"
enabled: false
allowParallel: true
---

你的任务是查看 2 个 Twitter 账号的最新推文。

## 工具

使用浏览器操作 Twitter。先读取 mcporter skill：

```bash
cat /home/lamarck/pi-mono/.pi/skills/mcporter/SKILL.md
```

## 数据库

- 路径：/home/lamarck/pi-mono/lamarck/data/lamarck.db

## 第一步：随机选取 2 个账号

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT username FROM twitter_accounts WHERE active = 1 ORDER BY RANDOM() LIMIT 2"
```

## 第二步：直接看推文

对每个账号：

1. 打开 `https://x.com/<username>`
2. **直接看**页面上最新的 5-6 条原创推文（跳过转发）
3. 不要写脚本，直接用眼睛看截图

## 过滤规则

跳过以下类型的推文：
- 纯广告推广：只是说"这个产品好用"之类的，没有实质内容
- 简单转发或 retweet
- 纯表情或无意义内容

只采集有价值的内容：
- 有独立观点或见解的
- 分享技术/产品体验细节的
- 有信息量的讨论或分析

## 反爬处理

如果页面空白或没有推文，检查是否有 "Retry" 按钮，点击它重新加载。

## 第三步：去重并入库

查询该账号已有的 tweetId（用于去重）：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT json_extract(content, '\$.tweetId') FROM inbox WHERE source = 'twitter:<username>'"
```

对页面上的每条推文，检查其 tweetId 是否已存在：
- 已存在 → 跳过
- 不存在 → 入库

新推文存入：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "INSERT INTO inbox (source, content) VALUES ('twitter:<username>', '{\"tweetId\":\"...\",\"username\":\"...\",\"content\":\"...\",\"url\":\"...\",\"publishedAt\":\"...\"}');"
```

**字段说明**：
- `tweetId`：从推文 URL 提取，如 `https://x.com/sama/status/2020678853468053516` → `2020678853468053516`
- `publishedAt`：从页面时间转换（如 "8h" → "2026-02-09 10:00"，"Feb 7" → "2026-02-07"）

## 输出

- 访问了哪 2 个账号
- 每个账号有什么新推文（简述内容）
- 是否有值得关注的信息
