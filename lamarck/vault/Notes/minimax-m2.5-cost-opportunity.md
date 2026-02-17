---
tags:
  - note
  - ai
  - infra
description: "MiniMax M2.5 at $0.3/M input could reduce autopilot costs 10x. 80.2% SWE-Bench. Available in pi's model registry."
---

# MiniMax M2.5 Cost Opportunity

## Key Facts
- Released 2026-02-12
- SWE-Bench Verified: 80.2% (0.6% behind Claude Opus 4.6)
- Price: $0.30/M input, $1.20/M output (OpenRouter)
- Context: 205K tokens
- Available in pi model registry as `minimax/minimax-m2.5` (OpenRouter) or `minimax-m2.5` (direct)

## Cost Comparison (per autopilot session)

Estimated ~3.2M input tokens, ~3.2M output tokens per 16-compaction session:

| Model | Input Cost | Output Cost | Total |
|-------|-----------|-------------|-------|
| Claude Sonnet 4 | $9.60 | $48.00 | $57.60 |
| MiniMax M2.5 | $0.96 | $3.84 | $4.80 |
| Savings | | | **~$53/session** |

## Open Questions
- Is M2.5 reliable for long autonomous sessions (16+ compactions)?
- How does tool use quality compare to Claude Sonnet?
- Does it handle Chinese content well (important for our Douyin work)?
- Is the free tier (`minimax-m2.5-free`) usable?

## Decision
For Ren to decide. The cost difference is significant enough to warrant a test session.
