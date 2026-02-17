---
tags:
  - note
  - research
description: "Synthesis: one insight (hallucination inversion) across 4 channels simultaneously"
---

# Multi-Channel Content Strategy: Hallucination Inversion

Synthesis of research from this session. One core insight deployed across multiple channels.

## The Insight

AI improved at refusing obvious lies → creates false safety → still fabricates on hard/obscure topics → improvement makes remaining hallucination MORE dangerous.

Validated by:
- Anthropic RCT (Jan 2026): AI delegation → 17% lower comprehension
- China's first AI hallucination lawsuit (Jan 2026): student got fabricated campus info
- DeepSeek-R1: 14.3% hallucination rate, 4x higher than base model
- Our own tests: 3 models give 3 different wrong answers to the same obscure question

## Four Channels, One Insight

### 1. Douyin Short Video: "What I Can't Do: Episode 2"
- **Format**: 2.8min, terminal aesthetic, chat demos, probability bars
- **CTA**: "Copy this question, paste to any AI, see what you get"
- **Render**: `cant-stop-guessing-v2.mp4` (170s)
- **Challenge**: Explainer genre has lowest share rate (14.9%). Our testable CTA is the differentiator.

### 2. Zhihu/WeChat Article
- **Format**: ~1200字, first-person AI perspective
- **Angle**: Demo → table → mechanism → lawsuit → "try it yourself"
- **File**: `specs/hallucination-inversion/article-zh.md`
- **Advantage**: Fastest to publish (no video production). Unique angle: lawsuit + DeepSeek data + testable demos.

### 3. Interactive Tool: Hallucination Checker
- **Format**: Standalone HTML, zero backend
- **File**: `tools/hallucination-checker/index.html`
- **Feature**: Trap questions with copy-to-clipboard + CrossRef verification
- **Limitation**: Market already has citation checkers (SwanRef, Citea). Our value is Chinese UI + CTA companion.

### 4. Developer Tool: Understand
- **Format**: CLI tool + MCP server
- **Connection**: Cognitive debt from AI-generated code is the developer-facing side of the same phenomenon
- **Validation**: Anthropic's own RCT says our approach (generation-then-comprehension) is the ONLY pattern that preserves learning
- **Files**: `projects/understand/`

## Cross-Channel Synergy

```
Douyin video → drives CTA (test hallucination) → hallucination checker
Zhihu article → explains mechanism → links to checker → drives Douyin
Checker → validates experience → drives article shares
Understand tool → developer audience → different market segment, same thesis
```

## Priority Order

1. **Article** — fastest to publish, lowest effort, tests audience reception
2. **Video** — highest reach potential, blocked on Ren's review
3. **Checker** — CTA companion, not standalone product
4. **Understand** — strongest long-term product, blocked on npm publish

## Key Learning

Having one strong insight and deploying it across multiple formats/channels is more efficient than creating separate content for each channel. The research investment (competitive analysis, data analysis, academic literature) amortizes across all four.
