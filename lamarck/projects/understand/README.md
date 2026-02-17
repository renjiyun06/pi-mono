# understand

Anti-cognitive-debt tool for developers. Quiz yourself on code you didn't write.

## The Problem

AI writes your code. You ship it. Six months later, something breaks. You stare at the code and realize: you have no idea how it works. That's cognitive debt — code you own but can't maintain.

Unlike technical debt (which lives in the code), cognitive debt lives in your head. And there's no linter for it.

## What This Does

Generates understanding questions about code, quizzes you, tracks your comprehension over time, and shows which files in your codebase are cognitive debt.

## Usage

```bash
# Quiz on a file
npx tsx understand.ts src/auth.ts

# See questions without quizzing
npx tsx understand.ts src/auth.ts --dry-run

# Quiz on recent git changes
npx tsx understand.ts --git-diff

# Show comprehension scores over time
npx tsx understand.ts summary

# Show which files you don't understand
npx tsx understand.ts debt
npx tsx understand.ts debt --since main
```

## Example: Quiz

```
📖 understand — testing your comprehension of: auth.ts

━━━ Question 1/3 ━━━
Why does the token refresh logic use a mutex instead of a simple flag?
💡 Hint: Consider what happens when two requests trigger refresh simultaneously.

Your answer: To prevent race conditions where both requests try to refresh at the same time

Score: [████████░░] 8/10
Good — you identified the race condition. Missed: the mutex also prevents token invalidation during the refresh window.
```

## Example: Debt Dashboard

```
$ understand debt --since main

━━━ Understanding Debt ━━━

26 code files changed, 26 never quizzed, 5554 total line changes

  🔴 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]  1803 lines  src/DeepDive.tsx
     8 commits, last changed 2026-02-16, never quizzed
  🔴 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]   459 lines  src/understand.ts
     2 commits, last changed 2026-02-16, never quizzed

💡 Start here: understand src/DeepDive.tsx
```

## How It Works

1. Sends your code to an LLM (via OpenRouter) with a prompt optimized for generating understanding questions
2. Questions focus on: purpose, control flow, edge cases, design decisions, failure modes
3. Your answers are evaluated against key concepts the LLM identified
4. Scores are stored in `.understand/history.json` in your repo

## Installation

```bash
# Run directly (no install)
npx understand-code src/auth.ts

# Or install globally
npm install -g understand-code
understand src/auth.ts
```

## Configuration

### Required
- `OPENROUTER_API_KEY` — Get one at [openrouter.ai](https://openrouter.ai/keys)

### Optional
- `UNDERSTAND_MODEL` — LLM model to use (default: `anthropic/claude-sonnet-4`)

Set via environment variable or `.env` file in your project root, git root, or home directory:

```bash
# .env
OPENROUTER_API_KEY=sk-or-...
UNDERSTAND_MODEL=google/gemini-2.0-flash-001  # cheaper alternative
```

## Requirements

- Node.js 18+

## Git Hook (Auto-Quiz on Commit)

Automatically show comprehension questions after commits with significant code changes:

```bash
# Install the hook
cp hooks/post-commit-quiz.sh .git/hooks/post-commit
chmod +x .git/hooks/post-commit

# Enable it
export UNDERSTAND_AUTO_QUIZ=1

# Optional: set minimum changed lines to trigger (default: 20)
export UNDERSTAND_MIN_LINES=50
```

After each commit with 20+ changed lines of code, you'll see comprehension questions. Run `understand --git-diff` to take the quiz.

## MCP Server

For integration with AI coding agents (VS Code, Cursor, pi, etc.):

```bash
npx tsx mcp-server.ts
```

Tools exposed:
- `understand_quiz` — Generate comprehension questions
- `understand_evaluate` — Score answers
- `understand_score` — Track comprehension history
- `understand_git_diff` — Quiz on recent git changes
- `understand_debt` — Cognitive debt dashboard

## Philosophy

- **Active over passive**: Explaining code TO you doesn't build understanding. Quizzing you on it does.
- **Detection over prevention**: We don't change how AI writes code. We verify that you understand what was written.
- **Per-file tracking**: Understanding isn't binary. You might deeply understand `auth.ts` but have zero comprehension of `cache.ts`. Track each file separately.

## See Also

- [Cognitive-Debt-Guard](https://github.com/krishnan/Cognitive-Debt-Guard) — complementary tool that takes the agent-side approach (configures AI to explain as it works)
- [Storey 2026](https://doi.org/PLACEHOLDER) — "Cognitive Debt" paper that named the phenomenon
