---
tags:
  - note
  - infra
---

# Task System

Location: `/home/lamarck/pi-mono/lamarck/tasks/`

Two types of tasks:

## 1. Agent-driven tasks (`.md` files)
Markdown files with frontmatter config + prompt as body. The scheduler (in main-session extension) picks them up automatically when main session is active. Each task runs as `pi --one-shot` in a tmux session.

Key frontmatter fields: `description` (required), `enabled`, `model`, `cron`, `after` (trigger after another task's sessions, e.g. `other-task/3`), `overlap` (skip/parallel/kill, default: skip).

Each task's sessions are stored in `/home/lamarck/pi-mono/lamarck/tasks/.sessions/<task-name>/`, one `.jsonl` per run.

For detailed authoring guidance (prompt structure, feedback protocol, etc.), see the `task-authoring` skill.

When the task involves browser operations, must first explore target pages to find working `evaluate_script` extraction code before writing the task document. This way the task document can directly include proven JS snippets for data extraction, and the executing agent doesn't need to take screenshots to understand the page — it just runs the scripts.

Exploration method:
1. Open target page with `mcporter`
2. Use `take_snapshot` + `evaluate_script` to probe DOM structure
3. Write and test JS extraction code until it reliably returns the needed data
4. Put the proven JS code directly into the task document as concrete steps

Exploration can be done in main session or delegated to a sub-agent.

## 2. Script tasks (`.ts` files)
For tasks that can be implemented purely with code, use TypeScript scripts instead of agent prompts. Deployment is manual via tmux:
- tmux session name = task name = script filename (without extension)
- Example: `lamarck/tasks/foo.ts` → `tmux new-session -d -s foo 'npx tsx lamarck/tasks/foo.ts'`
- Every script must use `commander` for arg parsing, and support two optional args: `--help` (usage info) and `--describe` (detailed explanation of what the task does)
