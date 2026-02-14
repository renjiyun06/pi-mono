---
cron: "*/20 * * * *"
description: Browse Zhihu recommended feed and upvote high-quality AI content
enabled: true
model: zai/glm-4.7
overlap: parallel
---

# 知乎推荐流发现高质量 AI 内容

## 目标

登录知乎首页，浏览推荐流，寻找 4~5 篇高质量 AI 方向内容并点赞。

## 高质量标准

**符合条件：**
- 主题与 AI/LLM/agents/机器学习相关
- 内容原创，有独立思考
- 观点深刻，有洞察力（技术分析、行业思考、实践经验、深度评论等）

**不符合条件（一律跳过）：**
- 教程类（手把手教你、入门指南、教学步骤等）
- 广告/推广/软文
- 搬运/翻译无原创观点
- 水帖/段子/情绪输出
- 非 AI 方向的内容

## 工作方式

全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

优先使用 `evaluate_script` 提取结构化数据，避免截图消耗 token。**如果 JS 提取返回空数据或异常（可能是网站改版导致 DOM 结构变化），则回退到 `take_snapshot` 截图查看。**

## 步骤

### 1. 打开知乎首页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com
```

### 2. 提取推荐流列表

用 JS 一次性提取所有 feed 条目：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const items = document.querySelectorAll('.ContentItem'); const results = []; for (const el of items) { const zop = JSON.parse(el.getAttribute('data-zop') || '{}'); const titleEl = el.querySelector('.ContentItem-title a'); let url = titleEl?.getAttribute('href') || ''; if (url.startsWith('//')) url = 'https:' + url; const excerptEl = el.querySelector('.RichContent-inner'); const excerpt = excerptEl ? excerptEl.innerText.substring(0, 200).trim() : ''; const voteBtn = el.querySelector('button[class*=VoteButton]'); const voteText = voteBtn?.textContent || ''; const voteMatch = voteText.match(/(\d[\d,]*)/); const votes = voteMatch ? parseInt(voteMatch[1].replace(/,/g, '')) : 0; const allBtns = Array.from(el.querySelectorAll('button')); const commentBtn = allBtns.find(b => b.textContent.includes('评论')); const commentText = commentBtn?.textContent || ''; const commentMatch = commentText.match(/(\d+)/); const comments = commentMatch ? parseInt(commentMatch[1]) : 0; results.push({ title: zop.title || titleEl?.textContent || '', author: zop.authorName || '', type: zop.type || '', url, excerpt, votes, comments }); } return JSON.stringify(results); }"
```

返回 JSON 数组，每条包含 title、author、type、url、excerpt、votes、comments。

根据标题和摘要筛选出与 AI 相关、有深度的候选内容。

### 3. 查看详情

对候选内容，用新标签页打开详情（不要离开推荐流页面）：

```bash
mcporter call chrome-devtools.new_page url=<内容URL>
```

用 JS 提取详情页全文（兼容回答页和文章页）：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const isArticle = !!document.querySelector('.Post-Title'); let title, author, content; if (isArticle) { title = document.querySelector('.Post-Title')?.innerText || document.querySelector('h1')?.innerText || ''; author = document.querySelector('.AuthorInfo meta[itemprop=name]')?.getAttribute('content') || document.querySelector('.AuthorInfo-content a')?.innerText || ''; content = document.querySelector('.RichText.ztext.Post-RichText')?.innerText || ''; } else { title = document.querySelector('.QuestionHeader-title')?.innerText || ''; author = document.querySelector('.AnswerItem .AuthorInfo meta[itemprop=name]')?.getAttribute('content') || document.querySelector('.AnswerItem .AuthorInfo-content a')?.innerText || ''; content = document.querySelector('.AnswerItem .RichContent-inner .RichText')?.innerText || ''; } const scope = isArticle ? document : document.querySelector('.AnswerItem') || document; const voteBtn = scope.querySelector('button[class*=VoteButton]'); const voteText = voteBtn?.textContent || ''; const voteMatch = voteText.match(/(\d[\d,]*)/); const votes = voteMatch ? parseInt(voteMatch[1].replace(/,/g, '')) : 0; const allBtns = Array.from(scope.querySelectorAll('button')); const commentBtn = allBtns.find(b => b.textContent.includes('评论')); const commentText = commentBtn?.textContent || ''; const commentMatch = commentText.match(/(\d+)/); const comments = commentMatch ? parseInt(commentMatch[1]) : 0; return JSON.stringify({ type: isArticle ? 'article' : 'answer', title, author, content, votes, comments }); }"
```

阅读返回的全文内容，判断是否符合高质量标准。

### 4. 点赞

如果内容确实高质量，在详情页用 JS 点击赞同按钮：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const btn = document.querySelector('.AnswerItem button[class*=VoteButton]') || document.querySelector('button[class*=VoteButton]'); if (btn) { btn.click(); return 'clicked'; } return 'not found'; }"
```

无论是否点赞，关闭详情页并切回推荐流：

```bash
mcporter call chrome-devtools.close_page pageId=<详情页的pageId>
mcporter call chrome-devtools.select_page pageId=<推荐流的pageId>
```

切回推荐流后不要再次提取或截图（页面未变化），直接从已有数据中继续判断下一个候选。

### 5. 滚动加载

当前列表中的候选内容都处理完后，向下滚动加载新内容：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

滚动后重新执行步骤 2 的提取代码获取新内容。

### 6. 完成条件

找到并点赞 4~5 篇高质量内容后任务结束。如果滚动了 5 轮仍不足 4 篇，也可以结束（说明当前推荐流中高质量 AI 内容不多）。

## 注意

- 每篇内容都要有明确的判断理由（为什么点赞/为什么跳过）
- 点赞前必须确认内容质量，不要只看标题就点赞
- 如果详情页内容不符合预期，不要点赞，直接返回继续看下一篇
- **如果任何 JS 提取返回空数据，回退到 `take_snapshot` 截图查看，可能是网站改版导致 DOM 结构变化**
