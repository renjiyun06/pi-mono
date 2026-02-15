---
tags:
  - issue
status: open
description: "Ollama not installed, no local LLM capability"
---

# Ollama Not Installed

**Discovered**: 2026-02-14

**Need**: Local LLM capability. 16GB RAM is enough for 7B models (e.g., Qwen2.5-7B, Llama 3.1-8B). Can serve as fallback for OpenRouter.

**Install command**: `curl -fsSL https://ollama.com/install.sh | sh` (requires sudo + zstd)

**Status**: zstd installed, but Ollama download timed out (slow network). Retry later.

**Priority**: Medium.
