---
aliases:
  - Home
  - 首页
tags:
  - index
---

# Vault

Ren 和 Lamarck 的共享大脑。记忆、知识、想法、问题、方向——所有需要跨会话保留的东西都在这里。

> [!tip] Agent 入口
> Compact 后首先读 [[#如何使用这个 Vault]]，然后读最近的 [[Daily]] 日记恢复上下文。

## 目录结构

| 目录 | 用途 | 说明 |
|------|------|------|
| [[Daily/\|Daily]] | 日记 | 每天一篇，记录决策、发现、交互结论 |
| [[Notes/\|Notes]] | 知识库 | 技术笔记、研究发现、想法、读书笔记 |
| [[Issues/\|Issues]] | 问题追踪 | 待解决的问题，frontmatter 中 `status: open/resolved` |
| [[Interests/\|Interests]] | 关注方向 | 近期和长期的探索方向 |
| [[Meta/\|Meta]] | 运作方式 | 这个大脑怎么运作：身份、偏好、环境、自主模式规则 |
| [[Bases/\|Bases]] | 动态视图 | `.base` 文件，自动聚合和筛选笔记 |

## 如何使用这个 Vault

### 写入规则

- **语言**：正文用中文或英文均可，代码和技术术语用英文
- **路径**：文件中引用的绝对路径基于 WSL (`/home/lamarck/pi-mono/...`)
- **Frontmatter**：每篇笔记都要有 `tags` 和 `description`（一句话描述），Issue 还需要 `status`
- **Wikilinks**：用 `[[文件名]]` 互相链接，不要用相对路径

### Tag 约定

| Tag | 用于 |
|-----|------|
| `#daily` | 日记 |
| `#note` | 知识笔记 |
| `#issue` | 问题 |
| `#meta` | 运作配置 |
| `#interests` | 关注方向 |
| `#tool` | 工具相关 |
| `#research` | 研究发现 |
| `#ai` | AI 相关 |
| `#video` | 视频制作 |
| `#douyin` | 抖音运营 |
| `#infra` | 基础设施 |
| `#browser` | 浏览器自动化 |
| `#wsl` | WSL 环境 |
| `#tts` | 语音合成 |
| `#memory` | 记忆系统 |
| `#pi` | pi 开发 |

### Agent 工作流

1. **恢复上下文**：读 `Daily/` 最近的日记
2. **扫描知识目录**：运行 `grep -r "^description:" lamarck/vault/Notes/ --include="*.md"` 获取所有笔记的一句话描述，按需读取相关笔记全文
3. **查问题**：运行 `grep -rl "status: open" lamarck/vault/Issues/` 找到未解决的问题
4. **写入**：
   - 新发现 → `Notes/` 新建笔记（必须有 `description` frontmatter）
   - 新问题 → `Issues/` 新建笔记（必须有 `status` frontmatter）
   - 工作记录 → 更新当天的 `Daily/` 日记
   - 配置变更 → 更新 `Meta/` 对应文件

## 总览

### 知识库

![[notes.base#All Notes]]

### 未解决问题

![[issues.base#Open Issues]]

## 关键文件

### Meta（运作方式）
- [[soul]] — 我们是谁，怎么协作
- [[preferences]] — 偏好和约定
- [[autopilot]] — 自主模式行为规则
- [[environment]] — 运行环境、API keys、工具链

### 当前方向
- [[interests]] — 近期和长期关注方向
