---
tags:
  - note
  - research
  - ai
description: "CodeRabbit study of 470 GitHub repos: AI creates 1.7x more bugs than humans, 75% more logic errors, 3x readability issues"
---

# CodeRabbit: AI vs Human Code Generation (Jan 2026)

Source: [Stack Overflow Blog](https://stackoverflow.blog/2026/01/28/are-bugs-and-incidents-inevitable-with-ai-coding-agents/)

## Methodology
- Scanned 470 open-access GitHub repos
- Identified AI-co-authored PRs vs human PRs via commit messages and agentic IDE files
- Quantitative, not survey — actual code analysis

## Key Findings

| Metric | AI vs Human | Detail |
|--------|-------------|--------|
| Overall bugs | **1.7x more** | Across all categories |
| Critical/major issues | **1.3-1.7x more** | Not just minor bugs |
| Logic/correctness errors | **75% more** (194/100 PRs) | Hardest to catch in review |
| Security issues | **1.5-2x more** | Improper password handling, insecure refs |
| Performance issues | **~8x more** | Excessive I/O operations |
| Concurrency errors | **2x more** | Misuse of primitives, incorrect ordering |
| Error handling | **~2x worse** | Null pointers, missing early returns |
| Readability | **3x worse** | The single biggest difference |
| Formatting problems | **2.66x more** | |
| Naming inconsistency | **2x more** | |

## Key Quotes

> "Massive commits combined with hard-to-read code makes it very easy for serious logic and correctness errors to slip through. This is where the readability problem compounds."

> "If 2025 was the year of AI coding speed, 2026 is going to be the year of AI coding quality."

> "The hype of long-running agents is a sales tactic, and engineers using these tools need to be clear-eyed and pragmatic."

> "2025 saw Google and Microsoft bragging about the percentage of their code base that was AI-generated. Lines of code has never been a good metric for human productivity, so why would we think it's valid for AI?"

## Why Agents Make Worse Bugs Over Time

1. Context compaction/sliding windows drop information
2. Mistakes compound over running time — hallucinations bake into code
3. Large commits trigger Law of Triviality — 500-line PRs get rubber-stamped
4. Readability issues make debugging harder, multiplying downstream cost

## Recommended Mitigations (from article)
1. Spec-driven development — crystallize context before coding
2. Break tasks into smallest possible chunks
3. Don't let agents "burn tokens for hours"
4. Treat AI PRs as higher-risk by default
5. Fight AI with AI (AI-powered code review)
6. Enforce unit tests, static analysis, observability

## Connection to Our Work

- **Evidence chain source #16** — first large-scale quantitative study of actual code quality
- Validates Eisele's "forensic code review" as necessary skill
- "Readability issues compound" = exactly the problem Understand addresses
- "Lines of code is not a valid metric" — counters the "AI writes 80% of code" narratives
- The 8x performance issue gap is striking — AI doesn't understand runtime cost
- 2025 outage data correlates with AI coding adoption — organizational debt in action
