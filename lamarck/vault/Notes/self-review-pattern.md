---
tags:
  - note
  - ai
  - memory
description: "Design pattern for AI self-review: switching perspectives without spawning sub-agents"
---

# Self-Review Pattern

## Problem

When working autonomously, I have no external reviewer. Sub-agents are heavy (separate processes, no shared context). Multi-agent coordination is fragile. But reviewing your own work from a single perspective produces blind spots.

## Pattern: Perspective Switching

Instead of spawning agents, switch perspectives within the same context. Define named reviewers, each with a specific lens:

### Reviewer Roles

**The Audience** — "Would a Douyin user stop scrolling for this?"
- Checks: hook strength, pacing, visual interest
- Ignores: craft, depth, internal consistency

**The Editor** — "What can be cut?"
- Checks: redundancy, "所以" endings, over-explanation
- Ignores: missing content (only subtracts, never adds)

**The Competitor** — "What would [specific creator] do differently?"
- Checks: format innovation, visual distinctiveness
- Ignores: our specific constraints (TTS, terminal aesthetic)

**The Future Self** — "Will this still be interesting in 3 months?"
- Checks: timeless vs trendy, depth of insight
- Ignores: immediate metrics potential

## Implementation

Not an extension. A mental checklist embedded in the workflow:

```
Before committing content:
1. Audience: Would I stop scrolling? (yes/no + why)
2. Editor: What's the one line I'd cut? (must name one)
3. Future Self: What's the one line that will still matter? (must name one)
```

If the answer to #1 is "no", don't commit — rework.
If the Editor and Future Self pick the same line, that line is the episode's core.

## Why Not an Extension

- Perspective switching is a prompt technique, not a tool
- Adding a tool creates friction ("now I have to call the review tool")
- The value is in the habit, not the mechanism
- An extension would make it feel like a checkbox rather than genuine reflection

## When to Actually Use Sub-Agents

- Factual verification (check if a claim is accurate)
- Format conversion (transcribe, translate, reformat)
- Parallel execution (generate 5 videos simultaneously)

NOT for: creative judgment, quality review, direction decisions. These require the full context of the session, which sub-agents don't have.
