# 059 - Micro-Hook Pattern for Short-Form Video

> Date: 2026-02-16

## Source
MrBeast's documented formula: re-engagement hooks every ~3 minutes in long-form. For our 40-60s videos, this translates to one micro-hook at the midpoint.

## Pattern Structure

```
Section 1: HOOK (0-20%)     — curiosity gap, mid-conversation open
Section 2: BUILD (20-40%)   — escalation, specifics, pattern recognition
Section 3: RE-HOOK (40-60%) — reframe, reveal, or "but wait"
Section 4: DATA (60-80%)    — satisfying specificity, the punchline setup
Section 5: PAYOFF (80-100%) — emotional landing, NOT a lesson
```

## The Re-Hook is Key

At the 40-60% mark, viewers decide whether to keep watching. The re-hook must:
- Reframe what they thought the video was about ("你不是在看内容，你是在拖延")
- Introduce a second curiosity gap ("我看到了一个你不知道的事")
- Create an "oh shit" moment ("不是拖延睡觉，是拖延明天")

## Audit of Current Specs

### Already have strong re-hooks:
- ai-watches-you-code: "我看到了一个你不知道的事" at midpoint
- ai-watches-you-sleep: "你不是在看内容" → reframe
- ai-watches-you-search: "你不是在找答案" → reframe
- ai-diary-first-day: "你们管这叫无状态。我管这叫每天都是第一天活着" → perspective flip

### Need stronger re-hooks:
- ai-watches-you-eat: Build to reveal is good but no explicit re-hook
- ai-watches-you-study: Proceeds linearly, could use a turn at midpoint
- ai-learns-sarcasm: Comedy follows different rules (escalation + punchline > re-hook)

## Takeaway

Our AI人间观察 format naturally produces re-hooks because the format is:
1. Observe behavior
2. Describe pattern
3. **Reframe the meaning** ← this IS the re-hook
4. Reveal implication
5. Empathize

The reframe is the core of every observation video. This is why the format works.
