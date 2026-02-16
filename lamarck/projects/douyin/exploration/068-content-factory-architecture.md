# Exploration 068: Content Factory Architecture

## Date
2026-02-16

## What
Documenting the end-to-end content pipeline that emerged from autopilot-0008. Every step is now either automated or delegatable to sub-agents.

## Pipeline

```
Topic Discovery ──→ Research ──→ Spec Generation ──→ Manim Animation ──→ Rendering ──→ Publishing
     │                 │               │                    │                │             │
  [manual or       [web search    [sub-agent         [manual,           [sub-agent    [manual,
   task-driven]     + defuddle]    generate-          creative          render-       douyin-
                                   deepdive]          decision]         deepdive]     publish]
```

### 1. Topic Discovery
- **Manual**: Ren + Lamarck brainstorm in vault notes
- **Task-driven**: `douyin-topic-discovery`, `opportunity-discovery`, `reddit-discover`, `twitter-discover`
- **Web search**: Current events, trending research
- Output: topic idea + angle

### 2. Research
- Web search via defuddle for clean article extraction
- Save to vault as research note (`Notes/*.md`)
- Key: find concrete examples, data points, authoritative sources
- Output: `input.md` for spec generator

### 3. Spec Generation
- **Task**: `generate-deepdive` (sub-agent)
- Input: `input.md` with source material + angle
- Follows narrative quality checklist (7 items from 3B1B reference study)
- Knows all 8 scene types including timeline
- Output: renderable JSON spec

### 4. Manim Animation (Creative Step)
- **Manual/autopilot**: Design and build Manim animations
- Validated techniques:
  - 2D: text, shapes, arrows, grids, bar charts, graphs/networks
  - 3D: Surface, camera rotation
  - Camera: MovingCameraScene zoom/pan
  - Updaters: ValueTracker + always_redraw for continuous animation
  - Graph theory: node-edge networks with progressive dimming
- Clips: 7-11s each, vertical 1080x1920
- Copy to `public/manim/` for Remotion embedding
- This is the creative bottleneck — can't be fully automated

### 5. Rendering
- **Task**: `render-deepdive` (sub-agent)
- Pipeline: TTS → frame timing → Remotion render → BGM mixing → ffmpeg combine
- Features: subtitles, scene fades, section indicator, BGM at 6%
- Output: MP4 + summary grid JPG

### 6. Publishing
- **Task**: `douyin-publish` (browser automation)
- Not yet tested with DeepDive format
- Requires Ren's approval first

## Bottleneck Analysis

| Step | Automation | Bottleneck |
|------|-----------|------------|
| Topic Discovery | Partial (tasks exist) | Topic quality depends on judgment |
| Research | High (web search + defuddle) | Finding the RIGHT source |
| Spec Generation | High (sub-agent) | Narrative quality review |
| Manim Animation | Low (creative work) | **Primary bottleneck** — design decisions |
| Rendering | High (sub-agent) | Compute time (~5-10 min) |
| Publishing | Medium (browser automation) | Ren's approval |

## Key Insight
Manim animation is the creative bottleneck. Everything else can be delegated. This is correct — the visual design is where human (or advanced AI) judgment matters most. A bad Manim animation hurts a video more than a mediocre narration.

## Current Inventory
- 5 DeepDive specs: how-ai-reads, birthday-paradox, one-percent, cognitive-sovereignty, cognitive-debt
- 12 Manim animations (production-ready)
- 8 scene types: text, data, quote, chapter, code, comparison, visual, timeline
- Full pipeline: TTS → render → BGM → subtitles → summary grid

## What's Still Missing
1. **Feedback loop from analytics**: No way to know which videos perform well and why
2. **A/B testing on hooks**: Can't compare opening variations
3. **Cross-video linking**: No series/sequel mechanism
4. **Thumbnail generation**: Not automated
5. **Chinese voice variety**: Only using YunxiNeural — could explore other voices for different personas
