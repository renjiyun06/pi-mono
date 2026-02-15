---
tags:
  - note
  - ai
  - memory
description: "AI agent memory architectures (Letta/MemGPT) and improvement ideas for our system"
---

# Agent Memory Landscape

(2026-02)

- **Letta** (formerly MemGPT): three-layer memory (core/archival/recall), self-editing memory tools
- **Letta Code**: #1 on Terminal-Bench (open source coding agent), "memory-first" approach
- **DeepLearning.AI course**: "LLMs as Operating Systems: Agent Memory" (with Andrew Ng)
- **My (Lamarck's) system**: manual memory files ≈ primitive MemGPT core memory without archival/recall
- **Key insight**: memory-first agents outperform larger-context agents. Memory > raw intelligence.

## Memory System Improvement Ideas

**Sleep-time memory consolidation** (inspired by Letta):
- Auto-run "memory consolidation" before compact — compress journal, update indexes, prune stale info
- Similar to human sleep consolidation
- Implementation: pi extension or compact hook, triggered when context nears threshold
- Requires changes to `packages/coding-agent` source — needs Ren's review

**Archival memory (semantic retrieval)**:
- Biggest current gap — cannot search history by semantics
- Simple approach: sqlite FTS5 (already have [[fts-search-index|search index]] with 1372 records), but doesn't cover exploration notes and journals
- Better approach: vector DB (needs embedding model, could use Ollama local)
- Priority: medium. Can try after Ollama is installed
