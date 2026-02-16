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

## Next Steps
- Build CLI prototype: `understand review` that takes a git diff and generates quiz questions
- Test on our own codebase (pi-mono)
- Validate whether developers would actually use this
