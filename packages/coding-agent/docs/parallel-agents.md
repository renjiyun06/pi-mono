# Parallel Agents

Run multiple pi instances simultaneously on different branches of the same session. Each agent works independently with its own conversation context, while sharing the same underlying Git repository.

## How It Works

Pi sessions are stored as Git repositories. Parallel agents use [Git worktrees](https://git-scm.com/docs/git-worktree) to allow multiple agents to work on different branches of the same session concurrently. Each worktree provides an isolated working copy tied to a specific branch, while all commits are shared across the repository.

## Quick Start

1. In your current pi session, create a branch for the parallel work (using `checkout`)
2. Run the `/parallel` command with the branch ID:
   ```
   /parallel <branchId>
   ```
3. Start the parallel agent in a new terminal:
   ```bash
   pi --session-repo <branchId>
   ```

Or let pi handle the launch automatically:
```
/parallel run <branchId>
```

## The `/parallel` Command

### Usage

| Command | Description |
|---------|-------------|
| `/parallel <branchId>` | Mark branch as parallel, create worktree, show start instructions |
| `/parallel run <branchId>` | Same as above, plus launch pi in a tmux session |
| `/parallel run <branchId> <message>` | Same as above, with an initial message for the new agent |

### What It Does

1. **Marks the branch** — Writes a `parallel_entry_branch` record on the target branch, establishing it as the root of a parallel subtree
2. **Creates a worktree** — Runs `git worktree add` to create an isolated working copy at `<session-repo>.worktrees/<branchId>`
3. **Launches (optional)** — With `run`, starts a new pi instance in a detached tmux session

## The `--session-repo` Flag

Use `--session-repo` to start pi against a specific worktree:

```bash
# Full path
pi --session-repo /path/to/worktree

# Short name (resolves to <most-recent-session>.worktrees/<name>)
pi --session-repo <name>
```

This is also used to resume a parallel agent after it has been stopped.

## Subtree Constraint

When parallel agents are active, each agent is restricted to its own subtree:

- The entry branch (marked by `/parallel`) is the subtree root
- The agent can freely create and switch between sub-branches within its subtree
- The agent **cannot** checkout or merge to branches outside its subtree
- This is enforced automatically — checkout/merge to outside branches will fail with an error

This prevents conflicts between parallel agents working on different parts of the session.

## Cleanup

When a parallel agent is done, remove its worktree:

```bash
cd <session-repo-path>
git worktree remove "<session-repo-path>.worktrees/<branchId>"
```

All commits made by the parallel agent remain in the shared repository. The branch is still accessible via `checkout` from any agent.

## Example Workflow

```
Main session: Discuss requirements, agree on API contract
  │
  ├── checkout → "frontend" branch
  ├── checkout → "backend" branch
  │
  ├── /parallel frontend
  ├── /parallel run backend "Implement the REST API endpoints"
  │
  ├── (frontend agent works in its own terminal)
  ├── (backend agent works in tmux)
  │
  └── Results merge back when done
```

## Limitations

- **One branch per worktree** — Git requires each worktree to have a unique branch. Two agents cannot be on the same branch simultaneously.
- **User-initiated** — The agent cannot launch parallel instances on its own. The user must run `/parallel` or start pi manually.
- **Shared working directory** — All agents share the same project working directory. Be mindful of file conflicts if agents edit the same files.
