---
tags:
  - project
description: "Understand: anti-cognitive-debt developer tool — forces comprehension of AI-generated code"
---

# Understand

Code: `/home/lamarck/pi-mono/lamarck/projects/understand/` (not yet started)

## Overview

Developer tool that sits between AI code generation and code acceptance. Instead of passively accepting AI output, developers must demonstrate understanding before code enters their codebase.

Core insight from Bainbridge 1983: "the most automated systems require the most skilled operators." Current AI tools remove the need for skill. This tool preserves it.

## Status

**Prototype validated.** CLI tool at `lamarck/projects/understand/understand.ts`. Takes a code file, generates 3 understanding questions via LLM, quizzes developer, evaluates answers, outputs comprehension score.

Tested on:
- `validate-spec.ts` — questions about Chinese quotation mark handling, error propagation
- `render-with-voice.ts` — questions about playback rate calculation, padding frames, ffprobe failure
- `packages/ai/src/stream.ts` — questions about provider registration, streaming as primitive, type casting risks

All questions were genuinely insightful — testing design decisions, failure modes, and architectural understanding rather than memorization.

## Key Features (planned)
1. Challenge Mode — explain AI code before accepting
2. Spaced Repetition — periodic quizzes on previously accepted code  
3. Understanding Score — gamified dashboard
4. Pair Mode — AI describes, you write
5. Diff Review — explain why changes were made

## Connection to Douyin Content
Our DeepDive videos about cognitive debt create awareness of the problem. This tool is the solution. Content → awareness → product funnel.

## Recent Progress (2026-02-16)
- Added score persistence (`.understand/history.json`) with per-file tracking
- Added `summary` command showing scores, trends, below-threshold filter
- Wrote design doc for pi integration: post-session quiz, commit gate, passive tracking
- Evidence chain now 16 sources (CodeRabbit: 1.7x more AI bugs, 3x readability issues)
- Key insight: Understand as pi extension = dogfooding + perfect demo

## Complete Ecosystem (as of 2026-02-16)

| Component | File | Description |
|-----------|------|-------------|
| **Web app** | `projects/understand/app.html` | Zero-install browser quiz (paste code + API key) |
| **Landing page** | `projects/understand/landing.html` | Marketing page with research stats |
| CLI tool | `projects/understand/understand.ts` | 4 commands: quiz, dry-run, summary, debt |
| Pi extension | `extensions/understand.ts` | Tracks session files, /understand command |
| Git hook | `projects/understand/hooks/post-commit` | Debt reminder after commits |
| Scheduled task | `tasks/understanding-report.ts` | Daily debt snapshot in vault |
| Web dashboard | `projects/understand/dashboard.html` | Visual history.json viewer |
| Smoke tests | `projects/understand/test-understand.ts` | 5 offline tests, all passing |
| README | `projects/understand/README.md` | Product-quality docs |
| Design doc | `projects/understand/design-pi-integration.md` | 3 integration options |
| Comprehension guide | `projects/understand/COMPREHENSION-GUIDE.md` | 8 questions for Ren |
| Manim demo | `douyin/tools/manim-understand-concept.py` | 12.6s concept animation |
| Competitor analysis | `vault/Notes/cognitive-debt-guard-competitor.md` | CDG comparison |
| Pitch doc | `douyin/exploration/075-understand-product-state.md` | Full pitch |
| Branch quiz | `AUTOPILOT-0008-QUIZ.md` | 8 questions testing branch understanding |

## Competitor

**Cognitive-Debt-Guard** (GitHub) — agent-side approach (configures AI tools to explain/pause). Complementary, not competitive. CDG prevents (changes AI behavior), we detect (measures human comprehension independently). See vault note for full analysis.

## Blockers
- Need Ren's input on whether to pursue this direction (product vs personal tool)
- Market validation: Reddit + Stackademic signals strong, no direct user testing yet
- Web app (app.html) enables zero-friction user testing — share the file, anyone can try it
- Packaging: CLI still single file with hardcoded paths, needs npm packaging for distribution
