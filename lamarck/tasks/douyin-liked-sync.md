---
cron: "0 * * * *"
description: Sync liked videos from personal Douyin account into douyin_works and douyin_accounts
enabled: true
model: anthropic/claude-sonnet-4-5
skipIfRunning: true
---

# 同步抖音点赞记录

## 目标

从登录账号的"喜欢"列表中，将点赞的作品同步到 `douyin_works` 和 `douyin_accounts` 表，标记 `source='liked'`。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 作品表：`douyin_works`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/douyin_works.sql`
- 博主表：`douyin_accounts`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/douyin_accounts.sql`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

使用下方提供的 `evaluate_script` JS 代码提取结构化数据，**不要用 `take_snapshot` 截图**。如果 JS 提取返回空数据或异常（可能是网站改版导致 DOM 结构变化），才回退到 `take_snapshot`。

## 增量策略

点赞列表按时间倒序排列（最新点赞在最上面）。增量逻辑：

1. 从列表顶部开始逐条处理
2. 对每条作品，用 `aweme_id` 查 `douyin_works` 表：
   - **不存在** → 新作品，进入详情页提取信息，写入 `source='liked'`
   - **存在但 `source='discover'`** → 之前发现任务采集的，更新 `source='liked'`，不需要进详情页
   - **存在且 `source='liked'`** → **停止！** 说明已追上上次同步位置，后面的都处理过了
3. 首次运行（表中无 `source='liked'` 记录）时，处理前 10 条后主动停止

## 步骤

### 1. 打开点赞列表

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.douyin.com/user/self?showTab=like
```

### 2. 提取点赞列表

点赞列表中的每条作品是一个 `<a>` 链接，包含视频 URL（含 aweme_id）、描述文本和封面图。

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const links = document.querySelectorAll('a[href*=\"/video/\"]'); const results = []; const seen = new Set(); for (const a of links) { const href = a.getAttribute('href') || ''; const match = href.match(/\/video\/(\d+)/); if (!match) continue; const awemeId = match[1]; if (seen.has(awemeId)) continue; seen.add(awemeId); const text = a.textContent.trim(); const img = a.querySelector('img'); const coverUrl = img ? img.getAttribute('src') || '' : ''; const descParts = text.split(/\d+$/); const desc = descParts[0] || ''; const diggMatch = text.match(/(\d+)$/); const digg = diggMatch ? parseInt(diggMatch[1]) : 0; results.push({ awemeId, url: 'https://www.douyin.com/video/' + awemeId, desc: desc.substring(0, 200), coverUrl, digg }); } return JSON.stringify(results); }"
```

返回 JSON 数组，每条包含 awemeId、url、desc、coverUrl、digg。

### 3. 逐条增量处理

对列表中的每条作品，按顺序执行：

#### 3a. 查库判断状态

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT source FROM douyin_works WHERE aweme_id='<awemeId>' LIMIT 1;"
```

- 返回 `liked` → **停止整个任务**，已追上上次同步位置
- 返回 `discover` → 执行更新：
  ```bash
  sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "UPDATE douyin_works SET source='liked', updated_at=datetime('now') WHERE aweme_id='<awemeId>';"
  ```
  然后继续处理下一条（不需要进详情页）
- 无返回 → 新作品，进入步骤 4

#### 3b. 首次运行保护

如果已处理（插入+更新）了 10 条且从未碰到 `source='liked'` 的记录，主动停止，避免首次运行翻完所有 2000+ 条点赞。

### 4. 打开作品详情页

对新作品，新开页面查看详情（不要离开点赞列表页）：

```bash
mcporter call chrome-devtools.new_page url=https://www.douyin.com/video/<awemeId>
```

#### 4a. 提取作品信息

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const data = {}; const authorLinks = document.querySelectorAll('a[href*=\"/user/MS4w\"]'); for (const a of authorLinks) { const text = a.textContent.trim(); if (text && !text.includes('作者') && a.querySelector('div')) { const m = a.getAttribute('href').match(/user\/(MS4w[^?/]+)/); data.sec_uid = m ? m[1] : ''; data.nickname = text; break; } } const bodyText = document.body.innerText; const timeMatch = bodyText.match(/发布时间：\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/); data.publishTime = timeMatch ? timeMatch[1] : ''; data.awemeId = (location.href.match(/video\/(\d+)/) || [])[1] || ''; data.title = document.title.replace(/ - 抖音$/, '').trim().substring(0, 200); return JSON.stringify(data); }"
```

返回 sec_uid、nickname、publishTime、awemeId、title。

#### 4b. 关闭详情页

```bash
mcporter call chrome-devtools.close_page pageId=<详情页ID>
mcporter call chrome-devtools.select_page pageId=<点赞列表页ID>
```

切回列表页后**不要再次截图或提取**。

### 5. 写入作品

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO douyin_works (aweme_id, author_sec_uid, author_uid, title, description, cover_url, digg_count, create_time, source) VALUES ('<awemeId>', '<sec_uid>', '', '<title>', '<desc>', '<coverUrl>', <digg>, strftime('%s', '<publishTime>'), 'liked');"
```

注意：
- `author_uid` 暂时为空字符串（点赞页面无法直接获取）
- `create_time` 需要将 `publishTime`（如 `2026-01-17 18:14`）转为 Unix 时间戳
- 文本字段中的单引号需转义为两个单引号

### 6. 写入博主（如果不存在）

先检查博主是否已入库：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT source FROM douyin_accounts WHERE sec_uid='<sec_uid>' LIMIT 1;"
```

- 无返回 → 新博主，写入：
  ```bash
  sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO douyin_accounts (sec_uid, nickname, source) VALUES ('<sec_uid>', '<nickname>', 'liked');"
  ```
- 返回 `discover` → 更新来源：
  ```bash
  sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "UPDATE douyin_accounts SET source='liked', updated_at=strftime('%Y-%m-%dT%H:%M:%S','now','localtime') WHERE sec_uid='<sec_uid>';"
  ```
- 返回 `liked` → 不做任何操作

### 7. 滚动加载（如果需要）

如果列表中的作品都处理完但还没有碰到停止条件，向下滚动加载更多：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1000)"
```

滚动后重新执行步骤 2 的提取代码获取新内容，继续处理。

## 完成条件

以下任一条件满足即结束：
- 碰到一条 `source='liked'` 的已有记录（增量追上）
- 首次运行处理了 10 条
- 列表滚动到底部，无更多内容

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- **优先使用 evaluate_script**，只有在 JS 提取失败时才回退到 take_snapshot
- 如果抖音要求登录或出现验证码，终止任务并报告
- 博主信息在此任务中只写入基础字段（sec_uid、nickname），完整信息由其他任务（douyin-discover-accounts）补充
