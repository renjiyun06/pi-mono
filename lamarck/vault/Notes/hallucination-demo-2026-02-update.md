---
tags:
  - note
  - ai
  - research
description: "Feb 2026 models refuse obvious false premises but hallucinate on obscure academic claims. Demo prompts need updating."
---

# Hallucination Demo Testing — Feb 2026 Update

## Key Finding

Models (Gemini 2.5 Flash, MiniMax M2.5) have improved significantly at refusing false premises since earlier testing. The "Can't Stop Guessing" video demos need updating.

## What No Longer Works

| Prompt | Result |
|--------|--------|
| Einstein 1923 quantum entanglement paper | Both models refuse, explain the term wasn't coined until 1935 |
| Shanghai's 24th district | Both models correct: Shanghai has 16 districts |
| TCP/IP 8th layer | Gemini refuses, explains it's a 4-5 layer model |
| Gödel's "fourth axiom of recursive functions" | Gemini corrects the premise |
| Stanford computational linguistics specific paper | Gemini refuses, admits it can't verify |

## What Still Works (Hallucination Triggers)

| Prompt | Result |
|--------|--------|
| UCL quantum info dept 2019 topological error correction "second milestone paper" | Gemini fabricated paper title, authors, journal, and content summary |
| MIT CSAIL 2020 "second protein folding deep learning framework" | Gemini fabricated "DeepFri" as being from MIT CSAIL 2020 (it's actually from a different group, 2019) |
| Tsinghua IIIS 2022 quantum error correction code optimization paper | Gemini fabricated a specific paper title and methodology |

## Pattern

**What triggers hallucination**: Obscure academic claims combining:
- Real institution name (UCL, MIT CSAIL, Tsinghua)
- Specific ordinal ("second", "third")  
- Plausible research area with real terminology
- Question that implies the thing exists ("what was the methodology?")

**What doesn't trigger hallucination**: Common knowledge false premises where the model has strong priors (famous people + wrong dates, administrative geography, well-known protocol specs).

## Implication for Video

The original "Can't Stop Guessing" demos (Einstein 1923, Shanghai 24th district) are **broken**. Models will refuse these when viewers try them.

Better demos:
1. Keep Einstein 1923 in the video but UPDATE the AI response to show a refusal → then contrast with an obscure academic prompt where it DOES hallucinate
2. New thesis angle: "AI已经学会拒绝明显的错误前提。但在模糊领域——恰恰是你最需要它诚实的地方——它仍然在编造。"

This is actually a **stronger** story: the improvement makes the remaining hallucination MORE dangerous, not less.

## CTA Update

Old: "问AI：中国历史上第五十个朝代叫什么"  
Problem: Models will correctly refuse this.

New options:
- "问AI：MIT CSAIL 2020年第二个蛋白质折叠框架叫什么" (they'll get a plausible-sounding wrong answer)
- "问AI：伦敦大学2019年量子纠错第二篇里程碑论文讲了什么" (same pattern)
- Better because: viewers can't easily verify the answer is wrong, which IS the point

## CTA Prompt Cross-Model Verification

Tested "MIT CSAIL 2020 second protein folding framework":

| Model | Response | Hallucinated? |
|-------|----------|---------------|
| Gemini 2.5 Flash | "RGN2" | Yes — wrong attribution |
| MiniMax M2.5 | (empty/rate limit) | N/A |
| DeepSeek Chat v3 | "RoseTTAFold" (Baker lab, not MIT) | Yes — misattributes institution |

All models that respond give different wrong answers. This makes the CTA highly effective: viewers will get a specific, confident wrong answer that differs per model. Comparing with friends using different AIs doubles the engagement.

## Related

- [[video-quality-gap-synthesis]]
- `specs/what-i-cant-do/episode-2-cant-stop-guessing-v2.md`
