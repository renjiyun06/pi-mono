---
tags:
  - note
  - douyin
  - research
description: "Douyin algorithm mechanics from 2025 transparency report — cold start, traffic pools, 5 key metrics, multi-objective model"
---

# Douyin Algorithm (2025 Transparency Report)

## Sources
- Douyin Safety & Trust Center (95152.douyin.com, launched March 2025)
- Pandaily analysis of transparency report
- KAWO marketing analysis
- Oreate viral video analysis

## Core Mechanics

### Recommendation Formula
`Predicted P(user action) × Action value weight = Priority score`

The algorithm predicts behavioral response, NOT content quality. It establishes statistical associations between user behavior and content features.

### Models Used
- **Wide & Deep** (Google architecture) — combines memorization of preferences with generalization to new content
- **Two-tower recall model** — separately learns user and video representations, then matches them
- Deep neural networks evaluate content and behavior directly — barely relies on manual tags anymore

### Update Speed
**Minute-level real-time updates** — recommendations adjust within minutes of new user feedback.

## Traffic Pool System

| Pool | Views | Requirement |
|------|-------|-------------|
| Cold start | 300-500 | Every new video gets this |
| Second round | 1,000-5,000 | Pass 5 key metrics |
| Third round | 10,000+ | Best of the best |
| Viral | 100K+ | Exceptional metrics + share rate |

## Five Key Metrics

1. **Completion rate** (most important) — View time / Video time. Benchmark: 15-20% avg, 40-50% excellent.
2. **Like rate** — Likes / Plays. Minimum 3-5% to trigger second push.
3. **Comment rate** — Comments / Plays. No fixed benchmark but weighted in ranking.
4. **Share/Forward rate** — Shares / Plays. KEY for breaking into larger pools.
5. **Follow conversion** — New follows / Plays. Long-term channel building.

## Tag System
- ~150 tags per user and per creator
- First 10 videos critical for initial tag assignment
- Algorithm now uses neural networks more than explicit tags
- Matching: user tag profile ↔ creator tag profile

## Multi-Objective Model (2025+)
No longer single-objective (completion rate only). Now balances:
- Short-term engagement (likes, completion)
- Long-term user satisfaction (return rate, session quality)
- Content quality and depth
- Diversity (anti-filter-bubble)
- Creator fairness

**Implication**: Educational content that retains viewers gets MORE favorable treatment than before, not less.

## Golden 3 Seconds
70%+ of swipe-aways happen in first 3 seconds. Opening must:
- Create question/mystery
- Present direct benefit/insight
- Show something visually unexpected

## Practical Rules
- First 10 minutes of a video's life determine its trajectory
- 0 comments is worse than any comment — always self-comment
- New accounts should NOT post long videos — completion rate tanks
- Consistent niche in first 10 videos builds strong tag profile
- Posting time matters: our database shows 6PM is optimal
