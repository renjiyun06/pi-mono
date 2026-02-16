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

## Blockers
- Need Ren's input on whether to pursue this direction
- Pi extension integration needs understanding of extension API
- Market validation: Reddit signals strong but no direct user testing yet
