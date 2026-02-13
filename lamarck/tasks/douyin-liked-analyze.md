---
cron: "5 * * * *"
description: Download, transcribe and deeply analyze liked Douyin videos
enabled: false
model: zhipu/glm-4.7
---

# 深度分析抖音点赞作品

## 目标

对 `source='liked'` 的抖音作品进行下载、转录、深度分析。这些作品是 Ren 亲手点赞的，代表极强的个人意图——内容形式值得学习、蕴含需求信号、或包含有价值的方法论。每条都需要认真处理。

## 数据库

- 路径：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- Schema 目录：`/home/lamarck/pi-mono/lamarck/data/schemas/`（所有表的建表语句和字段注释都在这里）
- 重点关注表：`douyin_works`、`douyin_accounts`
- 其他可用数据源：`reddit_posts`、`zhihu_activities`、`zhihu_hot`、`twitter_posts`、`topics`（仅在能深化你的延伸思考时使用，不要为了"交叉验证"而硬凑）

## 输出位置

- 视频文件：`/home/lamarck/pi-mono/lamarck/data/videos/<aweme_id>.mp4`
- 转录文件：`/home/lamarck/pi-mono/lamarck/data/transcripts/<aweme_id>.txt`
- **深度分析文档**：`/home/lamarck/pi-mono/lamarck/data/analyses/<aweme_id>.md`

## 工作方式

**你是一个像人类一样操作浏览器的 agent，不要写任何脚本。** 全程通过 mcporter 的 chrome-devtools MCP server 操作浏览器，用 sqlite3 命令行操作数据库。

## 步骤

### 1. 查找待处理作品

从 `source='liked'` 的作品中，找到第一条还没有生成分析文档的：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT aweme_id, title, description FROM douyin_works WHERE source='liked';"
```

逐条检查分析文档是否已存在：

```bash
ls /home/lamarck/pi-mono/lamarck/data/analyses/<aweme_id>.md 2>/dev/null
```

找到第一条没有分析文档的，就处理它。如果全部都已有分析文档，直接结束。

### 2. 转录（如果还没转录）

检查 `transcript_path` 是否已有值，或者转录文件是否已存在：

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT transcript_path FROM douyin_works WHERE aweme_id='<aweme_id>';"
ls /home/lamarck/pi-mono/lamarck/data/transcripts/<aweme_id>.txt 2>/dev/null
```

**如果已有转录**，跳过整个下载-转录流程，直接进入步骤 3。

**如果没有转录**，执行以下流程（与 douyin-video-transcribe 任务做法一致）：

#### 2a. 下载视频

打开视频页面：

```bash
mcporter call chrome-devtools.new_page url=https://www.douyin.com/video/<aweme_id>
```

等待 3~5 秒让播放器加载，然后提取视频源 URL：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const v = document.querySelector('video'); return v?.currentSrc || v?.src || v?.querySelector('source')?.src || null; }"
```

如果返回 null，等几秒重试。拿到 URL 后下载：

```bash
mkdir -p /home/lamarck/pi-mono/lamarck/data/videos
curl -s -o "/home/lamarck/pi-mono/lamarck/data/videos/<aweme_id>.mp4" "<video_url>" \
  -H "Referer: https://www.douyin.com/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

#### 2b. 顺便补充作品详情

如果作品的 `description` 为空或很短，在详情页顺便提取完整描述和互动数据：

```bash
mcporter call chrome-devtools.evaluate_script function="() => { const data = {}; const authorLinks = document.querySelectorAll('a[href*=\"/user/MS4w\"]'); for (const a of authorLinks) { const text = a.textContent.trim(); if (text && !text.includes('作者') && a.querySelector('div')) { const m = a.getAttribute('href').match(/user\/(MS4w[^?/]+)/); data.sec_uid = m ? m[1] : ''; data.nickname = text; break; } } const bodyText = document.body.innerText; const timeMatch = bodyText.match(/发布时间：\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/); data.publishTime = timeMatch ? timeMatch[1] : ''; data.title = document.title.replace(/ - 抖音$/, '').trim().substring(0, 200); const fansMatch = bodyText.match(/粉丝\s*([\d.]+万?)/); data.fans = fansMatch ? fansMatch[1] : ''; return JSON.stringify(data); }"
```

如果拿到了新信息，更新数据库中的对应字段。

#### 2c. 关闭详情页

```bash
mcporter call chrome-devtools.list_pages
mcporter call chrome-devtools.close_page pageId=<详情页ID>
```

#### 2d. 提取音频 + 转录

```bash
ffmpeg -i /home/lamarck/pi-mono/lamarck/data/videos/<aweme_id>.mp4 \
  -vn -acodec libmp3lame -q:a 2 \
  /home/lamarck/pi-mono/lamarck/data/videos/<aweme_id>.mp3 \
  -y -loglevel error

cd /home/lamarck/pi-mono/lamarck/tools && npx tsx transcribe-audio.ts \
  /home/lamarck/pi-mono/lamarck/data/videos/<aweme_id>.mp3 \
  -m small -l zh -t \
  -o /home/lamarck/pi-mono/lamarck/data/transcripts/<aweme_id>.txt
```

#### 2e. 生成 summary 并更新数据库

读取转录文本，结合 title 和 description，写一段摘要（3~5 句话）：视频的核心主题、关键信息点、作者的主要观点或结论。

**注意**：whisper 对专有名词识别经常出错，以 title 和 description 中的拼写为准校正。

```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "UPDATE douyin_works SET video_path='/home/lamarck/pi-mono/lamarck/data/videos/<aweme_id>.mp4', transcript_path='/home/lamarck/pi-mono/lamarck/data/transcripts/<aweme_id>.txt', summary='<摘要内容>', updated_at=datetime('now') WHERE aweme_id='<aweme_id>';"
```

#### 2f. 清理音频

```bash
rm -f /home/lamarck/pi-mono/lamarck/data/videos/<aweme_id>.mp3
```

### 3. 深度分析 → 输出文档

这是本任务的核心。summary 只是视频本身讲了什么，而深度分析是以视频为立足点，向外延伸——既挖掘数据库中已有的所有相关素材，也主动通过搜索和浏览器去查阅外部资料，最终形成一份有深度的分析。

#### 3a. 读取素材

读取转录全文。先形成你自己对视频内容的理解和初步想法，再决定是否需要查阅其他数据源。Schema 都在 `/home/lamarck/pi-mono/lamarck/data/schemas/` 目录下。

#### 3b. 外部调研

基于视频内容，判断是否需要进一步查阅外部资料。如果视频涉及具体的工具、产品、人物、方法论，主动去搜索和浏览：

- **搜索**：用 web_search 搜索视频中提到的关键概念、工具、人物
- **浏览器**：用 mcporter 打开相关网页深入了解（产品官网、GitHub 仓库、技术博客等）

不是每条视频都需要外部调研，但如果视频提到了你不熟悉的概念或工具，必须去查。

#### 3c. 分析维度

以视频内容为立足点，从以下维度分析（按相关性取舍，不必每条都写满所有维度）：

**A. 内容形式分析**（对 Ren 做抖音账号的借鉴）
- 叙事结构：开头 hook 手法、节奏编排、结尾引导
- 信息密度：深度长内容还是快节奏短内容？
- 表达风格：口播/图文/实操演示？语气和人设是什么？

**B. 需求信号提取**
- 视频中提到了哪些用户痛点、未被满足的需求？
- 需求的商业化空间：是否可以做成工具/服务/内容产品？

**C. 方法论与工具链**
- 提到了哪些具体工具、框架、工作流？
- 有没有可以直接复用的操作步骤？
- 和 Ren 当前关注的方向（AI Agent、AI 编程、多模态）有什么关联？

**D. 延伸思考**（最重要的维度）

这是本任务的核心价值所在。不是机械地整合信息，而是你作为一个有思考能力的 agent，看完这个视频后产生的独立见解。

**怎样才算"延伸思考"：**
- 视频的观点有没有漏洞、盲区、或未考虑到的情况？
- 视频的逻辑链条能否继续往下推？推到极致会是什么？
- 有没有让你联想到的其他领域、其他问题、其他可能性？
- 如果你是 Ren，看完这个视频你会想做什么实验或尝试？

**怎样才不算"延伸思考"：**
- ❌ "视频说 A，数据库里也有 A，验证了 A 是趋势" — 这是搜索结果拼接
- ❌ "视频提到了 X 工具，X 工具的官网说..." — 这是信息搬运
- ❌ 罗列一堆"相关"的信息点但没有自己的判断

**数据源的正确用法：**
先有你自己的思考，然后用数据源去深化这个思考（找到支撑、反例、或新的角度），而不是用数据源去"证明视频说的对"。如果数据源里没有能深化你思考的素材，就不要硬凑，直接写你自己的想法。

#### 3d. 写入分析文档

将分析结果写成 markdown 文档：

```bash
mkdir -p /home/lamarck/pi-mono/lamarck/data/analyses
```

文件路径：`/home/lamarck/pi-mono/lamarck/data/analyses/<aweme_id>.md`

文档格式：

```markdown
# <视频标题>

- 作者：<作者昵称>
- 链接：https://www.douyin.com/video/<aweme_id>
- 点赞：<digg_count> | 评论：<comment_count> | 收藏：<collect_count>

## 内容摘要

<即 summary 的内容，视频本身讲了什么>

## 内容形式分析

<叙事结构、信息密度、表达风格等，对 Ren 做账号的借鉴>

## 需求信号

<视频中蕴含的痛点、需求、商业化空间>

## 方法论与工具

<提到的具体工具、框架、可复用的操作>

## 延伸思考

<你看完视频后的独立见解：观点的漏洞/盲区、逻辑的进一步推演、联想到的其他领域、想做的实验或尝试>

## 关键启发

<对 Ren 最直接的 2~3 条 actionable takeaways>
```

**章节取舍原则：**
- 内容形式分析、需求信号、方法论与工具 — 按视频实际内容取舍，不必每条都写满
- **延伸思考** — 必须有，这是本任务的核心价值
- **关键启发** — 必须有，这是 Ren 看这份文档最关心的部分

## 完成条件

- 处理完 1 条作品，或
- 无待处理作品

## 注意

- **不要写脚本**，所有操作通过 mcporter 和 sqlite3 命令完成
- **优先使用 evaluate_script**，只有在 JS 提取失败时才回退到 take_snapshot
- 转录用 small 模型 + zh 语言提示，平衡速度和质量
- 如果视频下载失败（URL 为空、curl 报错），跳过该条，继续处理下一条
- 如果抖音要求登录或出现验证码，终止任务并报告
