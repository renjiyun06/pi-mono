---
cron: "0 * * * *"
description: Discover new AI-focused Zhihu accounts worth following
enabled: true
model: anthropic/claude-sonnet-4-5
skipIfRunning: true
---

# 发现值得关注的知乎 AI 账号

## 目标

每次运行发现 2~3 个新的、值得关注的 AI 领域知乎账号，写入数据库。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 表：`zhihu_accounts`
- Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/zhihu_accounts.sql`

## 值得关注的标准

**符合条件：**
- AI/LLM/agents/机器学习领域的活跃从业者或研究者
- 持续输出原创内容（回答、文章），不是偶尔写一两篇
- 内容有深度，有独立思考和行业洞察
- 优先选择：AI 创业者、研究员、工程师、有影响力的技术作者

**不符合条件（跳过）：**
- 营销号、课程推销、引流号
- 主要写教程/入门内容的科普号
- 长期不活跃（数月无新内容）
- 数据库中已存在的账号

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

## 步骤

### 1. 查看已有账号

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT url_token, nickname FROM zhihu_accounts;"
```

### 2. 随机选择发现策略

运行以下命令生成 1~2 的随机数，决定本次使用哪种策略：

```bash
echo $((RANDOM % 2 + 1))
```

- **结果为 1 → 策略 A：从已有账号的关注列表发现**
- **结果为 2 → 策略 B：从推荐流高质量内容发现**

---

### 策略 A：从已有账号的关注列表发现

#### A1. 随机选一个已有账号

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT url_token FROM zhihu_accounts ORDER BY RANDOM() LIMIT 1;"
```

#### A2. 访问其关注列表

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com/people/<url_token>/following
```

#### A3. 浏览关注列表

```bash
mcporter call chrome-devtools.take_snapshot
```

从列表中挑选几个看起来可能与 AI 相关的人（根据昵称、简介判断），点进主页评估。

#### A4. 评估主页

点进某个人的主页后，take_snapshot 查看：
- 个人简介是否与 AI 相关
- 最近的回答/文章内容和方向
- 是否持续活跃
- 内容是否有深度和原创性

如果符合标准，进入写入步骤。如果不符合，返回关注列表继续看下一个。

---

### 策略 B：从推荐流高质量内容发现

#### B1. 打开知乎首页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com
```

#### B2. 浏览推荐流

```bash
mcporter call chrome-devtools.take_snapshot
```

浏览推荐流中的内容，寻找 AI 方向的回答或文章。

#### B3. 严格筛选内容质量

**只有满足以下全部条件的内容才值得进一步查看作者：**
- 主题明确属于 AI/LLM/agents/机器学习
- 观点有原创性，不是常识搬运
- 分析有深度，体现专业水平（技术细节、行业判断、实践经验）
- 不是教程、广告、软文、情绪输出

大部分内容不会满足这个标准，这是正常的。宁可这次少发现几个账号，也不要降低标准。

#### B4. 评估作者主页

发现一篇真正高质量的内容后，点进作者主页：

```bash
mcporter call chrome-devtools.click uid=<作者名称的uid>
```

take_snapshot 查看：
- 这个人是否持续在 AI 方向输出内容（不只是偶尔一篇）
- 其他回答/文章的质量如何
- 是否活跃

如果只是偶尔写了一篇好的，但主页内容杂乱或不活跃，不录入。

#### B5. 滚动加载

如果推荐流中暂时没有发现高质量 AI 内容，向下滚动：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

然后重新 take_snapshot 继续筛选。

---

### 3. 写入数据库

确认某个账号值得关注后，从其主页提取信息并写入：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT OR IGNORE INTO zhihu_accounts (url_token, account_type, nickname, avatar_url, headline) VALUES ('<url_token>', '<people或org>', '<nickname>', '<avatar_url>', '<headline>');"
```

注意：
- `url_token` 从主页 URL 提取，如 `https://www.zhihu.com/people/wonglei` 中的 `wonglei`
- `account_type`：个人账号填 `people`，机构号填 `org`
- 文本字段中的单引号需转义为两个单引号

### 4. 完成条件

- 成功发现并写入 2~3 个新账号后任务结束
- 如果策略 B 滚动了 5 轮仍未发现符合标准的内容，也可以结束
- 每个写入的账号要记录选择理由（在任务输出中说明）

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- 如果知乎页面需要登录，先检查登录状态，如果未登录则终止任务并报告
- 策略 B 的质量标准要严格，宁缺毋滥
