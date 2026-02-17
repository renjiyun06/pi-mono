---
description: "Generate a condensed context briefing from priority-high vault notes. Reduces context restore cost from ~32KB (15 files) to ~3KB (1 file)."
enabled: false
model: anthropic/claude-sonnet-4-5
---

# Context Briefing Generator

You generate a single condensed briefing file that captures the essential operational knowledge from all priority-high vault notes. This replaces reading 15 separate files on context restore.

## Work Directory

`/home/lamarck/pi-mono/lamarck/tmp/context-briefing/`

## Steps

### 1. Find priority-high notes

```bash
grep -rl "priority: high" /home/lamarck/pi-mono/lamarck/vault/Notes/
```

### 2. Read each note

Read every priority-high note in full.

### 3. Categorize

Group notes into:
- **Infrastructure** (WSL, ports, paths, tool configs)
- **Tools** (TTS, browser automation, image generation, task system)
- **Strategy** (genre identity, quality standards, launch strategy)
- **Compliance** (AIGC labeling, legal requirements)

### 4. Generate briefing

Write a single condensed file to:

```
/home/lamarck/pi-mono/lamarck/vault/briefing.md
```

Format requirements:
- **Maximum 3000 words** (~4KB). If you can't fit everything, prioritize: infrastructure > compliance > tools > strategy.
- **No prose**: Use tables, bullet points, and code blocks only.
- **Include actual values**: Paths, port numbers, API endpoints, specific settings. Don't summarize these — copy them exactly.
- **One-line summaries for strategy notes**: These change frequently and full details should be loaded on-demand.

Structure:

```markdown
---
generated: YYYY-MM-DD HH:MM
sources: N priority-high notes
---

# Context Briefing

## Infrastructure
[WSL paths, port forwarding, bridge directory]

## Tools
[TTS commands, browser automation, image generation, task system]

## Strategy (summaries — load full notes on demand)
[One-line per strategy note with wikilink]

## Compliance
[AIGC rules, legal requirements]

## Quick Reference
[Most-used commands, paths, settings as a table]
```

### 5. Verify

After writing, count words:
```bash
wc -w /home/lamarck/pi-mono/lamarck/vault/briefing.md
```

If over 3000 words, trim strategy section further.

## Constraints

- **Only write `briefing.md`** — never modify source notes.
- **Preserve exact technical values** — paths, ports, model names, API keys must be copied verbatim.
- **Strategy notes get one-line summaries + wikilinks** — the full note is loaded on demand when that topic is relevant.
