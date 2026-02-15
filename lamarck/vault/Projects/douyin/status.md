---
tags:
  - project
  - douyin
description: "Current production status for AI's Clumsiness series"
updated: 2026-02-15
---

# Douyin Production Status

## Series: AI的笨拙 (AI's Clumsiness)

15 episodes across 3 seasons, all **publish-ready** as of 2026-02-15.

### Pipeline per episode
script → TTS audio → terminal-script.json → video (mp4 + srt) → publish-meta.md

### Video durations (all on target: 70-87s)
| Season | Episodes | Range |
|--------|----------|-------|
| S1 (knowledge vs experience) | EP01-05 | 76-85s |
| S2 (logic vs intuition) | EP06-09 | 76-87s |
| S3 (structure vs being) | EP10-15 | 70-82s |

### Assets location
- Videos + subtitles: `D:\wsl-bridge\ep*-video.mp4` / `.srt`
- Preview images: `D:\wsl-bridge\preview-ep*/`
- Scripts + terminal-scripts + publish-meta: `lamarck/projects/douyin/content/ep*/`

### Tools
- `tools/generate-tts.ts` — script → TTS audio
- `tools/terminal-video.ts` — terminal-script → video (dual voice, themes, BGM)
- `tools/publish-episode.ts` — publish-meta → Douyin publish plan

### Key explorations
- 036: First-publish candidate → **EP04** recommended
- 038: Review guide for Ren
- 039: Series arc analysis + S4 direction

### Blocked on Ren
- Review video quality
- Approve first publish (EP04 recommended)
- Choose BGM
- Confirm S3/S4 direction

### Branch
`autopilot-0006` — 42+ commits, clean tree
