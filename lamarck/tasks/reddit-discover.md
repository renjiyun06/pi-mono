---
cron: "*/20 * * * *"
description: Discover demand signals and high-quality founder shares from Reddit
enabled: true
model: zhipu/glm-4.7
---

# Reddit 需求信号与高质量分享发现

## 目标

每次运行从监控的 subreddit 中发现两类有价值的帖子：**需求信号**和**高质量创业分享**，深入阅读正文和评论区，将结果写入数据库。

## 什么样的帖子值得采集

### A. 需求信号

- 有人明确表达"我需要一个XX工具/服务"
- 吐槽现有工具的痛点，暗示市场缺口
- 询问"有没有工具能做XX"
- 描述一个具体的业务问题，尚无好的解决方案
- 分享创业想法/产品 idea，评论区反馈积极
- 讨论某个垂直行业的自动化/效率问题

### B. 高质量创业分享

- 创业者详细分享产品从 0 到 1 的过程（技术选型、冷启动、增长策略等）
- 深度复盘：做了什么、踩了什么坑、学到了什么
- 实操性强的工具链/技术栈/营销渠道分享
- 有具体数据支撑的经验帖（MRR、用户增长、转化率等）
- 独立开发者/solopreneur 的真实经历和方法论

### 跳过的帖子

- 纯技术教程/入门指南（没有创业/产品视角）
- 产品广告/软文推广
- 招聘帖
- Meme/段子/情绪输出
- 已经有成熟解决方案的常见问题
- 数据库中已存在的帖子（按 post_id 去重）

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 帖子表：`reddit_posts`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/reddit_posts.sql`
- 板块表：`reddit_subreddits`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/reddit_subreddits.sql`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

使用下方提供的 `evaluate_script` JS 代码提取结构化数据，**不要用 `take_snapshot` 截图**。如果 JS 提取返回空数据或异常（可能是网站改版导致 DOM 结构变化），才回退到 `take_snapshot`。

## 步骤

### 1. 随机选择 subreddit

从板块表中随机选 1 个 subreddit：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT name, category FROM reddit_subreddits ORDER BY RANDOM() LIMIT 1;"
```

记住选中的板块名称和分类，后续筛选时会用到。

### 2. 加权随机选择排序方式

运行以下命令生成 1~20 的随机数，决定排序方式：

```bash
echo $((RANDOM % 20 + 1))
```

权重分配（共 20）：
- **1~10 → Best**（权重 10）：Reddit 算法推荐，信噪比最高
- **11~17 → Top (week)**（权重 7）：一周内最高票，经过社区验证的高质量内容
- **18 → Hot**（权重 1）：当前热门
- **19 → Rising**（权重 1）：正在上升的帖子
- **20 → New**（权重 1）：最新帖子

对应的 URL 格式：
- Best：`https://www.reddit.com/r/<name>/best/`
- Top (week)：`https://www.reddit.com/r/<name>/top/?t=week`
- Hot：`https://www.reddit.com/r/<name>/hot/`
- Rising：`https://www.reddit.com/r/<name>/rising/`
- New：`https://www.reddit.com/r/<name>/new/`

### 3. 打开 subreddit 并提取帖子列表

打开页面：

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.reddit.com/r/<name>/<sort>/
```

用 JS 提取所有帖子的结构化数据（Reddit 使用 `shreddit-post` 自定义元素，所有关键信息都在其 HTML 属性上）：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const posts = document.querySelectorAll('shreddit-post'); const results = []; for (const p of posts) { const flairEl = p.querySelector('shreddit-post-flair a'); results.push({ post_id: (p.getAttribute('id') || '').replace('t3_', ''), title: p.getAttribute('post-title') || '', author: p.getAttribute('author') || '', permalink: p.getAttribute('permalink') || '', score: parseInt(p.getAttribute('score') || '0'), comment_count: parseInt(p.getAttribute('comment-count') || '0'), created: p.getAttribute('created-timestamp') || '', flair: flairEl ? flairEl.textContent.trim() : '', post_type: p.getAttribute('post-type') || '' }); } return JSON.stringify(results); }"
```

返回 JSON 数组，每条包含 post_id、title、author、permalink、score（即 upvotes）、comment_count、created、flair、post_type。

### 4. 初步筛选

根据以下信号综合判断哪些帖子值得深入：

- **需求类关键词**：含有 "need", "looking for", "is there", "any tool", "how do you", "frustrated with", "wish there was", "alternative to", "help me", "automate" 等
- **分享类关键词**：含有 "how I built", "my journey", "lessons learned", "breakdown", "tech stack", "launched", "grew to", "MRR", "postmortem", "what worked", "I made $", "side project" 等
- **score + comment_count**：互动越高说明越多人有同样的痛点（但低互动不代表没价值，新帖可能刚发出来）
- **flair**：如 "Request", "Question", "Discussion" 等标签更可能包含需求；"Lessons Learned", "Success Story" 等更可能是高质量分享
- **板块分类**：如果是 demand 类板块（SomebodyMakeThis, RequestABot, AppIdeas, buildinpublic），几乎每条帖子都是需求，筛选可以更宽松

从列表中选出 3~5 条候选帖子。

### 5. 逐条去重

对每条候选帖子，查数据库是否已存在：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT 1 FROM reddit_posts WHERE post_id='<post_id>' LIMIT 1;"
```

- 如果返回 `1`，说明已采集过，**跳过**，继续看下一条候选
- 如果无返回，说明是新帖，进入步骤 6 深入查看

### 6. 深入查看帖子

对通过去重的候选帖子，**新开页面** 查看详情（不要离开列表页）：

```bash
mcporter call chrome-devtools.new_page url=https://www.reddit.com<permalink>
```

#### 6a. 提取完整正文

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const post = document.querySelector('shreddit-post'); if (!post) return JSON.stringify({error: 'no post element'}); const bodyEl = post.querySelector('[slot=text-body] div[id$=-post-rtjson-content]'); const body = bodyEl ? bodyEl.innerText.trim() : ''; return JSON.stringify({ title: post.getAttribute('post-title') || '', author: post.getAttribute('author') || '', score: parseInt(post.getAttribute('score') || '0'), comment_count: parseInt(post.getAttribute('comment-count') || '0'), body }); }"
```

#### 6b. 提取评论区

Reddit 评论是树形结构，页面默认按 Best 排序，高赞评论在最前面。首次加载通常包含大部分高质量评论，深层嵌套回复（"More replies"）和折叠评论（低分）基本是噪音，不需要展开。

提取前 30 条顶级评论（depth=0）及其直接回复（depth=1），按 score 排序：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const comments = document.querySelectorAll('shreddit-comment'); const results = []; let topCount = 0; for (const c of comments) { const author = c.getAttribute('author') || ''; if (author === 'AutoModerator') continue; const depth = parseInt(c.getAttribute('depth') || '0'); if (depth > 1) continue; if (depth === 0) { topCount++; if (topCount > 30) break; } const score = parseInt(c.getAttribute('score') || '0'); const commentDiv = c.querySelector('[slot=comment]'); const body = commentDiv ? commentDiv.innerText.trim().substring(0, 500) : ''; results.push({ author, score, depth, body }); } return JSON.stringify({ total: comments.length, items: results }); }"
```

如果评论区很长，首屏可能没加载完，先向下滚动 2~3 次再提取：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 3000)"
```

#### 6c. 判断与总结

阅读正文和评论后：

1. **判断是否值得采集**：如果实际内容不符合标准（标题党、软文、跑题等），跳过不入库
2. **生成评论总结**（comments_summary）：用 2~3 句话总结评论区的核心观点和情绪，重点关注：
   - 有多少人表示"我也需要"
   - 有人推荐了什么现有方案（以及这些方案的缺陷）
   - 有人提出了补充需求或不同角度
   - 评论区的整体情绪（兴奋、共鸣、质疑）

#### 6d. 关闭详情页

```bash
mcporter call chrome-devtools.close_page pageId=<详情页ID>
mcporter call chrome-devtools.select_page pageId=<列表页ID>
```

切回列表页后**不要再次截图或提取**（页面未变化），直接从已有数据中继续处理下一条候选。

### 7. 写入数据库

对确认有价值的帖子，写入数据库：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO reddit_posts (post_id, subreddit, title, author, url, flair, body, comments_summary, thumbnail_url, upvotes, comment_count, posted_at) VALUES ('<post_id>', '<subreddit>', '<title>', '<author>', 'https://www.reddit.com<permalink>', '<flair>', '<body>', '<comments_summary>', '', <score>, <comment_count>, '<posted_at>');"
```

字段说明：
- `post_id`：从列表提取数据中直接获得（如 `1qx8bzd`）
- `body`：帖子完整正文（从详情页获取）
- `comments_summary`：你生成的评论区总结
- `posted_at`：`created` 字段的值，格式已是 ISO 8601（如 `2026-02-08T19:16:59.122000+0000`），直接使用即可
- 文本字段中的单引号需转义为两个单引号

### 8. 滚动加载（可选）

如果当前列表中候选帖子不够，可以向下滚动加载更多：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

滚动后重新执行步骤 3 的 JS 提取代码获取新帖子，继续筛选。

## 完成条件

- 成功发现并写入 2~4 条有价值的帖子（需求信号或高质量分享）后任务结束
- 如果浏览了整个列表页（包括滚动 3 轮）仍未找到 2 条，也可以结束——不是每个板块每次都有好内容，这很正常
- 每条写入的帖子要在任务输出中说明：它属于哪类（需求信号/高质量分享），以及为什么值得采集

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- **优先使用 evaluate_script**，只有在 JS 提取失败时才回退到 take_snapshot
- Reddit 可能有反爬机制，如果页面加载异常或出现验证页面，等待片刻后重试，连续失败则终止任务并报告
- 时间格式统一为 ISO 8601
- 如果帖子正文为空（如纯链接帖），body 字段存为空字符串，但仍可根据标题和评论判断是否有价值
- 评论区可能很长，不需要读完所有评论，读前 20~30 条高赞评论即可形成总结
