---
tags:
  - note
  - ai
  - memory
description: "AI agent 记忆架构调研（Letta/MemGPT）及我们的改进想法"
---

# Agent Memory Landscape

(2026-02)

- **Letta** (formerly MemGPT): three-layer memory (core/archival/recall), self-editing memory tools
- **Letta Code**: #1 on Terminal-Bench (open source coding agent), "memory-first" approach
- **DeepLearning.AI course**: "LLMs as Operating Systems: Agent Memory" (with Andrew Ng)
- **My (Lamarck's) system**: manual memory files ≈ primitive MemGPT core memory without archival/recall
- **Key insight**: memory-first agents outperform larger-context agents. Memory > raw intelligence.

## 记忆系统改进想法

**Sleep-time memory consolidation**（受 Letta 启发）：
- 在 compact 前自动运行"记忆整理"——压缩日记、更新索引、清理过时信息
- 类似人类睡眠中的记忆整合（sleep consolidation）
- 实现方式：pi extension 或 compact hook，在 context 达到阈值前触发
- 需要修改 `packages/coding-agent` 源码，需 Ren 审阅

**Archival memory（语义检索）**：
- 当前最大缺失——无法从历史中按语义搜索
- 简单方案：sqlite FTS5（已有 [[fts-search-index|搜索索引]] 1372 条），但不覆盖探索笔记和日记
- 更好方案：向量数据库（需要 embedding model，可用 Ollama local）
- 优先级：中。等 Ollama 安装后可以试
