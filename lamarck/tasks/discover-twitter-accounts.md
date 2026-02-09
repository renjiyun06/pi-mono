---
cron: "0 * * * *"
description: "从 Twitter 发现高质量 AI 领域账号"
enabled: true
---

你的任务是从 Twitter 上发现高质量的 AI 领域账号。

## 背景

我们维护一个 AI 领域的 Twitter 账号列表，现在需要扩展这个列表。
你要从现有账号的热门帖子下面，找到活跃的、有质量的互动者。

## 工具

**必须使用浏览器操作 Twitter**。先读取 mcporter skill 学习如何使用：

```bash
cat /home/lamarck/pi-mono/.pi/skills/mcporter/SKILL.md
```

常用命令：
- `mcporter call chrome.navigate url=<url>` — 打开页面
- `mcporter call chrome.screenshot` — 截图查看页面
- `mcporter call chrome.click selector=<css>` — 点击元素
- `mcporter call chrome.scroll_down` — 向下滚动

## 数据库

- 路径：/home/lamarck/pi-mono/lamarck/data/lamarck.db
- 表：twitter_accounts（username, display_name, reason, discovered_from, priority, active, created_at）

## 第一步：获取种子账号

从数据库随机抽取 2 个活跃账号作为本次探索的种子：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT username FROM twitter_accounts WHERE active = 1 ORDER BY RANDOM() LIMIT 2"
```

## 第二步：探索流程

对每个种子账号：

1. 打开该账号的 Twitter 主页（https://x.com/<username>）
2. 找一条高热度帖子（点赞或转发多的）
3. 进入帖子详情，查看引用转发（Quotes）或回复（Replies）
4. 从互动者中挑选看起来高质量的用户，打开他们主页查看

## 第三步：评估标准

符合以下标准的账号值得关注：
- 粉丝数 >= 500
- 有 bio，且和 AI/技术相关
- 有独立观点，不是纯转发机器

## 第四步：入库

发现符合标准的账号，直接插入数据库：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "INSERT OR IGNORE INTO twitter_accounts (username, display_name, reason, discovered_from) VALUES ('handle', 'Display Name', '入选理由', '从哪个账号发现的')"
```

## 输出要求

- 每发现一个合格账号，立即插入数据库
- 最后输出本次发现的账号列表和理由
- 如果没有发现合适的账号，也要说明原因

开始吧。
