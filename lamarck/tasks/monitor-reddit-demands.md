---
cron: "10 * * * *"
description: "浏览 Reddit 板块发现用户需求信号和痛点"
enabled: false
model: anthropic/claude-sonnet-4-5
---

你的任务是浏览 Reddit 板块，发现用户需求和痛点。

## 工具

**必须使用浏览器操作 Reddit**。先读取 mcporter skill 学习如何使用：

```bash
cat /home/lamarck/pi-mono/.pi/skills/mcporter/SKILL.md
```

## 数据库

- 路径：/home/lamarck/pi-mono/lamarck/data/lamarck.db
- 表：inbox（id, source, content, created_at）

## 监控板块

### Tier 1 - 直接需求类（优先）

| 板块 | 特点 |
|------|------|
| r/SomebodyMakeThis | 用户直接请求产品，每个帖子都是具体需求 |
| r/Lightbulb | 创意和发明分享 |
| r/ideavalidation | 商业点子验证 |
| r/CrazyIdeas | 疯狂点子，偶有创新灵感 |

### Tier 2 - SaaS/创业类

| 板块 | 特点 |
|------|------|
| r/SaaS | SaaS 产品讨论，高互动量 |
| r/startups | 创业综合讨论 |
| r/Entrepreneur | 最大创业社区 |
| r/MicroSaas | 小型 SaaS，贴近独立开发者 |
| r/indiehackers | 独立开发者，真实经验分享 |
| r/SideProject | 副业项目 |

## 执行流程

对每个板块：

### 1. 打开板块热门页面

```
https://www.reddit.com/r/{subreddit}/hot/
```

或者最新页面：

```
https://www.reddit.com/r/{subreddit}/new/
```

### 2. 浏览帖子列表

看标题和互动量，自己判断哪些帖子可能有需求信号：
- 标题包含 "I wish..."、"Why is there no..."、"Looking for..."
- 标题描述具体痛点或问题
- 互动量高（票数 > 10 或评论 > 10）

### 3. 点进有价值的帖子

对看起来有价值的帖子，点进去查看详情，提取：
- 标题
- URL
- 发布时间
- 核心需求/痛点
- 用户原话（最有价值的一句）

### 4. 去重检查

先查询已入库的 URL：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT content FROM inbox WHERE source = 'reddit_demand'" | grep -o '"url":"[^"]*"' | cut -d'"' -f4
```

跳过已存在的 URL。

### 5. 存入数据库

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "INSERT INTO inbox (source, content) VALUES ('reddit_demand', '{\"subreddit\":\"...\",\"title\":\"...\",\"url\":\"...\",\"posted\":\"...\",\"pain_point\":\"...\",\"quote\":\"...\"}');"
```

### 6. 继续下一个板块

每个板块之间间隔 30 秒，避免被封。

## 输出要求

- 每发现一个有价值的帖子，立即入库
- 最后汇总：共浏览 X 个板块，发现 Y 条新需求
- 列出发现的需求摘要
