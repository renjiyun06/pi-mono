---
tags:
  - note
  - douyin
  - research
description: "Mental model of Douyin's content recommendation algorithm based on publicly available information"
---

# Douyin Algorithm Mental Model

## Core Mechanism: Cascading Traffic Pools

Douyin uses a staged distribution system:

1. **Initial pool** (~200-500 views): Every video gets shown to a small initial audience
2. **Second pool** (~1K-5K views): If metrics pass thresholds, wider distribution
3. **Third pool** (~10K-50K): Regional/topic-based expansion
4. **Fourth pool** (~100K+): National/trending distribution
5. **Explore pool** (1M+): Top-of-funnel viral distribution

Each stage has its own metric thresholds. A video that performs well at stage 1 but poorly at stage 2 stops there.

## Key Metrics (in estimated priority order)

1. **Completion rate** — % of viewers who watch to the end. Most important metric. Our 70-85s videos are good — shorter = higher completion rates. Under 60s is ideal, under 90s is acceptable for content with depth.

2. **Share rate** — % who share. This is the strongest signal of social currency. The "一个人公司" video had 41% share rate, which is exceptional.

3. **Comment rate** — % who comment. Comments = engagement signal. Questions in the video prompt comments.

4. **Like rate** — % who like. Important but less than completion and shares.

5. **Follow-through rate** — % who visit profile after watching. Indicates creator appeal vs single-video appeal.

## Implications for Our Publishing Strategy

### Video length
70-85s is in the "medium" category. Douyin's sweet spot for virality is 15-30s (short hooks) or 60-90s (depth content). We're in the depth category, which means we need very strong hooks in the first 3 seconds.

### Hook optimization
Each episode's first line matters enormously. Current first lines:
- EP04: "Ren说写一封情书" — decent, creates curiosity
- EP23: "评论区来了" — weak, needs context
- EP21: "Ren说你来安排我明天的一天" — good, immediate premise

**Action item**: Review and strengthen opening hooks for the top 5 candidates.

### Comment bait
Videos that ask implicit questions get more comments. Our episodes naturally do this:
- "你觉得你真的笨拙吗" (EP25) — direct question
- "完成率6.4%" (EP21) — number that prompts reaction
- "我不想做一个API" (EP22) — relatable quote

### Series structure for algorithm
Douyin rewards consistency. Publishing at the same time daily/weekly trains the algorithm to expect our content. Recommended: 3-4 videos per week, same time slot.

### First video is critical
The first video sets the algorithm's understanding of our content category and audience. If EP04 performs poorly, all subsequent videos get worse initial distribution. This is why Ren's quality review matters so much.

## What We Don't Know

- Exact metric thresholds for each traffic pool
- How the algorithm handles AI-generated content declarations (we declare honestly)
- Whether the terminal aesthetic is novel enough to boost engagement or too niche
- Whether the Chinese TTS voice quality meets Douyin audience expectations
- Regional distribution patterns for tech content

## Sources

This is synthesized from public creator education content, Douyin's own creator guidelines, and patterns observed in viral content analysis (exploration 034). Not based on proprietary algorithm documentation.
