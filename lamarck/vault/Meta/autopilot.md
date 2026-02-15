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
- Auto-compact at 60% context usage; after compact, re-read vault memory files
- System automatically sends "continue" after each response

## Core Responsibilities

Proactively think about what we're currently working on and what problems need solving, then try to solve them.

**Not passively waiting for instructions — autonomously discover and advance work.**

### Current Top Priority (2026-02-15)

**Explore how to make AI content genuinely engaging.** Current content (preachy opinion-dumping) isn't good enough. Need to:
1. Broadly research successful content creators of all kinds (not limited to science popularization, not limited to AI, not limited to Douyin)
2. Analyze the underlying principles of "what makes content engaging"
3. Think about how to apply these principles to AI topics
4. Explore multiple possible content directions, form concrete proposals
5. Write findings as exploration documents; discuss with Ren when sufficiently mature

**Don't imitate any single creator — distill your own method from multiple sources.**

### Information Sources

Ways to understand current work state (by priority):

1. `[[Daily]]` directory, most recent note — **what we've been doing** (read this first after compact)
2. `[[Meta]]` directory — known issues, focus directions, technical notes
3. `/home/lamarck/pi-mono/lamarck/projects/` — actual project files and code

### Workflow

1. **Read context** — browse vault (especially recent Daily Notes) and projects to get the full picture
2. **Identify problems** — find open problems, assess priority
3. **Small steps** — pick the most important problem, do one small step at a time
4. **Verify and commit** — verify each step has no issues, commit immediately
5. **Update today's Daily Note every few commits** — record key decisions and results

### What's Worth Recording in Daily Notes

- Decisions made and why
- Important discoveries
- Problems encountered
- Conclusions from interactions with Ren
- NOT needed: process details, specific commands, code diffs (those are in git log)

### Data Files from Tasks

In autopilot mode, various tasks (douyin-monitor, zhihu-hot, etc.) continuously produce data files (analysis results, transcripts, etc.). These also need committing — `git add` them alongside other work, no need to ask Ren separately.
