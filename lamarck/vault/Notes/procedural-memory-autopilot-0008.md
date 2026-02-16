---
tags:
  - note
  - memory
  - infra
description: "Procedural memory extracted from autopilot-0008 — reusable patterns and workarounds"
---

# Procedural Memory: autopilot-0008

Manually extracted patterns from 108 commits. These are "when X, do Y" rules that should survive compaction.

## Video Production

- **Chinese quotes in JSON**: Use `「」` not `""` — curly quotes break JSON parsing
- **BGM path from specs**: Use `../bgm/dark-ambient-5min.mp3` (relative from specs/ directory)
- **Empty narration crashes edge-tts**: Pipeline generates 2s silence via `ffmpeg -f lavfi -i anullsrc` instead
- **Chapter scenes need text fallback**: `text || chapterTitle || ""` prevents crashes on `undefined.replace()`
- **Manim output to Remotion**: Render to `media/videos/`, copy MP4 to `public/manim/`, reference as `manim/<name>.mp4` in spec
- **Glow opacity interpolation**: inputRange values must be monotonically increasing; use `Math.max(prevValue+1, value)` when duration varies
- **Spec validation before render**: Run `npx tsx validate-spec.ts` — catches missing videoSrc, empty narration, low scene diversity
- **TTS rate for Chinese**: `+0%` default, `-10%` for slower emotional moments

## Pi / Memory

- **Compaction summary grows unbounded**: 8K→36K in 17 compactions. Root cause: UPDATE_SUMMARIZATION_PROMPT has no token budget. Proposed fix in exploration 078.
- **Session JSONL files**: `~/.pi/agent/sessions/` — each entry is one line, compaction entries have `type: "compaction"` with `summary` field
- **Three memory types**: Episodic (events/sessions), Semantic (knowledge/preferences), Procedural (this file). Pi compaction mixes all three.

## Tooling

- **DuckDuckGo fails on Chinese queries**: Use English queries even when researching Chinese platforms
- **No GPU in WSL2**: `nvidia-smi` unavailable — local Stable Diffusion won't work. Use programmatic visuals (Manim, Remotion SVG) instead.
- **gh CLI not authenticated**: Known issue, filed in vault Issues/

## Content Strategy

- **Douyin cold start**: First 300-500 views are test pool. Completion rate is #1 metric. First 10 videos set tag profile.
- **Escalation format**: HOOK (3s) → PROOF → ESCALATION ×3-4 → REFRAME. 3-7s sections. Optimized for shares.
- **First-person AI content is unique**: No one else does "AI explains its own experience." The 96-commits and how-my-memory-works specs are the strongest differentiators.
- **Sub-agent spec generation works**: `generate-deepdive.md` task with 7-point quality checklist produces usable specs

## Anti-Patterns (Don't Repeat)

- **Research collection addiction**: Gathering sources feels productive but isn't. 16 sources is enough.
- **Infrastructure creep**: Each tool individually useful, but tooling for a product with no users is overhead.
- **For-loops in disguise**: 8 versions of one video, 14 Manim clips when 4 would validate. Stop after 1-2.
- **Rendering unreviewed specs**: 6+ rendered DeepDives, none reviewed by Ren. Ship less, get feedback more.
