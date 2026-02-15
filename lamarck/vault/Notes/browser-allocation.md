---
tags:
  - note
  - browser
  - infra
description: "Browser allocation: each pi process gets an isolated Chrome instance via mcporter wrapper"
---

# Browser Allocation

Each pi agent process gets its own isolated Chrome browser instance. This is handled by a wrapper script at `/home/lamarck/pi-mono/lamarck/bin/mcporter` that intercepts all `mcporter` calls.

## How It Works

1. **Non-chrome calls** pass through directly to the real `mcporter` binary.
2. **First `chrome-devtools` call** from a pi process triggers setup:
   - Walk up the process tree to find the pi PID (`find_pi_pid`)
   - Acquire a free port from range 19301-19350 using atomic file locks (`/tmp/mcporter-locks/port-*.lock`)
   - Copy the base Chrome user data directory (`D:\chrome` → `D:\chromes\chrome-<pi_pid>`) via `robocopy`
   - Launch headless Chrome on Windows with `--remote-debugging-port=<port>` and the copied profile
   - Wait up to 10s for Chrome to respond on `http://172.30.144.1:<port>/json/version`
   - Generate a per-process mcporter config (`/tmp/mcporter-<pi_pid>.json`) pointing `chrome-devtools` to the allocated port
   - Write state file (`/tmp/pi-browser-<pi_pid>.json`) for subsequent calls
3. **Subsequent calls** detect the state file and reuse the existing config.

## Key Details

- **Port locking**: Uses `set -o noclobber` for atomic lock file creation, preventing race conditions when multiple pi processes start simultaneously.
- **Profile isolation**: Each pi process gets a full copy of the Chrome profile, so cookie state and sessions are independent.
- **WSL → Windows**: Chrome runs on Windows, accessed from WSL via the Windows host IP (`172.30.144.1`). This requires netsh portproxy rules — see [[wsl-port-forwarding]].
- **No cleanup**: The wrapper only creates; it does not clean up Chrome processes or copied profiles on pi exit. Cleanup is manual.

## Implications for Agents

- An agent doesn't need to think about browser setup — just call `mcporter call chrome-devtools.<tool>` and the wrapper handles the rest.
- Multiple agents (main session + task agents) can run simultaneously, each with their own browser.
- The shared Chrome profile base means all instances start with the same cookies/login state (e.g., Douyin login).
