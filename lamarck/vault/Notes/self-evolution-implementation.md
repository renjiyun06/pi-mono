---
tags:
  - note
  - pi
  - infra
description: "Implementation of pi self-evolution infrastructure — supervisor script + extension tools for safe code self-modification"
priority: high
---

# Self-Evolution Implementation

Based on research in [[self-evolution-frameworks-research]]. Implements the DGM-inspired architecture adapted for pi.

## Components

### 1. Supervisor Script (`lamarck/tools/pi-supervisor.sh`)

Bash watchdog that runs OUTSIDE pi. Handles:
- **Restart on crash**: Increments crash counter, restarts after 2s delay
- **Rollback after 3 crashes**: Reverts `packages/` to last known-good git ref
- **Intentional restart (exit 42)**: Rebuilds (`npm run check`) and restarts
- **Clean shutdown (exit 0)**: Supervisor exits

State stored in `.pi-supervisor/`:
- `crash_count` — consecutive crash counter (reset on clean exit or intentional restart)
- `last_good_ref` — git ref of last successful build
- `restart_reason` — log of why restarts were requested
- `supervisor.log` — full activity log

Usage: `./lamarck/tools/pi-supervisor.sh --continue` (or any pi args)

### 2. Self-Evolve Extension (`lamarck/extensions/self-evolve.ts`)

Three tools (main-session only):

| Tool | Purpose |
|------|---------|
| `evolve_check` | Run `npm run check` — verify code compiles before restart |
| `evolve_restart` | Exit with code 42 — supervisor catches and rebuilds |
| `evolve_status` | Show supervisor state, crash count, git state |

### 3. Workflow

```
Agent identifies problem in packages/
    ↓
Agent uses edit/write to modify source
    ↓
Agent calls evolve_check
    ↓ (if passes)
Agent calls evolve_restart with reason
    ↓
Pi exits with code 42
    ↓
Supervisor: npm run check → rebuild
    ↓ (if passes)          ↓ (if fails)
Restart pi              Rollback to last_good_ref
with --continue         Restart pi
```

### 4. State Migration

Most state survives restart automatically (file-based):
- Session history (`.jsonl` files)
- Settings (`settings.json`)
- Auth (`auth.json`)
- Vault notes

What's lost on restart:
- In-flight LLM response (if mid-turn)
- Extension runtime state (reconstructed on startup)
- Main-session lock (re-acquired on startup)

The `--continue` flag ensures the session resumes from where it left off.

## Safety Properties

1. **Agent cannot crash the supervisor** — supervisor is a separate process
2. **3-crash rollback** — repeated failures automatically revert to last good state
3. **Build verification** — `npm run check` must pass both before restart (agent-side) and during restart (supervisor-side)
4. **Git-based versioning** — every modification is trackable, revertible
5. **Session continuity** — `--continue` flag preserves conversation context

## Limitations

1. **No parallel testing** — can't run new version alongside old version to compare behavior
2. **No automated evaluation** — "does it still work?" is only verified by build check, not behavioral test
3. **Supervisor not yet integrated with tmux** — for true blue-green deployment, would need tmux orchestration
4. **Extension hot-reload still separate** — extension changes use `reload_extensions`, not `evolve_restart`

## Status

- [x] Supervisor script written and executable
- [x] Extension written and symlinked
- [ ] Test supervisor in tmux session
- [ ] Verify end-to-end: modify → check → restart → resume
- [ ] Add to autopilot startup procedure
