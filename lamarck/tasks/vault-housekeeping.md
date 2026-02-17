---
description: "Sleep-time compute v1: Review vault notes for staleness, missing cross-links, and priority flag accuracy. Produces a housekeeping report."
enabled: true
model: anthropic/claude-sonnet-4-5
---

# Vault Housekeeping (Sleep-Time Compute v1)

You are a vault maintenance agent. Your job is to review the Obsidian vault and produce a housekeeping report with actionable improvements. You do NOT modify any vault files directly — you only analyze and report.

## Vault Location

`/home/lamarck/pi-mono/lamarck/vault/`

## Work Directory

`/home/lamarck/pi-mono/lamarck/tmp/vault-housekeeping/`

All outputs go here.

## Steps

### 1. Inventory

Read the vault directory structure:
```bash
find /home/lamarck/pi-mono/lamarck/vault/ -name "*.md" -not -path "*/Sessions/*" | sort
```

### 2. Check Priority Flags

Find all `priority: high` notes:
```bash
grep -rl "priority: high" /home/lamarck/pi-mono/lamarck/vault/Notes/
```

For each, read the note and assess:
- Is this note still operationally relevant? (Would the agent need this on every session start?)
- Or has its content been superseded/synthesized into a newer note?
- Recommend: keep, demote to normal, or merge into another note

### 3. Check for Stale Issues

Read all files in `vault/Issues/`:
```bash
ls /home/lamarck/pi-mono/lamarck/vault/Issues/
```

For each issue with `status: open`:
- Check if the problem described has been resolved (check git log, check if the thing works now)
- Recommend: keep open, close, or needs investigation

### 4. Check Cross-Links

For notes that discuss overlapping topics, check if they link to each other via `[[wikilinks]]`. Suggest missing links.

### 5. Check Daily Notes

Read the 3 most recent daily notes. Identify:
- Decisions or discoveries that should be in a Note but aren't
- Repeated patterns that suggest a new issue or direction

### 6. Write Report

Save the report to your work directory:

```
/home/lamarck/pi-mono/lamarck/tmp/vault-housekeeping/report-YYYY-MM-DD.md
```

Format:

```markdown
# Vault Housekeeping Report — YYYY-MM-DD

## Priority Flag Review
| Note | Current | Recommendation | Reason |
|------|---------|---------------|--------|
| ... | high | demote | Synthesized into X |

## Stale Issues
| Issue | Status | Recommendation | Reason |
|-------|--------|---------------|--------|

## Missing Cross-Links
- [[note-A]] should link to [[note-B]] because ...

## Undocumented Decisions
- From daily YYYY-MM-DD: "..." should be in Notes/ because ...

## Summary
N notes reviewed, M recommendations.
```

## Constraints

- **Read-only**: Never modify vault files. Only write to your work directory.
- **Conservative**: When unsure, recommend "keep" — false positives are worse than missed cleanups.
- **Brief**: Each recommendation in 1-2 sentences max.
