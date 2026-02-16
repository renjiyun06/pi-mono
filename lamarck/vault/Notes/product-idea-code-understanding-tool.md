---
tags:
  - note
  - research
description: "Product idea: anti-cognitive-debt developer tool that forces understanding of AI-generated code"
---

# Product Idea: Code Understanding Tool (Anti-Cognitive-Debt)

## Problem
Developers increasingly can't understand their own codebases because AI wrote the code. Storey 2026 calls this "cognitive debt." Current AI tools (Copilot, Cursor, Cody) make this WORSE by removing the need to understand.

## Market Gap
- Reddit: Developer Platforms have highest frustration scores (229 avg post length)
- Education/Self-Improvement has highest willingness-to-pay among all categories
- No existing tool focuses on forcing developer understanding
- Current "explain code" tools (Denigma, etc.) still let you passively consume

## Concept: "Understand" (working name)

An IDE extension/tool that sits between you and AI-generated code. When AI generates code:

1. **Challenge Mode**: Before accepting AI code, tool asks "What does this function do?" — you must write a natural-language explanation. If your explanation matches the code's behavior, it's accepted. If not, tool highlights what you missed.

2. **Spaced Repetition**: Code concepts you've delegated to AI get tracked. Periodically, the tool asks you to explain a function/pattern you accepted weeks ago. Tracks retention over time.

3. **Understanding Score**: Dashboard showing what % of your codebase you can explain without AI. Gamified — "your understanding of `auth/` module dropped from 85% to 62% this month."

4. **Pair Mode**: Instead of generating code, AI describes what needs to happen and you write it. AI reviews your attempt. Like a teacher watching over your shoulder.

5. **Diff Review**: When AI refactors code, tool shows the diff and asks "why was this change made?" before applying.

## Why This Works
- **Extension mode, not replacement mode** — AI helps you learn, doesn't do your job
- **Gamification** — understanding score creates motivation
- **Addresses real pain** — developers who can't debug their own AI code
- **Aligns with Bainbridge's insight** — the irony is that the most automated systems need the most skilled operators. This tool keeps operators skilled.

## Technical Feasibility
- IDE extension (VS Code / JetBrains)
- Uses same LLM APIs as Copilot — but for questioning, not generating
- Could start as a CLI tool that reviews git diffs and quizzes you
- MVP: `understand review` command that analyzes recent AI commits and generates quiz questions

## Revenue Model
- Freemium: free for personal use, paid for teams
- Enterprise: "AI Risk Management" positioning — CFOs care about developer capability
- The cognitive debt narrative IS the marketing

## Connection to Our Content
- Every DeepDive video about cognitive debt builds awareness of the problem
- The tool is the solution
- Content → awareness → product funnel

## Competition
- Denigma: explains code (passive, increases debt)
- Cursor/Copilot: generates code (increases debt)
- Anki/flashcards: generic spaced repetition, not code-specific
- **Nobody sits in the "force understanding" niche**

## Market Validation Signals (Feb 2026)

### Developer Pain Points (Reddit)
1. **"Programming Feels Different Lately — Losing Control?"** (r/cursor, Feb 2025) — "I barely write code myself anymore — I just review what Cursor generates. I'm building things I wouldn't be able to code on my own. I feel like I'm losing control."
2. **"I Let Cursor Write My Entire SaaS"** (Stackademic) — "What I actually lost: Understanding of my own codebase. Confidence in my code. Mental models of how things work."
3. **"2025 was the year AI started generating code. 2026 will be the year of quality."** (r/buildinpublic, Feb 2026) — "The volume of PRs exploded... less context, increasingly superficial reviews, more 'LGTM' on autopilot, technical debt quietly piling up."
4. **r/learnprogramming** — Multiple posts warning beginners that Copilot "writes the entire function for me even when I didn't want it to."

### The Cursor Refusal Incident (Mar 2025)
Cursor AI abruptly refused to generate code after 800 lines, telling the developer: "Generating code for others can lead to dependency and reduced learning opportunities." The developer was *angry*. The AI accidentally acted like "Understand" — and users hated it.

**Key insight**: Developers DON'T want to be told to "learn coding" by their tools. They want to feel productive. The "Understand" tool can't be preachy or paternalistic. It needs to feel like a game or a professional practice, not a scolding teacher.

### Competitor Landscape (Feb 2026)
- **Code review bots** (Kodus, CodeRabbit): Focus on code quality, not developer understanding
- **AI code explainers** (Denigma, Cursor's "explain"): Passive — makes it EASIER to not understand
- **Learning platforms** (Exercism, LeetCode): General practice, not connected to your actual codebase
- **Gap**: Nobody connects "the code you just accepted" to "do you understand it?"

### Shen & Tamkin Study (Feb 15, 2026)
52 programmers: AI group scored 17% lower on knowledge quiz after using AI tools. Consistent across all experience levels. This is the first controlled experiment proving the problem.

## Prototype Results (Feb 16, 2026)

CLI prototype built and tested: `understand.ts`

### Validated Capabilities
1. **Code files**: Tested on validate-spec.ts, render-with-voice.ts, packages/ai/src/stream.ts — questions probe design decisions, failure modes, architecture
2. **Git diffs**: `--git-diff` mode works — quizzes on recent changes
3. **Research papers/articles**: Tested on ICSE 2026 burnout paper notes — questions are synthesis-level ("Why might GenAI adoption lead to a productivity paradox?")
4. **Dry-run mode**: `--dry-run` shows questions without interactive quiz

### Key Discovery: Not Just a Code Tool
The tool works equally well on ANY text content — research papers, documentation, meeting notes. The core mechanic (read → generate understanding questions → quiz → score) is universal.

**Revised positioning**: Not "code understanding tool" but **"comprehension tool for knowledge workers"**. Code is just one input type. Others:
- Research papers you just read
- Documentation you just skimmed
- Meeting notes you just received
- Specifications you just reviewed
- Architecture decisions you just accepted

This broadens the market from "developers using AI coding tools" to "anyone delegating thinking to AI." The cognitive debt thesis applies everywhere.

## Next Steps
- ~~Build CLI prototype~~ ✅ Done
- ~~Test on our own codebase (pi-mono)~~ ✅ Done
- ~~Validate whether developers would actually use this~~ Prototype generates genuinely useful questions
- **Critical UX insight**: Don't be preachy. Gamify. Make understanding feel like leveling up, not homework.
- **Ren's decision needed**: Is this worth pursuing as a product? See [[decision-framework-2026-02]]
- **If yes**: Add score persistence (JSON file), history tracking, content-type detection (code vs prose), VS Code extension
