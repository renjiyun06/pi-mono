---
cron: "*/30 * * * *"
description: Monitor latest activities from tracked Zhihu accounts
enabled: true
model: openrouter/moonshotai/kimi-k2.5
skipIfRunning: true
---

# 监控知乎账号最新动态

## 目标

每次运行随机选取 2~3 个已跟踪的知乎账号（排除 renjiyun，该账号有专门的任务），采集每个账号的最近几条动态，写入数据库。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 动态表：`zhihu_activities`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/zhihu_activities.sql`
- 账号表：`zhihu_accounts`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

## 步骤

### 1. 随机选取账号

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT url_token FROM zhihu_accounts WHERE url_token != 'renjiyun' ORDER BY RANDOM() LIMIT 3;"
```

### 2. 依次处理每个账号

对每个选中的账号，执行以下流程：

#### 2a. 查询数据库状态

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT MAX(activity_time) FROM zhihu_activities WHERE owner_id='<url_token>';"
```

- 如果无结果：首次同步，抓前 5~6 条
- 如果有结果：增量同步，遇到 `activity_time <= 已有最新时间` 的动态就停止

#### 2b. 打开动态页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com/people/<url_token>
```

#### 2c. 查看页面内容

```bash
mcporter call chrome-devtools.take_snapshot
```

阅读 snapshot，识别每条动态卡片，提取以下字段：

- `action_type`：根据 "赞同了回答" / "赞同了文章" / "赞同了想法" / "回答了问题" / "发布了文章" / "发布了想法" 等文本判断，映射为：`upvote_answer`, `upvote_article`, `upvote_pin`, `publish_answer`, `publish_article`, `publish_pin` 等
- `activity_time`：动态卡片上的时间，转为 ISO 8601 格式
- `title`：问题标题或文章标题（想法为空）
- `content_url`：内容链接
- `content_excerpt`：内容摘要
- `cover_image_url`：封面图
- `author_name` / `author_url` / `author_avatar` / `author_headline`：内容作者信息
- `upvote_count`：从 "已赞同 N" 提取
- `comment_count`：从 "N 条评论" 提取，"添加评论" = 0
- `pin_images`：想法的图片列表，JSON 数组
- `pin_publish_time`：想法的原始发布时间
- `ring_name` / `ring_url`：圈子信息

#### 2d. 逐条检查并写入

对每条动态，先计算 activity_hash：

```bash
echo -n "<url_token>|<action_type>|<content_url>|<activity_time>" | sha256sum | awk '{print $1}'
```

然后检查是否已存在：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT 1 FROM zhihu_activities WHERE activity_hash='<hash>';"
```

如果有返回结果，说明这条及更早的动态已经采集过，**停止当前账号的采集，处理下一个账号**。

如果没有返回结果，插入：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO zhihu_activities (owner_id, activity_hash, action_type, activity_time, title, content_url, content_excerpt, cover_image_url, author_name, author_url, author_avatar, author_headline, upvote_count, comment_count, pin_images, pin_publish_time, ring_name, ring_url) VALUES ('<url_token>', '<hash>', ...);"
```

#### 2e. 处理下一个账号

完成当前账号后，继续处理下一个选中的账号。

### 3. 完成条件

所有选中的账号都处理完毕后任务结束。

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- 时间格式统一为 ISO 8601：`YYYY-MM-DDTHH:MM:SS`
- 文本字段中的单引号需转义为两个单引号（SQL 转义）
- 如果知乎页面需要登录，先检查登录状态，如果未登录则终止任务并报告
- 如果某个账号页面加载异常，跳过该账号继续处理下一个
