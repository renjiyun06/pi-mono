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

## Browser

Control Chrome via the `mcporter` skill using the `chrome-devtools` MCP server (navigate, click, fill, screenshot, etc.).

## Playwright

### CDP connection must be closed
After connecting with `chromium.connectOverCDP()`, must call `browser.close()` before script ends, otherwise Node.js process won't exit.
