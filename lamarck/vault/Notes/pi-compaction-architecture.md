---
tags:
  - note
  - pi
  - memory
description: "Pi's compaction system: how context summaries are generated and preserved across segments"
---

# Pi Compaction Architecture

Source: `packages/coding-agent/src/core/compaction/compaction.ts` (809 lines)

## How It Works

1. **Trigger**: When `contextTokens > contextWindow - reserveTokens` (default reserve: 16384)
2. **Cut point**: Walk backwards from newest messages, accumulate estimated token sizes, cut when `keepRecentTokens` (default: 20000) are accumulated. Cut at valid boundaries (user/assistant messages, never mid-tool-result)
3. **Split turns**: If cut happens mid-turn, the turn's user message is included in "turn prefix" for context

## Summarization

Two modes:
- **Initial**: First compaction uses `SUMMARIZATION_PROMPT` — structured checkpoint (Goal/Constraints/Progress/Decisions/NextSteps/Context)
- **Update**: Subsequent compactions use `UPDATE_SUMMARIZATION_PROMPT` — preserves existing summary, adds new info, moves "In Progress" to "Done"

Uses `reasoning: "high"` for quality. Max tokens = 80% of reserveTokens.

## File Tracking

Tracks file operations (read/written/edited) across compactions via `CompactionDetails`. Each compaction inherits previous compaction's file lists and adds new ones from recent messages.

## Extension Hook

`session_before_compact` event lets extensions:
- Provide custom `CompactionResult` (override summary)
- Return `cancel: true` to abort compaction

## Key Constants

- `reserveTokens`: 16384 (space for system prompt + summary)
- `keepRecentTokens`: 20000 (messages kept after compaction)
- Token estimation: chars/4 heuristic (conservative overestimate)
- Images estimated at 1200 tokens each

## Observation

After 14 compactions in one day, the summary grows to capture all segments' work. Each update PRESERVES everything — information only grows, never shrinks. This means early decisions and context persist, but the summary itself consumes an increasing fraction of the reserve space.

Potential improvement: a "decay" mechanism that deprioritizes old segments when the summary exceeds a size threshold. Current system doesn't do this — it relies on the summarizing LLM to naturally compress less-relevant information.
