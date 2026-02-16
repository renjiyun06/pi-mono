# Design: Understand as Pi Extension

## Concept

After pi (or any AI coding agent) makes changes, the human reviewer should demonstrate understanding before accepting. This turns the review process from "LGTM rubber-stamp" into active comprehension.

## Why This Matters

CodeRabbit data (470 repos): AI code has 1.7x more bugs, 75% more logic errors, 3x readability issues. The Law of Triviality means large AI-generated diffs get rubber-stamped. The human's understanding degrades with each accepted PR they didn't deeply review.

Eisele (2026): "Forensic code review" is the defining skill. But humans don't do it because it's effortful and there's no mechanism forcing it.

## How It Would Work

### Option A: Post-Session Quiz (simplest)

After an interactive pi session, before the user closes:

```
Pi made 3 changes this session. Quick understanding check:

1. In stream.ts, why was the retry logic changed from exponential to linear backoff?
   > [user types answer]
   ✅ Good — you mentioned the timeout budget constraint.

2. What edge case does the new null check in transform-messages.ts handle?
   > [user types answer]
   ⚠️  Partial — you missed the nested tool_result case.

Session understanding: 75%
```

This takes 2 minutes and catches the "I have no idea what the agent just did" problem.

### Option B: Commit Gate (more enforcement)

Pi refuses to commit until the user passes a basic understanding quiz on the changes:

```
$ git commit -m "fix: retry logic"
🔒 Understanding check required for AI-assisted changes.

What was the root cause of the bug this commit fixes?
> [user types answer]
✅ Correct. Committing.
```

Risk: annoying for trivial changes. Needs smart thresholds (only trigger for significant changes).

### Option C: Passive Tracking (least intrusive)

Understand runs in background, tracking which files changed and when the user last demonstrated understanding. Dashboard shows understanding debt:

```
$ understand summary
Files with accumulated understanding debt:
❌  12%  packages/ai/src/providers/bedrock.ts  (changed 15 times, quizzed 0)
⚠️  45%  packages/tui/src/editor.ts             (changed 8 times, quizzed once 3 weeks ago)
✅  88%  packages/agent/src/tools.ts            (quizzed yesterday)
```

## Implementation Path

For pi specifically (as an extension):
1. Hook into `tool_call_end` events to track which files were modified
2. At session end, generate 1-2 questions about the most significant changes
3. Store scores in `.understand/history.json`

For general use (standalone tool):
1. Parse git log for recent AI-assisted commits (heuristic: large diffs, agent commit messages)
2. Generate questions about the most changed files
3. `understand review` command for periodic check-ups

## Dogfooding

We (Ren reviewing Lamarck's autopilot work) are the perfect first users. Ren currently reviews by:
1. Reading REVIEW-START-HERE.md
2. Looking at summary grids
3. Watching videos

But for CODE changes, there's no structured review process. 65+ commits on autopilot-0008 — does Ren understand what changed in DeepDive.tsx? In render-with-voice.ts? In the Manim scripts?

This is exactly the cognitive debt pattern we document in 16 studies. And we're experiencing it ourselves.

## Non-Goals (for now)

- Not a code review tool (CodeRabbit, SonarQube do that)
- Not a learning platform (LeetCode, Exercism do that)
- Not an AI code explainer (Cursor's "explain" does that — passively)
- The unique value: forces ACTIVE comprehension of code you didn't write, in YOUR codebase
