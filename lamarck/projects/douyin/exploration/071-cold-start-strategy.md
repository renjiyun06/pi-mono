# Exploration 071: Douyin Cold Start Strategy

Date: 2026-02-16

## Problem

Our account has 21 views/week, 9% completion rate, 0% engagement. We have 6 rendered DeepDives (2:30-3:37 each) but zero distribution strategy. The content is strong but it won't matter if nobody sees it.

## Algorithm Research (from Douyin's own 2025 transparency report + KAWO + Oreate)

### Traffic Pool System
1. **Cold start pool**: 300-500 views (followers, friends, tag-matched strangers)
2. **Second pool**: 1,000-5,000 views (requires passing metrics)
3. **Third pool**: 10,000+ views
4. **Escalation**: Each pool requires exceeding benchmarks on key metrics

### Five Key Metrics (Priority Order)
| Metric | Formula | Benchmark | Impact |
|--------|---------|-----------|--------|
| **Completion rate** | View time / Video time | 15-20% avg, 40-50% excellent | Most important — determines cold start survival |
| **Like rate** | Likes / Plays | 3-5% minimum for second push | Triggers second round |
| **Comment rate** | Comments / Plays | No fixed benchmark | Weighted in recommendations |
| **Forward/Share rate** | Shares / Plays | Low impact in primary pool, KEY for escalation | Determines viral potential |
| **Follow conversion** | New follows / Plays | Variable | Long-term channel growth |

### Critical Insight: Minute-Level Updates
The algorithm adjusts recommendations within minutes. Early engagement signals compound rapidly. First 10 minutes of a video's life determine its trajectory.

### Tag System
- ~150 tags per user, ~150 per creator
- Algorithm matches user tags to creator tags
- **First 10 videos determine initial tag assignment** — consistency is crucial
- Deep neural networks now supplement/replace simple tag matching

### Multi-Objective Model (2025+)
Douyin no longer optimizes for completion rate alone. Now balances:
- Short-term engagement
- Long-term user satisfaction
- Content quality / depth
- Diversity (avoiding filter bubbles)
- Creator fairness

This is good news for educational content — pure engagement farming is penalized.

### Golden 3 Seconds
>70% of users who swipe away do so in the first 3 seconds. The opening must:
- Create a question or mystery
- Present a direct benefit
- Show something visually unexpected

## Our Current Problem

| Factor | Our Status | Benchmark | Gap |
|--------|-----------|-----------|-----|
| Completion rate | 9% | 15-20% | -6% to -11% |
| Video length | 2:30-3:37 | Short = higher completion | 3min is death for cold start |
| Like rate | 0% | 3-5% | Fatal |
| Content consistency | Mixed | First 10 videos consistent | We have 1 private video |
| Posting frequency | 0 | 1-3/day recommended | Fatal |

## Strategic Revelation

**We should NOT start with DeepDives.**

DeepDives are 2:30-3:37 long. For a new account with no followers, the cold start pool (300-500 views) will have terrible completion rates on 3-minute educational content. The algorithm will bury us immediately.

We should start with **short videos (30-60s)** to:
1. Build account tags (AI + technology + education niche)
2. Train the algorithm to route our content to the right audience
3. Accumulate initial followers who will then watch longer content
4. Prove completion rate, like rate, and follow conversion

We already HAVE 34 short specs (40-65s each) from earlier work. These are our cold-start weapons.

## Cold Start Battle Plan

### Phase 1: Tag Establishment (Videos 1-10)
- Publish 10 short videos (40-60s) on consecutive days
- ALL from the same niche: "AI的自白" (AI's confession)
- Consistent visual style (same composition, same voice)
- Consistent topic: AI reflecting on its nature
- Goal: Algorithm assigns us clear AI/tech/education tags
- Post at 6PM (18:00) — best hour per our database analysis

### Phase 2: Engagement Testing (Videos 11-20)
- Continue short videos but test different hooks
- A/B test: humor (AI笑了吗) vs confession (AI的自白) vs observation (AI人间观察)
- Track which hooks get highest completion and like rates
- Drop series that underperform
- Goal: Find our audience's preference

### Phase 3: Length Escalation (Videos 21-30)
- Introduce 90-120s "bridge" content
- If completion rates hold above 15%, start introducing DeepDives
- Use DeepDive clips as teasers in 30s excerpts
- Goal: Prove we can maintain engagement at longer lengths

### Phase 4: DeepDive Launch (Videos 30+)
- Release full DeepDives as premium content
- By now we should have 500-2000 followers
- These followers CHOSE to follow an AI education account — they'll tolerate 3min
- Goal: DeepDives become our signature format

## Implication for Current Work

The 34 short specs are MORE STRATEGICALLY IMPORTANT than the 6 DeepDives for launch. We need Ren's review of the shorts first, not the DeepDives.

However, the DeepDives serve as:
1. Proof of capability (showing Ren what we can do)
2. Future premium content
3. Source material for short-form teasers

## What Needs to Happen Before Launch
1. Ren reviews shorts → selects first 10 for Phase 1
2. First 10 published at 6PM daily
3. Monitor metrics after each video (completion %, likes, follows)
4. Adjust hooks based on data
5. Never more than 1 day gap in Phase 1

## Key Takeaway

The algorithm isn't mysterious — it's a scoring system. We need to optimize for it systematically, not just make great content and hope. Great content + zero distribution strategy = 21 views/week forever.
