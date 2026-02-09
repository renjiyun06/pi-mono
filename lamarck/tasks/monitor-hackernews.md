---
cron: "30 * * * *"
description: "监控 Hacker News 首页热帖"
enabled: false
---

你的任务是查看 Hacker News 首页，采集热门帖子。

## 工具

使用浏览器操作。先读取 mcporter skill：

```bash
cat /home/lamarck/pi-mono/.pi/skills/mcporter/SKILL.md
```

## 数据库

- 路径：/home/lamarck/pi-mono/lamarck/data/lamarck.db

## 第一步：查询已入库的帖子链接

查询 inbox 中所有 hackernews 记录的原文链接：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT json_extract(content, '\$.url') FROM inbox WHERE source = 'hackernews'"
```

记住这些链接用于去重。

## 第二步：打开 Hacker News

访问：`https://news.ycombinator.com/`

直接看页面帖子列表，采集首页前 20-30 条帖子。

## 第三步：去重并采集新帖子

对页面上的每条帖子，检查它的原文链接是否在第一步的已有列表中：
- 如果链接已存在，跳过
- 如果链接不存在，采集并入库

对每条新帖子，提取：
- title（标题）
- url（原文链接，用于去重）
- score（分数，如 "291 points" 提取 291）
- author（作者）
- age（发布时间，如 "9 hours ago"）
- comments（评论数，如 "97 comments" 提取 97）

## 第四步：存入数据库

对每条新帖子：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "INSERT INTO inbox (source, content) VALUES ('hackernews', '{\"title\":\"...\",\"url\":\"...\",\"score\":...,\"author\":\"...\",\"age\":\"...\",\"comments\":...}');"
```

## 输出

- 采集了多少条新帖子
- 简述热门帖子的内容（前 3 条）
