# Exploration 088: Dog-Fooding Understand on Pi's Compaction System

## Context
Understand is our anti-cognitive-debt tool. Pi is the coding agent we run on. Our compaction fix (adding size budget guidance) lives in `packages/coding-agent/src/core/compaction/compaction.ts`. We modified this file but never formally tested our comprehension of its full scope — only the narrow area we changed.

## Dry-Run Results

`understand compaction.ts --dry-run` generated 3 questions:

### Q1: fromHook session file compatibility
> What happens when extractFileOperations encounters a CompactionEntry with fromHook=true vs false?

**Answer**: When `fromHook=true`, the function skips extracting file operations from `prevCompaction.details` because extension-generated compactions may store different detail formats. The `fromHook` field is kept in the entry struct for backward compatibility with existing session files that already have it persisted. Without it, loading old sessions would fail or produce incorrect file tracking.

**Insight**: This reveals a design tension — the compaction system must support both pi-native and extension-generated compactions, and they have different `details` shapes. Our size budget fix only applies to `generateSummary()` which runs after file ops extraction, so it's correctly orthogonal.

### Q2: estimateContextTokens with aborted messages
> If the last assistant message has stopReason='aborted', what will usageTokens and lastUsageIndex be?

**Answer**: `getAssistantUsage()` filters out aborted messages (they have no reliable usage data since they were interrupted). If the only assistant message is aborted, `getLastAssistantUsageInfo()` returns `undefined`, meaning `usageTokens = undefined` and `lastUsageIndex = -1`. This means the estimate falls back to character-based counting rather than actual token usage — less accurate but safe.

**Insight**: Our compaction fix uses `maxTokens` parameter (from model's context window), not the estimated tokens. So even if usage estimation fails after aborted messages, the budget calculation still works correctly.

### Q3: calculateContextTokens fallback computation
> Why does it fall back to input + output + cacheRead + cacheWrite when totalTokens is missing?

**Answer**: Not all providers return `totalTokens` in their usage response. The native field is the most accurate but optional. The fallback sums the components to approximate total context consumption. This works because `input` tokens include the conversation history, and adding `output` + cache tokens gives the full picture of what the model "saw."

**Insight**: This fallback matters for our budget fix because `prevTokensEstimate` uses `previousSummary.length / 4` (char-based estimation), not the actual token count. If we wanted higher precision, we could use `calculateContextTokens` on the summary content. But char/4 is a reasonable heuristic for the budget threshold check.

## Meta-Observation

This exercise reveals a real gap in our understanding of pi's compaction internals:
- We knew enough to make our fix (the `generateSummary` function)
- We didn't know the full context (file ops tracking, aborted message handling, token estimation fallbacks)
- The questions exposed exactly the boundary between "area we modified" and "area we should understand"

This is **exactly** the cognitive debt pattern Understand is designed to prevent. We wrote a patch to code we only partially understood. The tool works as intended.

## Content Angle

"I used my own tool on the code my AI runs on. Here's what I didn't know." — strongest possible first-person demonstration for escalation video.
