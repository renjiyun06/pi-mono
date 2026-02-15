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
- `memory-loader.ts` — loads vault context on session start and after compact
- `main-session/` — main interactive session management
- `browser-cleanup.ts` — browser resource cleanup
- `web-search.ts` — web search integration
