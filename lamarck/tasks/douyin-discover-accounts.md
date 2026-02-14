---
cron: "15 * * * *"
description: Discover high-quality Douyin AI content creators via search
enabled: true
model: zai/glm-4.7
---

# 抖音发现 AI 方向优质博主

## 目标

通过抖音搜索功能，搜索 AI 相关关键词，从高赞高评论的视频内容反推博主，评估博主主页作品整体质量，将优质博主入库。

## 搜索方向选择

1. 读取 `/home/lamarck/pi-mono/lamarck/memory/interests.md`，列出所有关注方向条目
2. 为每个条目赋一个权重（整数），近期关注的权重更高（如 5~10），长期关注的权重较低（如 1~3），根据自己对时效性和重要性的判断决定
3. 用以下命令做加权随机抽取（将 items 和 weights 替换为实际值）：

```bash
python3 -c "
import random
items = ['条目1', '条目2', '条目3']
weights = [10, 5, 2]
print(random.choices(items, weights=weights, k=1)[0])
"
```

4. 根据抽中的关注方向，自行拆解出 1~2 个适合在抖音搜索的具体关键词

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 账号表：`douyin_accounts`，Schema：`/home/lamarck/pi-mono/lamarck/data/schemas/douyin_accounts.sql`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

## 步骤

### 1. 搜索关键词

打开抖音搜索页：

```bash
mcporter call chrome-devtools.navigate_page type=url url=https://www.douyin.com/search/<关键词>
```

### 2. 筛选搜索结果

```bash
mcporter call chrome-devtools.take_snapshot
```

浏览搜索结果，关注视频类结果。从中筛选候选视频：

**入选条件：**
- 点赞数较高（至少数千以上）
- 评论数较高
- 标题/描述与 AI 方向相关，有一定深度（不是纯娱乐、纯蹭热点）

**排除：**
- 纯新闻搬运（如电视台剪辑片段）
- 广告/推广/卖课
- 标题党、蹭热点但无实质内容
- 点赞和评论都很低的内容

从搜索结果中选出 2~3 个看起来值得深入了解的视频。

### 3. 获取博主 sec_uid

搜索结果页的作者名是纯文本，没有主页链接。需要通过视频页获取：

1. 从搜索结果卡片的父元素 ID 提取视频 ID（格式 `waterfall_item_<video_id>`），用以下命令批量提取：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const items = document.querySelectorAll('[id^=\"waterfall_item_\"]'); return Array.from(items).map(i => i.id.replace('waterfall_item_', '')); }"
```

2. 用新标签页打开候选视频的详情页：

```bash
mcporter call chrome-devtools.new_page url=https://www.douyin.com/video/<video_id>
```

3. 从视频页提取作者主页 URL（第一个非 `/user/self` 的用户链接）：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const links = document.querySelectorAll('a[href*=\"/user/\"]'); for (const a of links) { if (!a.href.includes('/user/self')) return a.href; } return null; }"
```

4. 从返回的 URL 中提取 sec_uid（`/user/` 后面、`?` 前面的部分）

5. 关闭视频详情页，切回搜索结果页：

```bash
mcporter call chrome-devtools.close_page pageId=<视频页的pageId>
mcporter call chrome-devtools.select_page pageId=<搜索结果页的pageId>
```

### 4. 检查是否已入库

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT 1 FROM douyin_accounts WHERE sec_uid='<sec_uid>';"
```

如果已存在则跳过，看下一个候选。

### 5. 进入博主主页评估

用新标签页打开博主主页（不要离开搜索结果页）：

```bash
mcporter call chrome-devtools.new_page url=https://www.douyin.com/user/<sec_uid>
```

在主页中 take_snapshot，评估博主整体质量：

**评估要点：**
- 作品列表中的视频标题是否整体都与 AI/技术相关
- 是否有持续输出（不是偶尔发一条 AI 内容）
- 作品的点赞/评论是否整体较高，而不是只有一两条爆款
- 简介和认证信息是否表明该博主是 AI 领域的持续创作者

**通过标准：**
- 最近的作品列表中，至少一半以上与 AI/技术相关
- 整体作品互动数据不错（不要求每条都爆款，但整体水平不能太低）

**不通过则跳过：**
- 只是偶尔发了一条 AI 相关的爆款，其他内容与 AI 无关
- 整体作品质量参差不齐，大部分是低质量内容

### 6. 入库

如果博主通过评估，从主页提取信息并写入数据库：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT INTO douyin_accounts (sec_uid, douyin_id, nickname, avatar_url, verification_type, verification_desc, signature, gender, ip_location, following_count, follower_count, like_count, video_count) VALUES ('...', '...', '...', '...', '...', '...', '...', '...', '...', ..., ..., ..., ...);"
```

注意：
- `sec_uid` 从 URL 中提取
- 文本字段中的单引号需转义为两个单引号
- 粉丝数等数字需单位换算：万 = ×10000，亿 = ×100000000

### 7. 关闭博主主页，继续下一个

```bash
mcporter call chrome-devtools.close_page pageId=<博主主页的pageId>
mcporter call chrome-devtools.select_page pageId=<搜索结果页的pageId>
```

切回搜索结果页后不要再次截图（页面未变化），继续处理下一个候选博主。

如果当前搜索结果页的候选都处理完了，可以向下滚动加载更多结果：

```bash
mcporter call chrome-devtools.evaluate_script function="() => window.scrollBy(0, 1500)"
```

滚动后再 take_snapshot。

### 8. 完成条件

- 成功入库 3~5 个新博主即可结束
- 如果筛选了 10 个以上候选都不符合标准，也可以结束
- 每次运行处理 1~3 个关键词

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- 每个博主都要有明确的评估理由（为什么入库/为什么跳过）
- 宁缺毋滥，不确定的博主宁可跳过
- 如果抖音页面需要登录，终止任务并报告
