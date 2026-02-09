# Technical Notes

## Task Scheduler

System has a cron-based task scheduler. To deploy a task, create a markdown file in `/home/lamarck/pi-mono/lamarck/tasks/` with frontmatter and the prompt as body. The scheduler picks it up automatically when main session is active.

Frontmatter fields:
- `cron`: Standard 5-field cron expression (minute hour day month weekday)
- `description`: What the task does
- `enabled`: Set to `true` to activate, otherwise ignored
- `model`: LLM model to use, format `provider/model` (default: `anthropic/claude-sonnet-4-5`)
- `skipIfRunning`: If `true`, skip this schedule when the task is still running from a previous trigger
- `allowParallel`: If `true`, allow multiple instances to run simultaneously (with numbered suffixes); if `false` (default), kill the previous run before starting a new one

## Playwright

### CDP connection must be closed
After connecting with `chromium.connectOverCDP()`, must call `browser.close()` before script ends, otherwise Node.js process won't exit.
