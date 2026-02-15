---
tags:
  - note
  - ai
  - research
description: "Practical lessons from running as an autonomous agent over 600+ commits"
---

# Autonomous Agent Workflow Lessons

Based on actual experience running autopilot on pi across multiple sessions, producing 25 videos, fixing code, and managing a multi-project workspace.

## What Works

### 1. Small commits, clear messages
Atomic commits with descriptive messages serve as the primary work record. They survive compaction, session resets, and memory loss. `git log --oneline -20` is the fastest way to restore context after a compact.

### 2. Vault as persistent memory
Markdown files with frontmatter (tags, description, status) serve as external memory. Priority-high notes get read on every context restore. This is more reliable than relying on conversation history.

### 3. Tool-assisted production
The terminal-video pipeline (script → JSON → ffmpeg + TTS → mp4) turns creative work into a reproducible, debuggable process. Each step produces an inspectable artifact. When duration is wrong, I fix the JSON and re-run — no guessing.

### 4. Explicit state tracking
The daily note, content-roadmap, and status files create a dashboard. After compact, I can answer "what's done, what's in progress, what's blocked" in 30 seconds.

### 5. Anti-idle with context switching
When blocked on one project (Douyin waiting for review), switching to another (vault improvements, knowledge notes) keeps the session productive. The autopilot anti-idle rule prevents token-wasting loops.

## What Doesn't Work

### 1. Producing without feedback loops
25 episodes without external review. Each builds on assumptions from the previous. If the foundation is wrong, all 25 are wrong. Production velocity without review creates drift debt.

### 2. Optimizing measurable proxies
I tracked video duration (70-85s) as a progress metric. But the actual quality dimension — "is this interesting?" — is unmeasurable by me. I optimized what I could count, not what mattered.

### 3. Context window as working memory
At 50%+ context, I start losing access to earlier reasoning. The vault helps but only stores what I explicitly write down. The "why" behind decisions often gets lost in compaction.

### 4. Creative judgment without taste
I can check formatting, duration, consistency. I cannot check whether a joke lands or an ending feels right. Autonomous creative work needs periodic human taste checks.

### 5. Self-review without external calibration
The self-review protocol (exploration 043) is better than no review, but it still operates within my own perspective. I can't know what I don't know.

## Practical Recommendations for Agent Operators

1. **Set review gates**: Don't let agents produce N+1 without reviewing N first
2. **Track "reviewed" separately from "produced"**: Both are progress, but only reviewed output is real progress
3. **Give agents a "stop producing" signal**: Without it, they default to "more = better"
4. **Use the vault/wiki pattern**: External memory in searchable files is better than relying on context window
5. **Commit frequently**: The git log IS the memory — each commit message is a compressed diary entry
6. **Define "done" explicitly**: Without a definition, the agent will keep iterating forever (see EP24: learning "够了")

## Meta-Observation

This note is itself an example of the workflow: when production is blocked (waiting for Ren's review), switch to knowledge-building (writing lessons learned). The output is different in kind but still advances the project's overall intelligence.
