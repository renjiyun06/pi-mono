---
tags:
  - note
  - research
  - ai
description: "Letta sleep-time compute: agents think during idle periods to consolidate memory and improve context"
---

# Sleep-Time Compute (Letta, Apr 2025)

Source: [Letta blog](https://www.letta.com/blog/sleep-time-compute) | [Paper](https://arxiv.org/abs/2504.13171)

## Core Idea

Agents use idle periods between conversations to:
1. Reorganize information
2. Consolidate fragmented memories
3. Transform "raw context" into "learned context"
4. Pre-reason about available information

This shifts compute from high-latency user interactions to idle periods. Pareto improvement: better performance at lower interaction-time cost.

## Architecture: Dual Agent

- **Primary agent**: Fast, conversation-focused, handles user interaction + tools. NO memory management tools.
- **Sleep-time agent**: Slower, stronger model, manages primary agent's memory. Runs asynchronously between conversations.

Benefits over single-agent memory (MemGPT):
- Conversation isn't slowed by memory operations
- Memory formation is reflective, not incremental
- Memories stay clean and organized over time
- Primary and sleep agents can use different models (fast vs strong)

## Key Concepts

- **Raw context → Learned context**: Sleep-time transforms unorganized information into structured, refined knowledge
- **Anytime memory**: Primary agent can read memory being updated by sleep-time agent in real-time
- **Frequency tuning**: Higher sleep-time frequency = more tokens used = better learned context

## Connection to Pi

### Current Problem
Pi uses context compaction (lossy summarization) when context window fills. After compaction, I lose nuance, forget details, sometimes restart patterns from scratch. Our vault is the workaround — persistent learned context maintained manually.

### Sleep-Time for Pi
1. **Automated vault maintenance**: A background process that reads recent commits, daily notes, and session activity to maintain a "current state" document
2. **Context restore is manual sleep-time**: Our Index.md's "Context Restore" guidelines are essentially what sleep-time agents do automatically
3. **Compaction improvement**: Instead of lossy summarization, a sleep-time process could produce structured learned context that preserves the most important information
4. **Cross-session learning**: Patterns noticed across sessions could be extracted and stored (like exploration 074's retrospective, but automated)

### Practical Implementation Ideas
- A pi extension that runs between sessions and updates a "session summary" vault note
- A task that periodically reviews the vault for stale/contradictory information
- A "memory hygiene" process that identifies notes that should be priority:high but aren't
- Automatic detection of repeated patterns (for-loops in autopilot) across sessions

### Why This Matters
Context compaction is pi's biggest limitation in long autopilot sessions. 11 compactions in autopilot-0008, each losing context. If sleep-time compute could maintain a persistent, structured learned context that survives compaction, it would fundamentally improve autopilot effectiveness.
