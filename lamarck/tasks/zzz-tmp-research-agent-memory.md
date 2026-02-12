---
description: 搜索 AI Agent 记忆/状态管理相关的开源项目
enabled: true
model: openrouter/deepseek/deepseek-v3.2
---

# 任务：搜索 AI Agent 记忆/状态管理开源项目

## 背景

我们在研究如何让 AI Agent 实现真正的自主性。核心问题是：当 Agent 通过多轮会话（类似 Ralph Loop）持续工作时，如何在会话之间保留和管理状态/记忆。

我们需要了解目前有哪些开源项目在解决这个问题，它们的设计思路是什么。

## 搜索方向

1. **Agent Memory 系统**：专门为 AI Agent 设计的记忆/状态管理系统
2. **Long-term Memory for LLM**：LLM 长期记忆解决方案
3. **Agent State Management**：Agent 状态管理框架
4. **Persistent Context**：持久化上下文方案

## 搜索要求

- 在 GitHub 上搜索相关项目
- 用 web_search 搜索最新的技术文章和讨论
- 关注 2024-2026 年的新项目
- 技术栈不要太复杂，优先 Python 或 TypeScript
- 重点关注：
  - 项目的核心设计思路
  - 如何表示状态/记忆
  - 如何在多轮会话间传递
  - 是否有实际应用案例

## 输出要求

输出目录：`/home/lamarck/pi-mono/lamarck/tmp/zzz-tmp-research-agent-memory/`

创建以下文件：

1. `report.md` — 主报告，包含：
   - 找到的项目列表（名称、GitHub 链接、Stars、简介）
   - 每个项目的核心设计思路（2-3 段话）
   - 项目之间的对比
   - 推荐哪些值得深入研究

2. `references.md` — 参考资料，包含：
   - 搜索过程中发现的有价值的文章链接
   - 相关的讨论帖（Reddit、HN、Twitter 等）

完成后在 report.md 开头写明"任务完成"。
