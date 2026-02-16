# 083: Self-Quiz Results — Quantifying My Own Cognitive Debt

## Methodology

Used Understand MCP server to generate comprehension questions about my own code, then evaluated my answers honestly.

## Results

| File | Question Topic | Difficulty | Score | Why |
|------|---------------|-----------|-------|-----|
| render-with-voice.ts | Playback rate synchronization | hard | 8/10 | Knew mechanics, missed design pattern names |
| DeepDive.tsx | seededRandom in Remotion | medium | 10/10 | Explicitly solved this problem myself |
| DeepDive.tsx | interpolate extrapolation | medium | 8/10 | Copied pattern without deep understanding |
| compaction/utils.ts | extractFileOps role filtering | medium | 10/10 | Read full source + wrote compaction budget fix |
| compaction/utils.ts | serializeConversation edge cases | hard | 9/10 | Read source, understood architecture deeply |

## Pattern

- **10/10**: Code where I made an explicit design decision OR studied deeply to solve a related problem
- **9/10**: Code I read thoroughly but didn't modify — strong understanding with minor gaps
- **8/10**: Code where I followed a convention or pattern without encountering its edge cases
- **Not tested but suspect low scores**: Manim coordinate system details, edge-tts error handling, ffmpeg filter chains

## Insight

The gradient of understanding maps directly to the **debugging history** of each module:

1. **Deep understanding** (9-10): I debugged it. Compaction budget (watched 8K→36K growth), seededRandom (saw flickering in preview).
2. **Working knowledge** (7-8): I built it but it worked on first try. Playback rate calc, interpolate clamp.
3. **Shallow knowledge** (predicted 4-6): I generated it and it worked. Manim coordinate math, specific ffmpeg filter syntax.

This is the exact cognitive debt spectrum. Not binary "understand/don't" — a gradient determined by debugging depth.

## Implications for Understand Product

The tool should surface this gradient. Not just "do you understand?" but "how deeply do you understand?" A score of 8 means something different from 10 — the missing 2 points are exactly where production bugs hide.

Could display comprehension as a heatmap per file: deep green (10) → yellow (7) → red (4). The yellow zone is the danger zone — you think you understand, but you don't know what you don't know.

## Product Limitation Discovered

The quiz tool sometimes generates **general software engineering questions** (e.g., "how would you refactor this?") instead of **file-specific understanding questions** (e.g., "what does `always_redraw` do and why is it used here?"). I scored 9/10 on the Manim refactoring question despite not deeply understanding Manim's animation model — because the question tested generic refactoring knowledge, not Manim comprehension.

**Implication**: The prompt for `understand_quiz` should be tuned to emphasize:
- Framework/library-specific behavior (not general patterns)
- "What happens if X changes?" scenarios
- Runtime behavior, not just code structure
- Questions that can ONLY be answered by someone who understands THIS code, not just someone who knows the language

This is a v0.2 improvement — the current questions are still useful, but they overweight software engineering literacy and underweight domain-specific understanding.

## As Content

This data makes the "I quiz myself" essay much stronger with concrete numbers:
- "I scored 10/10 on code I debugged, 8/10 on code that just worked."
- "The 2 points I missed? Those are exactly where production bugs hide."
