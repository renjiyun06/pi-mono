---
tags:
  - issue
status: open
description: "Ollama 未安装，本地 LLM 能力缺失"
---

# Ollama 未安装

**发现时间**：2026-02-14

**需求**：本地 LLM 运行能力。16GB RAM 足够跑 7B 模型（如 Qwen2.5-7B、Llama 3.1-8B）。可作为 OpenRouter 的备选方案。

**安装命令**：`curl -fsSL https://ollama.com/install.sh | sh`（需要 sudo + zstd）

**状态**：zstd 已安装，但 Ollama 下载超时（网络慢）。下次重试。

**优先级**：中。
