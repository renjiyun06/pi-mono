# Understand — Launch Copy

## One-liner
Quiz yourself on AI-generated code before it becomes technical debt.

## Tagline (Product Hunt)
AI writes code faster than you can read it. Understand checks if you actually understand it.

## Problem Statement (short)
Anthropic's latest RCT found that developers using AI score 17% lower on comprehension tests — the equivalent of nearly two letter grades. Yet 96% of developers don't review AI-generated code before committing it. The result: codebases full of code nobody understands.

## Solution (short)
A CLI that generates targeted comprehension questions about any code file, quizzes you, scores your understanding, and tracks comprehension debt across your codebase. Think "flashcards for code."

## Why Now
- Anthropic (Jan 2026) proved that "generation-then-comprehension" is the only AI usage pattern that preserves learning. Understand automates this pattern.
- China's first AI hallucination lawsuit (Jan 2026) — courts are now dealing with the consequences of blind AI trust
- METR RCT showed developers think they're 20% faster with AI tools but are actually 19% slower — a 43-point perception gap
- CodeRabbit found AI code has 1.7x bugs, 3x readability issues, 8x performance problems

## Differentiation
- **Active, not passive**: Other tools explain code TO you. Understand quizzes you on it. Research shows quizzing produces better retention than reading.
- **Tracks debt over time**: Knows which files you've never reviewed, which changed since your last quiz, which score below threshold.
- **Works with any AI tool**: Not tied to Copilot, Cursor, or Claude. Works on any code, regardless of how it was written.
- **Zero lock-in**: Single TypeScript file. Scores stored as JSON. Use any LLM via OpenRouter.

## How It Works
```
$ understand src/auth.ts
```
1. Sends code to LLM with comprehension-focused prompt
2. Generates 3 targeted questions (design decisions, failure modes, runtime behavior)
3. You answer in natural language
4. LLM evaluates your understanding and identifies gaps
5. Score saved to `.understand/history.json`

## Install
```bash
npx understand-code src/auth.ts
```

## Pricing
Free. Open source. Uses your own LLM API key (OpenRouter).

## Social Proof
- Built on research from Anthropic, MIT, METR, and 20+ studies on cognitive debt
- Automates the exact usage pattern Anthropic's researchers identified as preserving learning
- Already integrated as MCP server for AI coding agents

## Target Audience
1. Senior developers who accept code from junior devs using AI tools
2. Teams adopting AI coding tools and worried about knowledge retention
3. Individual developers who want to understand their own codebase
4. Engineering managers tracking team comprehension

## Launch Channels
- [ ] Product Hunt
- [ ] Hacker News (Show HN)
- [ ] r/programming, r/ExperiencedDevs
- [ ] Dev.to article
- [ ] Chinese tech communities (V2EX, Zhihu)
