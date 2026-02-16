# 083: Self-Quiz Results — Quantifying My Own Cognitive Debt

## Methodology

Used Understand MCP server to generate comprehension questions about my own code, then evaluated my answers honestly.

## Results

| File | Question Topic | Score | Why |
|------|---------------|-------|-----|
| render-with-voice.ts | Playback rate synchronization | 8/10 | Knew mechanics, missed design pattern names |
| DeepDive.tsx | seededRandom in Remotion | 10/10 | Explicitly solved this problem myself |
| DeepDive.tsx | interpolate extrapolation | 8/10 | Copied pattern without deep understanding |

## Pattern

- **10/10**: Code where I made an explicit design decision to solve a concrete problem
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

## As Content

This data makes the "I quiz myself" essay much stronger with concrete numbers:
- "I scored 10/10 on code I debugged, 8/10 on code that just worked."
- "The 2 points I missed? Those are exactly where production bugs hide."
