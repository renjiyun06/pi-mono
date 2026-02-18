---
tags:
  - note
  - pi
  - memory
description: "Design analysis for pinned context — preserving critical messages across compaction cycles"
---

# Pinned Context Design Analysis

## Problem

After compaction, operational details are lost. The summary captures goals and progress but loses exact reasoning chains, debugging insights, and critical constraints that were hard-won during the session.

Pain point #1 from [[pi-pain-points-from-extended-autopilot]].

## Current Architecture

### Compaction Flow
1. `shouldCompact()` checks if context exceeds `contextWindow - reserveTokens`
2. `findCutPoint()` walks backwards from newest, keeping ~`keepRecentTokens` (default 20K)
3. Everything before the cut point → sent to LLM for summarization
4. Summary replaces old messages; recent messages kept verbatim

### Extension Hooks
- `session_before_compact` — can cancel or provide custom `CompactionResult`
- `session_compact` — fires after compaction (read-only)
- `context` — fires before each LLM call, can modify messages

### Key Insight
The `session_before_compact` hook already allows full control. An extension can intercept compaction and produce a custom summary that includes pinned content verbatim. But this requires the extension to do its own summarization.

## Design Options

### Option A: Label-based Pinning (Extension-only, no core changes)

An extension tracks "pinned" labels in session entries. On `session_before_compact`:
1. Extract pinned messages from `preparation.messagesToSummarize`
2. Call the normal summarization for non-pinned messages
3. Append pinned content verbatim to the summary
4. Return custom `CompactionResult`

**Pros**: No core changes needed. Works with current extension API.
**Cons**: Extension must re-implement summarization logic (or call the exported functions). Pinned content consumes summary budget.

### Option B: Custom Instructions (Already Exists)

The `customInstructions` parameter in `generateSummary()` is passed through to the summarization prompt. An extension could set `customInstructions` to something like:

> "The following information MUST be preserved verbatim in the summary: [pinned content]"

But this only works if the model follows the instruction — no guarantee.

### Option C: Core `pinnedMessages` Field (Core change)

Add a `pinnedMessages` or `preserveMessages` field to `CompactionPreparation`. During `findCutPoint()`, pinned messages are excluded from summarization and instead injected verbatim after the summary.

**Pros**: Clean integration. Guaranteed preservation.
**Cons**: Requires packages/ modification. Increases post-compaction context size.

### Option D: File-based Persistence (Current workaround)

Write critical context to files (vault notes, briefing.md). The memory-loader extension re-reads them after compaction.

**Pros**: Already works. Zero code changes.
**Cons**: Requires manual/deliberate file writing. Doesn't preserve conversation-specific context (debugging chains, reasoning steps).

## Recommendation

**Option D is what we already do** and it works for most cases. The briefing system is essentially manual pinning.

**Option A is the most interesting extension** — it could automate pinning without core changes. The workflow:
1. Agent calls a `pin_context` tool with a message
2. Extension stores the pinned text (in a file or memory)
3. On compaction, extension intercepts `session_before_compact`
4. Extension appends pinned text to the LLM-generated summary
5. Pinned content survives as part of the compaction summary

The tricky part: pinned content accumulates across compactions. Need a budget — e.g., max 2000 tokens of pinned content. Oldest pins get dropped when budget exceeded.

## Token Budget Analysis

Default settings:
- `reserveTokens`: 16,384 (for summary + system prompt)
- `keepRecentTokens`: 20,000 (recent messages kept verbatim)

If we reserve 2,000 tokens for pinned content out of `reserveTokens`, that's ~8,000 characters — enough for 10-20 critical facts/constraints. The summary gets 14,384 tokens, still generous.

## Status

Analysis complete. Implementation would be a new extension (`context-pinner.ts`). No core changes needed — Option A is viable with current extension API. Blocked on: real need during actual work (per soul.md: problem-driven only).
