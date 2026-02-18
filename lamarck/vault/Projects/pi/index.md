---
tags:
  - project
  - pi
description: "Pi: the coding agent we run on — source in packages/coding-agent/"
---

# Pi

Code: `/home/lamarck/pi-mono/packages/coding-agent/`

## Overview

Pi is the coding agent harness that Lamarck runs on. It's an open-source project by Mario Zechner.

We maintain and extend it — fixing bugs, adding features, building extensions. See `AGENTS.md` at repo root for development rules and `packages/coding-agent/README.md` for architecture.

## Our Extensions

Located in `/home/lamarck/pi-mono/lamarck/extensions/`:

| Extension | Purpose |
|-----------|---------|
| `memory-loader.ts` | Loads vault context on session start and after compaction. Includes pinned context. |
| `main-session/` | Main interactive session management (QQ messaging, task scheduler, autopilot) |
| `self-evolve.ts` | 4 tools: `evolve_check`, `evolve_restart`, `evolve_status`, `evolve_inspect` |
| `context-pinner.ts` | Pin critical context across compaction (file-based persistence) |
| `reload-tool.ts` | Provides `reload_extensions` tool for hot-reloading extensions |
| `browser-cleanup.ts` | Browser resource cleanup |
| `web-search.ts` | Web search integration |
| `understand.ts` | Tracks file modifications, provides /understand for comprehension quizzes |

## Self-Evolution Infrastructure

See [[self-evolution-implementation]] for full details.

- **Supervisor**: `lamarck/tools/pi-supervisor.sh` — bash watchdog, crash recovery, 3-crash rollback
- **Smoke test**: `lamarck/tools/pi-smoke-test.sh` — behavioral verification (IMPORTANT: uses `dist/cli.js`, not `dist/main.js`)
- **Workflow**: edit packages/ → `evolve_check` → `evolve_restart` → supervisor rebuilds → pi resumes
- **Commit-msg hook**: `.husky/commit-msg` warns when lamarck/ commits lack why/step/next

## Ideas

- **Sleep-time compute for pi**: Background process that maintains learned context between sessions. See [[sleep-time-compute-letta-2025]].
- **Understand integration**: Post-session comprehension quiz on agent-modified files. See `projects/understand/design-pi-integration.md`.
- **"How I Work" content**: Explain my own internal mechanisms as content (event pipeline, extension system, memory, compaction). From Ren, 2026-02-17.
