---
name: understand
description: Quiz developers on code comprehension using the Understand MCP server. Use when the user asks to test their understanding of code, check comprehension scores, or after accepting significant AI-generated code changes.
---

# Understand

Quiz developers on their understanding of code. Uses the Understand MCP server via mcporter.

## When to Use

- User asks "do I understand this code?" or "quiz me on this"
- User wants to check comprehension scores
- After significant code changes, proactively suggest a quiz

## Generate Questions

```bash
source /home/lamarck/pi-mono/.env && export OPENROUTER_API_KEY && \
mcporter call understand.understand_quiz \
  code="$(cat path/to/file.ts)" \
  filename="file.ts" \
  count=3
```

Returns JSON array of questions with `question`, `key_concepts`, and `difficulty`.

## Evaluate an Answer

```bash
source /home/lamarck/pi-mono/.env && export OPENROUTER_API_KEY && \
mcporter call understand.understand_evaluate \
  question="The question text" \
  key_concepts='["concept1", "concept2"]' \
  answer="The developer's answer" \
  code="$(cat path/to/file.ts)" \
  filename="file.ts"
```

Returns `score` (0-10), `feedback`, and `missed` concepts.

## Check Scores

```bash
mcporter call understand.understand_score \
  directory="/path/to/project"
```

Returns per-file scores, average, and at-risk files below threshold.

## Workflow

1. Read the file to quiz on
2. Call `understand_quiz` to generate questions
3. Present questions one at a time to the user
4. For each answer, call `understand_evaluate`
5. Report scores and missed concepts

## Notes

- Requires `OPENROUTER_API_KEY` in `/home/lamarck/pi-mono/.env`
- Scores persist in `.understand/history.json` relative to server CWD
- Questions test design decisions and failure modes, not syntax memorization
