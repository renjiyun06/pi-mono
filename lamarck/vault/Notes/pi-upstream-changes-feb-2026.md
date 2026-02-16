---
tags:
  - note
  - pi
description: "Notable upstream pi changes (origin/main) since our branch diverged — Feb 7-14, 2026"
---

# Pi Upstream Changes (Feb 7-14, 2026)

Our `autopilot-0008` branch diverged from main at `f9161c4d` (Feb 7). Since then, main has received v0.52.8 through v0.52.12. Key changes relevant to our work:

## Extension System Improvements

### New Events (#1375)
6 new extension events: `message_start`, `message_update`, `message_end`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`. Our Understand extension could use `message_end` to detect when the agent finishes writing code and proactively suggest a quiz.

### Terminal Input Hook
Extensions can now hook into terminal input. Could enable interactive quiz prompts directly in pi's TUI.

### ctx.reload (#1371)
Extensions can now reload themselves. Useful for development — change extension code and reload without restarting pi.

### pasteToEditor (#1351)
Extensions can paste text into the editor input. Could be used to inject quiz questions as follow-up prompts.

## Compaction Fix (7eb969dd)
`_checkCompaction()` was using `.find()` (first compaction) instead of `getLatestCompactionEntry()` (latest). This caused incorrect overflow detection with multiple compactions. **Our compaction budget fix is orthogonal** — it addresses summary growth, not boundary detection. Both fixes are needed.

Also: `ContextUsage.tokens` and `ContextUsage.percent` are now `number | null` (breaking change). Our extensions don't reference these directly, so no impact.

## New Models
- gpt-5.3-codex-spark
- MiniMax M2.5 across providers
- Claude Opus 4.6 (was 4.5)
- OpenRouter "auto" model alias

## Other Notable
- Kill ring and undo in Input component
- VT input mode on Windows
- Configurable transport + Codex WebSocket session caching

## Rebase Assessment

Our branch is 862 commits ahead. Most changes are in `lamarck/` (projects, vault, tools) which don't overlap with upstream pi code. The one file that overlaps is `compaction.ts`. Rebase should be clean except for that file (our budget fix vs their boundary fix — both needed, non-conflicting).

Recommendation: rebase after Ren reviews the branch. Low conflict risk.
