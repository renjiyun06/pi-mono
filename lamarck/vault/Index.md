---
aliases:
  - Home
tags:
  - index
---

# Vault

The shared brain of Ren and Lamarck. Memory, knowledge, ideas, issues, directions — everything that needs to persist across sessions lives here.

> [!tip] Agent Entry Point
> When you receive a memory-loader message, follow the [[#Context Restore]] guidelines below.

## Directory Structure

| Directory | Purpose | Description |
|-----------|---------|-------------|
| [[Daily/\|Daily]] | Journal | One note per day — decisions, discoveries, interaction conclusions |
| [[Notes/\|Notes]] | Knowledge base | Technical notes, research findings, ideas, reading notes |
| [[Issues/\|Issues]] | Issue tracker | Open problems, `status: open/resolved` in frontmatter |
| [[Interests/\|Interests]] | Directions | Current and long-term exploration directions |
| [[Meta/\|Meta]] | Operating rules | How this brain works: identity, preferences, environment, autopilot rules |
| [[Projects/\|Projects]] | Project docs | Per-project rules, directions, decisions (code lives in `lamarck/projects/`) |
| [[Bases/\|Bases]] | Dynamic views | `.base` files that auto-aggregate notes |
| [[Sessions/\|Sessions]] | Session digests | Compaction summaries preserved by `session-consolidate.ts` (sleep-time compute v0) |

## How to Use This Vault

### Writing Rules

- **Language**: English for all vault content. Chinese only when a term has no English equivalent.
- **Paths**: Absolute paths use WSL base (`/home/lamarck/pi-mono/...`)
- **Frontmatter**: Every note must have `tags` and `description` (one-line summary). Issues also need `status`. Operational notes that the agent must read on context restore get `priority: high`. Timestamps use filesystem mtime.
- **Wikilinks**: Use `[[filename]]` for internal links, not relative paths.

### Tag Conventions

| Tag | Used for |
|-----|----------|
| `#daily` | Journal entries |
| `#note` | Knowledge notes |
| `#issue` | Issues |
| `#meta` | Operating config |
| `#interests` | Exploration directions |
| `#tool` | Tool-related |
| `#research` | Research findings |
| `#ai` | AI-related |
| `#video` | Video production |
| `#douyin` | Douyin operations |
| `#infra` | Infrastructure |
| `#browser` | Browser automation |
| `#wsl` | WSL environment |
| `#tts` | Text-to-speech |
| `#memory` | Memory system |
| `#pi` | Pi development |

### Context Restore

**On session start** (first turn):

1. Read `vault/briefing.md` — contains condensed summaries of all priority-high notes (infrastructure, tools, strategy). This is the primary context source.
2. Read this file (`Index.md`) for vault structure reference.
3. Run `git log --oneline -15` to see recent commits.
4. Read the most recent `Daily/` note(s) for session history and decisions.
5. Load individual notes on demand when needed for specific tasks.

**After compaction** (mid-session): follow the memory-loader message instructions. The briefing already contains priority-high note summaries — do NOT re-read all 16 priority-high notes individually after reading the briefing, that's redundant.

**When to read full priority-high notes**: Only when you need specific operational details not covered in the briefing summary (e.g., exact command syntax, full code examples).

### Writing Guidelines

When adding new content during a session:

- New discovery → `Notes/` (must have `description` in frontmatter)
- New problem → `Issues/` (must have `status` in frontmatter)
- Work log → Update today's `Daily/` note
- Config change → Update the relevant `Meta/` file

## Overview

### Knowledge Base

![[notes.base#All Notes]]

### Open Issues

![[issues.base#Open Issues]]

## Key Files

### Meta (Operating Rules)
- [[user]] — Information about Ren
- [[soul]] — Lamarck's identity and values
- [[preferences]] — Shared working conventions
- [[autopilot]] — Autonomous mode behavior rules
- [[environment]] — Runtime environment, API keys, toolchain

### Projects
- [[Projects/douyin/index|douyin]] — Douyin account operations, content direction, video production
- [[Projects/debt-call-shield/index|debt-call-shield]] — AI call screening app
- [[Projects/pi/index|pi]] — Pi coding agent development and extensions

### Current Directions
- [[interests]] — Current and long-term focus areas
