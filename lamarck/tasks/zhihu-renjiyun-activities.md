---
cron: "*/30 * * * *"
description: Sync renjiyun's Zhihu activity feed to zhihu_activities table
enabled: false
model: zai/glm-4.7
---

# 同步 renjiyun 的知乎动态

## 目标

监控 https://www.zhihu.com/people/renjiyun 的动态列表，将新动态写入 SQLite 数据库。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 表：`zhihu_activities`
- Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/zhihu_activities.sql`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用自己的理解力提取页面内容，用 sqlite3 命令行写入数据库。

## 步骤

### 1. 查询数据库状态

用 bash 执行：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT COUNT(*) as total, MAX(activity_time) as latest FROM zhihu_activities;"
```

- 如果 `total = 0`：首次同步，抓前 10 条
- 如果 `total > 0`：增量同步，抓到 `activity_time <= latest` 的记录就停止

### 2. 打开知乎动态页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com/people/renjiyun
```

### 3. 查看页面内容

```bash
mcporter call chrome-devtools.take_snapshot
```

用你自己的理解力阅读 snapshot 输出，识别每条动态卡片，从中提取以下字段：

- `action_type`：根据 "赞同了回答" / "赞同了文章" / "赞同了想法" 等文本判断
- `activity_time`：动态卡片上的时间
- `title`：问题标题或文章标题（想法为空）
- `content_url`：内容链接
- `content_excerpt`：内容摘要
- `cover_image_url`：封面图
- `author_name` / `author_url` / `author_avatar` / `author_headline`：作者信息
- `upvote_count`：从 "已赞同 N" 提取
- `comment_count`：从 "N 条评论" 提取，"添加评论" = 0
- `pin_images`：想法的图片列表，JSON 数组
- `pin_publish_time`：想法的原始发布时间
- `ring_name` / `ring_url`：圈子信息

### 4. 写入数据库

对每条提取到的动态，用 bash 执行 sqlite3 命令插入：

- `owner_id` 固定为 `renjiyun`

计算 activity_hash（注意包含 owner_id）：

```bash
echo -n "renjiyun|upvote_answer|https://...|2026-02-09T00:08:00" | sha256sum | awk '{print $1}'
```

得到 activity_hash，然后：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO zhihu_activities (owner_id, activity_hash, ...) VALUES ('renjiyun', '...', ...);"
```

逐条插入，INSERT OR IGNORE 自动去重。

### 5. 判断是否继续

- 首次同步：已插入 10 条后停止
- 增量同步：遇到 `activity_time <= 数据库中最新时间` 的动态就停止
- 如果当前页面的动态都是新的，滚动加载更多内容，回到步骤 3

滚动方式：
```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1000)"
```

然后重新 take_snapshot 查看新加载的内容。

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- 时间格式统一为 ISO 8601：`YYYY-MM-DDTHH:MM:SS`
- content_excerpt 中的单引号需要转义为两个单引号（SQL 转义）
