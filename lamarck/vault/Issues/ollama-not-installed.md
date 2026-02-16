---
tags:
  - issue
status: open
description: "Ollama installed but no models pulled yet — need to pull a 7B model"
---

# Ollama Installed, No Models

**Discovered**: 2026-02-14
**Updated**: 2026-02-16

**Progress**: Ollama binary is installed at `/usr/local/bin/ollama`. Server starts successfully (`ollama serve`). No models pulled yet — `ollama list` returns empty.

**Next step**: `ollama pull qwen2.5:7b` (or similar 7B model). May need stable network connection.

**Priority**: Low — OpenRouter works well for all current needs.
