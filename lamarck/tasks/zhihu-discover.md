---
cron: "*/20 * * * *"
description: Browse Zhihu recommended feed and upvote high-quality AI content
enabled: true
model: anthropic/claude-sonnet-4-5
allowParallel: true
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

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器。

## 步骤

### 1. 打开知乎首页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com
```

### 2. 浏览推荐流

```bash
mcporter call chrome-devtools.take_snapshot
```

阅读推荐流中的每条内容摘要，根据标题和摘要做初步判断：
- 是否与 AI 相关
- 摘要中是否透露出原创性和深度

### 3. 查看详情

如果摘要看起来有潜力，用新标签页打开详情（不要在推荐流页面点击跳转）：

```bash
mcporter call chrome-devtools.new_page url=<内容URL>
```

在新标签页中 take_snapshot 阅读完整内容，判断是否符合高质量标准。

### 4. 点赞

如果内容确实高质量，在详情页点击"赞同"按钮：

```bash
mcporter call chrome-devtools.click uid=<赞同按钮的uid>
```

无论是否点赞，关闭详情页并切回推荐流：

```bash
mcporter call chrome-devtools.close_page pageId=<详情页的pageId>
mcporter call chrome-devtools.select_page pageId=<推荐流的pageId>
```

### 5. 滚动加载

如果当前页面中符合条件的内容不足 4 篇，向下滚动加载更多：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

然后重新 take_snapshot 继续筛选。

### 6. 完成条件

找到并点赞 4~5 篇高质量内容后任务结束。如果滚动了 5 轮仍不足 4 篇，也可以结束（说明当前推荐流中高质量 AI 内容不多）。

## 注意

- **不要写脚本**，所有操作通过 mcporter 完成
- 每篇内容都要有明确的判断理由（为什么点赞/为什么跳过）
- 点赞前必须确认内容质量，不要只看标题就点赞
- 如果详情页内容不符合预期，不要点赞，直接返回继续看下一篇
