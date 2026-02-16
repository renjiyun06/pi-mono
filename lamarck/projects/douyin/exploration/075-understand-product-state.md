# Exploration 075: Understand Product — Current State

## What It Is

An anti-cognitive-debt tool that forces comprehension of code you didn't write. Works on any codebase. Four modes:

### 1. Quiz Mode (`understand <file>`)
Generates 3 understanding questions about a code file via LLM, then quizzes you interactively. Evaluates answers on 0-10 scale.

Tested on: DeepDive.tsx (1500 lines), understand.ts itself, pi's extension API types (900 lines). Questions are genuinely insightful — asks about design decisions, edge cases, failure modes. Not memorization.

### 2. Dry-Run Mode (`understand <file> --dry-run`)
Shows questions without quizzing. Used to generate COMPREHENSION-GUIDE.md for Ren's review.

### 3. Summary Mode (`understand summary`)
Score history with per-file tracking, trends, and below-threshold filtering. Stored in `.understand/history.json` per repo.

### 4. Debt Mode (`understand debt --since <ref>`)
Passive tracking dashboard. Cross-references git log with quiz history. Shows which files have the most "understanding debt" — unreviewed code changes.

For autopilot-0008: **26 code files, 5554 lines, ALL unquizzed.** That's visible cognitive debt.

### Pi Extension (`/understand`)
Tracks files modified during a pi session via tool_result events. `/understand quiz` generates questions about the most-changed file. `/understand summary` shows scores.

## Why It Matters

- **CodeRabbit data** (470 repos): AI code has 1.7x more bugs, 3x readability issues
- **Eisele** (2026): "Forensic code review" is the defining skill of 2026
- **Shen & Tamkin**: AI users score 17% lower on knowledge tests
- **No competitor** in "force understanding" niche (Cursor explains passively, CodeRabbit reviews, LeetCode teaches — nobody forces comprehension of YOUR codebase)

## What It Needs

1. **Ren's decision**: Is this worth pursuing as a product, or just a personal tool?
2. **Packaging**: Currently a single file with hardcoded paths. Needs npm packaging.
3. **UX testing**: Does anyone besides us actually use it?
4. **Name**: "Understand" is descriptive but generic.
5. **Business model**: Free for individuals, team features for paid? Git hook marketplace?

## What I'd Do Next (if approved)

1. Package as standalone npm tool (zero config, works in any repo)
2. Git hook integration (pre-commit understanding check)
3. CI integration (understanding score as PR check)
4. VS Code extension (quiz in editor sidebar)

## Connection to Douyin Content

The Understand product IS the cognitive debt story we've been telling in 16 DeepDive sources. It's the answer to "what do we do about it?" — not just warn about cognitive debt, but build the tool that prevents it. Content → Product pipeline.

## Files

- CLI: `projects/understand/understand.ts` (550 lines)
- Extension: `extensions/understand.ts` (130 lines)
- Design: `projects/understand/design-pi-integration.md`
- Comprehension guide: `projects/understand/COMPREHENSION-GUIDE.md`
- Manim demo: `projects/douyin/tools/manim-understand-concept.py` (12.6s clip)
- Vault: `Notes/product-idea-code-understanding-tool.md`
- Project index: `Projects/understand/index.md`
