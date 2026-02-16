# Exploration 078: Compaction Summary Budget — Proposed Fix

## Problem

The `UPDATE_SUMMARIZATION_PROMPT` in `packages/coding-agent/src/core/compaction/compaction.ts` instructs the LLM to "PRESERVE all existing information" from the previous summary. This causes summaries to grow monotonically until hitting the output token limit (`0.8 * reserveTokens` = ~13,107 tokens).

Real data from autopilot-0008 session (17 compactions):
- Compaction #1: 8,240 chars (~2,060 tokens)
- Compaction #10: 26,246 chars (~6,561 tokens)
- Compaction #17: 35,924 chars (~8,981 tokens)

At #17, the summary consumes ~55% of `reserveTokens` (16,384). After system prompt + AGENTS.md + skills + extensions, little headroom remains.

## Root Cause

Line in `UPDATE_SUMMARIZATION_PROMPT`:
```
- PRESERVE all existing information from the previous summary
```

This is correct for short sessions. But in sessions >10 compactions, the summary must compress or it consumes the context budget.

## Proposed Fix

Add a budget instruction to the update prompt:

```diff
 const UPDATE_SUMMARIZATION_PROMPT = `The messages above are NEW conversation messages to incorporate into the existing summary provided in <previous-summary> tags.
 
-Update the existing structured summary with new information. RULES:
-- PRESERVE all existing information from the previous summary
+Update the existing structured summary with new information.
+
+TARGET: Keep the summary under ${Math.floor(maxTokens * 0.7)} tokens (~${Math.floor(maxTokens * 0.7 * 4)} characters).
+
+RULES:
+- PRESERVE all information that is still relevant to continuing the work
+- COMPRESS older progress entries into higher-level summaries when the budget is tight
+  (e.g., "Built and tested 6 Manim animations" instead of listing each one)
+- REMOVE details that are no longer needed for continuation (resolved blockers, abandoned approaches)
 - ADD new progress, decisions, and context from the new messages
```

This keeps the "preserve what matters" intent but gives the LLM permission to compress older entries.

## Alternative: Structured Sections with Budgets

Instead of a flat token budget, allocate per section:
- Goal: 200 tokens (stable, rarely changes)
- Constraints: 200 tokens
- Progress/Done: 2000 tokens (this is what grows — needs compression)
- Progress/In Progress: 500 tokens
- Key Decisions: 1000 tokens (grows but should be compressed)
- Next Steps: 300 tokens
- Critical Context: 2000 tokens

Total: ~6,200 tokens — leaves 10K+ for system prompt.

## Implementation Notes

The `maxTokens` variable is already computed in `generateSummary()`. The budget could be passed into the prompt template as a dynamic value. The change is ~10 lines in `compaction.ts`.

## Risk

- Compression may lose details needed later → mitigated by vault offload (session-consolidate.ts)
- LLMs are bad at counting tokens → use character count as proxy (~4 chars/token)
- Very short sessions wouldn't need compression → only apply budget pressure when previous summary > 50% of maxTokens
