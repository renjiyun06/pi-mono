---
tags:
  - note
  - research
  - douyin
description: "Data finding: mechanism explainers get likes but not shares. News/stories drive shares. Implications for cold-start strategy."
---

# Share Rate by Content Type

## Data (from our tracked 900+ Douyin works)

### Highest share rate content (>40%):
| Type | Example | Share Rate | Likes |
|------|---------|-----------|-------|
| Breaking tech news | Neuralink reveal (赛文乔伊) | 154.6% | 185K |
| Aspirational business story | 96年女生1亿营收 (程前朋友圈) | 105.9% | 320K |
| AI tool demo (viral) | Manus实测 (艾克ai分享) | 77.6% | 67K |
| Musk/future predictions | 马斯克预言 (Ai风向标) | 51.3% | 143K |
| Policy explainer | 国家怎么看AI就业 (Rick讲AI) | 50.7% | 15K |

### Mechanism explainers (our genre):
| Example | Share Rate | Likes |
|---------|-----------|-------|
| 为啥AI数不清手指 (飞天闪客) | 9.3% | 150K |
| AI影片底层密码 (大师的AI小灶) | 4.8% | 127K |
| NSA追查 (周鸿祎) | 4.9% | 201K |

## Key Finding

Mechanism explanation content can achieve very high likes (100K+) but has structurally low share rates (~5-10%). Breaking news and actionable tool demos drive 5-15x higher share rates.

**Why**: People share to signal identity ("I'm informed about the future") or provide utility ("try this tool"). Mechanism explanations are consumed for personal understanding — the knowledge is the reward, not the social signal.

## Implication for Cold-Start

Douyin cold-start algorithm weights shares most heavily. Our mechanism explainer genre is disadvantaged for cold-start.

**Options**:
1. Accept slow cold-start, build through likes + completion rate instead
2. Lead with a "hybrid" video that combines mechanism explanation with a shareable hook (news tie-in, tool demo)
3. Publish a high-share-rate "gateway" video first (e.g., tool demo or news take), then funnel to deeper content

**Recommendation**: Option 2. Our "What I Can't Do" series has testable demo hooks ("try asking your AI this"). The demo IS the sharing trigger. Lead with that, not with "How I Forget" (pure mechanism explanation, low share potential).

This challenges the current launch order in [[launch-strategy-synthesis]]. Worth discussing with Ren.
