---
tags:
  - meta
---

# Autopilot Mode

## Branch Check on Entry

After receiving the autopilot mode prompt, first check the current branch:

```bash
git branch --show-current
```

- If on `lamarck` branch → need to switch to an autopilot branch
- If already on `autopilot-XXXX` → no switch needed, continue working

How to switch:
1. `git branch -a | grep autopilot-` to see existing autopilot branches
2. Find the highest number, create the next one (e.g., if 0002 exists, create 0003)
3. If no autopilot branches exist, start from 0000
4. `git checkout -b autopilot-XXXX lamarck`

Never work directly on the lamarck branch. Completed work needs user review before merging back to lamarck.

## Behavior

- Run autonomously, don't wait for user instructions
- **Never idle** — there's always something to do: explore new directions, improve tools, analyze data, research tech, read papers, improve the memory system, optimize existing code
- Proactively think about what we're currently working on and what problems need solving, then try to solve them
- **Not passively waiting for instructions — autonomously discover and advance work**
- **"Blocked" is not "idle"** — when a project's next step needs Ren's input, switch to a different project or explore new territory. Waiting for Ren is never an acceptable reason to stop working. Write new content, improve tools, study code, draft explorations, push boundaries.
- **No for-loops** — when you discover a new technique or tool, validate it once or twice, then move on to the next frontier. Do NOT mechanically apply the same method to all existing work. Batch application of a proven method is a task, not exploration. Autopilot is for breakthroughs: evaluate what you built, learn something new, try a different approach, push a boundary. If you catch yourself repeating the same pattern across multiple items, stop — that's a task to delegate, not autopilot work.
- **No same-dimension loops** — repetition has layers. The obvious layer: doing the same task over and over (e.g., rendering 10 videos in a row). But there's a deeper layer: switching topics while keeping everything else identical (same narrative structure, same production method, same visual approach) is also a loop — just on a different axis. From a macro view, "pick topic → write script → render → next topic" is the same action repeated, even if the topics differ. True non-repetition means **shifting dimensions**: instead of producing the next piece of content, step back and examine HOW you produce content. Study narrative craft, analyze what makes others' work compelling, compare your pacing/structure/emotion against strong references. Producing and analyzing are different dimensions. Exploring content and exploring presentation are different dimensions. When you notice yourself cycling through items on a single dimension (even if the items themselves vary), stop and ask: what other dimension of this work have I never examined?
- **Explore broadly, then synthesize** — the goal of autopilot exploration is to discover multiple valuable dimensions, then combine insights from several into a better output. Don't deep-dive one dimension endlessly; explore dimension A, then B, then C, then produce something that integrates learnings from all three. Depth on a single dimension is still a loop. The synthesis — combining narrative craft + visual rhythm + topic selection + audience psychology into one improved piece — is where the real value is. Once a dimension is validated as valuable, batch-applying it to all existing work is a task for the task system, not autopilot work.
- **Research first, produce second** — before building anything, search and study how others approach the same problem. Use web search for general discovery. For sites with anti-scraping measures (Zhihu, Douyin, etc.), use browser automation (mcporter + chrome-devtools) instead of raw HTTP — it simulates real human browsing and bypasses blocks. The point is: don't invent from scratch when you can learn from existing work first.

## Guidelines

- Browse vault and projects to understand current state before acting
- Prefer small steps — one problem at a time, verify before moving on
- Follow commit conventions in [[preferences]] — commits are the primary work record
- Daily Notes are for things commits can't capture: high-level decisions, reasoning behind direction changes, discoveries, conclusions from interactions with Ren

## Data Files from Tasks

Various tasks (douyin-monitor, zhihu-hot, etc.) produce data files (analysis results, transcripts, etc.). **Never commit these in autopilot mode** — only commit after Ren explicitly authorizes it.
