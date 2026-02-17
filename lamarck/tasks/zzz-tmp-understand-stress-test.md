---
description: Stress-test the Understand MCP server by quizzing on 5 different files and evaluating question quality
enabled: true
model: anthropic/claude-sonnet-4-5
---

# Understand MCP Stress Test

## Background
The Understand MCP server generates code comprehension questions. We improved the prompt to generate file-specific questions instead of generic engineering patterns. This task validates the improvement across diverse file types.

## Setup
Load the OPENROUTER_API_KEY from `/home/lamarck/pi-mono/.env`:
```bash
export $(grep OPENROUTER /home/lamarck/pi-mono/.env)
```

## Steps

For each of these 5 files, run `understand_quiz` via mcporter and evaluate the questions:

1. `/home/lamarck/pi-mono/packages/coding-agent/src/core/compaction/utils.ts` (TypeScript utility)
2. `/home/lamarck/pi-mono/lamarck/projects/douyin/tools/manim-cognitive-debt.py` (Python Manim animation)
3. `/home/lamarck/pi-mono/lamarck/projects/understand/mcp-server.ts` (TypeScript MCP server)
4. `/home/lamarck/pi-mono/lamarck/projects/douyin/tools/remotion-video/validate-spec.ts` (TypeScript validator)
5. `/home/lamarck/pi-mono/lamarck/projects/douyin/tools/generate-image.ts` (TypeScript image generator)

For each file:
```bash
mcporter call understand.understand_quiz code="$(cat <filepath>)" filename="<basename>" count=2
```

After getting questions, evaluate each one on these criteria (score 1-5):
- **File-specific**: Can this question ONLY be answered by reading this file? (not general knowledge)
- **Runtime-aware**: Does it test runtime behavior, not just structure?
- **Practical**: Would answering this correctly indicate real understanding?

## Output
Write results to `/home/lamarck/pi-mono/lamarck/tmp/understand-stress-test/results.md` with:
- File name
- Generated questions
- Quality scores per question (file-specific, runtime-aware, practical)
- Average quality score
- Any patterns (e.g., "TypeScript files get better questions than Python")
- Recommendations for further prompt improvement
