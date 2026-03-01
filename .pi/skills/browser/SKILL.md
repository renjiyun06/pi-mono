---
name: browser
description: Browse the web using a real Chrome browser. Use when you need to visit websites, read web pages, interact with web UI, extract web content, or verify login state.
---

# Browser

You have access to a real Chrome browser via the `playwright-cli` command. The browser preserves login sessions — sites where the user is already logged in will remain logged in.

## Quick Start

```bash
# Open browser (must be called first)
playwright-cli open

# Navigate to a URL
playwright-cli goto https://example.com

# Close browser when done
playwright-cli close
```

## Key Rules

1. **Always `open` first** — you must call `playwright-cli open` before any other browser command.
2. **Use `snapshot` to see the page** — after navigating, use `snapshot` to get a structured view of the page with element references (ref numbers).
3. **Use ref numbers to interact** — `click`, `fill`, `hover`, etc. all take a ref number from the snapshot.
4. **Close when done** — call `playwright-cli close` when you no longer need the browser. If you forget, it will be cleaned up automatically on session exit.

## Common Workflow

```bash
# 1. Open browser
playwright-cli open

# 2. Navigate
playwright-cli goto https://example.com

# 3. Take snapshot to see elements
playwright-cli snapshot

# 4. Interact using ref numbers from snapshot
playwright-cli click 42
playwright-cli fill 15 "search query"
playwright-cli press Enter

# 5. Take another snapshot to see results
playwright-cli snapshot

# 6. Close when done
playwright-cli close
```

## Command Reference

Run `playwright-cli --help` for the full command list. Key commands:

| Command | Description |
|---------|-------------|
| `open [url]` | Open browser, optionally navigate to URL |
| `close` | Close the browser |
| `goto <url>` | Navigate to a URL |
| `snapshot` | Capture page snapshot with element refs |
| `click <ref>` | Click an element |
| `fill <ref> <text>` | Fill text into an input field |
| `type <text>` | Type text into the focused element |
| `press <key>` | Press a key (e.g., `Enter`, `Tab`, `ArrowDown`) |
| `select <ref> <value>` | Select a dropdown option |
| `hover <ref>` | Hover over an element |
| `screenshot [ref]` | Take a screenshot of the page or element |
| `eval <code> [ref]` | Run JavaScript on the page or element |
| `tab-list` | List all tabs |
| `tab-new [url]` | Open a new tab |
| `tab-select <index>` | Switch to a tab |
| `tab-close [index]` | Close a tab |
| `go-back` / `go-forward` / `reload` | Navigation |

## Notes

- The browser runs in headless mode — there is no visible window.
- Session management is handled automatically — do not pass `-s` or `--session` flags.
- You do not need to install anything — the browser is ready to use.
