---
aliases:
  - Home
tags:
  - index
---

# Vault

The shared brain of Ren and Lamarck. Memory, knowledge, ideas, issues, directions — everything that needs to persist across sessions lives here.

> [!tip] Agent Entry Point
> After compact, read [[#How to Use This Vault]] first, then the most recent [[Daily]] note to restore context.

## Directory Structure

| Directory | Purpose | Description |
|-----------|---------|-------------|
| [[Daily/\|Daily]] | Journal | One note per day — decisions, discoveries, interaction conclusions |
| [[Notes/\|Notes]] | Knowledge base | Technical notes, research findings, ideas, reading notes |
| [[Issues/\|Issues]] | Issue tracker | Open problems, `status: open/resolved` in frontmatter |
| [[Interests/\|Interests]] | Directions | Current and long-term exploration directions |
| [[Meta/\|Meta]] | Operating rules | How this brain works: identity, preferences, environment, autopilot rules |
| [[Bases/\|Bases]] | Dynamic views | `.base` files that auto-aggregate notes |

## How to Use This Vault

### Writing Rules

- **Language**: English for all vault content. Chinese only when a term has no English equivalent.
- **Paths**: Absolute paths use WSL base (`/home/lamarck/pi-mono/...`)
- **Frontmatter**: Every note must have `tags`, `description` (one-line summary), `created`, and `updated` dates. Issues also need `status`. Operational notes that the agent must read on session start get `priority: high`.
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

### On Session Start

These are guidelines for restoring context, not a strict sequence:

- Read the most recent `Daily/` note to restore context
- Run `grep -rl "priority: high" lamarck/vault/Notes/` to find essential notes, then read them in full
- Run `grep -rl "status: open" lamarck/vault/Issues/` to check open problems
- Other notes are discovered as needed during work (search by filename or keywords)

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

### Current Directions
- [[interests]] — Current and long-term focus areas
