# Technical Notes

## Task Scheduler

Location: `/home/lamarck/pi-mono/lamarck/tasks/`

Two types of tasks:

### 1. Agent-driven tasks (`.md` files)
For tasks that need LLM reasoning. Create a markdown file with frontmatter config and prompt as body. The system has a built-in scheduler that only serves `.md` tasks — it picks them up automatically when main session is active.

Frontmatter fields:
- `cron`: Standard 5-field cron expression (minute hour day month weekday)
- `description`: What the task does
- `enabled`: Set to `true` to activate, otherwise ignored
- `model`: LLM model to use, format `provider/model` (default: `anthropic/claude-sonnet-4-5`)
- `skipIfRunning`: If `true`, skip this schedule when the task is still running from a previous trigger
- `allowParallel`: If `true`, allow multiple instances to run simultaneously (with numbered suffixes); if `false` (default), kill the previous run before starting a new one

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

## Playwright

### CDP connection must be closed
After connecting with `chromium.connectOverCDP()`, must call `browser.close()` before script ends, otherwise Node.js process won't exit.
