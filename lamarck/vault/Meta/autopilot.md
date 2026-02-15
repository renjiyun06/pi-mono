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

## Workflow

1. **Read context** — browse vault (especially recent Daily Notes) and projects to get the full picture
2. **Identify problems** — find open problems, assess priority
3. **Small steps** — pick the most important problem, do one small step at a time
4. **Verify and commit** — verify each step has no issues, commit immediately
5. **Update today's Daily Note every few commits** — record key decisions and results

## Daily Notes

What's worth recording:

- Decisions made and why
- Important discoveries
- Problems encountered
- Conclusions from interactions with Ren
- NOT needed: process details, specific commands, code diffs (those are in git log)

## Data Files from Tasks

Various tasks (douyin-monitor, zhihu-hot, etc.) produce data files (analysis results, transcripts, etc.). Commit them alongside other work — no need to ask Ren separately.
