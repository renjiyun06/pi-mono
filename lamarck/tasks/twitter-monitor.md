---
cron: "*/15 * * * *"
description: Monitor latest tweets from tracked Twitter accounts
enabled: true
model: anthropic/claude-sonnet-4-5
skipIfRunning: true
---

# 监控推特账号最新推文

## 目标

每次运行随机选取 2~3 个已跟踪的推特账号，采集每个账号最近 5~6 条原创推文，写入数据库。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 推文表：`twitter_posts`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/twitter_posts.sql`
- 账号表：`twitter_accounts`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

## 步骤

### 1. 随机选取账号

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT handle FROM twitter_accounts ORDER BY RANDOM() LIMIT 3;"
```

### 2. 访问账号主页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://x.com/<handle>
```

### 3. 采集推文

```bash
mcporter call chrome-devtools.take_snapshot
```

阅读页面中的推文列表，对每条推文判断：

**跳过：**
- 转推（带 "reposted" 标记）
- 回复（带 "Replying to" 标记）

对每条原创推文，先检查是否已采集过：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT 1 FROM twitter_posts WHERE tweet_id='<tweet_id>';"
```

如果有返回结果，说明这条及更早的推文已经采集过，**跳过该条并停止当前账号的采集，直接处理下一个账号**。

如果没有返回结果，先检查推文内容是否被截断（是否有 "Show more" 按钮）。如果有，点击展开获取完整内容：

```bash
mcporter call chrome-devtools.click uid=<show_more按钮的uid>
```

点击后重新 take_snapshot 获取展开后的完整文本。

然后提取以下字段：
- `tweet_id`：从推文链接中提取，如 `/status/1234567890`
- `author_handle`：当前账号的 handle
- `author_name`：显示名称
- `content`：推文完整正文（确保是展开后的完整内容）
- `created_at`：发布时间，转为 ISO 8601 格式（如页面显示 "Feb 8" 则推算为当年日期）
- `media_type`：null / 'image' / 'video'
- `media_urls`：图片 URL 的 JSON 数组，无图则为 null
- `link_url`：外链卡片的 URL，无则为 null
- `reply_count`, `repost_count`, `like_count`, `bookmark_count`, `view_count`：互动数据，注意单位换算（如 "5.2K" = 5200）
- `is_pinned`：是否有 "Pinned" 标记

每个账号只采集首屏可见的最近 5~6 条原创推文，**不需要向下滚动翻更多**。

### 4. 写入数据库

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO twitter_posts (tweet_id, author_handle, author_name, content, created_at, media_type, media_urls, link_url, reply_count, repost_count, like_count, bookmark_count, view_count, is_pinned) VALUES ('...', '...', ...);"
```

注意：
- 文本字段中的单引号需转义为两个单引号
- `INSERT OR IGNORE` 确保 tweet_id 重复时不报错
- 互动数据单位换算：K = ×1000，M = ×1000000

### 5. 处理下一个账号

完成一个账号后，继续处理下一个选中的账号，重复步骤 2~4。

### 6. 完成条件

所有选中的账号都处理完毕后任务结束。

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- 如果推特页面需要登录才能查看，先检查登录状态，如果未登录则终止任务并报告
- 如果某个账号页面加载异常或被限流，跳过该账号继续处理下一个
- 时间推算：页面显示 "Xh"（X小时前）或 "Feb 8" 等相对/简写时间，需结合当前日期推算为完整的 ISO 8601 格式
