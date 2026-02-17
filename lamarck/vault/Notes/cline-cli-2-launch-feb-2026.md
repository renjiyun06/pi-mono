---
tags:
  - note
  - research
  - pi
description: "Cline CLI 2.0 launched Feb 13 2026 — terminal-first coding agent with parallel agents, headless mode, ACP. Direct pi competitor."
---

# Cline CLI 2.0 Launch (Feb 2026)

Cline, previously a VS Code sidebar extension, launched CLI 2.0 on Feb 13, 2026 — a terminal-first coding agent.

## Key Features

- **Parallel agents**: Multiple Cline instances on different folders/branches/tasks simultaneously
- **Headless mode**: For CI/CD automation — no interactive terminal needed
- **ACP (Agent Communication Protocol)**: Editor integration for Zed, Neovim, Emacs (not just VS Code)
- **Free model access**: MiniMax M2.5 and Kimi K2.5 at no cost during launch
- **Redesigned TUI**: Full terminal-native interface

## Relevance to Pi

Cline CLI 2.0 is the most direct competitor to pi's terminal coding agent. Comparison:

| Feature | Pi | Cline CLI 2.0 |
|---------|-----|---------------|
| Terminal-native | Yes | Yes |
| Parallel agents | Via tmux/sub-agents | Built-in |
| Headless mode | `--one-shot` | Native headless |
| Editor integration | No (terminal only) | ACP (multi-editor) |
| Extension system | Yes (TypeScript) | MCP + custom |
| Custom tools | Yes (extensions) | MCP servers |
| Free models | No (BYO API key) | Yes (MiniMax, Kimi) |
| Task system | Yes (.md + .ts tasks) | Not mentioned |
| Memory/vault | Yes (Obsidian vault) | Not mentioned |

Pi's differentiators: extension system, task scheduling, vault integration, session compaction.
Cline's differentiators: free model access, parallel agents built-in, editor integration via ACP, larger community.

## Traction

- 1,341 likes on launch tweet
- DevOps.com coverage
- YouTube explainer videos within 24 hours

## Source

- [Blog post](https://cline.bot/blog/introducing-cline-cli-2-0)
- [Twitter](https://twitter.com/cline) — 1.3K likes
