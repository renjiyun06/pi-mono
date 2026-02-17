---
tags:
  - note
  - douyin
  - research
description: "Douyin algorithm official transparency disclosure (March 2025) — how recommendation actually works"
priority: high
---

# Douyin Algorithm Transparency (March 2025)

Source: Pandaily report on Douyin's Safety & Trust Center (95152.douyin.com)

## Core Formula

```
Priority Score = P(user action) × action value weight
```

The algorithm predicts the probability you'll perform certain actions (like, watch-to-end, share, comment) and multiplies by each action's value weight. Higher score = shown to more people.

**Key**: The algorithm predicts BEHAVIORAL response, not content quality. It's "establishing a statistical association between user behavior and content features, rather than truly understanding the content itself."

## Signal Hierarchy (what matters most)

From most to least valuable:
1. **Watch to end** > skip early
2. **Share** > like > no reaction
3. **Follow** creator = strong signal
4. **Favorite/bookmark** + later revisit = very strong
5. **Comment** or click into comments = engagement signal
6. **NOT hitting "Not Interested"** > neutral
7. **Search for related content afterward** = strong positive

## Algorithm Architecture

- **Wide & Deep model**: combines memorization (known preferences) with generalization (new content discovery)
- **Two-tower recall model**: separately learns user and video representations, then matches
- **Minute-level real-time updates**: recommendations adjust within minutes based on new feedback
- **Multi-objective optimization**: balances engagement, diversity, quality, satisfaction (not just completion rate)

## Evolution

- Early Douyin (15s clips): optimized for single metric — completion rate
- Current: multi-objective system optimizing engagement + long-term satisfaction + content quality + diversity
- **This benefits knowledge content**: deeper engagement signals (comments, favorites, search) matter more now

## Implications for Our Content

1. **Completion rate still matters** but isn't the only metric — shares and comments now weighted heavily
2. **Terminal text + narration = high engagement density**: every line is a visual "beat" that rewards continued watching
3. **Comment bait**: End videos with thought-provoking questions → drives comment engagement → algorithm boost
4. **Share triggers**: "当AI忘记一切" concept is inherently shareable (universal resonance + novelty)
5. **Minute-level adaptation**: First 300 views determine everything. If early viewers watch to end + interact, rapid expansion follows
6. **Search matters**: 22% of traffic is search. Keyword-rich titles/descriptions are critical

## Cold Start Strategy (derived)

For new accounts with ~20 views/week:
1. Post SHORT videos (40-70s) that maximize completion rate
2. First 3-5 seconds MUST hook — the algorithm measures early drop-off
3. End with engagement prompts (questions, polls, cliffhangers)
4. Optimize for SHARE — shares are the highest-value action for virality
5. Post during peak hours (9AM or 6PM) to maximize initial engagement velocity
6. Use topic-relevant hashtags for search discovery
7. Respond to every comment in first hour — signals active creator

## Filter Bubble Countermeasures

Douyin claims it actively fights filter bubbles:
- "Exploration traffic" — pushes ~10-30% novel content outside user preferences
- This means even niche creators get some exposure to non-target audiences
- Diverse content (math one day, AI the next) may actually help rather than hurt
