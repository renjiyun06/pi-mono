---
cron: "*/30 * * * *"
description: Discover new Zhihu accounts worth following (AI priority, tech/startup also accepted)
enabled: true
model: zhipu/glm-4.7
---

# 发现值得关注的知乎账号

## 目标

每次运行发现 2~3 个新的、值得关注的知乎账号，写入数据库。AI 方向优先，但技术、创业、产品等相邻领域的高质量内容输出者也可以。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 表：`zhihu_accounts`
- Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/zhihu_accounts.sql`

## 值得关注的标准

**符合条件：**
- 持续输出原创内容（回答、文章），不是偶尔写一两篇
- 内容有深度，有独立思考和行业洞察
- AI/LLM/agents/机器学习方向优先
- 技术（编程、架构、基础设施）、创业（产品、商业化）、产品设计等相邻领域也可以
- 优先选择：从业者、研究者、创业者、有影响力的技术作者

**不符合条件（跳过）：**
- 营销号、课程推销、引流号
- 主要写教程/入门内容的科普号
- 长期不活跃（数月无新内容）
- 数据库中已存在的账号

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

**关键原则：优先使用 `evaluate_script` 提取结构化数据，而非 `take_snapshot`。** 本文档中的 JS 提取代码已经过验证，直接使用即可。仅在 JS 提取返回空数据（页面结构可能已变更）时，才 fallback 到 `take_snapshot`。

**多标签页操作：** 从列表页/推荐流评估候选人时，用 `new_page` 在新标签页打开目标，评估完 `close_page` 关闭，再 `select_page` 切回原标签页继续。不要在原页面直接导航，否则会丢失滚动位置和页面状态。切回未发生变化的页面后，不需要重新提取数据，继续处理之前提取结果中的下一个候选即可。

## 步骤

### 1. 查看已有账号

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT url_token, nickname FROM zhihu_accounts;"
```

记住这个列表，后续用于去重。

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

#### A3. 提取关注列表

用 JS 直接提取关注者信息：

```bash
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = document.querySelectorAll('.List-item');
  return Array.from(items).map(item => {
    const titleLink = item.querySelector('.ContentItem-title a.UserLink-link');
    const imgLink = item.querySelector('.ContentItem-image a.UserLink-link');
    const href = (titleLink || imgLink)?.getAttribute('href') || '';
    const name = titleLink?.textContent?.trim() || '';
    const desc = item.querySelector('.ContentItem-meta .ztext');
    const stats = item.querySelector('.ContentItem-status');
    const isOrg = href.includes('/org/');
    return {
      url_token: href.split('/').pop() || '',
      nickname: name,
      account_type: isOrg ? 'org' : 'people',
      headline: desc?.textContent?.trim() || '',
      stats: stats?.textContent?.trim() || ''
    };
  });
}"
```

从返回的 JSON 列表中：
1. 排除步骤 1 中已存在的 url_token
2. 从剩余候选中随机选 5~6 个（不要根据 nickname/headline 预判，很多优质作者的简介并不直接体现方向）
3. 对每个候选人，用 `new_page` 打开其主页进行评估（见 A4）

#### A4. 评估候选人主页

用 `new_page` 在新标签页打开候选人主页：

```bash
mcporter call chrome-devtools.new_page url=https://www.zhihu.com/people/<url_token>
```

然后用 JS 提取主页信息：

```bash
mcporter call chrome-devtools.evaluate_script function="() => {
  const name = document.querySelector('.ProfileHeader-name')?.textContent?.trim() || '';
  const headline = document.querySelector('.ProfileHeader-headline')?.textContent?.trim() || '';
  const avatar = document.querySelector('.Avatar.UserAvatar-inner')?.src || document.querySelector('img.Avatar')?.src || '';
  const items = document.querySelectorAll('.List-item');
  const recentItems = Array.from(items).slice(0, 8).map(item => {
    const title = item.querySelector('.ContentItem-title a')?.textContent?.trim() || '';
    const excerpt = item.querySelector('.RichContent-inner')?.textContent?.trim()?.substring(0, 120) || '';
    const time = item.querySelector('.ContentItem-time')?.textContent?.trim() || '';
    return { title, time, excerpt: excerpt || undefined };
  }).filter(i => i.title || i.excerpt);
  return { name, headline, avatar, recentItems };
}"
```

根据返回的数据判断：
- recentItems 的标题和摘要是否体现持续的、有深度的内容输出（AI 优先，技术/创业/产品方向也可以）
- time 字段判断是否活跃（最近几个月有内容）
- 内容是否有原创性和独立思考（不是搬运、水帖、情绪输出）

符合标准 → 进入写入步骤（所需字段已在提取结果中）。
不符合 → `close_page` 关闭当前标签页，`select_page` 切回关注列表页，继续评估下一个候选。

如果当前页的关注列表候选全部评估完仍不够，在关注列表页滚动加载更多：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

然后重新执行 A3 的提取脚本获取新加载的条目。

---

### 策略 B：从推荐流高质量内容发现

#### B1. 打开知乎首页

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.zhihu.com
```

#### B2. 提取推荐流内容

用 JS 提取当前可见的推荐流条目：

```bash
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = document.querySelectorAll('.TopstoryItem');
  return Array.from(items).map(item => {
    const contentItem = item.querySelector('.ContentItem[data-zop]');
    let author = '', title = '', type = '';
    if (contentItem) {
      try {
        const zop = JSON.parse(contentItem.getAttribute('data-zop'));
        author = zop.authorName || '';
        title = zop.title || '';
        type = zop.type || '';
      } catch(e) {}
    }
    const excerpt = item.querySelector('.RichContent-inner')?.textContent?.trim()?.substring(0, 150) || '';
    const titleLink = item.querySelector('.ContentItem-title a');
    const url = titleLink?.getAttribute('href') || '';
    return { title, author, type, url, excerpt };
  });
}"
```

#### B3. 严格筛选内容质量

根据返回的 JSON 数据，用 title 和 excerpt 判断每条内容是否值得进一步查看。

**只有满足以下全部条件的内容才值得进一步查看作者：**
- 主题明确属于 AI/LLM/agents/机器学习
- 观点有原创性，不是常识搬运
- 分析有深度，体现专业水平（技术细节、行业判断、实践经验）
- 不是教程、广告、软文、情绪输出

大部分内容不会满足这个标准，这是正常的。宁可这次少发现几个账号，也不要降低标准。

#### B4. 评估作者

发现一篇值得关注的内容后，先用 `new_page` 打开该内容页面，提取作者链接：

```bash
mcporter call chrome-devtools.new_page url=https:<内容url>
```

```bash
mcporter call chrome-devtools.evaluate_script function="() => {
  const authorLink = document.querySelector('.AuthorInfo .UserLink-link, a[href*=\"/people/\"].UserLink-link, a[href*=\"/org/\"].UserLink-link');
  return {
    authorUrl: authorLink?.getAttribute('href') || '',
    authorName: document.querySelector('.AuthorInfo-name')?.textContent?.trim() || '',
    authorHeadline: document.querySelector('.AuthorInfo-detail')?.textContent?.trim() || ''
  };
}"
```

从 authorUrl 中提取 url_token，先对比步骤 1 的已有列表去重。如果是新账号，关闭当前内容页，再用 `new_page` 打开作者主页，按 A4 中的主页提取脚本评估。

如果只是偶尔写了一篇好的，但主页内容杂乱或不活跃，不录入。

#### B5. 滚动加载

如果当前推荐流中没有发现符合标准的 AI 内容，在首页标签页中滚动：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

然后重新执行 B2 的提取脚本获取新加载的条目，继续筛选。

---

### 3. 写入数据库

确认某个账号值得关注后，从之前的主页提取结果中获取信息并写入：

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
- 所有 JS 提取代码已验证可用，如果返回空数据，可能是页面结构变更，此时 fallback 到 `take_snapshot`
