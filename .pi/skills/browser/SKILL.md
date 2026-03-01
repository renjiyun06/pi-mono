---
name: browser
description: Browse the web using a real Chrome browser. Use when you need to visit websites, read web pages, interact with web UI, or extract web content.
---

# Browser

You have access to a real Chrome browser via the `playwright-cli` command.

Before first use, run `playwright-cli --help` to learn available commands and usage.

## Key Rules

1. **Always `open` first** — you must call `playwright-cli open` before any other browser command.
2. **Do not pass `-s` or `--session` flags** — session management is handled automatically.
3. **Close when done** — call `playwright-cli close` when you no longer need the browser. If you forget, it will be cleaned up automatically on session exit.
