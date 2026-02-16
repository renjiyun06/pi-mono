---
tags:
  - note
  - research
description: "Cognitive-Debt-Guard: competitor analysis — agent-side approach vs our human-side approach"
---

# Cognitive-Debt-Guard (GitHub)

Source: [github.com/krishnan/Cognitive-Debt-Guard](https://github.com/krishnan/Cognitive-Debt-Guard)

## What It Is

A "cross-tool enforcement system" that prevents cognitive debt by configuring AI coding tools to:
- Work in small increments with narration
- Pause and ask developer to confirm understanding
- Log design decisions (DECISION-LOG.md)
- Generate session summaries
- Trigger periodic "theory checks" during long sessions

Supports 7 tools: Claude Code, Gemini CLI, Google Jules, GitHub Copilot, Cursor, Windsurf, Aider. Plus git hooks and PR template.

## Approach: Agent-Side Prevention

CDG modifies HOW the AI works. It's config files (CLAUDE.md, .cursorrules, etc.) that instruct the AI to be more pedagogical. Key mechanism: "theory checks" where the AI asks YOU to explain what it just did.

## Our Approach: Human-Side Detection

Understand measures WHETHER the human understands, regardless of how the code was written. It's tool-agnostic — works on any codebase with git history. Key mechanism: quiz + debt dashboard.

## Comparison

| Aspect | CDG | Understand |
|--------|-----|-----------|
| Strategy | Prevention | Detection |
| Target | AI behavior | Human comprehension |
| Integration | Per-tool config files | Git + LLM API |
| Verification | AI asks questions mid-session | Tool quizzes human after changes |
| Tracking | Session summaries, decision logs | Score history, debt dashboard |
| Scope | 7 specific tools | Any codebase |

## Key Insight

CDG is AGENTS.md for cognitive debt — it's instructions to the AI. But it has the same limitation as any instruction-based approach: the AI can follow the letter but not the spirit. It can "pause and ask" without actually verifying comprehension.

Understand is different: it tests comprehension independently. The AI that quizzes you is NOT the AI that wrote the code. This separation matters — it's like having a different person grade your test than the one who taught you.

## Complementary, Not Competitive

Best workflow: CDG during coding (AI explains as it works) + Understand after coding (verify you actually learned). CDG prevents, Understand verifies.

## Market Validation

CDG's existence validates the market. Someone else independently arrived at the same problem and built a solution. The discourse (Storey paper, Eisele article, Willison blog) is generating real products. Race is on.
