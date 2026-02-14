---
cron: "*/30 * * * *"
description: Scrape Zhihu hot list snapshot into zhihu_hot table
enabled: true
model: zhipu/glm-4.7
---

# 采集知乎热榜

## 目标

每次运行采集知乎热榜全部 30 条，作为一次快照写入数据库。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 表：`zhihu_hot`
- Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/zhihu_hot.sql`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用自己的理解力提取页面内容，用 sqlite3 命令行写入数据库。

## 步骤

### 1. 生成 snapshot_id

用当前时间作为本次采集的 snapshot_id：

```bash
date '+%Y-%m-%dT%H:%M:%S'
```

### 2. 打开知乎热榜

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com/hot
```

### 3. 查看页面内容

```bash
mcporter call chrome-devtools.take_snapshot
```

用你自己的理解力阅读 snapshot 输出，识别每条热榜条目，提取：

- `rank`：排名（1~30）
- `question_id`：从 URL 中提取问题 ID
- `title`：问题标题
- `excerpt`：摘要（可能为空）
- `heat`：热度数值（万），如 "1789 万热度" 提取为 1789
- `tag`：标签如 "新"，没有则为 NULL
- `url`：问题完整链接
- `thumbnail_url`：缩略图链接（可能为空）

### 4. 写入数据库

对每条热榜条目，用 sqlite3 命令插入：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT INTO zhihu_hot (snapshot_id, rank, question_id, title, excerpt, heat, tag, url, thumbnail_url) VALUES ('...', ...);"
```

### 5. 滚动加载

热榜共 30 条，一屏可能显示不完。如果 snapshot 中不足 30 条，滚动加载更多：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1000)"
```

然后重新 take_snapshot，继续提取未处理的条目，直到全部 30 条采集完毕。

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- 时间格式统一为 ISO 8601：`YYYY-MM-DDTHH:MM:SS`
- title 和 excerpt 中的单引号需要转义为两个单引号（SQL 转义）
- 每次运行采集完整的一次快照（30 条），不做增量
