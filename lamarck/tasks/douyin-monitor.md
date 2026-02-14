---
cron: "0,30 * * * *"
description: Monitor tracked Douyin accounts for new works
enabled: true
model: zai/glm-4.7
---

# 监控抖音博主新作品

## 目标

遍历已入库的抖音博主，检查是否有新发布的作品，将新作品入库，并更新已有作品的统计数据。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 账号表：`douyin_accounts`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/douyin_accounts.sql`
- 作品表：`douyin_works`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/douyin_works.sql`

## 工作方式

全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

优先使用 `evaluate_script` 提取结构化数据。**如果 JS 提取返回空数据或异常（可能是网站改版导致 DOM 结构变化），则回退到 `take_snapshot` 截图查看。**

## 步骤

### 1. 随机取 3~5 个博主

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT sec_uid, nickname FROM douyin_accounts ORDER BY RANDOM() LIMIT 5;"
```

### 2. 逐个打开博主主页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.douyin.com/user/<sec_uid>
```

### 3. 提取作品列表

用 JS 从 React fiber 中批量提取当前可见的作品信息：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const cards = document.querySelectorAll('a[href*=\"/video/\"].uz1VJwFY'); const results = []; for (const card of cards) { const fiberKey = Object.keys(card).find(k => k.startsWith('__reactFiber')); if (!fiberKey) continue; let fiber = card[fiberKey]; for (let i = 0; i < 3; i++) fiber = fiber?.return; if (!fiber?.memoizedProps?.awemeInfo) continue; const aweme = fiber.memoizedProps.awemeInfo; results.push({ awemeId: aweme.awemeId, desc: aweme.desc, itemTitle: aweme.itemTitle, createTime: aweme.createTime, isTop: aweme.tag?.isTop || false, mediaType: aweme.mediaType, authorUid: aweme.authorUserId?.toString() || '', authorSecUid: aweme.authorInfo?.secUid || '', stats: { diggCount: aweme.stats?.diggCount || 0, commentCount: aweme.stats?.commentCount || 0, shareCount: aweme.stats?.shareCount || 0, collectCount: aweme.stats?.collectCount || 0, recommendCount: aweme.stats?.recommendCount || 0 }, video: aweme.video ? { width: aweme.video.width, height: aweme.video.height, duration: aweme.video.duration, ratio: aweme.video.ratio } : null, hashtags: (aweme.textExtra || []).filter(t => t.type === 1).map(t => t.hashtagName), musicTitle: aweme.music?.title, coverUrl: card.querySelector('img')?.src if (results.length >= 10) break; }); } return JSON.stringify(results); }"
```

### 4. 入库新作品

对提取到的每条作品，检查是否已存在：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT 1 FROM douyin_works WHERE aweme_id='<aweme_id>';"
```

- **不存在**：INSERT 新作品
- **已存在**：UPDATE 统计数据（digg_count、comment_count、share_count、collect_count、recommend_count、updated_at）

INSERT 示例：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT INTO douyin_works (aweme_id, author_uid, author_sec_uid, title, description, hashtags, create_time, media_type, is_top, video_width, video_height, video_duration, video_ratio, cover_url, digg_count, comment_count, share_count, collect_count, recommend_count, music_title) VALUES ('...', '...', '...', '...', '...', '...', ..., ..., ..., ..., ..., ..., '...', '...', ..., ..., ..., ..., ..., '...');"
```

UPDATE 示例：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "UPDATE douyin_works SET digg_count=..., comment_count=..., share_count=..., collect_count=..., recommend_count=..., updated_at=datetime('now') WHERE aweme_id='<aweme_id>';"
```

注意：
- 文本字段中的单引号需转义为两个单引号
- 作品列表默认按时间倒序，如果连续碰到多条已入库且统计数据无明显变化的作品，可以停止处理该博主，进入下一个
- 置顶作品（is_top=true）始终排在最前面，不代表是最新作品，注意跳过置顶作品再判断是否有新内容

### 5. 处理下一个博主

直接用 `navigate_page` 跳转到下一个博主主页，重复步骤 3~4。

### 6. 完成条件

本次抽到的博主都检查完毕后任务结束。

## 注意

- **如果任何 JS 提取返回空数据，回退到 `take_snapshot` 截图查看，可能是网站改版导致 DOM 结构变化**
- 如果抖音页面需要登录，终止任务并报告
- 每个博主只需检查当前可见的作品（约 10 条），不需要滚动加载全部历史作品
