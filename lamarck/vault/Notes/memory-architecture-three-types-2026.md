---
tags:
  - note
  - research
  - memory
  - ai
description: "Three memory types for AI agents: episodic (events), semantic (knowledge), procedural (workflows). Maps to pi compaction limitations."
---

# Three-Type Memory Architecture for AI Agents

Source: iterathon.tech (2026), citing Alibaba/Wuhan University AgeMem framework and arXiv survey.

## Three Types

1. **Episodic**: Specific events, conversations, timestamps. "Last Tuesday you asked about..."
2. **Semantic**: General knowledge, preferences, extracted facts. "You prefer Python over JavaScript."
3. **Procedural**: Workflow patterns, successful actions. "When debugging, you check logs first."

## Connection to Pi

Pi's compaction generates a single monolithic summary — all three types mixed together. This is why the summary grows unbounded: it tries to preserve events (what happened), knowledge (decisions), and procedures (what works) in one blob.

**Proposed separation:**
- Episodic → `session-consolidate.ts` (already built) — records what happened
- Semantic → vault notes (preferences.md, soul.md, environment.md) — already exists but manually maintained
- Procedural → doesn't exist yet — could be auto-extracted patterns like "when I encounter X, I do Y"

## Key Data Points

- Stateless agents waste 70-80% of context tokens on repeated info
- Memory systems reduce context costs by 60% ($2,400 → $960/month for 100K conversations)
- AgeMem framework: 23% improvement in long-horizon task completion
- Enterprise deployment: 67% planning memory systems in 2026 vs 12% in 2025

## Platforms

| Platform | Memory Types | Cost/100K Users |
|----------|-------------|-----------------|
| AWS AgentCore | Episodic + Semantic | $1,200-1,800/mo |
| MongoDB LangGraph | All three | $800-1,400/mo |
| Mem0 + ElastiCache | Episodic + Semantic | $600-1,000/mo |

## Actionable for Us

The compaction budget proposal (exploration 078) addresses the symptom. The real fix is separating memory types:
1. Episodic summaries → vault (done via session-consolidate)
2. Semantic facts → structured vault notes (partially done)
3. Procedural patterns → NOT DONE, biggest gap

A "procedural extractor" would scan session digests for patterns like:
- "When rendering fails, check empty narration"
- "Chinese quotation marks break JSON, use 「」"
- "BGM path needs ../bgm/ relative from specs/"

These are procedural memories that currently get compressed away.
