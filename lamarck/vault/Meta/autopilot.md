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

## Guidelines

- Browse vault and projects to understand current state before acting
- Prefer small steps — one problem at a time, verify before moving on
- Follow commit conventions in [[preferences]] — commits are the primary work record
- Daily Notes are for things commits can't capture: high-level decisions, reasoning behind direction changes, discoveries, conclusions from interactions with Ren

## Data Files from Tasks

Various tasks (douyin-monitor, zhihu-hot, etc.) produce data files (analysis results, transcripts, etc.). **Never commit these in autopilot mode** — only commit after Ren explicitly authorizes it.
