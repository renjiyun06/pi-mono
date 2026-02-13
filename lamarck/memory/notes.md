# Technical Notes

## Task System

Location: `/home/lamarck/pi-mono/lamarck/tasks/`

Two types of tasks:

### 1. Agent-driven tasks (`.md` files)
Markdown files with frontmatter config + prompt as body. The scheduler (in main-session extension) picks them up automatically when main session is active. Each task runs as `pi --one-shot` in a tmux session.

Key frontmatter fields: `description` (required), `enabled`, `model`, `cron`, `overlap` (skip/parallel/kill, default: skip).

Each task's sessions are stored in `/home/lamarck/pi-mono/lamarck/tasks/.sessions/<task-name>/`, one `.jsonl` per run.

For detailed authoring guidance (prompt structure, feedback protocol, etc.), see the `task-authoring` skill.

When the task involves browser operations, must first explore target pages to find working `evaluate_script` extraction code before writing the task document. This way the task document can directly include proven JS snippets for data extraction, and the executing agent doesn't need to take screenshots to understand the page — it just runs the scripts.

Exploration method:
1. Open target page with `mcporter`
2. Use `take_snapshot` + `evaluate_script` to probe DOM structure
3. Write and test JS extraction code until it reliably returns the needed data
4. Put the proven JS code directly into the task document as concrete steps

Exploration can be done in main session or delegated to a sub-agent.

### 2. Script tasks (`.ts` files)
For tasks that can be implemented purely with code, use TypeScript scripts instead of agent prompts. Deployment is manual via tmux:
- tmux session name = task name = script filename (without extension)
- Example: `lamarck/tasks/foo.ts` → `tmux new-session -d -s foo 'npx tsx lamarck/tasks/foo.ts'`
- Every script must use `commander` for arg parsing, and support two optional args: `--help` (usage info) and `--describe` (detailed explanation of what the task does)

## Extensions

All custom extensions live in `/home/lamarck/pi-mono/lamarck/extensions/`. To make pi discover them, create a symlink in `.pi/extensions/` pointing back:

```bash
ln -s ../../lamarck/extensions/<name>.ts .pi/extensions/<name>.ts
# For directory extensions:
ln -s ../../lamarck/extensions/<name> .pi/extensions/<name>
```

## Browser

Control Chrome via the `mcporter` skill using the `chrome-devtools` MCP server (navigate, click, fill, screenshot, etc.).

### Multi-tab pattern: keep the origin page intact

When the current page serves as a "base" that you need to return to and continue operating on (feeds, lists, search results, following pages, etc.), never navigate away in the same tab — the page state may refresh, lose scroll position, or reload entirely on return.

Instead, use multi-tab:
1. `new_page url=<target_url>` — open the target in a new tab
2. Operate in the new tab (read, evaluate, like, etc.)
3. `close_page pageId=<new_tab_id>` — close the new tab
4. `select_page pageId=<origin_tab_id>` — switch back to the origin page and continue

Use `new_page` (not `evaluate_script` with `window.open`) — it's a dedicated MCP tool that returns the new page ID directly.

### Avoid redundant screenshots

When switching back to a page that has NOT changed (no scroll, no navigation, no user interaction), do NOT take another snapshot. The page content is identical to what was already seen — a repeat screenshot wastes tokens for zero new information.

Only take a new snapshot after a state-changing action on that page:
- Scrolled down/up
- Clicked something that mutates the page
- Page auto-refreshed or loaded new content

Pattern for feed browsing:
1. Snapshot the feed → identify candidates
2. Open candidate in new tab → evaluate → close tab
3. Switch back to feed tab → **do NOT snapshot again** (nothing changed)
4. Continue evaluating next candidate from the same snapshot
5. Only snapshot again after scrolling to load new content

## WSL ↔ Windows Port Forwarding

Chrome debug ports (19301-19350) listen on `127.0.0.1` only. WSL accesses Windows via `172.30.144.1`, so netsh portproxy rules are needed to forward `172.30.144.1:port → 127.0.0.1:port`.

**Known issue**: After Windows reboot, portproxy rules appear in `netsh interface portproxy show v4tov4` but don't actually work. Must reset and re-add:

```powershell
# Run as Administrator in PowerShell
netsh interface portproxy reset
for ($port = 19301; $port -le 19350; $port++) {
    netsh interface portproxy add v4tov4 listenaddress=172.30.144.1 listenport=$port connectaddress=127.0.0.1 connectport=$port
}
Restart-Service iphlpsvc -Force
```

**When Chrome startup times out in the mcporter wrapper**, the most likely cause is this portproxy issue after a reboot. Remind the user to re-apply the rules.

## Playwright

### CDP connection must be closed
After connecting with `chromium.connectOverCDP()`, must call `browser.close()` before script ends, otherwise Node.js process won't exit.
