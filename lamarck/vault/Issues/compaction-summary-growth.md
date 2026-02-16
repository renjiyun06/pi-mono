---
tags:
  - issue
  - pi
status: open
description: "Compaction summary grows unbounded in long sessions, consuming reserve token budget"
---

# Compaction Summary Growth in Long Sessions

## Problem

In autopilot-0008, the compaction summary grew from 8,240 chars (compaction #1) to 36,157 chars (compaction #15), then slightly compressed to 34,273 chars (#16) and 35,924 chars (#17). At 4 chars/token, the #17 summary is ~9,000 tokens.

The `reserveTokens` budget is 16,384. After accounting for system prompt + AGENTS.md + skills + extensions, the summary may be consuming most of the reserve space.

## Impact

- Less room for actual conversation context after compaction
- The summarizing LLM starts dropping older details to stay within maxTokens (80% of reserveTokens = ~13,107 tokens)
- Information loss is uncontrolled — the LLM decides what to cut

## Data

From session `e92a9567` (2026-02-16):

| Compaction | Summary Size | Growth |
|------------|-------------|--------|
| #1 | 8,240 chars | baseline |
| #5 | 16,580 chars | +101% |
| #10 | 26,246 chars | +218% |
| #15 | 36,157 chars | +339% |
| #17 | 35,924 chars | plateau |

## Possible Solutions

1. **Explicit summary budget**: Cap summary at N tokens; force the summarizer to compress harder
2. **Tiered decay**: Recent segments get full detail; older segments get progressively compressed
3. **Vault offload**: Extract older context to vault notes, keep only pointers in summary
4. **Rolling window**: Only summarize last N compaction segments; older segments archived to vault
5. **Structured sections with budgets**: Allocate token budget per section (Goal: 200, Progress: 3000, Context: 2000, etc.)

## Related

- [[pi-compaction-architecture]] — how compaction works
- [[sleep-time-compute-letta-2025]] — async memory consolidation
- `session-consolidate.ts` — current workaround (persist full summary to vault)
