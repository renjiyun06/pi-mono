---
cron: "*/20 * * * *"
description: Discover new AI-focused Twitter accounts worth following
enabled: true
model: zhipu/glm-4.7
---

# 发现值得关注的推特 AI 账号

## 目标

每次运行发现 3~5 个新的、值得关注的 AI 领域推特账号，写入数据库。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 表：`twitter_accounts`
- Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/twitter_accounts.sql`

## 值得关注的标准

**符合条件：**
- AI/LLM/agents/机器学习领域的活跃从业者或研究者
- 经常发布原创技术观点、行业洞察、项目发布
- 粉丝数不是硬性要求，但内容质量要高
- 优先选择：AI 创业者、知名研究员、开源项目维护者、有影响力的技术博主

**不符合条件（跳过）：**
- 纯搬运/翻译账号
- 营销号、课程推销
- 长期不活跃（数周无推文）
- 数据库中已存在的账号

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

## 步骤

### 1. 查看已有账号

先查看数据库中已有的账号，避免重复：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT handle FROM twitter_accounts;"
```

### 2. 随机选择发现策略

运行以下命令生成 1~3 的随机数，决定本次使用哪种策略：

```bash
echo $((RANDOM % 3 + 1))
```

- **结果为 1 → 策略 A：从已有账号的互动圈发现**
  - 从数据库中随机选一个账号：`sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT handle FROM twitter_accounts ORDER BY RANDOM() LIMIT 1;"`
  - 访问 `https://x.com/<handle>` 查看其最近的推文
  - 关注他们转推、回复、引用的人，点进这些人的主页评估

- **结果为 2 → 策略 B：搜索热门话题**
  - 先随机选一个关键词：`echo "AI agents|LLM|open source AI|machine learning|RAG|fine-tuning|AI startup|foundation models|AI engineering" | tr '|' '\n' | shuf -n1`
  - 访问 `https://x.com/search?q=<keyword>&src=typed_query&f=top`
  - 从热门推文中发现优质作者

- **结果为 3 → 策略 C：探索推荐列表**
  - 从数据库中随机选一个账号：`sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT handle FROM twitter_accounts ORDER BY RANDOM() LIMIT 1;"`
  - 访问 `https://x.com/<handle>/following`
  - 浏览列表，发现感兴趣的账号

### 3. 浏览和评估

打开目标页面：

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://x.com/...
```

查看页面内容：

```bash
mcporter call chrome-devtools.take_snapshot
```

对于每个潜在账号，点进主页查看：
- bio 描述是否与 AI 相关
- 最近的推文内容和质量
- 粉丝数和活跃度
- 是否有原创内容

### 4. 写入数据库

确认某个账号值得关注后，提取其主页信息并写入：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO twitter_accounts (handle, nickname, avatar_url, bio, website, location, verified, followers_count, following_count, joined_at) VALUES ('<handle>', '<nickname>', '<avatar_url>', '<bio>', '<website>', '<location>', <0或1>, <followers_count>, <following_count>, '<joined_at>');"
```

注意：
- handle 不含 @ 符号
- 文本字段中的单引号需转义为两个单引号
- verified 为 1 表示有蓝标
- followers_count 注意单位换算（如 "132.6K" = 132600）

### 5. 滚动和继续

如果当前页面中发现的账号不够，向下滚动加载更多：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

然后重新 take_snapshot 继续筛选。

### 6. 完成条件

- 成功发现并写入 3~5 个新账号后任务结束
- 如果浏览了足够多的内容（滚动 5 轮以上）但仍未找到 3 个，也可以结束
- 每个写入的账号要记录选择理由（在任务输出中说明）

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- 如果推特页面需要登录才能查看，先检查登录状态，如果未登录则终止任务并报告
- 如果遇到速率限制或页面异常，等待片刻后重试，连续失败则终止
- 优先发现不同子领域的账号（如 NLP、CV、RL、AI infra、AI 产品），避免同质化
