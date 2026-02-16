---
tags:
  - note
  - research
  - ai
description: "Werner Vogels (Amazon CTO) coined 'verification debt' at re:Invent 2025 — comprehension must be rebuilt when AI writes code"
---

# Verification Debt (Vogels, re:Invent 2025)

Source: https://www.theregister.com/2026/01/09/devs_ai_code/ (Sonar survey + Vogels keynote)

## Key Quote

> "You will write less code, 'cause generation is so fast, you will review more code because understanding it takes time. And when you write a code yourself, comprehension comes with the act of creation. When the machine writes it, you'll have to rebuild that comprehension during review. That's what's called verification debt."
> — Werner Vogels, AWS re:Invent 2025

## Survey Data (Sonar, 1,100+ developers)

| Metric | Value |
|--------|-------|
| Believe AI code isn't functionally correct | 96% |
| Always check AI code before committing | 48% |
| Use AI tools daily or multiple times/day | 72% |
| Code with significant AI assistance | 42% (projected 65% by 2027) |
| Review AI code = more effort than human code | 38% |
| Review AI code = less effort than human code | 27% |
| Report spending moderate/substantial effort on review | 59% |
| AI reduces toil | 75% say yes, but... |
| Actual toil time with vs without AI tools | Same (23-25%) |

## Connection to Our Framework

Vogels' "verification debt" = our "cognitive debt" from the review angle. The Sonar data proves the problem is real at scale:
- Almost no one trusts AI code (96%)
- Half don't check it anyway (48%)
- The ones who do check find it's harder to review (38% vs 27%)
- Toil doesn't decrease — it just shifts to verification

This is the strongest institutional validation we've found. Amazon's CTO named the problem we're building a tool to solve.

## Source 19 in Evidence Chain

Add to [[cognitive-debt-evidence-chain]] as enterprise-scale survey validation.
